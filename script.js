import { Terminal } from "./terminal.js";

document.addEventListener('DOMContentLoaded', () => {
    window.customElements.define('terminal-window', Terminal);

    const terminal = new Terminal({
        autofocus: true,
        user: 'user1',
        customPrompt: '',
    });
    document.body.appendChild(terminal);


    /* ----------------------- TESTING DURING DEVELOPMENT ----------------------- */
    
    /*const fs = new VirtualFileSystem({ users: { user1: {}, user2: {} } });
    console.log(fs.getFilestructure());
    setTimeout(() => {
        fs.cd('home');
        fs.mv('home', 'bin/home')
        fs.cd('..');
        fs.ls('bin/home')
        fs.cp('bin/home', 'home');
        fs.cd('..')
        fs.touch('touchFile');
        fs.cd('/')
        fs.mkdir('-p', 'bin/test2/test3/test4');
        fs.cd('/')
        fs.cd('bin/test2/test3/test4');
        fs.touch('fileX.txt');
        fs.ls();
        //fs.rm(null,'bin/test2/test3/test4');
        fs.rm('-r', 'bin/test2/test3/test4');
        fs.cd('/')
        fs.cd('test')
    }, 1000);*/

});