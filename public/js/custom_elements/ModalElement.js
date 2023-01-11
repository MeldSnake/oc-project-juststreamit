import APIUrl from "../Constants.js";

const MappedSlotModalData = new Map([
    ["score", x => x.imdb_score],
    ["actors", x => x.actors.join(", ")],
    ["writers", x => x.writers.join(", ")],
    ["directors", x => x.directors.join(", ")],
    ["genres", x => x.genres.join(", ")],
]);

class ModalElement extends HTMLElement {
    static register() {
        if (!ModalElement.__registered) {
            customElements.define("jsi-modal-titleinfo", ModalElement);
            ModalElement.__registered = true;
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
        const template = document.querySelector('template#modaltemplate');

        if (template === null) {
            throw Error("Modal template not found!");
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        /** @type {HTMLElement | null} */
        this.__border = this.shadowRoot.getElementById("border");
        this.__mutationObserver = new MutationObserver(this.__onMutation.bind(this));
        this.__mutationObserver.observe(this, {
            childList: true,
        });
        /** @type {HTMLPictureElement | null} */
        this.__picture = this.shadowRoot.getElementById("cover");
    }

    connectedCallback() {
        if (!this.isConnected)
            return;
        if (this.__connectedSignal !== undefined) {
            this.__connectedSignal.abort();
        }
        this.__connectedSignal = new AbortController();
        this.__connectedSignal.signal.addEventListener("abort", () => {
            this.__connectedSignal = undefined;
        }, { once: true });
        if (this.__border !== null) {
            this.__border.addEventListener("click", this._onQuit.bind(this), {
                signal: this.__connectedSignal.signal,
            });
        }
        this.addEventListener("click", this._onQuit.bind(this), {
            signal: this.__connectedSignal.signal,
        });
    }

    disconnectedCallback() {
        if (this.__connectedSignal !== undefined) {
            this.__connectedSignal.abort();
        }
    }

    /**
     * @param {MutationRecord} mutations
     * @param {MutationObserver} _observer
     */
    __onMutation(mutations, _observer) {
        if (this.__picture === null)
            return;
        for (const mutation of mutations) {
            if (mutation.addedNodes) {
                for (const addedNode of mutation.addedNodes) {
                    if (addedNode instanceof HTMLSourceElement) {
                        this.__picture.insertBefore(addedNode, this.__picture.firstChild);
                    }
                }
            }
        }
    }

    /**
     * @param {MouseEvent} _event
     */
    _onQuit(_event) {
        if (this.__border === null)
            return;
        if (this.__border === _event.currentTarget) {
            _event.stopPropagation();
        } else {
            this.dispatchEvent(new Event("close"));
        }
    }

    /**
     * @param {number} id
     * @param {AbortSignal} signal
     */
    static async fromID(id, signal) {
        const response = await fetch(new URL(`titles/${id}`, APIUrl()), {
            signal: signal,
            method: "GET",
            redirect: "follow",
            mode: "cors",
        });

        if (!response.ok)
            return new ModalElement();
        return this.fromData(await response.json(), signal);
    }

    /**
     * @param {import('../models.js').ITitleFullData} data
     * @param {AbortSignal} signal
     */
    static fromData(data, signal) {
        const modal = new ModalElement();
        const title = document.createElement("span");
        const source = document.createElement("source");
        const description = document.createElement("span");

        title.slot = "title";
        title.innerText = data.title;
        modal.appendChild(title);
        if (data.image_url) {
            source.srcset = data.image_url;
            modal.appendChild(source);
        }
        MappedSlotModalData.forEach((value, key) => {
            const element = document.createElement("span");

            element.slot = key;
            element.innerText = value(data);
            modal.appendChild(element);
        });
        description.slot = "description";
        description.innerText = data.long_description;
        modal.appendChild(description);
        signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", () => modal.remove());
        return modal;
    }
}

export default ModalElement;
