window.loadFinancialData = async (userId) => {
  try {
    console.log('Cargando datos financieros para:', userId);
    
    // Verificar que userId existe
    if (!userId) throw new Error('ID de usuario no proporcionado');
    
    // 1. Cargar resumen financiero
    const summary = await window.getFinancialSummary(userId);
    console.log('Resumen obtenido:', summary);
    
    // Actualizar UI con verificación de elementos
    const updateElement = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `$${value.toFixed(2)}`;
    };
    
    updateElement('total-balance', summary.balance);
    updateElement('total-income', summary.income);
    updateElement('total-expenses', summary.expenses);
    
    // 2. Cargar transacciones recientes
    const transactions = await window.getTransactions(userId, 5);
    const transactionsList = document.getElementById('transactions-list');
    
    if (transactionsList) {
      transactionsList.innerHTML = transactions.map(t => `
        <div class="transaction-item ${t.type}">
          <span>${t.description || 'Sin descripción'}</span>
          <span>${t.type === 'income' ? '+' : '-'}$${(t.amount || 0).toFixed(2)}</span>
        </div>
      `).join('');
    }
    
  } catch (error) {
    console.error('Error en loadFinancialData:', error);
    
    // Mostrar error en la interfaz
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `
      <p>Error al cargar datos: ${error.message}</p>
    `;
    
    const dashboardView = document.getElementById('dashboard-view');
    if (dashboardView) {
      dashboardView.appendChild(errorContainer);
    }
  }
};