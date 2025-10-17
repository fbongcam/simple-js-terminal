// Copyright (c) 2025 fbongcam
// Licensed under the MIT License. See LICENSE file in the project root for details.

import { Node } from "./vfs_node.js";

export class VirtualFileSystem {
    static Node = Node;

    #options;
    #fs;
    #currentPath;
    #inode = 1000;
    #commandStyle = 'margin-top:24px;background:#222;color:white;solid black;padding:8px 12px 8px 12px;font-size:13px;font-weight:bold;';
    #inputStyle = 'padding:16px;border-left:3px solid #333';

    constructor(options = {}) {
        this.#options = {
            users: { admin: {} },
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
        walker(this.#fs['/']);
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
     * @returns Object { contents, path, parentNode }
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
        let node = this.#fs['/']; // always start at root

        const pathLength = parts.length;
        if (pathLength === 0){
            return rootNode();
        }
        let i = 0;
        let parent = this.#fs['/'];
        for (const part of parts) {
            i++;
            // Get node of parent
            if (i === pathLength - 1) {
                if (i === 1) {
                    parent = node[part];
                }
                else {
                    parent = node['children'][part];
                }
            }
            // Get node
            if ((node && part in node) || (node?.children && part in node.children)) {
                if (i === 1) {
                    node = node[part];
                }
                else {
                    node = node['children'][part];
                }
            } else {
                return null; // not found
            }
        }

        const nodeName = parts[parts.length - 1];
        const nodeData = node;
        const nodePath = path;
        const nodeParent = parent;

        return new VirtualFileSystem.Node(nodeName, nodeData, nodePath, nodeParent);
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
        if (node.data.children.length > 0) {
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
        console.log('%cInput: ',this.#inputStyle, path);

        // Jump to root directory 
        if (path === '' || path === undefined || path === '/' || path === '~') {
            this.#currentPath = '/';
            console.log(`Current path: ${this.#currentPath}`);
            return this.getNode('/');
        }

        const node = this.getNode(path);

        // Check if node is directory
        if (node === null || !this.#isDirectory(node)) {
            throw new Error(`No such file or directory: ${path}`);
        }
        else if (this.#isFile(node)) {
            throw new Error(`Not a directory: ${path}`);
        }

        this.#currentPath = node.path;
        console.log(`Current path: ${this.#currentPath}`);
        return node;
    }

    /**
     * List files and folders in directory
     * @param {string} path Optional path
     */
    ls(path) {
        console.log('%cls', this.#commandStyle);
        console.log('%cInput: ',this.#inputStyle, path);

        const filenames = [];
        let entries;// Get entries from specified path
        const node = this.getNode(path);
        entries = Object.entries(node?.data?.children || {});

        if (entries.length > 0) {
            for (const [key] of entries) {
                console.log(`${key}`);
                filenames.push(key);
            }
        }

        return filenames;
    }

    /**
     * Move file
     * @param {string} source path to source destination
     * @param {string} dest path to output destination
     */
    mv(source, dest) {
        console.log('%cmv', this.#commandStyle);
        console.log(`%cInput: ${source} ${dest}`,this.#inputStyle);

        const sourceParts = source.split('/').filter(Boolean);
        const destParts = dest.split('/').filter(Boolean);

        const sourceKey = sourceParts.pop();
        destParts.pop();

        const sourceNode = this.getNode(source);
        const destNode = this.getNode(destParts.join('/'));


        if (sourceNode === null || destNode === null) {
            throw new Error('No such file or directory');
        }

        destNode.data['children'][sourceKey] = sourceNode.data;
        delete sourceNode.parentNode[sourceKey];
        console.log(`Moved ${source} to ${dest}`);
    }

    /**
     * Copy & paste file
     * @param {string} source Path to source file 
     * @param {string} dest Path to output file 
     */
    cp(source, dest) {
        console.log('%ccp', this.#commandStyle);
        console.log(`%cInput: ${source} ${dest}`,this.#inputStyle);

        const sourceParts = source.split('/').filter(Boolean);
        const destParts = dest.split('/').filter(Boolean);

        const sourceKey = sourceParts.pop();
        destParts.pop();

        const sourceNode = this.getNode(source);
        const destNode = this.getNode(destParts.join('/'));

        if (sourceNode === null || destNode === null) {
            throw new Error('No such file or directory');
        }

        const clone = JSON.parse(JSON.stringify(sourceNode?.data));

        destNode.data[sourceKey] = clone;
        console.log(`Copied ${source} to ${dest}`);
    }

    /**
     * Create file
     * @param {string} path Path to file
     */
    touch(path) {
        console.log('%ctouch', this.#commandStyle);
        console.log(`%cInput: ${path}`,this.#inputStyle);

        // Check directory levels of path
        const parts = path.split('/').filter(Boolean);
        const dirLevels = parts.length;
        const filename = parts.pop();

        if (dirLevels > 1) { // If path has directory levels
            // Check if parent of path exists
            const parent = this.getNode(parts.join('/'));
            if (parent === null) {
                throw new Error('No such file or directory');
            }
            parent.data.children[filename] = this.#createFileObject();
        }
        else if (dirLevels === 1) { // If path has no directory levels
            const node = this.getNode(this.#currentPath);
            // If path is root
            if (node.isRoot) {
                // Create file in root
                node.data[filename] = this.#createFileObject();
            }
            else {
                // Create file in "children" of directory node
                node.data.children[filename] = this.#createFileObject();
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
        console.log(`%cInput: ${args} ${path}`,this.#inputStyle);

        if ((args !== undefined && args !== null && args !== '' && args !== false) && args !== '-p') {
            throw new Error(`Invalid option -- ${args}`);
        }

        // Check directory levels of path
        const dirs = path.split('/').filter(Boolean);
        const dirLevels = dirs.length;
        const dirname = dirs.pop();

        // If only 1 level, check if directory already exists
        if (dirLevels === 1) {
            let node = this.getNode(dirname);
            if (node === null) { // If directory dont exist
                // Create directory in parent node
                node.parent.children[dirname] = this.#createDirectoryObject();
                console.log(`Created directory ${path}`);
                return;
            }
            else {
                throw new Error('Directory already exists')
            }
        }

        // Check each level of tree from path if directory exists
        const tree = {}
        let tempNode;
        for (const dir of dirs) {
            tempNode = this.getNode(dir);
            if (tempNode === null) {
                tree[dir] = false;
                continue;
            }
            tree[dir] = true;
        }

        // Validate existence of each directory
        if (Object.values(tree).includes(false)) {
            if (args === '-p') { // Create directories recursively
                // Create every parent directory
                let growingPath = [];
                let prevEntry = null; // [0] = directory name, [1] = exists or not (true, false)
                let node;
                for (const [dir, exist] of Object.entries(tree)) {
                    // If dir doesn't exist
                    if (!exist) {
                        // Create directory in existing parent directory
                        node = this.getNode(growingPath.join('/'));
                        node.data.children[dir] = this.#createDirectoryObject();
                    }
                    prevEntry = [dir, exist];
                    growingPath.push(dir);
                }
                node = this.getNode(growingPath.join('/'));
                node.data.children[dirname] = this.#createDirectoryObject();
            }
            else {
                throw new Error(`Cannot create directory ${path}: No such file or directory`);
            }
        }
        else {
            const node = this.getNode(dirs.join('/'));
            node.data[dirname] = {};
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
        console.log(`%cInput: ${args} ${path}`,this.#inputStyle);

        if ((args !== undefined && args !== null && args !== '' && args !== false) && args !== '-p') {
            throw new Error(`Invalid option -- ${args}`);
        }

        // Break path into dirs
        let dirs = path.split('/').filter(Boolean);

        if (dirs.length > 1 && args !== '-p') {
            // Remove last directory in path
            const node = this.getNode(dirs.join('/'));
            if (node === null) {
                throw new Error('No such file or directory');
            }
            if (!this.#isDirectory(node)) {
                throw new Error(`failed to remove '${dirs[dirs.length - 1]}': Not a directory`);
            }
            // Check if dir empty
            if (this.#isDirectoryEmpty(node)) {
                // Remove if empty
                delete node.parent[dirs[dirs.length - 1]];
                console.log(`Removed directory ${dirs[dirs.length - 1]}`);
            }
            else {
                throw new Error(`failed to remove '${dirs[dirs.length - 1]}': Directory not empty`);
            }
        }
        else if (dirs.length > 1 && args === '-p') {
            // Remove directories recursively
            for (let i = dirs.length - 1; i >= 0; i--) {
                // Check if node is directory
                const node = this.getNode(dirs.join('/'));
                if (node === null) {
                    throw new Error('No such file or directory');
                }
                if (!this.#isDirectory(node)) {
                    throw new Error(`failed to remove '${dirs[dirs.length - 1]}': Not a directory`);
                }
                // Check if dir empty
                if (this.#isDirectoryEmpty(node)) {
                    // Remove if empty
                    delete node.parentNode[dirs[i]];
                    console.log(`Removed directory ${dirs[i]}`);
                    // Generate new path for next iteration
                    dirs = dirs.slice(0, dirs.length - 1 < 0 ? 0 : dirs.length - 1);
                }
                else {
                    throw new Error(`failed to remove '${dirs[dirs.length - 1]}': Directory not empty`);
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
        console.log(`%cInput: ${args} ${path}`,this.#inputStyle);

        if (Array.isArray(path)) {
            // Run through every path
            for (const p of path) {
                this.rm(args, p);
            }
        }
        else {
            const parts = path.split('/').filter(Boolean);

            // Check if file/directory exists
            const node = this.getNode(path);
            if (node === null) {
                throw new Error(`cannot remove '${parts[parts.length - 1]}': No such file or directory`);
            }

            // Check if file or directory
            if (this.#isDirectory(node)) {
                if (args?.toLowerCase() === '-r' || args === '--recursive') {
                    delete node.parentNode.children[parts[parts.length - 1]];
                    console.log(`Removed directory ${parts[parts.length - 1]}`);
                }
                else {
                    throw new Error(`cannot remove '${parts[parts.length - 1]}': Is a directory`);
                }
            }
            if (this.#isFile(node)) {
                delete node.parentNode.children[parts[parts.length - 1]];
                console.log(`Removed file ${parts[parts.length - 1]}`);
            }
        }
    }

    getFilestructure() {
        return this.#fs;
    }
}