// Crear perfil de usuario
window.createUserProfile = async (userId, userData) => {
  try {
    await window.firebaseDb.collection('users').doc(userId).set({
      ...userData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Initialize empty transaction summary for new users
    await window.ensureTransactionSummary(userId);
  } catch (error) {
    console.error("[Firestore] Error creando perfil:", error);
    throw error;
  }
};

// Ensure transactionSummary exists
window.ensureTransactionSummary = async (userId) => {
  const summaryRef = window.firebaseDb.collection('users')
    .doc(userId)
    .collection('transactionSummary')
    .doc('current');

  const summaryDoc = await summaryRef.get();
  
  if (!summaryDoc.exists) {
    // Initialize summary for new users
    await summaryRef.set({
      balance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0,
      lastTransactionDate: null,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('[Firestore] TransactionSummary inicializado');
  }
  
  return summaryRef;
};

// Añadir transacción con actualización de summary
window.addTransaction = async (userId, transactionData) => {
  try {
    // 1. Ensure summary exists
    const summaryRef = await window.ensureTransactionSummary(userId);
    
    // 2. Add the transaction
    const transactionRef = await window.firebaseDb.collection('users')
      .doc(userId)
      .collection('transactions')
      .add({
        ...transactionData,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    // 3. Update transaction summary
    const updateData = {
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      lastTransactionDate: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (transactionData.type === 'income') {
      updateData.balance = firebase.firestore.FieldValue.increment(transactionData.amount);
      updateData.totalIncome = firebase.firestore.FieldValue.increment(transactionData.amount);
    } else {
      updateData.balance = firebase.firestore.FieldValue.increment(-transactionData.amount);
      updateData.totalExpenses = firebase.firestore.FieldValue.increment(transactionData.amount);
    }
    
    updateData.transactionCount = firebase.firestore.FieldValue.increment(1);

    await summaryRef.update(updateData);

    console.log('[Firestore] Transacción añadida y summary actualizado');
    return transactionRef;
  } catch (error) {
    console.error("[Firestore] Error añadiendo transacción:", error);
    throw error;
  }
};

// Obtener resumen financiero (FAST - usa transactionSummary)
window.getFinancialSummary = async (userId) => {
  try {
    // First try to get the pre-calculated summary
    const summaryDoc = await window.firebaseDb.collection('users')
      .doc(userId)
      .collection('transactionSummary')
      .doc('current')
      .get();

    if (summaryDoc.exists) {
      console.log('[Firestore] Usando transactionSummary (rápido)');
      return summaryDoc.data();
    } else {
      console.log('[Firestore] Calculando summary desde transacciones (primera vez)');
      // Fallback for existing users - calculate and create summary
      return await window.calculateSummaryFromTransactions(userId);
    }
  } catch (error) {
    console.error("[Firestore] Error obteniendo summary:", error);
    throw error;
  }
};

// Migration helper for existing users
window.calculateSummaryFromTransactions = async (userId) => {
  console.log('[Firestore] Calculando summary desde todas las transacciones...');
  const snapshot = await window.firebaseDb.collection('users')
    .doc(userId)
    .collection('transactions')
    .get();

  const summary = {
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    transactionCount: snapshot.size,
    lastUpdated: new Date()
  };

  let lastDate = null;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.type === 'income') {
      summary.totalIncome += data.amount;
      summary.balance += data.amount;
    } else {
      summary.totalExpenses += data.amount;
      summary.balance -= data.amount;
    }
    
    // Track most recent transaction
    if (data.date && (!lastDate || data.date.toDate() > lastDate)) {
      lastDate = data.date.toDate();
    }
  });

  summary.lastTransactionDate = lastDate;

  // Save the calculated summary for future use
  const summaryRef = window.firebaseDb.collection('users')
    .doc(userId)
    .collection('transactionSummary')
    .doc('current');
  
  await summaryRef.set(summary);
  console.log('[Firestore] Summary calculado y guardado');

  return summary;
};

// Obtener transacciones recientes
window.getTransactions = async (userId, limit = 5) => {
  const querySnapshot = await window.firebaseDb.collection('users')
    .doc(userId)
    .collection('transactions')
    .orderBy('date', 'desc')
    .limit(limit)
    .get();

  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

console.log('[Firestore] Módulo de base de datos cargado');