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

    onHashChanged(ev, force = false) {
        if (ev.oldURL === "") {
        }
        const oldURL = ev.oldURL === "" ? null : new URL(ev.oldURL);
        const newURL = ev.newURL === "" ? null : new URL(ev.newURL || ".");

        if (oldURL !== null && oldURL.hash === "#categories") {
            if (newURL !== null && newURL.hash !== "#categories") {
                this.updateView(false);
            } else if (force) {
                this.updateView(true);
            }
        } else {
            if (newURL !== null && newURL.hash === "#categories") {
                this.updateView(true);
            } else if (force) {
                this.updateView(false);
            }
        }
    }

    updateView(isCategories) {
        if (this.__viewSignal !== undefined) {
            this.__viewSignal.abort();
        }
        this.__viewSignal = new AbortController();
        while (this.shadowRoot.lastChild !== null && this.shadowRoot.lastChild.nodeName.toLowerCase() !== "link") {
            const child = this.shadowRoot.lastChild;

            if (child instanceof HTMLElement && child.tagName.toLowerCase() !== "link") {
                this.shadowRoot.removeChild(child);
                while (child.parentElement === this.shadowRoot) {
                    child.remove();
                }
            }
        }
        if (!isCategories) {
            this.__categories_names.forEach(x => {
                this.shadowRoot.appendChild(this._categoryTitles(x));
            });
            this._bestMovie(this.__viewSignal.signal)
                .then((title) => {
                    if (title && this.shadowRoot !== null) {
                        this.shadowRoot.insertBefore(title, this.__link.nextSibling);
                    }
                })
                .catch((e) => {
                    console.error("Unable to obtain the best movie", e);
                });
        } else {
            this._getCategories(this.__viewSignal.signal)
                .then((categories) => {
                    categories.forEach(x => {
                        this.shadowRoot.appendChild(this._categoryTitles(x));
                    });
                })
                .catch((e) => {
                    console.error("Unable to obtain the categories list", e);
                });
        }
        this.addEventListener("infotitle", this._onInfoTitle.bind(this), {
            signal: this.__viewSignal.signal,
        });
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
        window.addEventListener("hashchange", this.onHashChanged.bind(this), {
            signal: this.__connectedSignal.signal,
        });
        this.onHashChanged(new HashChangeEvent("", {
            newURL: this.ownerDocument.location.href,
        }), true);
    }

    disconnectedCallback() {
        if (this.__connectedSignal !== undefined) {
            this.__connectedSignal.abort();
        }
        if (this.__viewSignal !== undefined) {
            this.__viewSignal.abort();
        }
        for (const child of this.childNodes) {
            if (child instanceof HTMLElement && child.tagName !== "link") {
                child.remove();
            }
        }
    }

    __modalTerminated() {
        this.__modalSignal = undefined;
        this.ownerDocument.body.classList.remove("no-scroll");
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
            this.ownerDocument.body.classList.add("no-scroll");
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

    async _getCategories(signal) {
        const apiURL = APIUrl();
        let url = new URL("genres", apiURL);
        const categories = Array();

        while (true) {
            const response = await fetch(url, {
                method: "GET",
                redirect: "follow",
                mode: "cors",
                signal: signal,
            });

            if (!response.ok)
                break;
            /** @type {import('../models.js').IPagination<import('../models.js').IGenreData>|null|undefined} */
            const data = await response.json();

            if (!data || data.results.length === 0 || !data.results[0])
                break;
            for (const category of data.results) {
                categories.push(category.name);
            }
            if (data.next === null) {
                break;
            }
            url = new URL(data.next, apiURL);
        }
        return categories;
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
