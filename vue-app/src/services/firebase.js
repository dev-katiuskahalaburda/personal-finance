import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your existing Firebase config from js/auth/config.js
const firebaseConfig = {
  apiKey: "AIzaSyAVT7HgUQRDj9gCatGK7rKqfwNgewoDJxE",
  authDomain: "personal-finance-44981.firebaseapp.com",
  projectId: "personal-finance-44981",
  storageBucket: "personal-finance-44981.firebasestorage.app",
  messagingSenderId: "662347249340",
  appId: "1:662347249340:web:4ca156c7c2c969d6ea02b9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);