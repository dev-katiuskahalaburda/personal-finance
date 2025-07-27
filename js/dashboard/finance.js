// /js/dashboard/finance.js

window.loadFinancialData = async (userId) => {
  try {
    // 1. Obtener resumen financiero
    const summary = await window.getFinancialSummary(userId);
    
    // Actualizar tarjetas
    document.getElementById('total-balance').textContent = `$${summary.balance.toFixed(2)}`;
    document.getElementById('total-income').textContent = `$${summary.income.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${summary.expenses.toFixed(2)}`;
    
    // 2. Obtener transacciones recientes
    const transactions = await window.getTransactions(userId, 5);
    const transactionsList = document.getElementById('transactions-list');
    
    transactionsList.innerHTML = transactions.map(transaction => `
      <div class="transaction-item ${transaction.type}">
        <span class="transaction-description">${transaction.description}</span>
        <span class="transaction-amount">
          ${transaction.type === 'expense' ? '-' : '+'}$${transaction.amount.toFixed(2)}
        </span>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error cargando datos financieros:', error);
    alert('Error al cargar datos');
  }
};