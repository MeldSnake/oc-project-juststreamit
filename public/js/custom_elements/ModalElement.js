import APIUrl from "../Constants.js";

class ModalElement extends HTMLElement {
    /** @type {boolean | undefined} */
    static __registered;

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
        this.__border = this.shadowRoot.getElementById("border");
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
        const actors = document.createElement("span");
        const writers = document.createElement("span");

        title.slot = "title";
        title.innerText = data.title;
        modal.appendChild(title);
        if (data.image_url) {
            source.srcset = data.image_url;
            modal.appendChild(source);
        }
        actors.slot = "actors";
        actors.innerText = data.actors.join(", ");
        modal.appendChild(actors);
        writers.slot = "writers";
        writers.innerText = data.writers.join(", ");
        modal.appendChild(writers);
        signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", () => modal.remove());
        return modal;
    }
}

export default ModalElement;
