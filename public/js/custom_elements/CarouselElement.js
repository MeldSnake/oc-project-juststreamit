class CarouselElement extends HTMLElement {
    /** @type {boolean | undefined} */
    static __registered;

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
        if (this.shadowRoot === null) {
            throw new Error("Unable to attach a shadow root");
        }
        this.items = [];
        const template = document.querySelector("template#carouseltemplate");

        if (template === null) {
            throw Error("Carousel template not found");
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.__mutationObserver = new MutationObserver(this.__onNodeMutation.bind(this));
        this.__mutationObserver.observe(this, {
            childList: true,
        });
        this.__container = this.shadowRoot.querySelector(".carousel");
        this.__connectionSignal = new AbortController();
    }

    connectedCallback() {
        if (!this.isConnected)
            return;
        this.__connectionSignal.abort("reconnection");
        this.__connectionSignal = new AbortController();
        const previous_button = this.shadowRoot.querySelector(".carousel__previous");
        const next_button = this.shadowRoot.querySelector(".carousel__next");

        if (previous_button !== null) {
            previous_button.addEventListener("click", () => this.moveBy(-1), {
                signal: this.__connectionSignal.signal,
            });
        }
        if (next_button !== null) {
            next_button.addEventListener("click", () => this.moveBy(1), {
                signal: this.__connectionSignal.signal,
            });
        }
    }

    disconnectedCallback() {
        this.__connectionSignal.abort("disconnection");
    }

    /**
     * @param {Element} element
     * @param {Element} container
     */
    static IsElementIntoView(element, container) {
        if (container === undefined || container === null) {
            if (document.firstElementChild === null) {
                throw new Error("No element in document");
            }
            container = document.firstElementChild;
        }
        if (element === null || element === undefined
            || container === null || element === undefined) {
            return true;
        }
        const element_rect = element.getBoundingClientRect();
        const container_rect = container.getBoundingClientRect();

        return (element_rect.top >= container_rect.top
            && element_rect.bottom <= container_rect.bottom
            && element_rect.left >= container_rect.left
            && element_rect.right <= container_rect.right);
    }

    /**
     * @param {number} count
     */
    moveBy(count) {
        if (count === 0)
            return;
        const elements = count < 0 ? this.items.slice() : this.items.slice().reverse();
        let nextElement;

        while (elements.length > 0 && !CarouselElement.IsElementIntoView(elements[0], this.__container)) {
            nextElement = elements.shift();
        }
        if (nextElement !== undefined) {
            nextElement.scrollIntoViewIfNeeded(false);
        }
        return;
    }

    /**
     * 
     * @param {MutationRecord[]} mutations
     * @param {MutationObserver} _observer
     */
    __onNodeMutation(mutations, _observer) {
        for (const mutation of mutations) {
            let nextElement = mutation.nextSibling;

            while (nextElement !== null && !(nextElement instanceof HTMLElement)) {
                nextElement = nextElement.nextSibling;
            }
            if (mutation.removedNodes) {
                for (const removedNode of mutation.removedNodes) {
                    if (removedNode instanceof HTMLElement) {
                        const idx = this.items.indexOf(removedNode);

                        if (idx !== -1) {
                            this.items.splice(idx, 1);
                        }
                    }
                }
            }
            if (mutation.addedNodes) {
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
                    this.items.push(...Array.prototype.filter((x) => x instanceof HTMLElement, mutation.addedNodes), ...this.items.splice(idxInsert));
                } else {
                    this.items.push(...Array.prototype.filter((x) => x instanceof HTMLElement, mutation.addedNodes));
                }
            }
        }
    }
}

export default CarouselElement;
