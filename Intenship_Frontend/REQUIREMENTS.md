# Project Requirements: Advanced AI Code Editor

## 1. Project Overview
A web-based, VS Code-like integrated development environment (IDE) that leverages advanced AI capabilities to provide a Cursor-like experience for developers. The editor is built using vanilla web technologies and the Monaco Editor, with a powerful Python-based AI backend.

## 2. Core Functional Requirements

### 2.1 Code Editor (Monaco Integration)
* **Syntax Highlighting**: Support for multiple programming languages.
* **Persistent State**: File content and editor settings should persist across sessions.
* **Theme Support**: Seamless switching between Light and Dark themes.

### 2.2 Advanced AI Integration
* **Context-Aware Chat**:
    * Support for **File and Folder Upload** directly in chat to provide project-wide context.
    * Recursive directory reading for folder uploads.
* **Smart Code Interaction**:
    * **Copy Code Button**: Instant clipboard access for AI-generated snippets.
    * **Auto Apply**: One-click application of AI suggestions to the active file.
    * **Selected Code Replace**: Ability to replace only specific selected code blocks with AI-generated content.
* **Cursor-Style Diff System**:
    * Side-by-side comparison of AI-suggested changes.
    * **Keep / Undo** workflow to accept or revert changes after review.

### 2.3 File Management
* **Explorer View**: Tree-view structure for managing files and folders.
* **CRUD Operations**: Create, Read, Update, and Delete files and directories.
* **Drag-and-Drop**: Support for organizing files within the explorer.

### 2.4 Terminal & Panel System
* **Multi-Instance Terminal**: Integrated terminal with command execution and history.
* **Panel Management**: Dedicated tabs for Output, Debug Console, and Terminal.

## 3. Technical Requirements

### 3.1 Frontend
* **HTML5/CSS3**: Responsive layout using Flexbox and Grid.
* **Vanilla JavaScript**: Modular ES6+ logic for state management and UI interaction.
* **Monaco Editor**: Integrated via CDN for professional editing features.

### 3.2 Backend
* **Python/Flask**: RESTful API for handling AI requests.
* **RAG (Retrieval-Augmented Generation)**: Enhanced AI responses using local project context.
* **Vector Store (FAISS)**: Efficient indexing for code context retrieval.

### 3.3 State & Storage
* **LocalStorage**: Client-side persistence for file systems and user preferences.
* **Session Management**: Secure login and profile management.

## 4. UI/UX Requirements
* **Professional Aesthetics**: Clean, modern interface matching VS Code standards.
* **Real-time Feedback**: Loading states, toast notifications for actions, and interactive buttons.
* **Accessibility**: Keyboard shortcuts for common editor actions.
