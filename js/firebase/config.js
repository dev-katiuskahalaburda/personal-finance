// Importa los servicios de Firebase que necesitas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Tu configuración de Firebase (la que te proporcionaron)
const firebaseConfig = {
  apiKey: "AIzaSyAVT7HgUQRDj9gCatGK7rKqfwNgewoDJxE",
  authDomain: "personal-finance-44981.firebaseapp.com",
  projectId: "personal-finance-44981",
  storageBucket: "personal-finance-44981.firebasestorage.app",
  messagingSenderId: "662347249340",
  appId: "1:662347249340:web:4ca156c7c2c969d6ea02b9"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa los servicios
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta los servicios inicializados
export { auth, db };