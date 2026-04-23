# AI Code Editor

A professional, VS Code–inspired web-based code editor with integrated AI assistance, featuring a modular architecture and real-time interaction.

## � Features

- **Professional Editor**: Integrated Monaco Editor with multi-model support, syntax highlighting, and persistent state.
- **Advanced File Explorer**: Tree-view file system with folder support, drag-and-drop, and CRUD operations.
- **Interactive AI Chat**: Real-time AI assistance connected to a Flask backend (RAG + Qwen 2.5).
- **Multi-Instance Terminal**: Fully interactive terminal with command history, splitting, and panel management.
- **Robust Panel System**: Dedicated panels for Terminal, Output, and Debug Console.
- **Theme & Settings**: Support for Dark (default) and Light themes with instant synchronization.
- **Desktop Experience**: Top menu bar (File, Edit, Run, etc.) and native keyboard shortcuts.

## �️ Tech Stack

- **Frontend**: HTML5, CSS3 (Flexbox/Grid), Vanilla JavaScript (ES6+).
- **Code Editor**: Monaco Editor (via CDN).
- **Backend**: Python, Flask (for AI and RAG processing).
- **State Management**: LocalStorage for persistent user data and file system simulation.

## ⚙️ Setup Instructions

### 1. Run the Backend
Ensure you have the requirements installed and run the Flask server:
```bash
pip install -r requirements.txt
python server.py
```
The AI backend will run at `http://localhost:5000`.

### 2. Open the Frontend
Since the frontend uses Vanilla JS, you can open it directly:
- Open `login.html` in your browser.
- Use default credentials (Email: `admin@example.com`, Password: `admin`) or sign up.
- For the best experience, use a local server like **Live Server** (VS Code extension).

## 📁 Project Structure

```text
/
├── index.html          # Main Editor Dashboard
├── login.html          # Authentication - Login
├── signup.html         # Authentication - Signup
├── profile.html        # User Profile & Session Management
├── editor.js           # File System & Monaco Logic
├── terminal.js         # Terminal & Panel Logic
├── chat.js             # AI Chat & Backend Integration
├── auth.js             # User Session & Auth Logic
├── settings.js         # Theme & Global Settings
├── style.css           # Global Layout Styles
└── README.md           # Documentation
```

## � Workflow
1. **Login/Signup**: Secure your session.
2. **Manage Files**: Use the Explorer to build your project structure.
3. **Write Code**: Professional editing with Monaco.
4. **Ask AI**: Use the Chat panel for code generation and debugging.
5. **Run & Debug**: Execute JS code and monitor output in the Terminal/Debug Console.
