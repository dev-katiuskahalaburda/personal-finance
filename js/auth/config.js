// js/auth/config.js
// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAVT7HgUQRDj9gCatGK7rKqfwNgewoDJxE",
  authDomain: "personal-finance-44981.firebaseapp.com",
  projectId: "personal-finance-44981",         
  storageBucket: "personal-finance-44981.appspot.com",
  messagingSenderId: "662347249340",
  appId: "1:662347249340:web:4ca156c7c2c969d6ea02b9"
};

// Inicialización
const app = firebase.initializeApp(firebaseConfig);

// Exportación mediante window
window.firebaseApp = app;
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore(); // FIXED: Changed from window.firestore to window.firebaseDb

// In config.js - Add this line after the existing exports
window.firebaseFirestore = firebase.firestore(); // Add this for compatibility

console.log('[Config] Firebase inicializado correctamente');

// CRITICAL FIX: Proper auth persistence setup
window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log('[Config] Auth persistence set to LOCAL');
    
    // Check current auth state
    return new Promise((resolve) => {
      const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
        console.log('[Config] Initial auth state check:', user ? user.email : 'No user');
        unsubscribe(); // Stop listening after first check
        resolve(user);
      });
    });
  })
  .catch((error) => {
    console.error('[Config] Error setting auth persistence:', error);
  });
