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

window.getFinancialSummary = async (userId) => {
  const snapshot = await window.firebaseDb.collection('users')
    .doc(userId)
    .collection('transactions')
    .get();

  const summary = { income: 0, expenses: 0, balance: 0 };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.type === 'income') {
      summary.income += data.amount;
    } else {
      summary.expenses += data.amount;
    }
  });
  
  summary.balance = summary.income - summary.expenses;
  return summary;
};

window.getTransactions = async (userId, limit = 5) => {
  const querySnapshot = await window.firebaseDb.collection('users')
    .doc(userId)
    .collection('transactions')
    .orderBy('date', 'desc')
    .limit(limit)
    .get();

  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};