import CarouselElement from "./CarouselElement.js";
import APIUrl from "../Constants.js";
import VideoInfoElement from "./VideoInfoElement.js";

class CategoryElement extends HTMLElement {
    /** @type {boolean | undefined} */
    static __registered;

    static register() {
        if (!CategoryElement.__registered) {
            CarouselElement.register();

            customElements.define("jsi-category", CategoryElement);
            CategoryElement.__registered = true;
        }
    }

    get categoryname() {
        if (this.hasAttribute("categoryname")) {
            return this.getAttribute("categoryname") || "Category";
        }
        return "Category";
    }

    set categoryname(value) {
        if (value === undefined || value === null) {
            this.removeAttribute("categoryname");
        } else {
            this.setAttribute("categoryname", value);
        }
    }

    /**
     * @param {number} value
     */
    set categoryId(value) {
        this.__categoryId = value;
        this.clear();
        this.dispatchEvent(new CustomEvent("onLoadCategory", {
            cancelable: true,
        }));
    }

    static get observedAttributes() {
        return [
            'categoryname',
        ];
    }

    constructor() {
        super();
        this.attachShadow({
            mode: "open",
        });
        if (this.shadowRoot === null) {
            throw new Error("Unable to attach a shadow root");
        }
        const template = document.querySelector("template#categorytemplate");

        if (template === null) {
            throw Error("Category template not found");
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.__title = this.shadowRoot.getElementById("title");
        /** @type {CarouselElement | null} */
        this.__carousel = this.shadowRoot.getElementById("carousel");
        this.__categoryId = -1;
        this.__pending_task = Promise.resolve();
        this.__pending_task_signal = new AbortController();
        /** @type {VideoInfoElement[]} */
        this.__items = [];
    }

    connectedCallback() {
        this.clear();
        this.update();
    }

    disconnectedCallback() {
        this.clear();
    }

    async __is_completed_task() {
        return (await Promise.race([this.__pending_task, 'pending'])) === "pending";
    }

    /**
     * @param {string} name
     * @param {any} _oldValue
     * @param {any} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
        if (name === "categoryname" && this.__title !== null) {
            this.__title.innerText = newValue;
        }
    }

    update() {
        if (this.__carousel === null)
            return;
        const url = new URL("titles", APIUrl());
        const category = this.categoryname;
        const order = ["-imdb_score", "-year", "title"];

        url.searchParams.set("page_size", "7");
        switch (this.categoryname) {
        case "Meilleur film":
            url.searchParams.set("page_size", "1");
            break;
        case "Films les mieux notés":
            break;
        default:
            url.searchParams.set("genre", category);
            break;
        }
        if (order.length !== 0) {
            url.searchParams.set("sort_by", order.join(","));
        }
        this.__pending_task_signal.abort("Updating");
        this.__pending_task_signal = new AbortController();
        fetch(url, {
            method: "GET",
            redirect: "follow",
            mode: "cors",
            signal: this.__pending_task_signal.signal,
        })
            .then(this.__appendMovies.bind(this))
            .then(
                /** @param {VideoInfoElement[]} results */
                (results) => {
                    if (results.length !== 0 && this.__carousel !== null) {
                        this.__items.push(...results);
                        results.forEach(this.__carousel.appendChild.bind(this.__carousel));
                    }
                })
            .catch(this.clear.bind(this));
    }

    /**
     * @param {Response} response
     * @returns {Promise<VideoInfoElement[]>}
     */
    async __appendMovies(response) {
        if (!response.ok)
            return [];
        /** @type {import('../models.js').IPagination<import('../models.js').ITitleShortData>} */
        const data = await response.json();

        if (data === undefined || data === null)
            return [];
        return data.results
            .map(VideoInfoElement.fromTitleInfo.bind(null))
            .filter((x) => x !== undefined);
    }

    clear() {
        this.__items.splice(0).forEach(x => x.remove());
        this.__pending_task_signal.abort();
        this.__pending_task_signal = new AbortController();
        return null;
    }
}

export default CategoryElement;
