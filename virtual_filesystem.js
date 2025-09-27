export class VirtualFileSystem {
    #options;
    #fs;
    #currentPath;
    #commandStyle = 'border-left: 3px solid black;padding:12px;font-size:13px;font-weight:bold;';

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
    }

    /**
     * Gets node from path
     * @param {*} path 
     * @returns Object { contents, path, parentNode }
     */
    #getNode(path) {
        const vfsNode = new VirtualFileSystem.Node();

        if (this.#currentPath === '/' && (path === '' || path === undefined)) {
            vfsNode.contents = this.#fs['/'];
            vfsNode.path = '/';
            vfsNode.parentNode = null;
            return vfsNode;
        }
        else if (this.#currentPath !== '/' && (path === '' || path === undefined)) {
            path = this.#currentPath;
        }

        let parts;
        if (path === '..' && this.#currentPath !== '/') {
            parts = this.#currentPath.split('/').filter(Boolean);
            parts = parts.slice(0, parts.length - 2).join('/');
            if (parts.length === 0) {
                vfsNode.contents = this.#fs['/'];
                vfsNode.path = '/';
                vfsNode.parentNode = null;
                return vfsNode;
            }
        }
        else if (path === '..' && this.#currentPath === '/') {
            vfsNode.contents = this.#fs['/'];
            vfsNode.path = '/';
            vfsNode.parentNode = null;
            return vfsNode;
        }

        parts = path.split('/').filter(Boolean); // split by "/" and drop empties
        let node = this.#fs['/']; // always start at root

        const treeLength = parts.length;
        let i = 0;
        let parent = this.#fs['/'];
        for (const part of parts) {
            i++;
            if (i === treeLength - 1) {
                parent = node[part];
            }
            if (node && typeof node === 'object' && part in node) {
                node = node[part];
            } else {
                return null; // not found
            }
        }

        return new VirtualFileSystem.Node(node, path, parent);
    }

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
     * 
     * @param {*} node 
     * @returns true or false
     */
    #isFile(node) {
        if (!(node instanceof VirtualFileSystem.Node)) {
            throw new Error(`Not instance of ${VirtualFileSystem.Node.name}`);
        }
        if (typeof node.contents === null) {
            return true;
        }
        return false;
    }

    /**
     * 
     * @param {*} node 
     * @returns true or false
     */
    #isDirectory(node) {
        if (!(node instanceof VirtualFileSystem.Node)) {
            throw new Error(`Not instance of ${VirtualFileSystem.Node.name}`);
        }
        if (typeof node.contents === 'object') {
            return true;
        }
        return false;
    }

    #isDirectoryEmpty(node) {
        if (!(node instanceof VirtualFileSystem.Node)) {
            throw new Error(`Not instance of ${VirtualFileSystem.Node.name}`);
        }
        if (Object.keys(node.contents).length === 0) {
            return true;
        }
        return false;
    }

    /**
     * Navigate to path
     * @param {*} path 
     */
    cd(path) {
        console.log('%ccd', this.#commandStyle);
        // Jump to home directory 
        if (path === '' || path === undefined) {
            this.#currentPath = '/';
            return this.#getNode('/');
        }

        const node = this.#getNode(path);
        if (node === null) {
            return null;
        }

        console.log(node)

        // Check if node is directory
        if (!this.#isDirectory(node)) {
            throw new Error(`failed to remove '${dirs[dirs.length - 1]}': Not a directory`);
        }

        console.log(node);

        this.#currentPath = path;
        return node;
    }

    /**
     * List files and folders in directory
     * @param {*} path Optional path
     */
    ls(path) {
        console.log('%cls', this.#commandStyle);

        const filenames = [];
        let entries;// Get entries from specified path
        const node = this.#getNode(path);
        entries = Object.entries(node.contents);

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
     * @param {*} source path to source destination
     * @param {*} dest path to output destination
     */
    mv(source, dest) {
        console.log('%cmv', this.#commandStyle);
        const sourceParts = source.split('/').filter(Boolean);
        const destParts = dest.split('/').filter(Boolean);

        const sourceKey = sourceParts.pop();
        destParts.pop();

        const sourceNode = this.#getNode(source);
        const destNode = this.#getNode(destParts.join('/'));


        if (sourceNode === null || destNode === null) {
            throw new Error('No such file or directory');
        }

        destNode.contents[sourceKey] = sourceNode.contents;
        delete sourceNode.parentNode[sourceKey];
        console.log(`Moved ${source} to ${dest}`);
    }

    /**
     * Copy & paste file
     * @param {*} source Path to source file 
     * @param {*} dest Path to output file 
     */
    cp(source, dest) {
        console.log('%ccp', this.#commandStyle);

        const sourceParts = source.split('/').filter(Boolean);
        const destParts = dest.split('/').filter(Boolean);

        const sourceKey = sourceParts.pop();
        destParts.pop();

        const sourceNode = this.#getNode(source);
        const destNode = this.#getNode(destParts.join('/'));


        if (sourceNode === null || destNode === null) {
            throw new Error('No such file or directory');
        }

        const clonedNode = this.#cloneNode(sourceNode.contents);

        destNode.contents[sourceKey] = clonedNode;
        console.log(`Copied ${source} to ${dest}`);
    }

    /**
     * Create file
     * @param {*} path Path to file
     */
    touch(path) {
        console.log('%ctouch', this.#commandStyle);

        // Check directory levels of path
        const parts = path.split('/').filter(Boolean);
        const dirLevels = parts.length;
        const filename = parts.pop();

        if (dirLevels > 1) { // If path has directory levels
            // Check if parent of path exists
            const parent = this.#getNode(parts.join('/'));
            if (parent === null) {
                throw new Error('No such file or directory');
            }
            parent.contents[filename] = null;
        }
        else if (dirLevels === 1) { // If path has no directory levels
            this.#getNode(this.#currentPath).contents[filename] = null;
        }
        console.log(`Created file ${path}`);
    }

    /**
     * Create directory
     * @param {*} args "-p" for recursively make directories of path
     * @param {*} path Path of directory 
     */
    mkdir(args, path) {
        console.log('%cmkdir', this.#commandStyle);

        if ((args !== undefined && args !== null && args !== '' && args !== false) && args !== '-p') {
            throw new Error(`Invalid option -- ${args}`);
        }

        // Check directory levels of path
        const dirs = path.split('/').filter(Boolean);
        const dirLevels = dirs.length;
        const dirname = dirs.pop();

        // If only 1 level, check if directory already exists
        if (dirLevels === 1) {
            let node = this.#getNode(dirname);
            if (node === null) { // If directory dont exist
                // Create directory in parent node
                node.parent[dirname] = {};
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
            tempNode = this.#getNode(dir);
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
                        node = this.#getNode(growingPath.join('/'));
                        console.log(growingPath);
                        console.log(node)
                        node.contents[dir] = {};
                    }
                    prevEntry = [dir, exist];
                    growingPath.push(dir);
                    console.log(prevEntry)
                }
                node = this.#getNode(growingPath.join('/'));
                node.contents[dirname] = {};
            }
            else {
                throw new Error(`Cannot create directory ${path}: No such file or directory`);
            }
        }
        else {
            const node = this.#getNode(dirs.join('/'));
            node.contents[dirname] = {};
        }
    }

    /**
     * Remove empty directory
     * @param {*} args 
     * @param {*} path 
     */
    rmdir(args, path) {
        console.log('%crmdir', this.#commandStyle);

        if ((args !== undefined && args !== null && args !== '' && args !== false) && args !== '-p') {
            throw new Error(`Invalid option -- ${args}`);
        }

        // Break path into dirs
        let dirs = path.split('/').filter(Boolean);

        if (dirs.length > 1 && args !== '-p') {
            // Remove last directory in path
            const node = this.#getNode(dirs.join('/'));
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
                const node = this.#getNode(dirs.join('/'));
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
     * Remove file
     */
    rm(args) {

    }

    getFilestructure() {
        return this.#fs;
    }
}

VirtualFileSystem.Node = class Node {
    constructor(contents, path, parentNode) {
        this.contents = contents;
        this.path = path;
        this.parentNode = parentNode;
    }

    setAll(content, path, parentNode) {
        this.contents = content;
        this.path = path;
        this.parentNode = parentNode;
    }

    setContent(content) {
        this.contents = content;
    }

    setPath(path) {
        this.path = path;
    }

    setParentNode(parentNode) {
        this.parentNode = parentNode;
    }
}