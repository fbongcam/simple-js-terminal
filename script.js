import Console from "./console.js";

document.addEventListener('DOMContentLoaded', () => {
    window.customElements.define('console-window', Console);

    const console = new Console(true);
    document.body.appendChild(console);
});