import VideoInfoElement from "./custom_elements/VideoInfoElement.js";
import CarouselElement from "./custom_elements/CarouselElement.js";

VideoInfoElement.register();
CarouselElement.register();

function setupApp() {
    const root = document.getElementById("root");
    const bigVid = new VideoInfoElement();
    const carousel = new CarouselElement();
    const smallVid = new VideoInfoElement();
    bigVid.infolevel = "full";
    bigVid.innerHTML = `
    <span slot="title">Hello World</span>
    <span slot="score">4.2</span>
    <source srcset="imgs/nocover-big.png" />
    `;
    smallVid.innerHTML = `
    <span slot="title">Hello small world</span>
    <source srcset="imgs/nocover-small.png" />
    `
    bigVid.addEventListener("playmovie", __onPlayMovie.bind(0));
    smallVid.addEventListener("playmovie", __onPlayMovie.bind(0));
    root.appendChild(bigVid);
    root.appendChild(carousel);
    root.appendChild(smallVid.cloneNode(true));
    carousel.appendChild(smallVid);
    carousel.appendChild(smallVid.cloneNode(true));
    carousel.appendChild(smallVid.cloneNode(true));
    carousel.appendChild(smallVid.cloneNode(true));
    carousel.appendChild(smallVid.cloneNode(true));
    carousel.appendChild(smallVid.cloneNode(true));
    carousel.appendChild(smallVid.cloneNode(true));
}

/**
 * @param {Event} evt 
 */
function __onPlayMovie(evt) {
}

/**
 * @returns {Promise<void>}
 */
function initApp() {
    if (document.readyState === "complete") {
        setupApp();
        return Promise.resolve();
    } else {
        return new Promise((resolve, reject) => {
            document.addEventListener("readystatechange", () => {
                initApp()
                    .catch(reject)
                    .then(resolve);
            }, {
                once: true,
                passive: true,
            });
        });
    }
}

initApp();
