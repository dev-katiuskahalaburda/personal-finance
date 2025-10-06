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

// Añadir transacción con actualización de summary - FIXED VERSION
window.addTransaction = async (userId, transactionData) => {
  try {
    console.log('[Firestore] Adding transaction for user:', userId, 'Data:', transactionData);
    
    const db = firebase.firestore();
    const transactionRef = db.collection('users').doc(userId).collection('transactions').doc();
    
    // Ensure amount is stored as a proper number (integer for Guarani)
    const transactionToSave = {
      name: transactionData.name,
      date: firebase.firestore.Timestamp.fromDate(new Date(transactionData.date)),
      amount: Number(transactionData.amount), // Explicitly convert to number
      type: transactionData.type,
      category: transactionData.category,
      description: transactionData.description || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('[Firestore] Saving to Firestore:', transactionToSave);
    
    await transactionRef.set(transactionToSave);
    
    // Update the transaction summary
    await window.updateTransactionSummary(userId);
    
    console.log('[Firestore] Transaction added successfully');
    
  } catch (error) {
    console.error("[Firestore] Error añadiendo transacción:", error);
    throw error;
  }
};

// Update transaction summary - FIXED VERSION
window.updateTransactionSummary = async (userId) => {
  try {
    const db = firebase.firestore();
    const transactionsRef = db.collection('users').doc(userId).collection('transactions');
    const snapshot = await transactionsRef.get();
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;
    let lastTransactionDate = null;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const amount = Number(data.amount); // Ensure we're working with numbers
      
      if (data.type === 'income') {
        totalIncome += amount;
      } else if (data.type === 'expense') {
        totalExpenses += amount;
      }
      
      transactionCount++;
      
      // Update last transaction date
      const transactionDate = data.date?.toDate();
      if (transactionDate && (!lastTransactionDate || transactionDate > lastTransactionDate)) {
        lastTransactionDate = transactionDate;
      }
    });
    
    const balance = totalIncome - totalExpenses;
    
    const summaryData = {
      balance: Number(balance),
      totalIncome: Number(totalIncome),
      totalExpenses: Number(totalExpenses),
      transactionCount: transactionCount,
      lastTransactionDate: lastTransactionDate ? firebase.firestore.Timestamp.fromDate(lastTransactionDate) : null,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(userId).collection('transactionSummary').doc('current').set(summaryData);
    
    console.log('[Firestore] Transaction summary updated:', summaryData);
    
  } catch (error) {
    console.error('[Firestore] Error updating transaction summary:', error);
    throw error;
  }
};

