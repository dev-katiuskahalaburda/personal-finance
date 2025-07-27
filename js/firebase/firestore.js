import { 
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from './config.js';

/**
 * Crea un perfil de usuario en Firestore
 * @param {string} userId 
 * @param {object} userData 
 * @returns {Promise<void>}
 */
export const createUserProfile = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene el perfil de un usuario
 * @param {string} userId 
 * @returns {Promise<DocumentSnapshot>}
 */
export const getUserProfile = async (userId) => {
  try {
    return await getDoc(doc(db, 'users', userId));
  } catch (error) {
    throw error;
  }
};

/**
 * Añade una nueva transacción financiera
 * @param {string} userId 
 * @param {object} transactionData 
 * @returns {Promise<DocumentReference>}
 */
export const addTransaction = async (userId, transactionData) => {
  try {
    return await addDoc(collection(db, 'users', userId, 'transactions'), {
      ...transactionData,
      date: serverTimestamp()
    });
  } catch (error) {
    throw error;
  }
};