// Define la función como propiedad global
window.loadFinancialData = async (userId) => {
  try {
    console.log('Cargando datos financieros para:', userId);
    
    // 1. Cargar resumen financiero
    const summary = await window.getFinancialSummary(userId);
    console.log('Resumen obtenido:', summary);
    
    // Actualizar UI
    document.getElementById('total-balance').textContent = `$${summary.balance.toFixed(2)}`;
    document.getElementById('total-income').textContent = `$${summary.income.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${summary.expenses.toFixed(2)}`;
    
    // 2. Cargar transacciones recientes
    const transactions = await window.getTransactions(userId, 5);
    const transactionsList = document.getElementById('transactions-list');
    
    transactionsList.innerHTML = transactions.map(t => `
      <div class="transaction-item ${t.type}">
        <span>${t.description}</span>
        <span>${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</span>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error en loadFinancialData:', error);
    alert('Error al cargar datos financieros');
  }
};