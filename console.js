/*
 *   Copyright (c) 2025 fbongcam
 *   All rights reserved.
 */

export default class Console extends HTMLElement {
  #terminal;
  #PROMPT = "> ";
  #history = "";
  #commandHistory = [];
  #commandIterator = null;
  #lastValidCaretPos;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'closed' });
    // Create link element for external stylesheet
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'console.css');
    shadow.innerHTML = `
      <div>
        <div id="border">
          <textarea id="input"></textarea>
        </div>
      </div>
    `;
    shadow.appendChild(linkElem);

    this.#terminal = shadow.querySelector("textarea");

    // Textarea options
    //------------------
    this.#terminal.spellcheck = false;
    //------------------

    // Set initial prompt
    this.#terminal.value = this.#PROMPT;
    this.#setCaretToEnd();

    // Prevent caret from going before prompt
    this.#terminal.addEventListener("keydown", (e) => {
      const caretPos = this.#terminal.selectionStart;
      const promptIndex = this.#terminal.value.lastIndexOf(this.#PROMPT);
      const inputStart = promptIndex + this.#PROMPT.length;

      // Disallow moving caret before prompt
      if (e.key === "ArrowLeft" && caretPos <= inputStart) {
        e.preventDefault();
      }
      if (e.key === "Home") {
        e.preventDefault();
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
          if (this.#commandHistory.length - 1 === this.#commandIterator) {
            this.#terminal.value = this.#history + this.#PROMPT;
            this.#setCaretToEnd();
            // Reset iterator
            this.#commandIterator = this.#commandHistory.length ? this.#commandHistory.length - 1 : null;
            return;
          }
          this.#inputCommandHistory(1);
        }
      }

      // Disallow Backspace before prompt
      if (e.key === "Backspace" && caretPos <= inputStart) {
        e.preventDefault();
      }

      // On Enter: save input and add new prompt
      if (e.key === "Enter") {
        e.preventDefault();
        const input = this.#terminal.value.slice(inputStart).trim();

        // Validate non empty input
        if (input.trim() !== "") {
          this.#commandHistory.push(input);
        }
        this.#handleCommand(input);

        // Reset command iterator
        this.#commandIterator = null;
      }

    });

    // Prevent input before prompt
    this.#terminal.addEventListener("beforeinput", (e) => {
      const start = this.#getPromptStart();
      if (this.#terminal.selectionStart < start || this.#terminal.selectionEnd < start) {
        e.preventDefault();
      }
    });

  }

  #inputCommandHistory(value) {
    if (this.#commandIterator == null && this.#commandHistory.length > 0) {
      this.#commandIterator = this.#commandHistory.length - 1;
    }

    // Update command iterator
    if (value === -1 && this.#commandIterator > 0) {
      this.#commandIterator--;
    }
    else if (value === 1 && this.#commandIterator < (this.#commandHistory.length - 1) ) {
      this.#commandIterator++;
    }

    console.log("Command history: ", this.#commandHistory);
    console.log("Loaded command: ", this.#commandHistory[this.#commandIterator]);
    const command = this.#commandHistory[this.#commandIterator];
    if (command != null) {
      this.#terminal.value = this.#history + this.#PROMPT + command;
      this.#setCaretToEnd();
    }
    
    
  }

  #handleCommand(input) {
    // Add to history
    this.#history += `${this.#PROMPT}${input}\n`;

    // Set new prompt line
    this.#terminal.value = this.#history + this.#PROMPT;
    this.#setCaretToEnd();
  }

  // Utility: set caret to end
  #setCaretToEnd() {
    requestAnimationFrame(() => {
      this.#terminal.selectionStart = this.#terminal.selectionEnd = this.#terminal.value.length;
      this.#terminal.scrollTop = this.#terminal.scrollHeight;
    });
  }

  #getPromptStart() {
    return this.#terminal.value.lastIndexOf(this.#PROMPT) + this.#PROMPT.length;
  }

  // Save caret position if it's valid
  #updateValidCaretPosition() {
    const pos = this.#terminal.selectionStart;
    const promptStart = this.#getPromptStart();
    if (pos >= promptStart) {
      this.#lastValidCaretPos = pos;
    }
  }

  #enforceCaretPosition() {
    const start = this.#getPromptStart();
    if (this.#terminal.selectionStart < start || this.#terminal.selectionEnd < start) {
      this.#setCaretToEnd();
    }
  }

  setCaret(pos) {
    this.#terminal.selectionStart = this.#terminal.selectionEnd = pos;
    this.#terminal.scrollTop = this.#terminal.scrollHeight;
  }

}