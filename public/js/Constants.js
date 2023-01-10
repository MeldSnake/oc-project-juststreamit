const API_SECURE = false;
const API_HOST = "127.0.0.1";
const API_PORT = 8000;
const API_PATH = "/api/v1/";

function APIUrl() {
    let protocol = "";

    if (API_SECURE) {
        protocol = "https://";
    } else {
        protocol = "http://";
    }
    return protocol + API_HOST + ":" + API_PORT.toFixed(0) + API_PATH;
}

export { API_SECURE, API_HOST, API_PORT, APIUrl, API_PATH };

export default APIUrl;
