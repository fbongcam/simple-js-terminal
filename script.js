import { Terminal } from "./terminal.js";

document.addEventListener('DOMContentLoaded', () => {
    window.customElements.define('terminal-window', Terminal);

    const terminal = new Terminal({autofocus:true});
    document.body.appendChild(terminal);
});