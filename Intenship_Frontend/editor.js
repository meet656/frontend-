/**
 * Editor Logic
 * Handles Monaco Editor, Tabs, and Advanced File System Simulation
 */

const Editor = {
    editor: null,
    diffEditor: null,
    fileSystem: [], // Array of objects: { id, name, type: 'file'|'folder', parentId, content, language, isOpen: boolean, model: monaco.editor.ITextModel }
    activeFileId: null,
    openTabs: [],
    originalModel: null,
    modifiedModel: null,

    init() {
        this.loadFileSystem();
        this.setupMonaco();
        this.renderFileTree();
        this.attachEventListeners();
        this.updateEmptyState();
        this.setupDiffEditorHandlers();
    },

    setupDiffEditorHandlers() {
        document.getElementById('accept-diff-btn').onclick = () => this.acceptChanges();
        document.getElementById('reject-diff-btn').onclick = () => this.rejectChanges();
    },

    openDiffView(originalContent, modifiedContent) {
        const overlay = document.getElementById('diff-editor-overlay');
        overlay.classList.remove('hidden');

        if (!this.diffEditor) {
            this.diffEditor = monaco.editor.createDiffEditor(document.getElementById('monaco-diff-container'), {
                theme: Settings.theme === 'light' ? 'vs' : 'vs-dark',
                automaticLayout: true,
                originalEditable: false,
                renderSideBySide: true
            });
        }

        const activeFile = this.fileSystem.find(f => f.id === this.activeFileId);
        const language = activeFile ? activeFile.language : 'javascript';

        this.originalModel = monaco.editor.createModel(originalContent, language);
        this.modifiedModel = monaco.editor.createModel(modifiedContent, language);

        this.diffEditor.setModel({
            original: this.originalModel,
            modified: this.modifiedModel
        });
    },

    acceptChanges() {
        if (!this.modifiedModel || !this.activeFileId) return;
        
        const newContent = this.modifiedModel.getValue();
        const file = this.fileSystem.find(f => f.id === this.activeFileId);
        
        if (file) {
            file.content = newContent;
            if (file.model) {
                file.model.setValue(newContent);
            }
            this.saveFileSystem();
        }

        this.closeDiffView();
        Utils.showToast('Changes applied', 'success');
    },

    rejectChanges() {
        this.closeDiffView();
        Utils.showToast('Changes discarded', 'info');
    },

    closeDiffView() {
        const overlay = document.getElementById('diff-editor-overlay');
        overlay.classList.add('hidden');

        if (this.originalModel) this.originalModel.dispose();
        if (this.modifiedModel) this.modifiedModel.dispose();
        
        this.originalModel = null;
        this.modifiedModel = null;
    },

    loadFileSystem() {
        const saved = localStorage.getItem('app_file_system');
        if (saved) {
            this.fileSystem = JSON.parse(saved);
        } else {
            // Default structure
            this.fileSystem = [
                { id: 'root_src', name: 'src', type: 'folder', parentId: null, isOpen: true },
                { id: '1', name: 'index.js', type: 'file', parentId: 'root_src', content: '// Welcome\nconsole.log("Hello!");', language: 'javascript' },
                { id: '2', name: 'styles.css', type: 'file', parentId: 'root_src', content: 'body { color: white; }', language: 'css' },
                { id: '3', name: 'index.html', type: 'file', parentId: null, content: '<html></html>', language: 'html' }
            ];
            this.saveFileSystem();
        }
    },

    saveFileSystem() {
        console.log('Saving File System:', this.fileSystem);
        localStorage.setItem('app_file_system', JSON.stringify(this.fileSystem));
    },

    setupMonaco() {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            // Apply Dark Theme by default as requested
            monaco.editor.setTheme("vs-dark");

            this.editor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                lineHeight: 22,
                padding: { top: 16, bottom: 16 }
            });

            this.editor.onDidChangeCursorPosition(e => {
                document.getElementById('editor-cursor-pos').textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
            });

            // Restore last active file if any
            const lastActive = localStorage.getItem('last_active_file');
            if (lastActive && this.fileSystem.find(f => f.id === lastActive)) {
                this.openFile(lastActive);
            }
        });
    },

    renderFileTree() {
        console.log('Rendering File Tree... Current State:', this.fileSystem);
        const container = document.getElementById('file-tree');
        if (!container) return;
        
        // 1. Always clear container
        container.innerHTML = '';
        
        // 2. Rebuild full tree from fileSystem
        const renderLevel = (parentId, level = 0) => {
            const items = this.fileSystem.filter(f => f.parentId === parentId)
                .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));

            items.forEach(item => {
                const div = document.createElement('div');
                div.className = `file-item ${item.id === this.activeFileId ? 'active' : ''} ${item.type}`;
                div.style.paddingLeft = `${level * 12 + 12}px`;
                div.draggable = true;
                
                // Drag and Drop Events
                div.ondragstart = (e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                    div.classList.add('dragging');
                    document.body.classList.add('dragging-mode');
                };

                div.ondragend = () => {
                    div.classList.remove('dragging');
                    document.body.classList.remove('dragging-mode');
                    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('drag-over'));
                };

                div.ondragover = (e) => {
                    e.preventDefault();
                    div.classList.add('drag-over');
                };

                div.ondragleave = () => {
                    div.classList.remove('drag-over');
                };

                div.ondrop = (e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData('text/plain');
                    if (draggedId !== item.id) {
                        this.moveItem(draggedId, item.id);
                    }
                };
                
                const icon = item.type === 'folder' 
                    ? (item.isOpen ? '▾ 📂' : '▸ 📁') 
                    : this.getFileIcon(item.name);

                div.innerHTML = `
                    <span class="file-icon">${icon}</span>
                    <span class="file-name">${item.name}</span>
                    <div class="file-actions">
                        <button onclick="event.stopPropagation(); Editor.renameItem('${item.id}')" title="Rename">✎</button>
                        <button onclick="event.stopPropagation(); Editor.deleteItem('${item.id}')" title="Delete">✕</button>
                    </div>
                `;

                div.onclick = (e) => {
                    e.stopPropagation();
                    if (item.type === 'folder') {
                        item.isOpen = !item.isOpen;
                        this.saveFileSystem();
                        this.renderFileTree();
                    } else {
                        this.openFile(item.id);
                    }
                };

                container.appendChild(div);

                if (item.type === 'folder' && item.isOpen) {
                    renderLevel(item.id, level + 1);
                }
            });
        };

        renderLevel(null);
        console.log('File Tree Rendered Successfully');
    },

    getFileIcon(name) {
        if (name.endsWith('.js')) return 'JS';
        if (name.endsWith('.html')) return '<>';
        if (name.endsWith('.css')) return '#';
        return '📄';
    },

    getLanguage(filename) {
        if (filename.endsWith(".js")) return "javascript";
        if (filename.endsWith(".py")) return "python";
        if (filename.endsWith(".html")) return "html";
        if (filename.endsWith(".css")) return "css";
        return "plaintext";
    },

    openFile(id) {
        const file = this.fileSystem.find(f => f.id === id);
        if (!file || file.type === 'folder') return;

        this.activeFileId = id;
        localStorage.setItem('last_active_file', id);

        if (this.editor) {
            // Use Model-Based Approach: If model doesn't exist, create it
            if (!file.model) {
                const language = this.getLanguage(file.name);
                file.model = monaco.editor.createModel(file.content, language);
                
                // Track changes per model to keep fileSystem in sync
                file.model.onDidChangeContent(() => {
                    file.content = file.model.getValue();
                    this.saveFileSystem();
                });
            }

            // Set the model to the editor (This enables syntax highlighting)
            this.editor.setModel(file.model);
            
            // Ensure layout updates
            setTimeout(() => this.editor.layout(), 0);
        }

        if (!this.openTabs.includes(id)) {
            this.openTabs.push(id);
        }

        document.getElementById('current-file-name').textContent = file.name;
        document.getElementById('editor-lang').textContent = this.getLanguage(file.name).toUpperCase();
        
        this.renderTabs();
        this.renderFileTree();
        this.updateEmptyState();
    },

    moveItem(draggedId, targetId) {
        const dragged = this.fileSystem.find(i => i.id === draggedId);
        const target = this.fileSystem.find(i => i.id === targetId);
        
        if (!dragged || !target) return;
        
        // Prevent moving into itself or its children
        if (draggedId === targetId) return;
        
        // Move to new parent
        if (target.type === 'folder') {
            dragged.parentId = target.id;
        } else {
            dragged.parentId = target.parentId;
        }
        
        this.saveFileSystem();
        this.renderFileTree();
        Utils.showToast(`Moved ${dragged.name}`);
    },

    renderTabs() {
        const bar = document.getElementById('tabs-bar');
        bar.innerHTML = '';
        this.openTabs.forEach(id => {
            const file = this.fileSystem.find(f => f.id === id);
            if (!file) return;
            const tab = document.createElement('div');
            tab.className = `tab ${id === this.activeFileId ? 'active' : ''}`;
            tab.draggable = true;
            
            tab.ondragstart = (e) => {
                e.dataTransfer.setData('text/tab', id);
                tab.classList.add('dragging');
            };
            
            tab.ondragover = (e) => {
                e.preventDefault();
                tab.classList.add('drag-over');
            };
            
            tab.ondragleave = () => tab.classList.remove('drag-over');
            
            tab.ondrop = (e) => {
                e.preventDefault();
                const draggedTabId = e.dataTransfer.getData('text/tab');
                if (draggedTabId && draggedTabId !== id) {
                    const fromIdx = this.openTabs.indexOf(draggedTabId);
                    const toIdx = this.openTabs.indexOf(id);
                    this.openTabs.splice(fromIdx, 1);
                    this.openTabs.splice(toIdx, 0, draggedTabId);
                    this.renderTabs();
                }
            };
            
            tab.ondragend = () => tab.classList.remove('dragging');

            tab.innerHTML = `
                <span>${file.name}</span>
                <span class="tab-close" onclick="event.stopPropagation(); Editor.closeTab('${id}')">✕</span>
            `;
            tab.onclick = () => this.openFile(id);
            bar.appendChild(tab);
        });
    },

    closeTab(id) {
        this.openTabs = this.openTabs.filter(tid => tid !== id);
        if (this.activeFileId === id) {
            this.activeFileId = this.openTabs.length > 0 ? this.openTabs[this.openTabs.length - 1] : null;
            if (this.activeFileId) this.openFile(this.activeFileId);
        }
        this.renderTabs();
        this.renderFileTree();
        this.updateEmptyState();
    },

    updateEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const editorContainer = document.getElementById('monaco-editor-container');
        if (this.activeFileId) {
            emptyState.classList.add('hidden');
            editorContainer.style.display = 'block';
        } else {
            emptyState.classList.remove('hidden');
            editorContainer.style.display = 'none';
        }
    },

    addNewFile() {
        const name = prompt('File name:');
        if (!name) return;
        
        console.log('Creating new file:', name);
        const id = 'file_' + Date.now();
        const lang = this.getLanguage(name);
        
        const newFile = { id, name, type: 'file', parentId: null, content: '', language: lang };
        this.fileSystem.push(newFile);
        
        this.saveFileSystem();
        this.renderFileTree();
        this.openFile(id);
        
        Utils.showToast(`File "${name}" created`, 'success');
        if (window.Terminal) Terminal.logToOutput(`New file created: ${name}`, 'success');
    },

    addNewFolder() {
        const name = prompt('Folder name:');
        if (!name) return;
        
        console.log('Creating new folder:', name);
        const id = 'folder_' + Date.now();
        const newFolder = { id, name, type: 'folder', parentId: null, isOpen: true };
        this.fileSystem.push(newFolder);
        
        this.saveFileSystem();
        this.renderFileTree();
        
        Utils.showToast(`Folder "${name}" created`, 'success');
        if (window.Terminal) Terminal.logToOutput(`New folder created: ${name}`, 'success');
    },

    renameItem(id) {
        const item = this.fileSystem.find(i => i.id === id);
        if (!item) return;
        
        const newName = prompt('New name:', item.name);
        if (newName && newName !== item.name) {
            console.log(`Renaming ${item.name} to ${newName}`);
            item.name = newName;
            
            // If it's a file with a model, we might need to update model uri if we were using uris, 
            // but here we just use the name in the UI.
            
            this.saveFileSystem();
            this.renderFileTree();
            
            if (this.activeFileId === id) {
                document.getElementById('current-file-name').textContent = newName;
            }
            
            Utils.showToast('Renamed successfully');
        }
    },

    deleteItem(id) {
        if (!confirm('Are you sure you want to delete this?')) return;
        
        const item = this.fileSystem.find(i => i.id === id);
        if (item && item.model) {
            item.model.dispose();
        }

        this.fileSystem = this.fileSystem.filter(i => i.id !== id && i.parentId !== id);
        this.closeTab(id);
        this.saveFileSystem();
        this.renderFileTree();
        Utils.showToast('Item deleted', 'error');
    },

    attachEventListeners() {
        document.getElementById('new-file-btn').onclick = () => this.addNewFile();
        document.getElementById('new-folder-btn').onclick = () => this.addNewFolder();
        
        document.getElementById('open-file-btn').onclick = async () => {
            try {
                const [fileHandle] = await window.showOpenFilePicker();
                const file = await fileHandle.getFile();
                const content = await file.text();
                const id = 'open_' + Date.now();
                const lang = this.getLanguage(file.name);
                this.fileSystem.push({ 
                    id, 
                    name: file.name, 
                    type: 'file', 
                    parentId: null, 
                    content, 
                    language: lang
                });
                this.saveFileSystem();
                this.renderFileTree();
                this.openFile(id);
                Utils.showToast(`Opened ${file.name}`);
            } catch (err) {
                console.error(err);
            }
        };

        document.getElementById('open-folder-btn').onclick = async () => {
            try {
                const directoryHandle = await window.showDirectoryPicker();
                console.log('Opening Folder:', directoryHandle.name);
                
                // CRITICAL: Clear existing file system when opening a new folder
                this.fileSystem = [];
                this.openTabs = [];
                this.activeFileId = null;
                
                const processHandle = async (handle, parentId = null) => {
                    const id = 'item_' + Math.random().toString(36).substr(2, 9);
                    
                    if (handle.kind === 'directory') {
                        this.fileSystem.push({
                            id,
                            name: handle.name,
                            type: 'folder',
                            parentId,
                            isOpen: true
                        });
                        
                        for await (const entry of handle.values()) {
                            await processHandle(entry, id);
                        }
                    } else {
                        const file = await handle.getFile();
                        const content = await file.text();
                        const lang = this.getLanguage(file.name);
                        
                        this.fileSystem.push({
                            id,
                            name: file.name,
                            type: 'file',
                            parentId,
                            content,
                            language: lang
                        });
                    }
                };

                await processHandle(directoryHandle);
                
                this.saveFileSystem();
                this.renderFileTree();
                this.renderTabs();
                this.updateEmptyState();
                
                Utils.showToast(`Folder "${directoryHandle.name}" loaded`, 'success');
                if (window.Terminal) Terminal.logToOutput(`Folder loaded: ${directoryHandle.name}`, 'success');
            } catch (err) {
                console.error('Error opening folder:', err);
                if (err.name !== 'AbortError') Utils.showToast('Failed to open folder', 'error');
            }
        };

        document.getElementById('save-btn').onclick = () => {
            this.saveFileSystem();
            Utils.showToast('All files saved', 'success');
        };
        document.getElementById('run-btn').onclick = () => {
            const fileName = this.fileSystem.find(f => f.id === this.activeFileId)?.name || 'code';
            const file = this.fileSystem.find(f => f.id === this.activeFileId);
            
            if (!file) return;

            // Log to terminal/output
            if (window.Terminal) {
                Terminal.logToOutput(`Running ${fileName}...`, 'info');
                Terminal.switchPanel('output');
            }

            if (file.language === 'javascript') {
                try {
                    // 1. Capture original console.log
                    const originalLog = console.log;
                    const originalError = console.error;

                    // 2. Redirect to Debug Console
                    console.log = (...args) => {
                        originalLog(...args);
                        if (window.Terminal) Terminal.logToDebug(args.join(' '), 'info');
                    };
                    console.error = (...args) => {
                        originalError(...args);
                        if (window.Terminal) Terminal.logToDebug(args.join(' '), 'error');
                    };

                    // 3. Execute code safely using eval
                    // We wrap it in an IIFE to keep the scope clean
                    const code = file.content;
                    eval(`(function() { ${code} \n})()`);

                    // 4. Restore original console
                    console.log = originalLog;
                    console.error = originalError;

                    if (window.Terminal) {
                        Terminal.logToOutput(`Execution finished.`, 'success');
                        Terminal.logToDebug(`--- Execution End ---`, 'success');
                    }
                } catch (err) {
                    if (window.Terminal) {
                        Terminal.logToOutput(`Execution failed: ${err.message}`, 'error');
                        Terminal.logToDebug(`Error: ${err.message}`, 'error');
                    }
                    console.error('Execution Error:', err);
                }
            } else {
                if (window.Terminal) {
                    Terminal.logToOutput(`Language '${file.language}' execution not supported.`, 'warn');
                }
            }
        };
    }
};
