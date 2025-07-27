// Crear perfil de usuario
window.createUserProfile = async (userId, userData) => {
  try {
    await window.firebaseDb.collection('users').doc(userId).set({
      ...userData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("[Firestore] Error creando perfil:", error);
    throw error;
  }
};

// Añadir transacción
window.addTransaction = async (userId, transactionData) => {
  try {
    return await window.firebaseDb.collection('users').doc(userId).collection('transactions').add({
      ...transactionData,
      date: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("[Firestore] Error añadiendo transacción:", error);
    throw error;
  }
};

console.log('[Firestore] Módulo de base de datos cargado');