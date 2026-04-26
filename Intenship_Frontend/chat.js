/**
 * Advanced AI Chat Logic
 * Handles multiple chats and history
 */

const Chat = {
    chats: [], // [{ id, title, messages: [{ role, text }] }]
    activeChatId: null,
    attachedFiles: [], // [{ name, content, type }]
    autoApply: true,
    diffDecorations: [],

    init() {
        this.loadChats();
        // this.loadSettings(); // Auto Apply is now permanently true
        this.attachEventListeners();
        this.renderHistory();
        if (this.chats.length === 0) {
            this.createNewChat();
        } else {
            this.switchChat(this.chats[0].id);
        }
    },

    loadChats() {
        const saved = localStorage.getItem('app_chats');
        if (saved) {
            this.chats = JSON.parse(saved);
        }
    },

    saveChats() {
        localStorage.setItem('app_chats', JSON.stringify(this.chats));
    },

    loadSettings() {
        // Auto Apply is permanently enabled
    },

    saveSettings() {
        // Auto Apply is permanently enabled
    },

    attachEventListeners() {
        document.getElementById('chat-send-btn').onclick = () => this.sendMessage();
        document.getElementById('chat-input').onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        };

        // Header New Chat button (The only one)
        const newChatHeaderBtn = document.getElementById('new-chat-header-btn');
        if (newChatHeaderBtn) newChatHeaderBtn.onclick = () => this.createNewChat();
        
        // Toggle history sidebar
        const toggleHistoryBtn = document.getElementById('toggle-chat-history');
        if (toggleHistoryBtn) {
            toggleHistoryBtn.onclick = () => {
                const sidebar = document.getElementById('chat-history-sidebar');
                sidebar.classList.toggle('hidden');
                console.log('Toggled history sidebar');
            };
        }

        document.getElementById('close-chat-btn').onclick = () => {
            if (this.chats.length > 1) {
                this.deleteChat(this.activeChatId);
            } else {
                Utils.showToast("Cannot close the only chat", "info");
            }
        };

        // close-ai-panel-btn is handled by script.js // Feature 1: File/Folder Upload
        const uploadBtn = document.getElementById('chat-upload-btn');
        const uploadMenu = document.getElementById('upload-menu');
        const fileInput = document.getElementById('chat-file-input');
        const folderInput = document.getElementById('chat-folder-input');

        uploadBtn.onclick = (e) => {
            e.stopPropagation();
            uploadMenu.classList.toggle('hidden');
        };

        document.addEventListener('click', () => {
            uploadMenu.classList.add('hidden');
        });

        document.getElementById('upload-file-option').onclick = () => {
            fileInput.click();
        };

        document.getElementById('upload-folder-option').onclick = () => {
            folderInput.click();
        };

        fileInput.onchange = (e) => this.handleFileUpload(e.target.files);
        folderInput.onchange = (e) => this.handleFileUpload(e.target.files);

        // Clear diff highlights on editor change
        if (Editor.editor) {
            Editor.editor.onDidChangeModelContent(() => {
                this.clearDiffDecorations();
            });
        }
    },

    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.attachedFiles.push({
                    name: file.name,
                    content: e.target.result,
                    type: file.type || 'text/plain',
                    path: file.webkitRelativePath || file.name
                });
                this.renderAttachments();
            };
            reader.readAsText(file);
        });
    },

    renderAttachments() {
        const container = document.getElementById('chat-attachments');
        if (this.attachedFiles.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        container.innerHTML = '';
        this.attachedFiles.forEach((file, index) => {
            const div = document.createElement('div');
            div.className = 'attachment-item';
            div.innerHTML = `
                <span>${file.name}</span>
                <span class="remove-btn" onclick="Chat.removeAttachment(${index})">×</span>
            `;
            container.appendChild(div);
        });
    },

    removeAttachment(index) {
        this.attachedFiles.splice(index, 1);
        this.renderAttachments();
    },

    createNewChat() {
        const id = 'chat_' + Date.now();
        const newChat = {
            id,
            title: 'New Chat',
            messages: [{ role: 'ai', text: "Hello! I'm your AI coding assistant. How can I help you today?" }]
        };
        this.chats.unshift(newChat);
        this.saveChats();
        this.renderHistory();
        this.switchChat(id);
    },

    switchChat(id) {
        this.activeChatId = id;
        const chat = this.chats.find(c => c.id === id);
        if (!chat) return;

        this.renderMessages();
        this.renderHistory();
    },

    renderMessages() {
        const chat = this.chats.find(c => c.id === this.activeChatId);
        const container = document.getElementById('chat-messages');
        container.innerHTML = '';
        
        chat.messages.forEach((msg, index) => {
            const div = document.createElement('div');
            div.className = `message ${msg.role}-message`;
            
            // Basic markdown-like code block detection
            if (msg.text.includes('```')) {
                const parts = msg.text.split('```');
                parts.forEach((part, i) => {
                    if (i % 2 === 1) {
                        // Code block
                        const code = part.replace(/^[a-zA-Z]*\n/, ''); // Remove language tag
                        
                        // Wrap code block for Feature 2: Copy Button
                        const codeBlockContainer = document.createElement('div');
                        codeBlockContainer.className = 'code-block-container';

                        const copyBtn = document.createElement('button');
                        copyBtn.className = 'copy-code-btn';
                        copyBtn.textContent = 'Copy';
                        copyBtn.onclick = () => this.copyToClipboard(code, copyBtn);
                        codeBlockContainer.appendChild(copyBtn);

                        const pre = document.createElement('pre');
                        const codeTag = document.createElement('code');
                        codeTag.textContent = code;
                        pre.appendChild(codeTag);
                        codeBlockContainer.appendChild(pre);
                        
                        div.appendChild(codeBlockContainer);

                        // Manual apply UI removed as per requirements (Auto Apply is permanent)
                    } else if (part.trim()) {
                        const text = document.createElement('p');
                        text.textContent = part;
                        div.appendChild(text);
                    }
                });
            } else {
                div.textContent = msg.text;
            }
            
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    },

    copyToClipboard(text, btn) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 2000);
        });
    },

    handleAutoApply(newCode) {
        if (!Editor.activeFileId) {
            Utils.showToast('Please open a file first', 'warn');
            return;
        }

        const model = Editor.editor.getModel();
        if (model) {
            const oldCode = model.getValue();
            this.showLiveDiff(oldCode, newCode);
            
            model.setValue(newCode);
            Utils.showToast('AI applied changes', 'success');
            
            // Save change
            const file = Editor.fileSystem.find(f => f.id === Editor.activeFileId);
            if (file) {
                file.content = newCode;
                Editor.saveFileSystem();
            }
        }
    },

    showLiveDiff(oldCode, newCode) {
        const oldLines = oldCode.split('\n');
        const newLines = newCode.split('\n');
        const decorations = [];

        // Basic line-by-line diff for visualization
        // In a real IDE we'd use a proper diffing algorithm like Myers'
        const maxLines = Math.max(oldLines.length, newLines.length);
        
        for (let i = 0; i < maxLines; i++) {
            if (i < newLines.length && (i >= oldLines.length || oldLines[i] !== newLines[i])) {
                // Line added or modified
                decorations.push({
                    range: new monaco.Range(i + 1, 1, i + 1, 1),
                    options: {
                        isWholeLine: true,
                        className: 'line-added',
                        marginClassName: 'line-added-margin'
                    }
                });
            } else if (i < oldLines.length && i >= newLines.length) {
                // Line removed (at the end)
                decorations.push({
                    range: new monaco.Range(newLines.length, 1, newLines.length, 1),
                    options: {
                        isWholeLine: true,
                        className: 'line-removed',
                        marginClassName: 'line-removed-margin'
                    }
                });
            }
        }

        this.diffDecorations = Editor.editor.deltaDecorations(this.diffDecorations, decorations);

        // Auto-clear after 5 seconds
        setTimeout(() => this.clearDiffDecorations(), 5000);
    },

    clearDiffDecorations() {
        if (this.diffDecorations.length > 0) {
            this.diffDecorations = Editor.editor.deltaDecorations(this.diffDecorations, []);
        }
    },

    handleSelectionReplace(newCode) {
        if (!Editor.activeFileId) {
            Utils.showToast('Please open a file first', 'warn');
            return;
        }

        const selection = Editor.editor.getSelection();
        if (!selection || selection.isEmpty()) {
            Utils.showToast('Please select code first', 'warn');
            return;
        }

        const model = Editor.editor.getModel();
        const oldCode = model.getValue();

        Editor.editor.executeEdits('chat-ai', [
            {
                range: selection,
                text: newCode,
                forceMoveMarkers: true
            }
        ]);

        const updatedCode = model.getValue();
        this.showLiveDiff(oldCode, updatedCode);

        Utils.showToast('Selected code updated', 'success');
        
        // Save change
        const file = Editor.fileSystem.find(f => f.id === Editor.activeFileId);
        if (file) {
            file.content = updatedCode;
            Editor.saveFileSystem();
        }
    },

    handleReviewChanges(newCode) {
        if (!Editor.activeFileId) {
            Utils.showToast('Please open a file first', 'warn');
            return;
        }

        const currentContent = Editor.editor.getValue();
        const selection = Editor.editor.getSelection();
        
        let originalContent = currentContent;
        let modifiedContent = currentContent;

        if (selection && !selection.isEmpty()) {
            const range = selection;
            const model = Editor.editor.getModel();
            
            const before = model.getValueInRange({
                startLineNumber: 1, startColumn: 1,
                endLineNumber: range.startLineNumber, endColumn: range.startColumn
            });
            const after = model.getValueInRange({
                startLineNumber: range.endLineNumber, startColumn: range.endColumn,
                endLineNumber: model.getLineCount(), endColumn: model.getLineMaxColumn(model.getLineCount())
            });
            
            modifiedContent = before + newCode + after;
        } else {
            modifiedContent = newCode;
        }

        this.lastOriginalContent = originalContent;
        this.lastModifiedContent = modifiedContent;
        Editor.openDiffView(originalContent, modifiedContent);
        
        // Update Editor.acceptChanges to notify Chat
        const originalAccept = Editor.acceptChanges.bind(Editor);
        Editor.acceptChanges = () => {
            originalAccept();
            this.onChangesAccepted();
        };
    },

    onChangesAccepted() {
        const chat = this.chats.find(c => c.id === this.activeChatId);
        chat.messages.push({
            role: 'ai',
            text: 'Changes applied to editor. Do you want to keep them?',
            hasDiffAction: true,
            originalContent: this.lastOriginalContent,
            modifiedContent: this.lastModifiedContent
        });
        this.renderMessages();
        this.saveChats();
    },

    handleKeepChanges(msg) {
        msg.hasDiffAction = false;
        msg.text = 'Changes kept.';
        this.renderMessages();
        this.saveChats();
        Utils.showToast('Changes kept', 'success');
    },

    handleUndoChanges(msg) {
        if (msg.originalContent && Editor.activeFileId) {
            const file = Editor.fileSystem.find(f => f.id === Editor.activeFileId);
            if (file) {
                file.content = msg.originalContent;
                if (file.model) file.model.setValue(msg.originalContent);
                Editor.saveFileSystem();
            }
        }
        msg.hasDiffAction = false;
        msg.text = 'Changes undone.';
        this.renderMessages();
        this.saveChats();
        Utils.showToast('Changes undone', 'info');
    },

    renderHistory() {
        const container = document.getElementById('chat-history-list');
        container.innerHTML = '';

        this.chats.forEach(chat => {
            const div = document.createElement('div');
            div.className = `history-item ${chat.id === this.activeChatId ? 'active' : ''}`;
            div.innerHTML = `
                <span>${chat.title}</span>
                <button onclick="event.stopPropagation(); Chat.deleteChat('${chat.id}')">✕</button>
            `;
            div.onclick = () => this.switchChat(chat.id);
            container.appendChild(div);
        });
    },

    deleteChat(id) {
        this.chats = this.chats.filter(c => c.id !== id);
        this.saveChats();
        if (this.activeChatId === id) {
            if (this.chats.length > 0) this.switchChat(this.chats[0].id);
            else this.createNewChat();
        } else {
            this.renderHistory();
        }
    },

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text && this.attachedFiles.length === 0) return;

        const chat = this.chats.find(c => c.id === this.activeChatId);
        if (!chat) return;

        // Feature 2: Selected Code Replace
        let selectionText = "";
        let finalPrompt = text;
        if (Editor.editor && Editor.activeFileId) {
            const selection = Editor.editor.getSelection();
            if (selection && !selection.isEmpty()) {
                selectionText = Editor.editor.getModel().getValueInRange(selection);
                finalPrompt = `I have selected this code:\n\`\`\`\n${selectionText}\n\`\`\`\n\nUser instructions: ${text}`;
                Utils.showToast("Using selected code as context", "info");
            }
        }

        if (chat.title === 'New Chat' && text) {
            chat.title = text.substring(0, 20) + (text.length > 20 ? '...' : '');
        }

        // Feature 1: Send files to AI
        const messageFiles = [...this.attachedFiles];
        this.attachedFiles = [];
        this.renderAttachments();

        chat.messages.push({ 
            role: 'user', 
            text: text + (messageFiles.length > 0 ? `\n\n(Attached files: ${messageFiles.map(f => f.name).join(', ')})` : '') + (selectionText ? "\n\n(Selection included)" : "")
        });
        
        this.renderMessages();
        this.renderHistory();
        input.value = '';

        const loadingMsg = { role: 'ai', text: 'Typing...', isLoading: true };
        chat.messages.push(loadingMsg);
        this.renderMessages();

        try {
            const response = await fetch("http://localhost:5000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: finalPrompt,
                    files: messageFiles 
                })
            });
            
            if (!response.ok) throw new Error('Backend error');
            const data = await response.json();
            
            chat.messages.pop(); 
            chat.messages.push({ role: 'ai', text: data.response });

            // Feature 1: Auto Apply Changes
            if (this.autoApply && data.response.includes('```')) {
                const parts = data.response.split('```');
                if (parts.length >= 2) {
                    const code = parts[1].replace(/^[a-zA-Z]*\n/, ''); // Extract first code block
                    
                    // If we had a selection, apply to selection, otherwise full apply
                    if (selectionText) {
                        this.handleSelectionReplace(code);
                    } else {
                        this.handleAutoApply(code);
                    }
                }
            }

        } catch (error) {
            console.error('Chat error:', error);
            chat.messages.pop();
            chat.messages.push({ role: 'ai', text: "Sorry, I'm having trouble connecting to the AI backend. (Is your Flask server running at :5000?)" });
        }

        this.saveChats();
        this.renderMessages();
    },

    getMockResponse(text) {
        const t = text.toLowerCase();
        if (t.includes('hello')) return "Hi there! Ready to write some code?";
        if (t.includes('help')) return "I can help with HTML, CSS, and JavaScript. Just ask!";
        return "I'm analyzing your request... (Mock response for: " + text + ")";
    }
};
