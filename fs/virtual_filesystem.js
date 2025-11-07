// Copyright (c) 2025 fbongcam
// Licensed under the MIT License. See LICENSE file in the project root for details.

import { Node } from "./vfs_node.js";

export class VirtualFileSystem {
    static Node = Node;

    #options;
    #fs;
    #currentPath;
    #inode = 1000;
    #commandStyle = 'margin-top:24px;background:grey;color:white;solid black;padding:8px 12px 8px 12px;font-size:13px;font-weight:bold;';
    #inputStyle = 'padding:16px;border-left:3px solid #333';

    /**
     * A virtual file system in javascript that aims to replicate the basic features of a standard file system used by operating systems.
     * @param {object} options { users: {user1: {}, user2 {} ... }, extendedFileSystem: true/false} }
     */
    constructor(options = {}) {
        this.#options = {
            users: { admin: {} },
            extendedFilesystem: true,
            ...options
        }

        this.#fs = {
            '/': {
                bin: {
                    bash: null,
                    ls: null,
                    cat: null,
                    grep: null,
                    cp: null,
                    mv: null,
                    rm: null,
                    mkdir: null,
                    touch: null,
                    echo: null,
                    pwd: null
                },
                boot: {
                    grub: null,
                    vmlinuz: null,
                    'initrd.img': null,
                    efi: null
                },
                dev: {
                    null: null,
                    zero: null,
                    sda: null,
                    sdb: null,
                    tty: null,
                    urandom: null,
                    loop0: null,
                    pts: null
                },
                etc: {
                    passwd: null,
                    group: null,
                    shadow: null,
                    hostname: null,
                    hosts: null,
                    network: null,
                    profile: null,
                    fstab: null,
                    'resolv.conf': null,
                    ssh: {},
                    systemd: {},
                    'init.d': {}
                },
                home: {
                    ...this.#options.users,
                    guest: {}
                },
                lib: {
                    modules: {},
                    systemd: {},
                    udev: {},
                    firmware: {}
                },
                lib64: {
                    'ld-linux-x86-64.so.2': null,
                    modules: {}
                },
                'lost+found': {},
                media: {
                    cdrom: {},
                    usb: {},
                    floppy: {}
                },
                mnt: {
                    data: {},
                    backup: {}
                },
                opt: {
                    customApp: {},
                    google: {},
                    vscode: {}
                },
                proc: {
                    cpuinfo: null,
                    meminfo: null,
                    uptime: null,
                    mounts: null,
                    version: null,
                    sys: {},
                    self: {}
                },
                root: {
                    '.bashrc': null,
                    '.profile': null,
                    '.ssh': {},
                    Downloads: {},
                    Documents: {}
                },
                run: {
                    lock: {},
                    systemd: {},
                    user: {},
                    network: {}
                },
                sbin: {
                    init: null,
                    ifconfig: null,
                    reboot: null,
                    shutdown: null,
                    iptables: null,
                    mount: null,
                    fsck: null
                },
                srv: {
                    ftp: {},
                    www: {},
                    git: {}
                },
                sys: {
                    block: {},
                    bus: {},
                    class: {},
                    devices: {},
                    firmware: {},
                    fs: {},
                    kernel: {}
                },
                tmp: {
                    tempfile1: null,
                    tempfile2: null,
                    'X11-unix': {},
                    'systemd-private': {}
                },
                usr: {
                    bin: {
                        python3: null,
                        perl: null,
                        ruby: null,
                        nano: null,
                        vim: null,
                        gcc: null,
                        make: null,
                        git: null
                    },
                    lib: {},
                    lib64: {},
                    sbin: {
                        apache2: null,
                        cron: null,
                        sshd: null
                    },
                    share: {
                        man: {},
                        doc: {}
                    },
                    local: {
                        bin: {},
                        etc: {},
                        games: {},
                        include: {},
                        lib: {},
                        sbin: {},
                        share: {},
                        src: {}
                    },
                    src: {},
                    include: {},
                    games: {}
                },
                var: {
                    log: {
                        syslog: null,
                        'auth.log': null,
                        dmesg: null,
                        'kern.log': null,
                        apt: {}
                    },
                    mail: {},
                    spool: {
                        cron: {},
                        cups: {},
                        mail: {},
                        anacron: {}
                    },
                    tmp: {},
                    cache: {},
                    backups: {},
                    lib: {
                        dpkg: {},
                        apt: {},
                        systemd: {},
                        mysql: {},
                        docker: {}
                    },
                    run: {}
                }
            }
        };
        this.#currentPath = '/';

        // Extend filesystem
        if (this.#options.extendedFilesystem) {
            this.#extendFilesystem(this.#fs['/']);
        }
    }

    /**
     * Extends the simple file system of "fs".
     * @param {*} tree 
     */
    #extendFilesystem(tree) {
        // Directory = {}, File = null
        const walker = (treeObject, recursivePath) => {
            const entries = Object.entries(treeObject);
            for (const [key, value] of entries) {
                // Walk directory level
                const newPath = recursivePath ? `${recursivePath}/${key}` : key;

                // If directory, go deeper
                if (value !== null) {
                    walker(value, newPath);
                    // Check if directory has children
                    // Move its entries to new directory object "children"
                    let temp;
                    if (Object.entries(value).length > 0) {
                        console.log(value)
                        temp = value;
                        treeObject[key] = this.#createDirectoryObject();
                        treeObject[key]['children'] = temp;
                    }
                    else {
                        treeObject[key] = this.#createDirectoryObject();
                    }
                }
                else if (value === null) {
                    treeObject[key] = this.#createFileObject();
                }
            }
        }
        walker(tree);
    }

    #createDirectoryObject() {
        this.#inode++;
        return {
            type: 'dir',
            children: {},
            file_info: {
                createdDate: Date.now(),
                modifiedDate: Date.now(),
                size: null
            },
            inode: this.#inode
        };
    }

    #createFileObject() {
        this.#inode++;
        return {
            type: 'file',
            content: null,
            file_info: {
                createdDate: Date.now(),
                modifiedDate: Date.now(),
                size: null
            },
            inode: this.#inode
        };
    }

    /**
     * Gets node from path
     * @param {string} path 
     * @returns {VirtualFileSystem.Node} name, data, path, parentNode, isRoot
     */
    getNode(path) {
        const rootNode = () => {
            vfsNode.name = '~';
            vfsNode.data = this.#fs['/'];
            vfsNode.path = '/';
            vfsNode.parentNode = null;
            vfsNode.isRoot = true;
            return vfsNode;
        };

        const vfsNode = new VirtualFileSystem.Node();

        if (this.#currentPath === '/' && (path === '' || path === undefined)) {
            return rootNode();
        }
        else if (this.#currentPath !== '/' && (path === '' || path === undefined)) {
            path = this.#currentPath;
        }

        // Get previous node
        let parts;
        if (path === '..' && this.#currentPath !== '/') {
            parts = this.#currentPath.split('/').filter(Boolean);
            parts = parts.slice(0, parts.length - 2).join('/');
            // If no previous directory levels, return root
            if (parts.length === 0) {
                return rootNode();
            }
        }
        else if (path === '..' && this.#currentPath === '/') {
            return rootNode();
        }

        parts = path.split('/').filter(Boolean); // split by "/" and drop empties
        const pathLength = parts.length;
        if (pathLength === 0) {
            return rootNode();
        }

        let node = this.#fs['/']; // always start at root
        let parentNode = this.#fs['/'];
        for (let i = 0; i < pathLength; i++) {
            // If next node exists in current node or its children
            const nextNode = node?.[parts[i]] ?? node?.children?.[parts[i]];

            if (!nextNode) {
                return null; // not found anywhere
            }

            // Update parentNode to the current node before moving down
            parentNode = node;

            // Move to next node
            node = nextNode;
        }

        vfsNode.name = parts[parts.length - 1];
        vfsNode.data = node;
        vfsNode.path = path;
        vfsNode.parentNode = parentNode;

        return vfsNode;
    }

    /**
     * Deep clone node
     * @param {VirtualFileSystem.Node} node 
     * @returns 
     */
    #cloneNode(node) {
        if (node === null) {
            // file: just return a new "file"
            return null;
        }
        if (typeof node === 'object') {
            // directory: deep clone
            const copy = {};
            for (const key in node) {
                copy[key] = this.#cloneNode(node[key]); // recursive
            }
            return copy;
        }
        throw new Error("Invalid node type");
    }

    /**
     * Check if node is file
     * @param {VirtualFileSystem.Node} node 
     * @returns true or false
     */
    #isFile(node) {
        if (!(node instanceof VirtualFileSystem.Node)) {
            throw new Error(`Not instance of ${VirtualFileSystem.Node.name}`);
        }
        if (typeof node.data.type === 'file') {
            return true;
        }
        return false;
    }

    /**
     * Check if node is directory
     * @param {VirtualFileSystem.Node} node 
     * @returns true or false
     */
    #isDirectory(node) {
        if (!(node instanceof VirtualFileSystem.Node)) {
            throw new Error(`Not instance of ${VirtualFileSystem.Node.name}`);
        }
        if (node.data.type === 'dir' || node.isRoot) {
            return true;
        }
        return false;
    }

    /**
     * Check if directory is empty
     * @param {VirtualFileSystem.Node} node 
     * @returns 
     */
    #isDirectoryEmpty(node) {
        if (!(node instanceof VirtualFileSystem.Node)) {
            throw new Error(`Not instance of ${VirtualFileSystem.Node.name}`);
        }
        console.log(Object.keys(node.data))
        if (node?.data?.type === 'dir' && Object.keys(node?.data?.children).length <= 0) {
            return true;
        }
        return false;
    }

    #nodeToPath(node) {
        if (!(node instanceof VirtualFileSystem.Node)) {
            throw new Error(`Not instance of ${VirtualFileSystem.Node.name}`);
        }

        let path = '/';
        if (node.parentNode === null) {
            return path;
        }



        return path;
    }

    /**
     * Navigate to path
     * @param {string} path 
     */
    cd(path) {
        console.log('%ccd', this.#commandStyle);
        console.log('%cInput: ', this.#inputStyle, path);

        path = this.#pathHandler(path, { defaultToRoot: true });
        const node = this.getNode(path);

        // Check if node is directory
        if (node === null || !this.#isDirectory(node)) {
            console.log(node)
            throw new Error(`No such file or directory: ${path}`);
        }
        else if (this.#isFile(node)) {
            throw new Error(`Not a directory: ${path}`);
        }

        this.#currentPath = path;
        console.log(`Current path: ${this.#currentPath.replace('//', '/')}`);
        return node;
    }

    /**
     * List files and folders in directory
     * @param {string} path Optional path
     * @returns {array} list of filenames
     */
    ls(path) {
        console.log('%cls', this.#commandStyle);
        console.log('%cInput: ', this.#inputStyle, path);

        const filenames = [];
        let entries;// Get entries from specified path
        path = this.#pathHandler(path);
        console.log('ls path: ' + path)
        const node = this.getNode(path);
        entries = Object.entries(node?.data?.children || {});

        if (entries.length > 0) {
            for (const [key] of entries) {
                console.log(key);
                filenames.push(key);
            }
        }
        else if (node.isRoot) {
            for (const [key] of Object.entries(node.data)) {
                console.log(key);
                filenames.push(key);
            }
        }

        return filenames;
    }

    /**
     * Move file
     * @param {string} sourcePath path to source destination
     * @param {string} destPath path to output destination
     */
    mv(sourcePath, destPath) {
        console.log('%cmv', this.#commandStyle);
        console.log(`%cInput: ${sourcePath} ${destPath}`, this.#inputStyle);

        const sourceParts = sourcePath.split('/').filter(Boolean);
        const destParts = destPath.split('/').filter(Boolean);

        const sourceKey = sourceParts.pop();
        destParts.pop();

        sourcePath = this.#pathHandler(sourcePath);
        destParts = this.#pathHandler(destParts.join('/'));
        const sourceNode = this.getNode(sourcePath);
        const destNode = this.getNode(destParts);

        if (sourceNode === null || destNode === null) {
            throw new Error('No such file or directory');
        }

        (destNode.data['children'] ?? destNode.data)[sourceKey] = sourceNode.data;
        delete sourceNode.parentNode[sourceKey];
        console.log(`Moved ${sourcePath} to ${destPath}`);
    }

    /**
     * Copy & paste file
     * @param {string} sourcePath Path to source file 
     * @param {string} destPath Path to output file 
     */
    cp(sourcePath, destPath) {
        console.log('%ccp', this.#commandStyle);
        console.log(`%cInput: ${sourcePath} ${destPath}`, this.#inputStyle);

        const sourceParts = sourcePath.split('/').filter(Boolean);
        const destParts = destPath.split('/').filter(Boolean);

        const sourceKey = sourceParts.pop();
        destParts.pop();

        sourcePath = this.#pathHandler(sourcePath);
        destParts = this.#pathHandler(destParts.join('/'));

        const sourceNode = this.getNode(sourcePath);
        const destNode = this.getNode(destParts.join('/'));

        if (sourceNode === null || destNode === null) {
            throw new Error('No such file or directory');
        }

        const clone = JSON.parse(JSON.stringify(sourceNode?.data));

        (destNode.data['children'] ?? destNode.data)[sourceKey] = clone;
        console.log(`Copied ${sourcePath} to ${destPath}`);
    }

    /**
     * Create file
     * @param {string} path Path to file
     */
    touch(path) {
        console.log('%ctouch', this.#commandStyle);
        console.log(`%cInput: ${path}`, this.#inputStyle);

        // Check directory levels of path
        const parts = path.split('/').filter(Boolean);
        const dirLevels = parts.length;
        const filename = parts.pop();

        path = this.#pathHandler(parts.join('/'));

        if (dirLevels > 1) { // If path has directory levels
            console.log('dir levels')
            // Check if parent of path exists
            const parent = this.getNode(path);
            if (parent === null) {
                throw new Error('No such file or directory');
            }
            // Check if file exists
            if ((parent.data ?? parent.data.children)[filename]) {
                // Update modification date
                parent.data.children[filename].file_info.modifiedDate = new Date();
            }
            // If file dont exists, create the file
            else {
                parent.data.children[filename] = this.#createFileObject();
            }
        }
        else if (dirLevels === 1) { // If path has no directory levels
            const node = this.getNode(this.#currentPath);
            // Check if file exists
            if ((node.data.children ?? node.data)[filename]) {
                // Update modification date
                (node.data.children ?? node.data)[filename].file_info.modifiedDate = new Date();
            }
            else {
                (node.data.children ?? node.data)[filename] = this.#createFileObject();
            }


        }
        console.log(`Created file ${path}`);
    }

    /**
     * Create directory
     * @param {string} args "-p" for recursively make directories of path
     * @param {string} path Path of directory 
     */
    mkdir(args, path) {
        console.log('%cmkdir', this.#commandStyle);
        console.log(`%cInput: ${args} ${path}`, this.#inputStyle);

        // All directories from input path
        const inputDirs = path.split('/').filter(Boolean);

        // Absolute path
        path = this.#pathHandler(path);

        console.log("Corrected path: " + path);

        if (args && args !== '-p') {
            throw new Error(`Invalid option -- ${args}`);
        }

        if (!path) {
            throw new Error(`Invalid option -- ${path}`);
        }

        // Check if directory already exists
        let node = this.getNode(path);
        if (node !== null) {
            throw new Error("Directory already exists");
        }

        // All directory levels of full path
        const dirs = path.split('/').filter(Boolean);

        // Check each level of tree from path if directory exists
        // Build paths
        const paths = [];
        paths.length = dirs.length;
        for (let i = 0; i < dirs.length; i++) {
            paths[i] = dirs[i - 1] ? paths[i - 1] + '/' + dirs[i] : dirs[i];
        }
        // Get nodes
        const tree = {}
        for (const p of paths) {
            if (this.getNode(p) === null) {
                tree[p] = false;
            }
            else {
                tree[p] = true;
            }
        }

        console.log('DIRECTORY TREE')
        console.log(tree)

        // Create directories recursively
        if ((args === '-p' && inputDirs.length > 1) || inputDirs.length === 1) {

            for (const [dirPath, exists] of Object.entries(tree)) {
                if (!exists) {
                    let parentPath = (dirPath.split('/').filter(Boolean));
                    const dirName = parentPath.pop();
                    parentPath =
                        path.startsWith('/') ? '/' + parentPath.join('/') : parentPath.join('/');
                    const parentNode = this.getNode(parentPath);
                    (parentNode.data.children ?? parentNode.data)[dirName] = this.#createDirectoryObject();
                }
            }
        }
        else {
            throw new Error(`Cannot create directory ${path}: No such file or directory`);
        }

        console.log('Created directory ', path);
    }

    /**
     * Remove empty directory
     * @param {string} args 
     * @param {string} path 
     */
    rmdir(args, path) {
        console.log('%crmdir', this.#commandStyle);
        console.log(`%cInput: ${args} ${path}`, this.#inputStyle);

        // All directories from input path
        const dirs = path.split('/').filter(Boolean);

        // Absolute path
        path = this.#pathHandler(path);

        console.log("Corrected path: " + path);

        if (args && args !== '-p') {
            throw new Error(`Invalid option -- ${args}`);
        }

        if (!path) {
            throw new Error(`Invalid option -- ${path}`);
        }

        const nodeCheck = () => {
            const node = this.getNode(dirs.join('/'));
            if (node === null) {
                throw new Error('No such file or directory');
            }
            if (!this.#isDirectory(node)) {
                throw new Error(`failed to remove '${dirs[dirs.length - 1]}': Not a directory`);
            }
            return node;
        }

        const notEmpty = () => {
            throw new Error(`failed to remove '${dirs[dirs.length - 1]}': Directory not empty`);
        }

        // Remove single directory
        if (args !== '-p') {
            const node = nodeCheck();
            // Check if dir empty
            if (this.#isDirectoryEmpty(node)) {
                // Remove if empty
                delete node.parentNode[dirs[dirs.length - 1]];
                console.log(`Removed directory ${dirs[dirs.length - 1]}`);
            }
            else {
                notEmpty();
            }
        }
        // Remove directories recursively
        else if (args === '-p') {
            while (dirs.length > 0) {
                const node = nodeCheck();
                console.log(node)
                // Check if dir empty
                if (this.#isDirectoryEmpty(node)) {
                    // Remove if empty
                    delete node.parentNode[dirs[dirs.length - 1]];
                    console.log(`Removed directory ${dirs[dirs.length - 1]}`);
                    // Generate new path for next iteration
                    dirs.pop();
                }
                else {
                    notEmpty();
                    break;
                }
            }
        }
        else {
            throw new Error('No such file or directory');
        }
    }

    /**
     * Remove file/files
     * @param {string} args 
     * @param {*} path Path to file, array of paths
     */
    rm(args, path) {
        console.log('%crm', this.#commandStyle);
        console.log(`%cInput: ${args} ${path}`, this.#inputStyle);

        if (Array.isArray(path)) {
            // Run through every path
            for (let p of path) {
                p = this.#pathHandler(path);
                this.rm(args, p);
            }
        }
        else {
            path = this.#pathHandler(path);
            const parts = path.split('/').filter(Boolean);

            console.log("parts: " + parts.join(','));

            // Check if file/directory exists
            const node = this.getNode(path);
            if (node === null) {
                throw new Error(`cannot remove '${parts[parts.length - 1]}': No such file or directory`);
            }

            // Check if file or directory
            if (this.#isDirectory(node)) {
                if (args?.toLowerCase() === '-r' || args === '--recursive') {
                    delete
                        (node.parentNode.children ??
                            node.parentNode.data ??
                            node.parentNode)[parts[parts.length - 1]];
                    console.log(`Removed directory ${parts[parts.length - 1]}`);
                }
                else {
                    throw new Error(`cannot remove '${parts[parts.length - 1]}': Is a directory`);
                }
            }
            if (this.#isFile(node)) {
                delete
                    (node.parentNode.children ??
                        node.parentNode.data ??
                        node.parentNode)[parts[parts.length - 1]];
                console.log(`Removed file ${parts[parts.length - 1]}`);
            }
        }
    }

    pwd() {
        return ('/' + this.#currentPath).replace('//', '/');
    }

    getFilestructure() {
        return this.#fs;
    }

    /**
     * Helps correct path.
     * Fixes and recognizes absolute and relative paths depending on input and current directory path.
     * @param {string} path
     * @returns Full directory path (absolute path)
     */
    #pathHandler(path, { defaultToRoot = false } = {}) {
        // Path starts from root
        if (path && path.startsWith('/')) {
            return path;
        }

        // Path goes back one directory level
        if (path && path === '..') {
            path = this.#currentPath.split('/').filter(Boolean);
            path.pop();
            path = path.join('/');
            console.log("new path: " + path)
            return ('/' + path).replaceAll('//', '/');
        }

        // No input path
        if (!path || path === '~' || path === '/') {
            // Default behavior: either root or stay in current path
            return defaultToRoot ? '/' : this.#currentPath || '/';
        }

        return (this.#currentPath + '/' + path).replaceAll('//', '/');
    }

    #parseArgs(argv) {
        const flags = {};
        const files = [];

        for (const arg of argv) {
            if (arg === '--') break; // stop parsing flags
            if (arg.startsWith('--')) {
                flags[arg.slice(2)] = true;
            } else if (arg.startsWith('-')) {
                for (const ch of arg.slice(1)) {
                    flags[ch] = true;
                }
            } else {
                files.push(arg);
            }
        }
        return { flags, files };
    }

}