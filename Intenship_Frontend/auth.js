/**
 * Authentication Logic
 * Handles Login, Signup, and Session Management
 */

const Auth = {
    // Current user session
    currentUser: null,

    // Initialize Auth
    init() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Seed a default admin user if no users exist
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.length === 0) {
            users.push({ username: 'admin', email: 'admin@example.com', password: 'admin' });
            users.push({ username: 'user', email: 'user@example.com', password: 'user' });
            localStorage.setItem('users', JSON.stringify(users));
        }

        this.checkAuth();
    },

    // Signup logic
    signup(username, email, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if user exists
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        const newUser = { username, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        return { success: true, message: 'Signup successful! Redirecting to login...' };
    },

    // Login logic
    login(email, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = { username: user.username, email: user.email };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return { success: true };
        }

        return { success: false, message: 'Invalid email or password' };
    },

    // Logout logic
    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        window.location.href = 'login.html';
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('currentUser');
    },

    // Redirect if not authenticated
    checkAuth() {
        const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');
        
        if (!this.isAuthenticated() && !isAuthPage) {
            window.location.href = 'login.html';
        } else if (this.isAuthenticated() && isAuthPage) {
            window.location.href = 'index.html';
        }
    }
};

// Auto-init auth on load
Auth.init();
