import Console from "./console.js";

document.addEventListener('DOMContentLoaded', () => {
    window.customElements.define('console-window', Console);

    document.body.appendChild(new Console(true));
});