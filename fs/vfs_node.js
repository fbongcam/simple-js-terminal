// Copyright (c) 2025 fbongcam
// Licensed under the MIT License. See LICENSE file in the project root for details.

export class Node {
    /**
     * 
     * @param {string} name name of the node
     * @param {object} data object containing file structure
     * @param {string} path full path to node as string
     * @param {object} parentNode parent object of file structure
     * @param {boolean} isRoot flag to keep track if node location is root or not
     */
    constructor(name, data, path, parentNode, isRoot = false) {
        this.name = name;
        this.data = data;
        this.path = path;
        this.parentNode = parentNode;
        this.isRoot = isRoot;
    }
}