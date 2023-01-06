import PlayButtonElement from "./PlayButtonElement.js";

class VideoInfoElement extends HTMLElement {

    get infolevel() {
        if (this.hasAttribute("infolevel")) {
            return this.getAttribute("infolevel") === "full"
                ? "full" : "short";
        }
        return "short";
    }

    /**
     * @param {"full"|"short"|undefined|null} value
     */
    set infolevel(value) {
        if (value === undefined || value === null) {
            this.removeAttribute("infolevel");
        } else {
            this.setAttribute("infolevel", value);
        }
    }

    static get observedAttributes() {
        return [
            'infolevel',
        ];
    }

    static register() {
        if (VideoInfoElement.__registered == undefined) {
            customElements.define("video-info", VideoInfoElement);
            VideoInfoElement.__registered = true;
        }
        PlayButtonElement.register();
    }

    /**
     * 
     * @param {string|undefined} title 
     * @param {string|undefined} cover 
     * @param {(number|string|undefined)} score 
     */
    constructor() {
        super();
        this.attachShadow({
            mode: "open",
        });
        /** @type {HTMLTemplateElement|null} */
        const template = document.querySelector("template#videoinfotemplate");
        if (template === null) {
            throw Error("Video info template not found!");
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.__connectSignal = new AbortController();
        /** @type {HTMLDivElement} */
        this.__root = this.shadowRoot.querySelector(".videoinfo");
        this.attributeChangedCallback("infosize", null, this.infolevel);
        /** @type {PlayButtonElement} */
        this.__play = this.shadowRoot.querySelector("#play-button");
        /** @type {HTMLPictureElement} */
        this.__picture = this.shadowRoot.querySelector("#picture");
        this.__mutationObserver = new MutationObserver(this.__onMutatedElement.bind(this));
        this.__mutationObserver.observe(this, {
            childList: true,
        });
    }

    /**
     * @param {MutationRecord[]} mutations 
     * @param {MutationObserver} observer 
     */
    __onMutatedElement(mutations, observer) {
        for (const mutation of mutations) {
            if (mutation.addedNodes) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLSourceElement) {
                        if (node.parentElement !== this.__picture) {
                            this.__picture.insertBefore(node, this.__picture.firstElementChild);
                        }
                    }
                }
            }
        }
    }

    connectedCallback() {
        if (!this.isConnected) return;
        this.__play.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent("playmovie", {
                bubbles: true,
                cancelable: true,
                detail: movieId,
            }));
        }, {
            signal: this.__connectSignal.signal,
        });
    }

    disconnectedCallback() {
        this.__connectSignal.abort();
        this.__connectSignal = new AbortController();
    }

    /**
     * Called during the life-cycle of the custom element for each attribute named given within the observedAttribute static field.
     * @param {string} name
     * @param {any} oldValue
     * @param {any} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "infolevel") {
            if (newValue !== oldValue) {
                if (newValue === "full") {
                    this.__root.classList.remove("videoinfo--short");
                    this.__root.classList.add("videoinfo--full");
                } else {
                    this.__root.classList.remove("videoinfo--full");
                    this.__root.classList.add("videoinfo--short");
                }
            }
        }
    }

}

export default VideoInfoElement;