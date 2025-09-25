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
        if (this.#currentPath === '/' && (path === '' || path === undefined)) {
            return { contents: this.#fs['/'], path: '/', parent: null };
        }
        else if (this.#currentPath !== '/' && (path === '' || path === undefined)) {
            path = this.#currentPath;
        }

        let parts;
        if (path === '..' && this.#currentPath !== '/') {
            parts = this.#currentPath.split('/').filter(Boolean);
            parts = parts.slice(0, parts.length - 2).join('/');
            if (parts.length === 0) {
                return { contents: this.#fs['/'], path: '/', parent: null };
            }
        }
        else if (path === '..' && this.#currentPath === '/') {
            return { contents: this.#fs['/'], path: '/', parent: null };
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

        return { contents: node, path: path, parent: parent };
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
        if (node === null) return null;

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
        delete sourceNode.parent[sourceKey];
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
     * @param {*} name 
     */
    mkdir(name) {

    }

    /**
     * Remove empty directory
     * @param {*} path 
     */
    rmdir(path) {

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