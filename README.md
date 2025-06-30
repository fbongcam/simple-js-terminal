
# 🖥️ Simple Terminal Made in JavaScript

A lightweight, embeddable terminal interface written in plain JavaScript. It simulates a command-line experience in the browser, complete with basic commands, command history, blinking cursor, and keyboard input.

The goal of this project isn't to create a fully working terminal.

## ✨ Features

- Interactive terminal prompt
- Adding custom commands
- Command history (with arrow key navigation)
- Simulated blinking cursor
- Easily embeddable in any HTML page

## 🚀 Getting Started

### 1. Clone or Download

```bash
git clone https://github.com/fbongcam/simple-js-terminal.git
```

### 2. Usage

Move <b>terminal.css</b> and <b>terminal.js</b> to same folder and use it like in the <b>script.js</b> file.

```js
import Terminal from "./terminal.js";
```

```js
window.customElements.define('terminal-window', Terminal);

const terminal = new Terminal(true);
document.body.appendChild(terminal);
```

More info coming soon.
