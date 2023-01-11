class PlayButtonElement extends HTMLElement {
    static register() {
        if (!PlayButtonElement.__registered) {
            customElements.define("jsi-play-button", PlayButtonElement);
            PlayButtonElement.__registered = true;
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
        const template = document.querySelector('template#playbuttontemplate');

        if (template === null) {
            throw Error("Play button template not found!");
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}

export default PlayButtonElement;
