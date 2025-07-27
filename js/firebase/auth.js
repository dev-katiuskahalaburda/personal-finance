// Importa las funciones necesarias del SDK de Firebase
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { auth } from './config.js';
import { createUserProfile } from './firestore.js';

/**
 * Registra un nuevo usuario con email y contraseña
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<UserCredential>}
 */
export const signUpUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(userCredential.user.uid, { email });
    return userCredential;
  } catch (error) {
    throw error;
  }
};

/**
 * Inicia sesión con email y contraseña
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<UserCredential>}
 */
export const signInUser = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
};

/**
 * Cierra la sesión actual
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

/**
 * Observador del estado de autenticación
 * @param {(user: User|null) => void} callback 
 * @returns {Unsubscribe}
 */
export const onAuthStateChangedListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};