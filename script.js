import { Terminal } from "./terminal.js";
import { VirtualFileSystem } from "./virtual_filesystem.js";

document.addEventListener('DOMContentLoaded', () => {
    window.customElements.define('terminal-window', Terminal);

    const terminal = new Terminal({
        autofocus: true,
        user: 'fbongcam',
        customPrompt: '',
    });
    document.body.appendChild(terminal);

    const fs = new VirtualFileSystem({users:{filip:{}, alex:{}}});
    console.log(fs.getFilestructure());
    fs.cd('home');
    fs.mv('home', 'bin/home')
    fs.cd('..');
    fs.ls()
    fs.cp('bin/home', 'home');
    fs.cd('..')
    fs.touch('touchFile');
    fs.cd('/')
    fs.mkdir('-p','bin/test2');
    fs.cd('/')
});