/**
 * Settings & Theme Management
 */

const Settings = {
    theme: 'dark',

    init() {
        this.loadSettings();
        this.attachEventListeners();
        this.applyTheme();
    },

    loadSettings() {
        this.theme = localStorage.getItem('app_theme') || 'dark';
    },

    saveSettings() {
        localStorage.setItem('app_theme', this.theme);
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
        this.applyTheme();
    },

    applyTheme() {
        document.body.className = this.theme === 'light' ? 'light-theme' : '';
        // If monaco is initialized, update its theme too
        if (window.monaco) {
            monaco.editor.setTheme(this.theme === 'light' ? 'vs' : 'vs-dark');
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
                        <h3>Profile</h3>
                        <button class="empty-btn" onclick="window.location.href='profile.html'">View Profile</button>
                    </div>
                    <div class="settings-section">
                        <h3>Theme</h3>
                        <div class="theme-presets">
                            <div class="theme-option theme-dark ${this.theme === 'dark' ? 'active' : ''}" onclick="Settings.setTheme('dark'); this.parentElement.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active')); this.classList.add('active')" title="Dark"></div>
                            <div class="theme-option theme-light ${this.theme === 'light' ? 'active' : ''}" onclick="Settings.setTheme('light'); this.parentElement.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active')); this.classList.add('active')" title="Light"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
};

// Initialize Settings
Settings.init();
