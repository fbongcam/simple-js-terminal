
# 🖥️ Simple Terminal Made in JavaScript

A lightweight, embeddable terminal interface written in plain JavaScript. It simulates a command-line experience in the browser, complete with basic commands, command history, blinking cursor, and keyboard input.

The goal of this project isn't to create a fully working terminal with all features, rather a super simple terminal environment that can be added for fun anywhere, for whatever reason.

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

*Note:* document.body can of course be replaced with any element.

## License

Copyright 2025 fbongcam

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
