/**
 * Main Application Script
 * Initializes modules and handles global UI interactions
 */

/**
 * Global Utilities
 */
const Utils = {
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    },

    showLoading(target) {
        const loader = document.createElement('div');
        loader.className = 'loader-overlay';
        loader.innerHTML = '<div class="loader"></div>';
        target.appendChild(loader);
        return () => loader.remove();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Authentication Check
    // If not logged in, auth.js will redirect to login.html
    if (!Auth.isAuthenticated()) {
        Auth.checkAuth();
        return;
    }

    // 2. Initialize Modules
    Editor.init();
    Terminal.init();
    Chat.init();

    // 3. Set User Info
    const user = Auth.currentUser;
    if (user) {
        const statusUser = document.getElementById('status-user');
        if (statusUser) statusUser.textContent = user.username;
    }

    // 4. Global UI Event Listeners
    
    // Panel Toggles
    const closePanelBtn = document.getElementById('close-panel-btn');
    // bottomPanel declared later for terminal resizer
    if (closePanelBtn) {
        closePanelBtn.onclick = () => {
            document.getElementById('bottom-panel').classList.toggle('hidden');
            if (Editor.editor) setTimeout(() => Editor.editor.layout(), 0);
        };
    }

    const closeAiBtn = document.getElementById('close-ai-panel-btn');
    if (closeAiBtn) {
        closeAiBtn.onclick = () => {
            document.getElementById('ai-panel').classList.toggle('hidden');
            if (Editor.editor) setTimeout(() => Editor.editor.layout(), 0);
        };
    }

    // Activity Bar Switching Logic
    const activityIcons = document.querySelectorAll('.activity-icon');
    const sidebarSections = document.querySelectorAll('.sidebar-section');

    activityIcons.forEach(icon => {
        const title = icon.getAttribute('title');
        
        // Skip special icons that have their own handlers attached elsewhere
        if (title === 'Open Project' || title === 'Close Project' || title === 'Settings') {
            return; 
        }

        icon.onclick = () => {
            if (!title) return;

            // Switch Sidebar Sections
            activityIcons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');

            const sectionId = `sidebar-${title.toLowerCase()}`;
            sidebarSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
        };
    });

    // Resizable Panels Logic
    const sidebar = document.getElementById('sidebar');
    const resizer = document.createElement('div');
    resizer.className = 'resizer-v';
    sidebar.after(resizer);

    let isResizing = false;

    resizer.onmousedown = (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
    };

    document.onmousemove = (e) => {
        if (!isResizing) return;
        const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
        if (newWidth > 150 && newWidth < 500) {
            sidebar.style.width = newWidth + 'px';
            document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
            if (Editor.editor) Editor.editor.layout();
        }
    };

    document.onmouseup = () => {
        isResizing = false;
        document.body.style.cursor = 'default';
        isResizingTerminal = false;
        if (Editor.editor) Editor.editor.layout();
    };

    // Terminal Resizer
    const bottomPanel = document.getElementById('bottom-panel');
    const resizerH = document.createElement('div');
    resizerH.className = 'resizer-h';
    bottomPanel.before(resizerH);

    let isResizingTerminal = false;

    resizerH.onmousedown = (e) => {
        isResizingTerminal = true;
        document.body.style.cursor = 'row-resize';
    };

    document.addEventListener('mousemove', (e) => {
        if (isResizingTerminal) {
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight > 100 && newHeight < 600) {
                bottomPanel.style.height = newHeight + 'px';
                if (Editor.editor) Editor.editor.layout();
            }
        }
    });
    
    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        // Ctrl + P -> Quick Open (Search)
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            const searchIcon = document.querySelector('.activity-icon[title="Search"]');
            if (searchIcon) searchIcon.click();
            Utils.showToast('Opening Search...');
        }
    });

    // Theme Restore
    Settings.applySettings();

    // 5. Initialize Menu Logic
    initMenuBar();

    // 6. Global Console Capture for Debug Console
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
        originalLog(...args);
        if (window.Terminal) Terminal.logToDebug(args.join(' '), 'info');
    };
    
    console.error = (...args) => {
        originalError(...args);
        if (window.Terminal) Terminal.logToDebug(args.join(' '), 'error');
    };

    window.onerror = (msg, url, line, col, error) => {
        if (window.Terminal) Terminal.logToDebug(`Runtime Error: ${msg} (at ${line}:${col})`, 'error');
        return false;
    };
    
    console.log('AI Code Editor Initialized Successfully');
});

