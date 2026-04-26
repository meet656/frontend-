/**
 * Settings & Theme Management
 */

const Settings = {
    theme: 'dark',
    fontSize: 14,
    tabSize: 4,

    init() {
        this.loadSettings();
        this.attachEventListeners();
        this.applySettings();
    },

    loadSettings() {
        this.theme = localStorage.getItem('app_theme') || 'dark';
        this.fontSize = parseInt(localStorage.getItem('app_font_size')) || 14;
        this.tabSize = parseInt(localStorage.getItem('app_tab_size')) || 4;
    },

    saveSettings() {
        localStorage.setItem('app_theme', this.theme);
        localStorage.setItem('app_font_size', this.fontSize);
        localStorage.setItem('app_tab_size', this.tabSize);
    },

    attachEventListeners() {
        // Settings icon in activity bar
        const settingsBtn = document.querySelector('.activity-icon[title="Settings"]');
        if (settingsBtn) {
            settingsBtn.onclick = () => this.showSettingsModal();
        }
    },

    setTheme(themeName) {
        this.theme = themeName;
        this.saveSettings();
        this.applySettings();
    },

    setFontSize(size) {
        this.fontSize = size;
        this.saveSettings();
        this.applySettings();
    },

    setTabSize(size) {
        this.tabSize = size;
        this.saveSettings();
        this.applySettings();
    },

    applySettings() {
        // Apply Theme
        document.body.className = this.theme === 'light' ? 'light-theme' : '';
        
        // Apply to Monaco
        if (window.monaco && Editor.editor) {
            const monacoTheme = this.theme === 'light' ? 'vs' : 'vs-dark';
            Editor.editor.updateOptions({ 
                theme: monacoTheme,
                fontSize: this.fontSize,
                tabSize: this.tabSize
            });
            if (Editor.diffEditor) {
                Editor.diffEditor.updateOptions({ 
                    theme: monacoTheme,
                    fontSize: this.fontSize,
                    tabSize: this.tabSize
                });
            }
        }
    },

    showSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'settings-overlay';
        modal.innerHTML = `
            <div class="settings-modal">
                <div class="settings-header">
                    <h2>Settings</h2>
                    <button class="icon-btn" onclick="this.closest('.settings-overlay').remove()">✕</button>
                </div>
                <div class="settings-content">
                    <div class="settings-section">
                        <h3>Editor Theme</h3>
                        <div class="theme-presets">
                            <div class="theme-option theme-dark ${this.theme === 'dark' ? 'active' : ''}" onclick="Settings.setTheme('dark'); this.parentElement.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active')); this.classList.add('active')" title="Dark Theme"></div>
                            <div class="theme-option theme-light ${this.theme === 'light' ? 'active' : ''}" onclick="Settings.setTheme('light'); this.parentElement.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active')); this.classList.add('active')" title="Light Theme"></div>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Editor Font Size</h3>
                        <div class="settings-input-group">
                            <input type="number" value="${this.fontSize}" min="8" max="32" onchange="Settings.setFontSize(parseInt(this.value))">
                            <span>px</span>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Tab Size</h3>
                        <div class="settings-input-group">
                            <select onchange="Settings.setTabSize(parseInt(this.value))">
                                <option value="2" ${this.tabSize === 2 ? 'selected' : ''}>2</option>
                                <option value="4" ${this.tabSize === 4 ? 'selected' : ''}>4</option>
                                <option value="8" ${this.tabSize === 8 ? 'selected' : ''}>8</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Auto Save</h3>
                        <div class="toggle-container">
                            <label class="toggle-switch">
                                <input type="checkbox" ${Editor.autoSaveEnabled ? 'checked' : ''} onchange="Editor.autoSaveEnabled = this.checked; localStorage.setItem('editor_auto_save', this.checked); Editor.updateAutoSaveUI(); Utils.showToast('Auto Save ' + (this.checked ? 'Enabled' : 'Disabled'))">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
};

// Initialize Settings
document.addEventListener('DOMContentLoaded', () => {
    Settings.init();
});
