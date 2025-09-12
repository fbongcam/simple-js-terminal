class VirtualFileSystem {
    #paths = {
        '/bin': ['bash', 'ls', 'cat', 'grep'],
        '/boot': ['grub2', 'vmlinuz', 'initramfs.img'],
        '/dev': ['null', 'zero', 'sda', 'tty'],
        '/etc': ['passwd', 'hostname', 'hosts', 'network'],
        '/home': ['alice', 'bob'],
        '/lib': ['modules', 'systemd'],
        '/lib64': ['ld-linux-x86-64.so.2'],
        '/lost+found': [],
        '/media': ['cdrom', 'usb'],
        '/mnt': ['data'],
        '/opt': ['customApp'],
        '/proc': ['cpuinfo', 'meminfo', 'uptime'],
        '/root': ['.bashrc', '.profile'],
        '/run': ['systemd', 'user'],
        '/sbin': ['init', 'shutdown', 'reboot'],
        '/srv': ['www', 'ftp'],
        '/sys': ['devices', 'fs'],
        '/tmp': ['tempfile1', 'tempfile2'],
        '/usr': ['bin', 'lib', 'share', 'local'],
        '/var': ['log', 'mail', 'spool', 'tmp']
    };

    constructor(options = {}) {
        this.options = {
            users: ['user'],
            ...options
        }
    }

    mkdir() {

    }

    rm() {

    }
}