/**
 * Menu Bar Logic
 * Connects UI menu items to real editor, terminal, and system functions
 */
function initMenuBar() {
    // Edit Menu
    document.getElementById('menu-undo').onclick = () => Editor.editor?.trigger('keyboard', 'undo', null);
    document.getElementById('menu-redo').onclick = () => Editor.editor?.trigger('keyboard', 'redo', null);
    document.getElementById('menu-cut').onclick = () => {
        const text = Editor.editor?.getModel()?.getValueInRange(Editor.editor?.getSelection());
        if (text) {
            navigator.clipboard.writeText(text);
            Editor.editor?.trigger('keyboard', 'delete', null);
        }
    };
    document.getElementById('menu-copy').onclick = () => {
        const text = Editor.editor?.getModel()?.getValueInRange(Editor.editor?.getSelection());
        if (text) navigator.clipboard.writeText(text);
    };
    document.getElementById('menu-paste').onclick = async () => {
        const text = await navigator.clipboard.readText();
        if (text) {
            const selection = Editor.editor?.getSelection();
            Editor.editor?.executeEdits('paste', [{ range: selection, text: text, forceMoveMarkers: true }]);
        }
    };
    document.getElementById('menu-select-all').onclick = () => Editor.editor?.setSelection(Editor.editor?.getModel()?.getFullModelRange());

    // File Menu (Extended)
    document.getElementById('menu-open-file').onclick = () => document.getElementById('open-file-btn').click();
    document.getElementById('menu-open-folder').onclick = () => document.getElementById('open-folder-btn').click();
    
    // New Project Menu Items (if they exist in HTML)
    const menuOpenProject = document.getElementById('menu-open-project');
    if (menuOpenProject) menuOpenProject.onclick = () => Editor.openProject();

    const menuCloseProject = document.getElementById('menu-close-project');
    if (menuCloseProject) menuCloseProject.onclick = () => Editor.closeProject();

    const menuSaveProject = document.getElementById('menu-save-project');
    if (menuSaveProject) menuSaveProject.onclick = () => {
        Editor.saveFileSystem();
        Utils.showToast('Project saved to local storage', 'success');
    };

    // Go Menu
    document.getElementById('menu-go-line').onclick = () => {
        const line = prompt('Go to line:');
        if (line) Editor.editor?.revealLineInCenter(parseInt(line));
    };

    // Run Menu
    document.getElementById('menu-run-code').onclick = () => document.getElementById('run-btn').click();

    // Help Menu
    document.getElementById('menu-about').onclick = () => {
        const modal = document.createElement('div');
        modal.className = 'settings-overlay';
        modal.innerHTML = `
            <div class="settings-modal" style="width: 400px; text-align: center;">
                <div class="settings-header">
                    <h2>About AI Code Editor</h2>
                    <button class="icon-btn" onclick="this.closest('.settings-overlay').remove()">✕</button>
                </div>
                <div class="settings-content" style="padding: 40px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" style="margin-bottom: 20px;">
                        <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                    </svg>
                    <p style="margin-bottom: 10px;"><strong>AI Code Editor</strong></p>
                    <p style="color: var(--text-secondary); font-size: 13px;">Version 1.0.0</p>
                    <p style="color: var(--text-secondary); font-size: 13px; margin-top: 20px;">Built with Monaco Editor & Vanilla JS</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };
}
