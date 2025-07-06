/*!
Copyright 2025 fbongcam

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
@license MIT
*/

import { man } from "./man.js";

export class Terminal extends HTMLElement {
   #window;
   #input;
   #user = 'user';
   #PROMPT = "> ";
   #commandHistory = [];
   #commandIterator = null;
   #htmlTags = [
      "b", "strong", "i", "em", "mark", "small", "del", "ins", "sub", "sup",
      "u", "abbr", "code", "kbd", "samp", "var", "q", "blockquote", "cite",
      "pre", "span", "br", "wbr"
   ];
   #HTTPproxy = "https://corsproxy.io/?url=";

   constructor(autofocus) {
      super();
      this.shadow = this.attachShadow({ mode: 'closed' });
      // Create link element for external stylesheet
      let css;
      if (typeof process === 'undefined') {
         css = document.createElement('link');
         css.setAttribute('rel', 'stylesheet');
         css.setAttribute('href', './terminal.css');
      } else {
         const cssInject = 'INJECT_CSS_HERE';
         css = document.createElement('style');
         css.textContent = cssInject;
      }
      this.shadow.innerHTML = `
      <div id="container">
         <div id="border">
            <div id="caret"></div>
            <div id="window"></div>
         </div>
      </div>
      `;
      this.shadow.appendChild(css);
      this.#window = this.shadow.querySelector("#window");
      this.caret = this.shadow.querySelector('#caret');

      // Commands
      this.commands = {
         help: () => {
            return `Available commands: ${Object.keys(this.commands).sort().join(', ')}`;
         },
         echo: (args) => {
            return args.join(' ');
         },
         clear: () => {
            /* Insert line breaks to keep history

            const lineHeight_px = window.getComputedStyle(this.#input).lineHeight;
            const windowHeight_px = this.#window.clientHeight;
            console.log(windowHeight_px)
            console.log(lineHeight_px)
            const windowLines = Math.floor(windowHeight_px / parseFloat(lineHeight_px));
            for (let i=0; i < windowLines*2; i++) {
               this.#window.appendChild(document.createElement('br')); 
            }*/

            // Clear window
            this.#window.innerHTML = '';
         },
         date: () => {
            const date = new Date();
            return date;
         },
         whoami: () => {
            return this.#user;
         },
         ping: async (url) => {
            const sanitizeUrl = () => {
               if (!/^http?:\/\//i.test(url)) {
                  return 'http://' + url;
               }
               return url;
            }
            url = sanitizeUrl(url);
            const start = performance.now();
            return await fetch(this.#HTTPproxy + encodeURIComponent(url), {
               method: 'GET',
               cache: 'no-store'
            }).then(response => {
               const ms = performance.now() - start;
               if (response.status === 403) {
                  return `ping: cannot resolve ${url}`;
               }
               if (response.status === 429) {
                  return `ping: too many requests ${url}`;
               }
               return `ping: ${ms.toFixed(0)}ms`;
            }).catch(error => {
               return `ping: cannot resolve ${url}`;
            });
         },
         man: (args) => {
            // Check match for available commands
            const command = this.commands[args[0]];
            if (command != null) {
               // format and return command object
               const data = man[args[0]];
               const s = [];
               s[0] = '<b>NAME</b>';
               s[1] = String('     ' + data.name.replaceAll(args[0], `<b>${args[0]}</b>`));
               s[2] = '<b>DESCRIPTION</b>';
               s[3] = String('     ' + data.desc.replaceAll(args[0], `<b>${args[0]}</b>`));
               return this.#pre(s.join('\n'));
            }
            else {
               return 'What manual page do you want?';
            }
         },
         history: () => {
            const lines = [];
            let index = 1001;
            for (let i = 0; i < this.#commandHistory.length - 1; i++) {
               lines.push(`     <b>${String(index)}</b>     ${String(this.#commandHistory[i])}`);
               index++;
            }
            return this.#pre(lines.join('\n'));
         }
      }

      // Initialization
      requestAnimationFrame(() => {
         this.#loginMessage();
         this.#newLine();
         if (autofocus) {
            this.#input.focus();
         }
      });

      // Prevent caret from going before prompt
      this.#window.addEventListener("keydown", (e) => {

         // Key combos
         if (e.ctrlKey && e.key === 'c') {
            console.log('Cancel operation')
            // TODO Cancel operation
         }
         if (e.ctrlKey && e.key === 'l') {
            this.commands.clear();
         }

         // Move caret
         if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            requestAnimationFrame(() => {
               this.#moveCaret();
            });
         }

         // Go through previous commands
         if (e.key === "ArrowUp" || e.key === "ArrowDown" && this.#commandHistory.length > 0) {
            e.preventDefault();
            // Arrow up - Previous command
            if (e.key === "ArrowUp") {
               this.#inputCommandHistory(-1);
               console.log("arrow up")
            }
            // Arrow down - Next command
            if (e.key === "ArrowDown") {
               console.log("arrow down")
               this.#inputCommandHistory(1);
            }
            requestAnimationFrame(() => {
               this.#moveCaret();
            });
         }

         // On Enter: save input and add new prompt
         if (e.key === "Enter") {
            e.preventDefault();
            // Add input
            this.#handleCommand();
         }
      });

      // Prevent Safari from adding line breaks
      this.#window.addEventListener("beforeinput", (e) => {
         if (e.inputType === "insertParagraph") {
            e.preventDefault();
         }
      });

      this.#window.addEventListener('click', (e) => {
         const selection = window.getSelection();
         const selectedText = selection ? selection.toString().trim() : "";
         if (selectedText.length > 0) {
            // Prevent the click from triggering if text is selected
            e.preventDefault();
            e.stopPropagation();
            return;
         }
         this.shadow.querySelector('.input-current').focus();
      });

      this.#window.addEventListener('input', () => {
         requestAnimationFrame(() => {
            this.#moveCaret();
         })
      });
   }

   #pre(content) {
      const pre = document.createElement('pre');
      pre.innerHTML = content;
      return pre;
   }

   #loginMessage() {
      let date = new Date().toUTCString();
      date = date.replace(',', "");
      const msg = `Last login: ${date.slice(0, 24)}`;
      const div = document.createElement('div');
      div.id = 'login-msg';
      div.textContent = msg;
      this.#window.appendChild(div);
   }

   #moveCaret() {
      const caretPosition = this.#getCaretPosition();
      if (caretPosition.offset === 0) {
         this.#moveCaretToNewLine();
         return;
      }
      this.caret.style.left = `${caretPosition.x}px`;
   }

   #moveCaretToNewLine() {
      const newLinePos = this.#input.getBoundingClientRect();
      this.caret.style.top = `${newLinePos.y}px`;
      this.caret.style.left = `${newLinePos.x}px`;
   }

   #newLine() {
      // Disable old input
      const old = this.shadow.querySelector('.input-current');
      if (old != null) {
         this.#disableEditable(old);
      }

      const div = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = this.#PROMPT;
      const span = document.createElement('span');
      span.classList.add('input', 'input-current');
      span.contentEditable = true;
      span.autocorrect = 'off';
      span.autocapitalize = 'off';
      div.appendChild(b);
      div.appendChild(span);
      this.#input = span;
      this.#window.appendChild(div);
      requestAnimationFrame(() => {
         this.#setCaretToEnd();
         this.#moveCaretToNewLine();
      });
   }

   #disableEditable(el) {
      el.removeAttribute('contenteditable');
      el.classList.remove('input-current');
   }

   #inputCommandHistory(value) {
      if (this.#commandIterator == null && this.#commandHistory.length > 0) {
         this.#commandIterator = this.#commandHistory.length;
      }

      // Update command iterator
      if (value === -1) {
         this.#commandIterator--;
      }
      else if (value === 1) {
         this.#commandIterator++;
      }

      // Safety check for iterator
      if (this.#commandIterator < 0) {
         this.#commandIterator = 0;
      }
      if (this.#commandIterator > this.#commandHistory.length) {
         this.#commandIterator = this.#commandHistory.length;
      }

      const command = this.#commandHistory[this.#commandIterator];
      if (command != null) {
         this.#input.textContent = command;
      }
      else {
         this.#input.textContent = "";
      }
      requestAnimationFrame(() => {
         this.#setCaretToEnd();
      })

      console.log("Command history: ", this.#commandHistory);
      console.log("Loaded command: ", this.#commandHistory[this.#commandIterator]);
   }

   async #handleCommand() {
      const promptLength = this.#PROMPT.length;
      const input = this.#window.lastElementChild.textContent.slice(promptLength).trim().toLowerCase();
      console.log(input)

      // Validate non empty input
      if (input.trim() !== "") {
         this.#commandHistory.push(input);
      }

      // Reset command iterator
      this.#commandIterator = null;

      // Split command and arguments
      const [cmdName, ...args] = input.trim().split(/\s+/);

      // Run command
      const newTextBlock = document.createElement('div');
      newTextBlock.classList.add('output');
      const fn = this.commands[cmdName];
      if (fn != null) {
         const result = await fn(args);
         if (result !== undefined) {
            if (result instanceof HTMLElement) {
               newTextBlock.appendChild(result);
            }
            else {
               newTextBlock.innerHTML = result;
            }

            this.#window.appendChild(newTextBlock);
         }
      }
      else if (input.trim() === '') {
         // DO NOTHING
      }
      else {
         newTextBlock.textContent = `Command not found: ${input}`;
         this.#window.appendChild(newTextBlock);
      }

      requestAnimationFrame(() => {
         this.#newLine();
      });
   }

   #setCaretToEnd() {
      this.#input.focus();

      const range = document.createRange();
      range.selectNodeContents(this.#input);
      range.collapse(false);

      const selection = this.shadow.getSelection?.() || window.getSelection();
      try {
         // Safari-friendly approach
         selection.setBaseAndExtent(
            range.startContainer,
            range.startOffset,
            range.endContainer,
            range.endOffset
         );
      } catch (e) {
         // Fallback for older browsers
         selection.removeAllRanges();
         selection.addRange(range);
      }
   }

   #getCaretPosition() {
      this.#input.focus();

      const selection = this.shadow.getSelection?.() || window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0).cloneRange();

      // Collapse the range to the caret (insertion point only)
      range.collapse(true);

      // Get bounding rectangle
      const rect = range.getClientRects()[0] || range.getBoundingClientRect();

      if (!rect) return null; // In case caret is not visible

      return {
         container: range.endContainer,
         offset: range.endOffset,
         x: rect.left,
         y: rect.top
      };
   }

   setCaret(pos) {
      this.#window.selectionStart = this.#window.selectionEnd = pos;
      this.#window.scrollTop = this.#window.scrollHeight;
   }

   #stripTextFormattingTags(input) {
      const tagPattern = new RegExp(`<\/?(${this.#htmlTags.join("|")})(\\s[^>]*)?>`, "gi");
      return input.replace(tagPattern, "");
   }

   /**
    * Set custom list of commands
    * @param {*} commands 
    */
   setCommands(commands) {
      if (
         typeof commands === 'object' &&
         commands !== null &&
         !Array.isArray(commands) &&
         Object.values(commands).every(value => typeof value === 'function')
      ) {
         this.commands = commands;
      } else {
         throw new Error("Not valid commands");
      }
   }

   /**
    * Add command
    * @param {string} key 
    * @param {function} fn 
    */
   addCommand(key, fn) {
      if (typeof key === 'string' && typeof fn === 'function') {
         this.commands[key] = fn;
      } else if (typeof key !== 'string') {
         throw new Error('Key has to be of type string');
      }
      else if (typeof fn !== 'function') {
         throw new Error('Fn has to be a function');
      }
   }

   /**
    * Set custom proxy server other than the default one
    * @param {*} url 
    */
   setProxy(url) {
      this.#HTTPproxy = url;
   }

}