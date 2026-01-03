// Database utility for managing user accounts
// Uses localStorage to store user data

class UserDatabase {
    constructor() {
        this.storageKey = 'netflix_users';
        this.initDatabase();
    }

    // Initialize database with default admin user if empty
    initDatabase() {
        if (!localStorage.getItem(this.storageKey)) {
            const defaultUsers = [
                {
                    email: 'admin@netflix.com',
                    password: 'admin123',
                    name: 'Admin User',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem(this.storageKey, JSON.stringify(defaultUsers));
        }
    }

    // Get all users from database
    getAllUsers() {
        const users = localStorage.getItem(this.storageKey);
        return users ? JSON.parse(users) : [];
    }

    // Save users to database
    saveUsers(users) {
        localStorage.setItem(this.storageKey, JSON.stringify(users));
    }

    // Register a new user
    registerUser(email, password, name) {
        const users = this.getAllUsers();
        
        // Check if user already exists
        const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return { success: false, message: 'Email already registered' };
        }

        // Validate email format
        if (!this.validateEmail(email)) {
            return { success: false, message: 'Invalid email format' };
        }

        // Validate password (minimum 6 characters)
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        // Add new user
        const newUser = {
            email: email.toLowerCase(),
            password: password, // In production, this should be hashed
            name: name || email.split('@')[0],
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, message: 'Registration successful!' };
    }

    // Verify user login
    verifyLogin(email, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }

        if (user.password !== password) {
            return { success: false, message: 'Invalid email or password' };
        }

        return { success: true, user: { email: user.email, name: user.name } };
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Set current logged in user
    setCurrentUser(user) {
        localStorage.setItem('netflix_current_user', JSON.stringify(user));
    }

    // Get current logged in user
    getCurrentUser() {
        const user = localStorage.getItem('netflix_current_user');
        return user ? JSON.parse(user) : null;
    }

    // Logout user
    logout() {
        localStorage.removeItem('netflix_current_user');
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
}

// Create global database instance
const userDB = new UserDatabase();

