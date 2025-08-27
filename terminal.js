/*!
Copyright 2025 fbongcam

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { man } from "./man.js";

export class Terminal extends HTMLElement {
   #id = 'simple-js-terminal-fb';
   #window;
   #input; // Input element
   #user = 'user';
   #PROMPT = "> ";
   #commandHistory = []; // List of used commands
   #commandIterator = null;
   #HTTPproxy = "https://corsproxy.io/?url=";
   #workingFile;
   #pageOpen = false; // Helps track if page is open
   #pageEditMode = false; // True means the opened page is the current input
   #reactiveMode = false; // True means input reacts instantly on keydown
   #currentPageLine = 0;
   #currentElement;
   #outputBackup; // Temporarily stores output
   #files = [];
   #observers = [];
   #isKeyDown = {};
   #intervals = {};
   #timeouts = {};
   #animations = {};
   #keyRepeats = 0;
   #latestEvent;

   // Private helper functions
   //------------------
   #idPrefix = (id_class_name) => {
      return `${this.#id}-${id_class_name}`;
   }

   #createPageHeader = (title, desc) => {
      const div = document.createElement('div');
      const t = document.createElement('div');
      t.append(title);
      const s = document.createElement('div');
      s.append(desc);
      div.append(t);
      div.append(s);
      return div;
   }

   #createPageFooter = (footerContent) => {
      const div = document.createElement('div');
      if (Array.isArray(footerContent)) {
         for (let el of footerContent) {
            div.append(el);
         }
      }
      else {
         div.append(footerContent);
      }
      return div;
   }

   /**
    * Creates a new input element
    * @returns input object with reference to container and the input element itself ({input, inputField})
    */
   #createInput = () => {
      const div = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = this.#PROMPT;
      const span = document.createElement('span');
      span.classList.add(this.#idPrefix('input'), this.#idPrefix('input-current'));
      span.contentEditable = true;
      span.autocorrect = 'off';
      span.spellcheck = false;
      span.autocapitalize = 'off';
      div.appendChild(b);
      div.appendChild(span);
      return { 'input': div, 'inputField': span };
   }

   /**
    * Removes input element
    */
   #removeInput = () => {
      const floatingInput = this.querySelector(`.${this.#idPrefix('floating-input')}`);
      if (floatingInput != null) {
         floatingInput.remove();
         return;
      }
      const old = this.querySelector(`.${this.#idPrefix('input-current')}`);
      console.log(old);
      if (old != null) {
         this.#disableEditable(old);
      }
   }

   #hideShowPageHeaderFooter = () => {
      const scrollPos = this.#getScrollPos(this.#window);
      switch (scrollPos) {
         case 'TOP':
            this.header.style.visibility = 'visible';
            break;
         case 'BOTTOM':
            this.footer.style.visibility = 'visible';
            this.header.style.visibility = 'hidden';
            break;
         case 'CENTER':
            this.header.style.visibility = 'hidden';
            this.footer.style.visibility = 'hidden';
            break;
         default:
            this.header.style.visibility = 'visible';
            this.footer.style.visibility = 'visible';
      }
   }

   #resetHeaderFooter = () => {
      this.header.style.visibility = 'hidden';
      this.footer.style.visibility = 'hidden';
      this.header.innerHTML = '';
      this.footer.innerHTML = '';
   }

   #getLineheight = (el) => {
      const lineHeight = window.getComputedStyle(el).lineHeight;
      if (lineHeight === 'normal') {
         const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
         return fontSize * 1.2;
      }
      return parseFloat(lineHeight);
   }

   #getScrollPos = (el) => {
      const scrollTop = el.scrollTop;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (el.scrollHeight === el.clientHeight) {
         return 'NONE';
      }
      else if (scrollTop >= maxScroll) {
         console.log('Scrolled bottom')
         return 'BOTTOM';
      }
      else if (scrollTop === 0) {
         console.log('Scrolled top')
         return 'TOP';
      }
      else {
         return 'CENTER';
      }
   }

   /**
    * Observes latest added element in a container or element
    * @param {element} el element to observe 
    */
   #observeLatestElement = (el) => {
      this.#observers['latest-element'] = new MutationObserver(mutations => {
         mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
               if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV') {
                  this.#currentElement = node;
                  console.log(`Latest element added in ${el}: `, this.#currentElement)
               }
            });
         });
      });

      this.#observers['latest-element'].observe(el, { childList: true, subtree: true });
   }

   /**
    * 
    * @param {element} node 
    * @param {fn} callback 
    */
   #observeTextNodes = (el, callback, callback2) => {
      this.#observers['text-nodes'] = new MutationObserver(mutations => {
         mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
               if (node.nodeType === Node.TEXT_NODE) {
                  console.log('Latest text node ', node)
                  if (callback) {
                     callback(node);
                  }
               }
            });
         });
      });

      this.#observers['text-nodes'].observe(el, { childList: true, subtree: false });
   }

   #stopObserver = (observer) => {
      if (observer) {
         observer.disconnect();
      }
      else {
         throw new Error(`Observer doesn't exist`)
      }
   }

   #findFirstTextNode = (el) => {
      if (el) {
         const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
               // Filter out empty text nodes
               return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            },
         });
         return walker.nextNode();
      }
      return null;
   }

   /**
    * Wraps text nodes with a container element
    * @param {element/node} textNode
    * @param {element} container 
    */
   #wrapTextNode = (textNode, container) => {
      if (textNode.nodeType === Node.TEXT_NODE) {
         if (!container) {
            container = document.createElement('div');
         }
         const clone = textNode.cloneNode(false);
         container.append(clone);
         console.log(textNode.parentElement)
         textNode.parentElement.replaceChild(container, textNode);
         console.log('Text node wrapped');
      }
   }

   #getUserAgent = () => {
      const userAgent = navigator.userAgent.toString().toLowerCase();
      console.log('UserAgent: ', userAgent)
      if (userAgent.includes('firefox')) {
         return 'firefox';
      }
      else if (userAgent.includes('chrome')) {
         return 'chrome';
      }
      else if (userAgent.includes('safari')) {
         return 'safari';
      }
      else {
         return 'unknown';
      }
   }

   #getSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
         return null;
      }
      return selection;
   }

   #getCaretPosition = () => {
      this.#input.focus();

      const selection = this.#getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const originalRange = selection.getRangeAt(0).cloneRange();
      const testRange = originalRange.cloneRange();
      testRange.collapse(true);

      // Create a temporary marker span (invisible but measurable)
      const marker = document.createElement("span");
      marker.textContent = "\u200b"; // Zero-width space
      marker.style.position = "absolute"; // Prevent reflow
      marker.style.pointerEvents = "none"; // Avoid interaction
      marker.style.userSelect = "none"; // Avoid selection
      marker.style.lineHeight = "1";

      // Insert and measure
      testRange.insertNode(marker);
      const rect = marker.getBoundingClientRect();
      const containerRect = this.border.getBoundingClientRect();

      // Cleanup: remove marker and restore selection
      const parent = marker.parentNode;
      parent.removeChild(marker);

      // Restore the original selection
      selection.removeAllRanges();
      selection.addRange(originalRange);

      // If the rect is valid, return it
      if (rect && rect.left !== 0 && rect.top !== 0) {
         return {
            container: originalRange.endContainer,
            offset: originalRange.endOffset,
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top
         };
      }

      return null; // Still can't get a meaningful position
   }

   #disableEditable = (el) => {
      el.removeAttribute('contenteditable');
      el.classList.remove(this.#idPrefix('input-current'));
   }

   /**
    * Moves caret to beginning of input
    */
   #moveCaretToInput = () => {
      this.#input.focus();
      const inputPos = this.#input.getBoundingClientRect();
      const containerPos = this.border.getBoundingClientRect();
      this.caret.style.top = `${inputPos.y - containerPos.y}px`;
      this.caret.style.left = `${inputPos.x - containerPos.x}px`;
   }

   /**
    * Moves caret to specified element
    * @param {element} el 
    */
   #moveCaretToElement = (el) => {
      const elementPos = el.getBoundingClientRect();
      const containerPos = this.border.getBoundingClientRect();
      this.caret.style.top = `${elementPos.y - containerPos.y}px`;
      this.caret.style.left = `${elementPos.x - containerPos.x}px`;
   }

   #setCaretToEnd = () => {
      this.#input.focus();

      const range = document.createRange();
      range.selectNodeContents(this.#input);
      range.collapse(false);

      const selection = this.#getSelection();
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

   #setCaretPosition = (el, offset = 0) => {
      const range = document.createRange();
      const sel = this.#getSelection();

      const textNode = this.#findFirstTextNode(el);

      let rect;
      if (textNode) {
         console.log('textNode: ', textNode)
         // Strip 'zero-width' from text node
         if (textNode.nodeValue.includes('\u200B')) {
            textNode.nodeValue = textNode.nodeValue.replace(/\u200B/g, '');
         }

         // If offset parameter larger than element text node, set offset to 
         // textNode max offset
         if (textNode.length < offset) {
            offset = textNode.length;
            if (!textNode.length) {
               offset = null;
            }
         }

         range.setStart(textNode, offset);
         range.collapse(true); // Collapse to just a caret

         // Get bounding rectangle
         rect = range.getClientRects()[0] || range.getBoundingClientRect();

         sel.removeAllRanges();
         sel.addRange(range);
      }
      else { // If no text node exists
         offset = null;
      }

      if (offset === 0 || offset == null) {
         this.#moveCaretToElement(el);
      }
      else if (rect) {
         this.caret.style.top = `${rect.y}px`;
         this.caret.style.left = `${rect.x}px`;
      }
   }

   #stripTextFormattingTags = (input) => {
      const htmlTags = [
         "b", "strong", "i", "em", "mark", "small", "del", "ins", "sub", "sup",
         "u", "abbr", "code", "kbd", "samp", "var", "q", "blockquote", "cite",
         "pre", "span", "br", "wbr"
      ];
      const tagPattern = new RegExp(`<\/?(${htmlTags.join("|")})(\\s[^>]*)?>`, "gi");
      return input.replace(tagPattern, "");
   }

   #deleteChar = () => {
      const selection = this.#getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      if (!range.collapsed) {
         // There is a selection — delete it
         range.deleteContents();
         return;
      }

      // No selection: delete one character before the cursor
      const { startContainer, startOffset } = range;

      if (startOffset === 0) return; // Beginning of node — nothing to delete

      // Create new range to delete the previous character
      const deleteRange = document.createRange();
      deleteRange.setStart(startContainer, startOffset - 1);
      deleteRange.setEnd(startContainer, startOffset);

      // Delete the character
      deleteRange.deleteContents();

      // Move the caret back to the right position
      range.setStart(startContainer, startOffset - 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
   }

   #pre = (content) => {
      const pre = document.createElement('pre');
      pre.innerHTML = content;
      return pre;
   }
   //------------------

   // Commands
   //------------------
   #commands = {
      help: () => {
         return `Available commands: ${Object.keys(this.#commands).sort().join(', ')}`;
      },
      //-------------
      echo: (args) => {
         return args.join(' ');
      },
      //-------------
      clear: () => {
         // Clear window
         this.#window.innerHTML = '';
      },
      //-------------
      date: () => {
         const date = new Date();
         return date;
      },
      //-------------
      whoami: () => {
         return this.#user;
      },
      //-------------
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
      //-------------
      man: (args) => {
         // Check match for available commands
         const command = this.#commands[args[0]];
         if (command || (typeof process && args[0] === 'devman' && args[1])) {
            // format and return command object
            let data = man[args[0]];
            if (args[0] === 'devman') {
               if (!man.devman[args[1]]) {
                  console.warn('Invalid dev manual!');
                  return 'Invalid dev manual!';
               }
               else {
                  data = man.devman[args[1]];
               }
            }
            const d = [];
            for (let i = 0; i < 10; i++) {
               d[i] = document.createElement('div');
               if (i % 2 === 0) {
                  d[i].classList.add(this.#idPrefix('man-page-title'));
               }
               else {
                  d[i].classList.add(this.#idPrefix('man-page-desc'));
               }
            }

            d[0].innerHTML = '<b>Name</b>';
            d[1].innerHTML = data.name.replaceAll(args[0], `<b>${args[0]}</b>`);
            d[2].innerHTML = '<b>Syntax</b>';
            d[3].innerHTML = `<b>${args[0]}</b> [ <u>options</u> ]`;
            d[4].innerHTML = '<b>Description</b>';
            d[5].innerHTML = data.desc.replaceAll(args[0], `<u>${args[0]}</u>`);
            /*
            Add more here...
            */

            const contentContainer = document.createElement('div');
            for (let i = 0; i < d.length; i++) {
               if (d[i].children.length !== 0 || d[i].innerHTML !== '') {
                  contentContainer.appendChild(d[i]);
               }
            }

            this.#openPage(
               {
                  editable: false,
                  headerContent: this.#createPageHeader(args[0], "MANUAL"),
                  footerContent: this.#createPageFooter("Footer"),
                  content: contentContainer
               }
            );

            this.#reactiveMode = true;

         }
         else {
            return 'What manual page do you want?';
         }
      },
      //-------------
      history: () => {
         const lines = [];
         let index = 1001;
         for (let i = 0; i < this.#commandHistory.length - 1; i++) {
            lines.push(`     <b>${String(index)}</b>     ${String(this.#commandHistory[i])}`);
            index++;
         }
         return this.#pre(lines.join('\n'));
      },
      //-------------
      nano: (args) => {
         if (args.length > 0) {
            this.#workingFile = args[0];
         }

         // HEADER
         const header = this.#createPageHeader('UW PICO', args.length > 0 ? args[0] : 'New Buffer');
         // FOOTER
         const lblExit = document.createElement('div');
         const o = document.createElement('span');
         o.textContent = '^C';
         o.style.backgroundColor = 'white';
         o.style.color = 'black';
         lblExit.append(o, ' Exit');
         const lblSave = document.createElement('div');
         const s = document.createElement('span');
         s.textContent = '^O';
         s.style.backgroundColor = 'white';
         s.style.color = 'black';
         lblSave.append(s, ' Save');
         const footer = this.#createPageFooter([lblExit, lblSave]);

         this.#openPage({ editable: true, headerContent: header, footerContent: footer, content: null });

         // Track latest element (line)
         this.#observeLatestElement(this.#input);

         return false;
      },
      //-------------
      pico: (args) => this.#commands['nano'](args),
      /*
      Add commands here...
      //-------------
      name: (args) => {
      
      },
      */
   }

   constructor({ autofocus = true, parent = document.body }) {
      super();
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

      this.terminal = document.createElement('div');
      this.terminal.id = this.#idPrefix('container');
      this.border = document.createElement('div');
      this.caret = document.createElement('div');
      this.#window = document.createElement('div');
      this.header = document.createElement('div');
      this.footer = document.createElement('div');
      this.border.id = this.#idPrefix('border');
      this.caret.id = this.#idPrefix('caret');
      this.#window.id = this.#idPrefix('window');
      this.header.id = this.#idPrefix('header');
      this.footer.id = this.#idPrefix('footer');

      this.border.append(this.caret, this.#window);
      this.border.appendChild(this.header);
      this.border.appendChild(this.footer);
      this.terminal.append(this.border);
      this.append(this.terminal)
      document.head.appendChild(css);
      // Caret blink animation
      this.#animations['caret-blink'] = this.caret.animate(
         [
            { opacity: 1 },
            { opacity: 0 },
            { opacity: 1 }
         ],
         {
            duration: 1000,
            iterations: Infinity,
            easing: 'steps(2, start)' // sharp transition, no fade
         }
      );

      // Initialization
      requestAnimationFrame(() => {
         this.#loginMessage();
         this.#newCommandInput();
         if (autofocus) {
            this.#input.focus();
         }
      });

      this.addEventListener('keyup', (e) => {
         this.#isKeyDown[e.key] = false;
         if (e.key === 'Backspace') {
            this.#keyRepeats = 0;
         }
      });

      this.addEventListener("keydown", (e) => {
         this.#isKeyDown[e.key] = true;

         // Pause caret blink
         this.#animations['caret-blink'].currentTime = 500;
         this.#animations['caret-blink'].pause();
         clearTimeout(this.#timeouts['caret-blink']);
         this.#timeouts['caret-blink'] = setTimeout(() => {
            // Start cursor blink after 1.5s
            this.#animations['caret-blink'].play();
         }, 1500);

         if (e.key === 'Backspace') {
            // Debounce
            this.#keyRepeats++;
            if (this.#keyRepeats % 2 === 0) {
               e.preventDefault();
            }
         }

         // Key combos
         if (e.ctrlKey && e.key === 'c') {
            console.log('Cancel operation')
            // TODO Cancel operation
            if (this.#pageOpen) {
               this.#closePage();
            }
         }
         if (e.ctrlKey && e.key === 'l') {
            this.#commands.clear();
         }
         if (e.ctrlKey && e.key === 'x') {
            if (this.#pageOpen) {

            }
         }

         // Move caret
         if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            requestAnimationFrame(() => {
               this.#moveCaret();
            });
         }

         if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            // Go through previous commands
            if (!this.#pageOpen && this.#commandHistory.length > 0) {
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
            // Scroll when a page is opened
            if (this.#pageOpen && !this.#pageEditMode) {
               const page = document.getElementById(this.#idPrefix('page'));
               // Get page lineHeight
               const lineHeight = this.#getLineheight(page);
               console.log(lineHeight)
               if (e.key === 'ArrowUp') {
                  this.#window.scrollTop = this.#window.scrollTop - lineHeight;
               }
               if (e.key === 'ArrowDown') {
                  this.#window.scrollTop = this.#window.scrollTop + lineHeight;
               }
            }
         }

         // On Enter:
         if (e.key === "Enter") {
            // Save input and add new prompt
            if (!this.#pageOpen) {
               e.preventDefault();
               // run command
               this.#handleCommand();
            }
            // If page is open and inputMode is on, add new line
            else if (this.#pageOpen && this.#pageEditMode) {
               const el = this.#currentElement;
               // Update the caret position
               const loop = setInterval(() => {
                  if (el != this.#currentElement) {
                     requestAnimationFrame(() => {
                        this.#currentPageLine++;
                        // Move caret to latest element (line)
                        this.#moveCaretToElement(this.#currentElement)
                        clearInterval(loop);
                     })
                  }
               }, 30);
            }
         }

         if (e.key === 'q') {
            if (this.#pageOpen && !this.#pageEditMode && this.#reactiveMode) {
               this.#closePage();
            }
         }
      });

      this.addEventListener("beforeinput", (e) => {
         // Disable line break
         if (e.inputType === 'insertLineBreak') {
            e.preventDefault();
            return;
         }

         this.#latestEvent = e;
         console.log(this.#latestEvent)

         // Prevent Safari from adding line breaks
         if (e.inputType === "insertParagraph") {
            if (!this.#pageOpen) {
               e.preventDefault();
            }
         }
      });

      this.addEventListener('click', (e) => {
         const selection = this.#getSelection();
         const selectedText = selection ? selection.toString().trim() : "";
         if (selectedText.length > 0) {
            // Prevent the click from triggering if text is selected
            e.preventDefault();
            e.stopPropagation();
            return;
         }
         this.querySelector(`.${this.#idPrefix('input-current')}`).focus();
      });

      this.addEventListener('input', (e) => {
         requestAnimationFrame(() => {
            if (this.#pageOpen) {

            }
            this.#moveCaret();
         })
      });

      this.addEventListener('focusin', (e) => {
         console.log('Focused element: ', e.target);
         this.caret.classList.remove(this.#idPrefix('caret-inactive'));
         this.#animations['caret-blink'].play();
      });
      this.addEventListener('focusout', (e) => {
         this.caret.classList.add(this.#idPrefix('caret-inactive'));
         this.#animations['caret-blink'].currentTime = 500;
         this.#animations['caret-blink'].pause();
      });

      // Scroll behaviour
      this.#window.addEventListener('scroll', () => {
         if (!this.#pageEditMode && this.#pageOpen) {
            this.#hideShowPageHeaderFooter();
         }
      });

      // Window resize optimizations
      this.#observers['resize'] = new ResizeObserver((el) => {
         requestAnimationFrame(() => {
            this.#moveCaret();
         })
      });
      this.#observers['resize'].observe(this.#window);
   }

   #loginMessage() {
      let date = new Date().toUTCString();
      date = date.replace(',', "");
      const msg = `Last login: ${date.slice(0, 24)}`;
      const div = document.createElement('div');
      div.id = this.#idPrefix('login-msg');
      div.textContent = msg;
      this.#window.appendChild(div);
   }

   async #handleCommand() {
      const promptLength = this.#PROMPT.length;
      const input = this.#window.lastElementChild.textContent.slice(promptLength).trim();
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
      const fn = this.#commands[cmdName];
      if (fn != null) {
         const result = await fn(args);
         if (result !== undefined) {
            if (result instanceof HTMLElement) {
               newTextBlock.appendChild(result);
            }
            else if (result === false) {
               // If result is false, cancel operation
               return;
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

      if (!this.#pageOpen) {
         requestAnimationFrame(() => {
            this.#newCommandInput();
         });
      }

   }

   /**
    * Opens page for input of content and various information, e.t.c manual pages.
    * @param {Object} page Object consisting of properties: editable: true/false, headerContent: html, footerContent: html, content: html
    */
   #openPage(page = { editable, headerContent, footerContent, content }) {
      this.#outputBackup = this.#window.innerHTML;
      this.#pageOpen = true;
      if (page.editable) {
         this.#pageEditMode = true;
      }

      // clear window
      this.#window.innerHTML = '';
      console.log(this.#outputBackup)

      const container = document.createElement('div');
      const header = page.headerContent ? page.headerContent : this.#createPageHeader('NAME', 'DESC');
      const content = document.createElement('div');
      content.id = this.#idPrefix('page-content');
      if (page.content) {
         content.append(page.content);
      }
      if (page.editable) {
         content.classList.add(this.#idPrefix('input'), this.#idPrefix('input-current'));
         content.contentEditable = true;
      }
      else {
         content.contentEditable = false;
         // Create floating input outside Window element
         const input = this.#createInput();
         input.input.classList.add(this.#idPrefix('floating-input'));
         this.border.appendChild(input.input);

         this.#input = input.inputField;
         this.#input.focus();
      }

      content.spellcheck = false;
      content.autocorrect = 'off';
      content.autocapitalize = 'off';
      if (page.editable) {
         this.#input = content;
      }

      requestAnimationFrame(() => {
         this.#moveCaret();
      });

      const footer = page.footerContent ? page.footerContent : this.#createPageFooter('UNDEFINED');
      this.header.innerHTML = "";
      this.header.append(header);
      container.append(content);
      container.id = this.#idPrefix('page');
      this.#window.appendChild(container);
      this.footer.innerHTML = "";
      this.footer.append(footer);

      if (!page.editable) {
         // Calculate height of footer for bottom offset
         const footerHeight = this.footer.clientHeight;
         console.log('Footer height: ', footerHeight)
         const pagePadding = parseFloat(window.getComputedStyle(container).paddingBottom);
         container.style.paddingBottom = footerHeight + pagePadding + 'px';
         this.footer.style.bottom = footerHeight + 'px';
      }

      this.#hideShowPageHeaderFooter();
   }

   #closePage() {
      console.log(this.#outputBackup)
      if (!this.#reactiveMode) {
         // Restore window output on close
         this.#window.innerHTML = this.#outputBackup;
      }
      else {
         this.#endReactiveMode();
      }

      this.#pageEditMode = false;
      this.#pageOpen = false;

      // Remove floating input
      this.#removeInput();

      requestAnimationFrame(() => {
         this.#newCommandInput();
      });

      // Stop element observer
      if (this.#observers['latest-element']) {
         this.#stopObserver(this.#observers['latest-element']);
      }

      this.#resetHeaderFooter();
   }

   #endReactiveMode() {
      if (this.#reactiveMode) {
         this.#reactiveMode = false;
         this.#window.innerHTML = this.#outputBackup;
      }
   }

   /**
    * Creates new line (new input)
    */
   #newCommandInput() {
      // Disable old input
      this.#removeInput();

      // Create new input
      const input = this.#createInput();

      // Add the input to DOM
      this.#input = input.inputField;
      this.#window.appendChild(input.input);

      // Move caret to the new line
      requestAnimationFrame(() => {
         this.#moveCaretToInput();
      });
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

   /**
    * Moves caret to correct position
    * @returns none
    */
   #moveCaret() {
      const caretPosition = this.#getCaretPosition();
      console.log('Caret position: ', caretPosition)

      // USE CASE: Moves caret to new input when command has been entered, as an example.
      if (caretPosition.offset === 0 && !this.#pageOpen) {
         this.#moveCaretToInput();
         return;
      }
      // USE CASE: Moves caret when typing in an input
      if (caretPosition.x !== 0 && caretPosition.y !== 0) {
         this.caret.style.left = `${caretPosition.x}px`;
         this.caret.style.top = `${caretPosition.y}px`;
      }
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
         this.#commands = commands;
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
         this.#commands[key] = fn;
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