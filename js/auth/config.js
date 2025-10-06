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
window.firestore = firebase.firestore();

// CRITICAL FIX: Set auth persistence to LOCAL
window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log('[Config] Auth persistence set to LOCAL');
    
    // Check if user is already logged in
    const currentUser = window.firebaseAuth.currentUser;
    if (currentUser) {
      console.log('[Config] User already authenticated:', currentUser.email);
    } else {
      console.log('[Config] No user currently authenticated');
    }
  })
  .catch((error) => {
    console.error('[Config] Error setting auth persistence:', error);
  });

console.log('[Config] Firebase inicializado correctamente');