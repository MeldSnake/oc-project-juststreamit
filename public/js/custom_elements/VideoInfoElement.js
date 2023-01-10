import PlayButtonElement from "./PlayButtonElement.js";

class VideoInfoElement extends HTMLElement {
    get titleid() {
        const titleid = this.getAttribute("data-titleid");

        if (titleid !== null) {
            if (/^\d+$/.test(titleid)) {
                return Number.parseInt(titleid);
            }
        }
        return -1;
    }

    set titleid(id) {
        if (id === -1) {
            this.removeAttribute("data-titleid");
        }
        this.setAttribute("data-titleid", id.toFixed(0));
    }

    get infolevel() {
        if (this.hasAttribute("infolevel")) {
            return this.getAttribute("infolevel") === "full"
                ? "full" : "short";
        }
        return "short";
    }

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
            PlayButtonElement.register();
            customElements.define("jsi-video-info", VideoInfoElement);
            VideoInfoElement.__registered = true;
        }
    }

    constructor() {
        super();
        this.attachShadow({
            mode: "open",
        });
        if (this.shadowRoot === null) {
            throw new Error("Unable to attach the shadow root");
        }
        const template = document.querySelector("template#videoinfotemplate");

        if (template === null) {
            throw Error("Video info template not found!");
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.__connectSignal = new AbortController();
        this.__root = this.shadowRoot.querySelector(".videoinfo");
        this.attributeChangedCallback("infolevel", null, this.infolevel);
        this.__play = this.shadowRoot.querySelector("#play-button");
        this.__picture = this.shadowRoot.querySelector("#picture");
        this.__mutationObserver = new MutationObserver(this.__onMutatedElement.bind(this));
        this.__mutationObserver.observe(this, {
            childList: true,
        });
    }

    __onMutatedElement(mutations, _) {
        if (this.__picture === null) {
            return;
        }
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
        if (!this.isConnected || this.__play === null)
            return;
        this.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent("infotitle", {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: this.titleid,
            }));
        }, {
            signal: this.__connectSignal.signal,
        });
        this.__play.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent("playtitle", {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: this.titleid,
            }));
        }, {
            signal: this.__connectSignal.signal,
        });
    }

    disconnectedCallback() {
        this.__connectSignal.abort();
        this.__connectSignal = new AbortController();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.__root === null)
            return;
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

    static fromTitleInfo(titleInfo, short = true) {
        const element = new VideoInfoElement();
        const title = document.createElement("span");
        const score = document.createElement("span");
        const source = document.createElement("source");

        title.innerText = titleInfo.title;
        score.innerText = titleInfo.imdb_score;
        source.srcset = titleInfo.image_url || "imgs/nocover.png";
        title.slot = "title";
        element.appendChild(title);
        score.slot = "score";
        element.appendChild(score);
        element.appendChild(source);
        element.infolevel = short ? "short" : "full";
        element.titleid = titleInfo.id;
        return element;
    }

    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
    }
}

export default VideoInfoElement;
