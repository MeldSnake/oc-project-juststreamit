import CarouselElement from "./CarouselElement.js";

class CategoryElement extends HTMLElement {
    static register() {
        if (!CategoryElement.__registered) {
            customElements.define("jsi-category", CategoryElement);
            CategoryElement.__registered = true;
        }
        CarouselElement.register();
    }

    get title() {
        if (this.hasAttribute("title")) {
            return this.getAttribute("title") || "Category";
        }
        return "Category";
    }

    /**
     * @param {string|undefined} value
     */
    set title(value) {
        if (value === undefined) {
            this.removeAttribute("title");
        } else {
            this.setAttribute("title");
        }
    }

    set categoryId(value) {
        self.__categoryId = value;
        self.clear();
        self.dispatchEvent(new CustomEvent(
            "onLoadCategory", {
                cancelable: true,
            }
        ));
    }

    static get observedAttributes() {
        return [
            'title',
        ];
    }

    constructor() {
        super();
        this.attachShadow({
            mode: "open",
        });
        /** @type {HTMLTemplateElement|null} */
        const template = document.querySelector("template#categorytemplate");
        if (template === null) {
            throw Error("Category template not found");
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.__title = this.shadowRoot.getElementById("title");
        this.__carousel = this.shadowRoot.getElementById("carousel");
        self.__categoryId = -1;
        self.__pending_task = Promise.resolve();
        self.__pending_task_signal = new AbortController();
    }

    async __is_completed_task() {
        return (await Promise.race([self.__pending_task, 'pending'])) === "pending";
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "title") {
            this.__title.innerText = newValue;
        }
    }
}

export default CategoryElement;