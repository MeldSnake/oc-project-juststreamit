class CarouselElement extends HTMLElement {
    static register() {
        if (!CarouselElement.__registered) {
            customElements.define("jsi-carousel", CarouselElement);
            CarouselElement.__registered = true;
        }
    }

    constructor() {
        super();
        this.attachShadow({
            mode: "open",
        });
        /** @type {HTMLElement[]} */
        this.items = [];
        /** @type {HTMLTemplateElement|null} */
        const template = document.querySelector("template#carouseltemplate");
        if (template === null) {
            throw Error("Carousel template not found");
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        /** @type {MutationObserver} */
        this.__mutationObserver = new MutationObserver(this.__onNodeMutation.bind(this));
        this.__mutationObserver.observe(this, {
            childList: true,
        });
        this.__container = this.shadowRoot.querySelector(".carousel");
        this.__connectionSignal = new AbortController();
    }

    connectedCallback() {
        if (!this.isConnected) return;
        this.__connectionSignal.abort("reconnection");
        this.__connectionSignal = new AbortController();
        const previous_button = this.shadowRoot.querySelector(".carousel__previous");
        const next_button = this.shadowRoot.querySelector(".carousel__next");
        previous_button.addEventListener("click", this.moveBy.bind(this, -1), {
            signal: this.__connectionSignal.signal,
        });
        next_button.addEventListener("click", this.moveBy.bind(this, 1), {
            signal: this.__connectionSignal.signal,
        });
    }

    disconnectedCallback() {
        this.__connectionSignal.abort("disconnection");
    }

    static IsElementIntoView(element, container=undefined) {
        if (container === undefined) {
            container = document;
        }
        const element_rect = element.getBoundingClientRect();
        const container_rect = container.getBoundingClientRect();
        
        return (
            element_rect.top >= container_rect.top
            && element_rect.bottom <= container_rect.bottom
            && element_rect.left >= container_rect.left
            && element_rect.right <= container_rect.right
        );
    }
    
    /**
     * @param {number} count
     */
    moveBy(count, force=false) {
        if (count === 0) return;
        const elements = count < 0 ? this.items.slice() : this.items.slice().reverse();
        /** @type {HTMLElement|undefined} */
        let nextElement = undefined;

        while (elements.length !== 0 && !CarouselElement.IsElementIntoView(elements[0], this.__container)) {
            nextElement = elements.shift();
        }
        if (nextElement !== undefined) {
            nextElement.scrollIntoViewIfNeeded(false);
        }

        return;
    }

    /**
     * @param {MutationRecord[]} mutations
     * @param {MutationObserver} observer
     */
    __onNodeMutation(mutations, observer) {
        for (const mutation of mutations) {
            /** @type {HTMLElement|Node|null} */
            let nextElement = mutation.nextSibling;

            while (nextElement !== null && !(nextElement instanceof HTMLElement)) {
                nextElement = nextElement.nextSibling;
            }
            if (!!mutation.removedNodes) {
                for (const removedNode of mutation.removedNodes) {
                    if (removedNode instanceof HTMLElement) {
                        const idx = this.items.indexOf(removedNode);
                        if (idx !== -1) {
                            this.items.splice(idx, 1);
                        }
                    }
                }
            }
            if (!!mutation.addedNodes) {
                for (const addedNode of mutation.addedNodes) {
                    if (addedNode instanceof HTMLElement) {
                        addedNode.draggable = false;
                    }
                }
                if (nextElement !== null) {
                    let idxInsert = this.items.indexOf(nextElement);
                    if (idxInsert === -1) {
                        idxInsert = this.items.length - 1;
                    }
                    const hold = this.items.splice(idxInsert);
                    this.items.push(...mutation.addedNodes, ...hold);
                } else {
                    this.items.push(...mutation.addedNodes);
                }
            }
        }
    }
}

export default CarouselElement;