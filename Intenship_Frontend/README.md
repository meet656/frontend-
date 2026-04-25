# AI Code Editor (Cursor-Inspired)

An advanced, AI-powered web-based code editor inspired by Cursor and VS Code. Featuring a modular architecture, context-aware AI assistance, and seamless code integration.

## 🚀 Features

- **Professional Editor**: Integrated Monaco Editor with multi-model support, syntax highlighting, and persistent state.
- **Context-Aware AI Chat**: Real-time AI assistance with file/folder context, connected to a Flask backend (RAG + Qwen 2.5).
- **Smart Code Operations**: "Auto Apply" AI suggestions, "Apply to Selection" for granular updates, and a one-click "Copy Code" button.
- **Cursor-Style Diff System**: Visual code comparison for AI changes with professional "Keep" or "Undo" workflows.
- **Advanced File Explorer**: Tree-view file system with folder support, drag-and-drop, and recursive folder upload capabilities.
- **Multi-Instance Terminal**: Fully interactive terminal with command history, splitting, and panel management.
- **Robust Panel System**: Dedicated panels for Terminal, Output, and Debug Console.
- **Theme & Settings**: Support for Dark (default) and Light themes with instant synchronization.

## 🧠 Advanced AI Features

- **File/Folder Context Upload**: Directly upload files or entire directories into the chat to provide the AI with full project context.
- **Smart Code Replacement**: Use "Auto Apply" to instantly update files or "Apply to Selection" to refine specific code blocks without manual copy-pasting.
- **Interactive Diff Preview**: Review AI-suggested changes in a side-by-side diff view before committing, with the ability to instantly revert using "Undo".
- **Context-Aware AI**: The system automatically understands your project structure and active selections to provide highly relevant code suggestions.

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