// Obtener resumen financiero (FAST - usa transactionSummary)
window.getFinancialSummary = async (userId) => {
  try {
    console.log('[Firestore] Getting summary for user:', userId);
    
    const summaryDoc = await window.firebaseDb.collection('users')
      .doc(userId)
      .collection('transactionSummary')
      .doc('current')
      .get();

    if (summaryDoc.exists) {
      const data = summaryDoc.data();
      console.log('[Firestore] Summary data found:', data);
      return data;
    } else {
      console.log('[Firestore] No summary found, calculating...');
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
    const amount = Number(data.amount); // Ensure we're working with numbers
    
    if (data.type === 'income') {
      summary.totalIncome += amount;
      summary.balance += amount;
    } else {
      summary.totalExpenses += amount;
      summary.balance -= amount;
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

// Get all transactions for a user
window.getAllTransactions = async (userId) => {
  try {
    console.log('[Firestore] Getting all transactions for user:', userId);
    
    const db = firebase.firestore();
    const transactionsRef = db.collection('users').doc(userId).collection('transactions');
    const snapshot = await transactionsRef.orderBy('date', 'desc').get();
    
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[Firestore] Retrieved ${transactions.length} transactions`);
    return transactions;
    
  } catch (error) {
    console.error('[Firestore] Error getting transactions:', error);
    throw error;
  }
};

// Update a transaction
window.updateTransaction = async (userId, transactionId, updateData) => {
  try {
    console.log('[Firestore] Updating transaction:', { userId, transactionId, updateData });
    
    const db = firebase.firestore();
    const transactionRef = db.collection('users').doc(userId).collection('transactions').doc(transactionId);
    
    // Ensure amount is properly converted if it's being updated
    if (updateData.amount) {
      updateData.amount = Number(updateData.amount);
    }
    
    // Convert date if it's being updated
    if (updateData.date) {
      updateData.date = firebase.firestore.Timestamp.fromDate(new Date(updateData.date));
    }
    
    await transactionRef.update({
      ...updateData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update summary
    await window.updateTransactionSummary(userId);
    
    console.log('[Firestore] Transaction updated successfully');
    
  } catch (error) {
    console.error('[Firestore] Error updating transaction:', error);
    throw error;
  }
};

// Delete a transaction
window.deleteTransaction = async (userId, transactionId) => {
  try {
    console.log('[Firestore] Deleting transaction:', { userId, transactionId });
    
    const db = firebase.firestore();
    const transactionRef = db.collection('users').doc(userId).collection('transactions').doc(transactionId);
    
    await transactionRef.delete();
    
    // Update summary
    await window.updateTransactionSummary(userId);
    
    console.log('[Firestore] Transaction deleted successfully');
    
  } catch (error) {
    console.error('[Firestore] Error deleting transaction:', error);
    throw error;
  }
};

// Savings Goals Functions - FIXED COLLECTION NAMES
window.addSavingsGoal = async (userId, goalData) => {
    try {
        const docRef = await window.firebaseDb.collection('users').doc(userId).collection('savingsGoals').add({
            ...goalData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            archived: false
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding savings goal:', error);
        throw error;
    }
};

window.getSavingsGoals = async (userId, includeArchived = false) => {
    try {
        let query = window.firebaseDb.collection('users').doc(userId).collection('savingsGoals');
        
        if (!includeArchived) {
            query = query.where('archived', '==', false);
        }
        
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const goals = [];
        
        for (const doc of snapshot.docs) {
            const goal = { id: doc.id, ...doc.data() };
            
            // Load contributions for this goal
            const contributions = await window.getGoalContributions(userId, doc.id);
            goal.contributions = contributions;
            goal.currentAmount = contributions.reduce((sum, contrib) => sum + contrib.amount, 0);
            goal.progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            
            goals.push(goal);
        }
        
        return goals;
    } catch (error) {
        console.error('Error getting savings goals:', error);
        throw error;
    }
};

window.updateSavingsGoal = async (userId, goalId, goalData) => {
    try {
        await window.firebaseDb.collection('users').doc(userId).collection('savingsGoals').doc(goalId).update({
            ...goalData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating savings goal:', error);
        throw error;
    }
};

window.archiveSavingsGoal = async (userId, goalId) => {
    try {
        await window.firebaseDb.collection('users').doc(userId).collection('savingsGoals').doc(goalId).update({
            archived: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error archiving savings goal:', error);
        throw error;
    }
};

window.deleteSavingsGoal = async (userId, goalId) => {
    try {
        // First delete all contributions
        const contributions = await window.getGoalContributions(userId, goalId);
        const deletePromises = contributions.map(contrib => 
            window.firebaseDb.collection('users').doc(userId).collection('savingsGoals')
                .doc(goalId).collection('contributions').doc(contrib.id).delete()
        );
        
        await Promise.all(deletePromises);
        
        // Then delete the goal
        await window.firebaseDb.collection('users').doc(userId).collection('savingsGoals').doc(goalId).delete();
    } catch (error) {
        console.error('Error deleting savings goal:', error);
        throw error;
    }
};

// Contributions Functions
window.addSavingsContribution = async (userId, goalId, contributionData) => {
    try {
        const docRef = await window.firebaseDb.collection('users').doc(userId).collection('savingsGoals')
            .doc(goalId).collection('contributions').add({
                ...contributionData,
                date: firebase.firestore.Timestamp.fromDate(new Date(contributionData.date || new Date())),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        return docRef.id;
    } catch (error) {
        console.error('Error adding savings contribution:', error);
        throw error;
    }
};

window.getGoalContributions = async (userId, goalId, limit = 10) => {
    try {
        const snapshot = await window.firebaseDb.collection('users').doc(userId).collection('savingsGoals')
            .doc(goalId).collection('contributions')
            .orderBy('date', 'desc')
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting goal contributions:', error);
        throw error;
    }
};

console.log('[Firestore] Módulo de base de datos cargado');