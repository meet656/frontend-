/**
 * Extension System
 * Allows modular features to be added to the editor
 */

const ExtensionManager = {
    extensions: [],
    activeExtensions: new Set(),

    init() {
        this.loadExtensions();
        this.renderExtensionList();
    },

    register(extension) {
        this.extensions.push(extension);
        const savedState = localStorage.getItem(`ext_${extension.id}`);
        if (savedState === 'enabled' || (savedState === null && extension.defaultEnabled)) {
            this.enable(extension.id);
        }
    },

    enable(id) {
        const ext = this.extensions.find(e => e.id === id);
        if (ext && !this.activeExtensions.has(id)) {
            try {
                ext.activate();
                this.activeExtensions.add(id);
                localStorage.setItem(`ext_${id}`, 'enabled');
                this.renderExtensionList();
                Utils.showToast(`Extension "${ext.name}" enabled`, 'success');
            } catch (err) {
                console.error(`Failed to activate extension ${id}:`, err);
                Utils.showToast(`Failed to enable ${ext.name}`, 'error');
            }
        }
    },

    disable(id) {
        const ext = this.extensions.find(e => e.id === id);
        if (ext && this.activeExtensions.has(id)) {
            try {
                if (ext.deactivate) ext.deactivate();
                this.activeExtensions.delete(id);
                localStorage.setItem(`ext_${id}`, 'disabled');
                this.renderExtensionList();
                Utils.showToast(`Extension "${ext.name}" disabled`, 'info');
            } catch (err) {
                console.error(`Failed to deactivate extension ${id}:`, err);
            }
        }
    },

    loadExtensions() {
        // Register default extensions
        this.register(WordCounterExtension);
        this.register(CodeFormatterExtension);
    },

    renderExtensionList() {
        const container = document.getElementById('extensions-list');
        if (!container) return;

        container.innerHTML = '';
        this.extensions.forEach(ext => {
            const isActive = this.activeExtensions.has(ext.id);
            const div = document.createElement('div');
            div.className = 'extension-item';
            div.innerHTML = `
                <div class="extension-item-header">
                    <span class="extension-name">${ext.name}</span>
                    <button class="ext-toggle ${isActive ? 'active' : ''}">
                        ${isActive ? 'Disable' : 'Enable'}
                    </button>
                </div>
                <p class="extension-description">${ext.description}</p>
            `;
            
            div.querySelector('.ext-toggle').onclick = () => {
                if (isActive) this.disable(ext.id);
                else this.enable(ext.id);
            };
            
            container.appendChild(div);
        });
    }
};

/**
 * Extension 1: Word Counter
 */
const WordCounterExtension = {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Shows word and character count in the status bar.',
    defaultEnabled: true,
    interval: null,

    activate() {
        const footerLeft = document.querySelector('.footer-left');
        const stats = document.createElement('div');
        stats.id = 'ext-word-counter-stats';
        stats.className = 'status-item';
        footerLeft.appendChild(stats);

        const updateStats = () => {
            const model = Editor.editor?.getModel();
            if (model) {
                const text = model.getValue();
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                const chars = text.length;
                stats.textContent = `${words} words, ${chars} chars`;
            } else {
                stats.textContent = '';
            }
        };

        this.interval = setInterval(updateStats, 1000);
        updateStats();
    },

    deactivate() {
        if (this.interval) clearInterval(this.interval);
        document.getElementById('ext-word-counter-stats')?.remove();
    }
};

/**
 * Extension 2: Code Formatter
 */
const CodeFormatterExtension = {
    id: 'code-formatter',
    name: 'Code Formatter',
    description: 'Adds a format button to the editor toolbar.',
    defaultEnabled: true,

    activate() {
        const controls = document.querySelector('.action-controls');
        const formatBtn = document.createElement('button');
        formatBtn.id = 'ext-format-btn';
        formatBtn.className = 'icon-btn action-icon-btn';
        formatBtn.title = 'Format Code';
        formatBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
            </svg>
        `;
        
        formatBtn.onclick = () => {
            const action = Editor.editor?.getAction('editor.action.formatDocument');
            if (action) {
                action.run();
                Utils.showToast('Code formatted', 'success');
            } else {
                Utils.showToast('Formatting not available for this language', 'warn');
            }
        };

        controls.appendChild(formatBtn);
    },

    deactivate() {
        document.getElementById('ext-format-btn')?.remove();
    }
};

// Initialize Extension Manager
document.addEventListener('DOMContentLoaded', () => {
    ExtensionManager.init();
});
