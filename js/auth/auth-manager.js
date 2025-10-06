// js/auth/auth-manager.js
window.AuthManager = {
    authListener: null,
    currentUser: null,
    authReady: false,
    authReadyCallbacks: [],
    
    // Initialize auth manager
    init() {
        console.log('[AuthManager] Initializing...');
        
        // Wait for Firebase to be ready
        if (!window.firebaseAuth) {
            console.error('[AuthManager] Firebase Auth not available');
            return;
        }
        
        this.setupAuthListener();
    },
    
    // Centralized auth listener
    setupAuthListener(callback) {
        // Clean up existing listener
        if (this.authListener) {
            this.authListener();
        }
        
        console.log('[AuthManager] Setting up auth listener');
        
        this.authListener = window.firebaseAuth.onAuthStateChanged(
            (user) => {
                console.log('[AuthManager] Auth state changed:', user ? `User: ${user.email}` : 'No user');
                this.currentUser = user;
                this.authReady = true;
                
                // Execute all pending ready callbacks
                this.executeReadyCallbacks(user);
                
                // Execute the provided callback
                if (callback && typeof callback === 'function') {
                    try {
                        callback(user);
                    } catch (error) {
                        console.error('[AuthManager] Error in auth callback:', error);
                    }
                }
                
                // Auto-redirect if no user and we're on a protected page
                this.handleAutoRedirect(user);
            },
            (error) => {
                console.error('[AuthManager] Auth state error:', error);
                this.authReady = true;
                this.executeReadyCallbacks(null);
            }
        );
        
        return this.authListener;
    },
    
    // Wait for auth to be ready
    waitForAuth() {
        return new Promise((resolve) => {
            if (this.authReady) {
                resolve(this.currentUser);
            } else {
                this.authReadyCallbacks.push(resolve);
            }
        });
    },
    
    // Execute all pending ready callbacks
    executeReadyCallbacks(user) {
        while (this.authReadyCallbacks.length > 0) {
            const callback = this.authReadyCallbacks.shift();
            try {
                callback(user);
            } catch (error) {
                console.error('[AuthManager] Error in ready callback:', error);
            }
        }
    },
    
    // Auto-redirect logic
    handleAutoRedirect(user) {
        const isAuthPage = window.location.pathname.includes('index.html');
        const isDashboardPage = window.location.pathname.includes('dashboard.html');
        
        if (!user && isDashboardPage) {
            console.log('[AuthManager] No user on dashboard, redirecting to login');
            window.location.href = './index.html';
        } else if (user && isAuthPage) {
            console.log('[AuthManager] User on auth page, redirecting to dashboard');
            window.location.href = './dashboard.html';
        }
    },
    
    // Enhanced sign-in with better error handling
    async signIn(email, password) {
        try {
            console.log('[AuthManager] Signing in user:', email);
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('[AuthManager] Sign-in successful');
            return userCredential;
        } catch (error) {
            console.error('[AuthManager] Sign-in error:', error);
            throw this.formatAuthError(error);
        }
    },
    
    // Enhanced sign-up
    async signUp(email, password) {
        try {
            console.log('[AuthManager] Signing up user:', email);
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            console.log('[AuthManager] Sign-up successful');
            return userCredential;
        } catch (error) {
            console.error('[AuthManager] Sign-up error:', error);
            throw this.formatAuthError(error);
        }
    },
    
    // Enhanced logout
    async logout() {
        try {
            console.log('[AuthManager] Logging out user');
            await window.firebaseAuth.signOut();
            this.currentUser = null;
            console.log('[AuthManager] Logout successful');
        } catch (error) {
            console.error('[AuthManager] Logout error:', error);
            throw this.formatAuthError(error);
        }
    },
    
    // Format auth errors for user-friendly messages
    formatAuthError(error) {
        const errorMap = {
            'auth/invalid-email': 'El formato del email es inválido',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
            'auth/user-not-found': 'No existe una cuenta con este email',
            'auth/wrong-password': 'La contraseña es incorrecta',
            'auth/email-already-in-use': 'Ya existe una cuenta con este email',
            'auth/weak-password': 'La contraseña es demasiado débil',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde'
        };
        
        return {
            code: error.code,
            message: errorMap[error.code] || error.message,
            originalError: error
        };
    },
    
    // Get current user safely
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    },
    
    // Cleanup
    cleanup() {
        if (this.authListener) {
            this.authListener();
            this.authListener = null;
        }
        this.authReadyCallbacks = [];
        console.log('[AuthManager] Cleaned up');
    }
};

// Override the global setupAuthListener for backward compatibility
window.setupAuthListener = (callback) => {
    return window.AuthManager.setupAuthListener(callback);
};

// Enhanced global auth functions with better error handling
window.signInUser = async (email, password) => {
    return await window.AuthManager.signIn(email, password);
};

window.signUpUser = async (email, password) => {
    return await window.AuthManager.signUp(email, password);
};

window.logoutUser = async () => {
    return await window.AuthManager.logout();
};

// Initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    window.AuthManager.init();
});

console.log('[AuthManager] Auth manager loaded');