/**
 * Advanced AI Chat Logic
 * Handles multiple chats and history
 */

const Chat = {
    chats: [], // [{ id, title, messages: [{ role, text }] }]
    activeChatId: null,

    init() {
        this.loadChats();
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

        document.getElementById('close-ai-panel-btn').onclick = () => {
            document.getElementById('ai-panel').classList.add('hidden');
        };
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
        
        chat.messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.role}-message`;
            div.textContent = msg.text;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
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
        if (!text) return;

        const chat = this.chats.find(c => c.id === this.activeChatId);
        if (!chat) return;

        // Update title if it's the first user message
        if (chat.title === 'New Chat') {
            chat.title = text.substring(0, 20) + (text.length > 20 ? '...' : '');
        }

        // Add user message to UI
        chat.messages.push({ role: 'user', text });
        this.renderMessages();
        this.renderHistory();
        input.value = '';

        // Show AI loading state
        const loadingMsg = { role: 'ai', text: 'Typing...', isLoading: true };
        chat.messages.push(loadingMsg);
        this.renderMessages();

        try {
            // Real AI Connection (Flask backend)
            const response = await fetch("http://localhost:5000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text })
            });
            
            if (!response.ok) throw new Error('Backend error');
            const data = await response.json();
            
            // Remove loading state and add real response
            chat.messages.pop(); 
            chat.messages.push({ role: 'ai', text: data.response });
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
