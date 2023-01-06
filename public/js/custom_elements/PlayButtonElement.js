class PlayButtonElement extends HTMLElement {
    static register() {
        if (!PlayButtonElement.__registered) {
            customElements.define("play-button", PlayButtonElement);
            PlayButtonElement.__registered = true;
        }
    }

    constructor() {
        super();
        this.attachShadow({
            mode: "open",
        });
        /** @type {HTMLTemplateElement} */
        const template = document.querySelector('template#playbuttontemplate');
        if (template === null) {
            throw Error("Play button template not found!");
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}

export default PlayButtonElement;