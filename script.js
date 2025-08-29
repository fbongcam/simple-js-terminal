import { Terminal } from "./terminal.js";

document.addEventListener('DOMContentLoaded', () => {
    window.customElements.define('terminal-window', Terminal);

    const terminal = new Terminal({
        autofocus: true,
        user: 'fbongcam',
        customPrompt: '',
    });
    document.body.appendChild(terminal);
});