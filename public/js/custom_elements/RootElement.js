import APIUrl from "../Constants.js";
import CarouselElement from "./CarouselElement.js";
import CategoryElement from "./CategoryElement.js";
import ModalElement from "./ModalElement.js";
import VideoInfoElement from "./VideoInfoElement.js";

class RootElement extends HTMLElement {
    static register() {
        if (!RootElement.__registered) {
            VideoInfoElement.register();
            CarouselElement.register();
            CategoryElement.register();
            ModalElement.register();
            customElements.define("jsi-root", RootElement);
            RootElement.__registered = true;
        }
    }

    constructor() {
        super();
        const shadow = this.attachShadow({
            mode: "open",
        });

        this.__categories_names = [
            "Films les mieux notés",
            "Romance",
            "Sci-Fi",
            "Horror",
        ];
        this.__link = document.createElement("link");
        this.__link.rel = "stylesheet";
        this.__link.href = "styles/root.css";
        shadow.appendChild(this.__link);
    }

    connectedCallback() {
        if (!this.isConnected)
            return;
        if (this.__connectedSignal !== undefined) {
            this.__connectedSignal.abort();
        }
        this.__connectedSignal = new AbortController();
        this.__connectedSignal.signal.addEventListener("abort", () => {
            if (this.__modalSignal !== undefined) {
                this.__modalSignal.abort("disconnected");
            }
        }, {
            once: true,
        });
        this.__categories_names.forEach(x => {
            this.shadowRoot.appendChild(this._categoryTitles(x));
        });
        this._bestMovie(this.__connectedSignal.signal)
            .then((title) => {
                if (title && this.shadowRoot !== null) {
                    this.shadowRoot.insertBefore(title, this.shadowRoot.firstChild);
                }
            })
            .catch((e) => {
                console.error("Unable to obtain the best movie", e);
            });
        this.addEventListener("infotitle", this._onInfoTitle.bind(this), {
            signal: this.__connectedSignal.signal,
        });
    }

    disconnectedCallback() {
        if (this.__connectedSignal !== undefined) {
            this.__connectedSignal.abort();
        }
        for (const child of this.childNodes) {
            if (child instanceof HTMLElement && child.tagName !== "link") {
                child.remove();
            }
        }
    }

    __modalTerminated() {
        this.__modalSignal = undefined;
    }

    /**
     * @param {CustomEvent<number>} event
     */
    async _onInfoTitle(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.shadowRoot)
            return;
        if (this.__modalSignal !== undefined) {
            this.__modalSignal.abort();
        }
        this.__modalSignal = new AbortController();
        try {
            const modal = await ModalElement.fromID(event.detail, this.__modalSignal.signal);

            modal.addEventListener("close", this.__modalSignal.abort.bind(this.__modalSignal));
            this.shadowRoot.insertBefore(modal, this.shadowRoot.firstChild);
            this.__modalSignal.signal.addEventListener("abort", this.__modalTerminated.bind(this));
        } catch (err) {
            this.__modalSignal.abort();
            console.error(err);
        }
    }

    /**
     * @param {AbortSignal} signal
     */
    async _bestMovie(signal) {
        const url = new URL("titles", APIUrl());
        const order = ["-imdb_score", "-year", "title"];

        url.searchParams.set("page_size", "1");
        url.searchParams.set("sort_by", order.join(","));
        const response = await fetch(url, {
            method: "GET",
            redirect: "follow",
            mode: "cors",
            signal: signal,
        });

        if (!response.ok)
            return null;
        /** @type {import('../models.js').IPagination<import('../models.js').ITitleShortData>|null|undefined} */
        const data = await response.json();

        if (!data || data.results.length === 0 || !data.results[0])
            return null;
        return VideoInfoElement.fromTitleInfo(data.results[0], false);
    }

    /**
     * @param {string} categoryName
     */
    _categoryTitles(categoryName) {
        const category = new CategoryElement();

        category.categoryname = categoryName;
        return category;
    }
}

export default RootElement;
