/**
 * Terminal & Panel Logic
 * Handles interactive terminals, tabs switching, and logs
 */

const Terminal = {
    instances: [], // { id, element, history: [], historyIndex: -1 }
    activeInstanceId: null,
    isSplit: false,
    globalHistory: [], // Shared history across instances
    historyIndex: -1,

    init() {
        this.attachEventListeners();
        this.createNewInstance();
        this.logToOutput("Editor system initialized...", "success");
    },

    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.onclick = () => this.switchPanel(tab.dataset.tab);
        });

        // Terminal actions
        document.getElementById('new-terminal-btn').onclick = () => this.createNewInstance();
        document.getElementById('split-terminal-btn').onclick = () => this.splitTerminal();
        document.getElementById('kill-terminal-btn').onclick = () => this.killActiveInstance();
    },

    switchPanel(tabId) {
        console.log(`Switching to panel: ${tabId}`);
        
        // 1. Update tabs active state
        const tabs = document.querySelectorAll('.panel-tab');
        tabs.forEach(t => t.classList.remove('active'));
        
        const activeTab = document.querySelector(`.panel-tab[data-tab="${tabId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // 2. Update content visibility
        const contents = document.querySelectorAll('.panel-content');
        contents.forEach(p => p.classList.remove('active'));
        
        const activeContent = document.getElementById(`${tabId}-panel`);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        // 3. Focus terminal if switched to terminal
        if (tabId === 'terminal') {
            const activeInst = this.instances.find(i => i.id === this.activeInstanceId);
            if (activeInst) {
                const input = activeInst.element.querySelector('.terminal-input');
                if (input) input.focus();
            }
        }
    },

    createNewInstance() {
        const id = 'term_' + Date.now();
        const instance = {
            id,
            history: [],
            element: this.createTerminalElement(id)
        };

        this.instances.push(instance);
        this.activeInstanceId = id;
        this.renderInstances();
        this.switchPanel('terminal');
    },

    createTerminalElement(id) {
        const div = document.createElement('div');
        div.className = 'terminal-instance';
        div.id = id;
        div.innerHTML = `
            <div class="terminal-output">
                <div class="terminal-line log-info">Microsoft Windows [Version 10.0.19045.4291]</div>
                <div class="terminal-line log-info">(c) Microsoft Corporation. All rights reserved.</div>
            </div>
            <div class="terminal-input-line">
                <span class="terminal-prompt">C:\\Users\\AI-Editor&gt;</span>
                <input type="text" class="terminal-input" spellcheck="false" autocomplete="off">
            </div>
        `;

        const input = div.querySelector('.terminal-input');
        input.onkeydown = (e) => this.handleInput(e, id);
        
        // Auto-focus when clicking anywhere in terminal
        div.onclick = () => input.focus();

        return div;
    },

    renderInstances() {
        const container = document.getElementById('terminal-instances');
        container.innerHTML = '';
        this.instances.forEach(inst => {
            container.appendChild(inst.element);
        });
        
        // Focus active input
        const activeInst = this.instances.find(i => i.id === this.activeInstanceId);
        if (activeInst) activeInst.element.querySelector('.terminal-input').focus();
    },

    handleInput(e, id) {
        const input = e.target;
        
        // Handle Command History
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.globalHistory.length > 0) {
                if (this.historyIndex === -1) {
                    this.historyIndex = this.globalHistory.length - 1;
                } else if (this.historyIndex > 0) {
                    this.historyIndex--;
                }
                input.value = this.globalHistory[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.globalHistory.length > 0) {
                if (this.historyIndex !== -1 && this.historyIndex < this.globalHistory.length - 1) {
                    this.historyIndex++;
                    input.value = this.globalHistory[this.historyIndex];
                } else {
                    this.historyIndex = -1;
                    input.value = '';
                }
            }
        }

        if (e.key === 'Enter') {
            const command = input.value.trim();
            if (!command) return;

            // Add to history
            this.globalHistory.push(command);
            this.historyIndex = -1;
            
            this.executeCommand(command, id);
            input.value = '';
        }
    },

    executeCommand(cmd, id) {
        const instance = this.instances.find(i => i.id === id);
        const outputArea = instance.element.querySelector('.terminal-output');
        
        // Add command to history view
        const cmdLine = document.createElement('div');
        cmdLine.className = 'terminal-line';
        cmdLine.innerHTML = `<span class="terminal-prompt">C:\\Users\\AI-Editor&gt;</span> ${cmd}`;
        outputArea.appendChild(cmdLine);

        // Process simple commands
        let response = "";
        const c = cmd.toLowerCase();
        
        if (c === 'cls' || c === 'clear') {
            outputArea.innerHTML = '';
        } else if (c === 'help') {
            response = "Available commands: help, cls, ls, date, echo, whoami";
        } else if (c === 'ls' || c === 'dir') {
            response = Object.values(Editor.fileSystem).map(f => f.name).join('  ');
        } else if (c === 'date') {
            response = new Date().toLocaleString();
        } else if (c === 'whoami') {
            response = Auth.currentUser ? Auth.currentUser.username : "guest";
        } else if (c.startsWith('echo ')) {
            response = cmd.substring(5);
        } else {
            response = `'${cmd}' is not recognized as an internal or external command.`;
        }

        if (response) {
            const respLine = document.createElement('div');
            respLine.className = 'terminal-line';
            respLine.textContent = response;
            outputArea.appendChild(respLine);
        }

        // Scroll to bottom
        instance.element.scrollTop = instance.element.scrollHeight;
    },

    splitTerminal() {
        if (this.instances.length >= 2) {
            Utils.showToast("Maximum split reached", "info");
            return;
        }
        this.createNewInstance();
    },

    killActiveInstance() {
        if (this.instances.length <= 1) {
            // Just clear the terminal if it's the last one
            this.instances[0].element.querySelector('.terminal-output').innerHTML = '';
            return;
        }

        this.instances = this.instances.filter(i => i.id !== this.activeInstanceId);
        this.activeInstanceId = this.instances[this.instances.length - 1].id;
        this.renderInstances();
    },

    logToOutput(msg, type = 'info') {
        const container = document.getElementById('output-log');
        const line = document.createElement('div');
        line.className = `log-${type}`;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        container.appendChild(line);
        container.scrollTop = container.scrollHeight;
    },

    logToDebug(msg, type = 'info') {
        const container = document.getElementById('debug-log');
        const line = document.createElement('div');
        line.className = `log-${type}`;
        line.textContent = `> ${msg}`;
        container.appendChild(line);
        container.scrollTop = container.scrollHeight;
    }
};
