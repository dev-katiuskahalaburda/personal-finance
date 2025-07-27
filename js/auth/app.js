document.addEventListener('DOMContentLoaded', () => {
  console.log('[Dashboard] Inicializando...');
  
  // Verificar autenticación
  if (!window.firebaseAuth) {
    console.error('[Dashboard] Firebase no está disponible');
    window.location.href = 'index.html';
    return;
  }

  // Configurar observador de autenticación
  window.setupAuthListener((user) => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      console.log('[Dashboard] Usuario autenticado:', user.email);
      initDashboard(user.uid);
    }
  });

  // Manejador de logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await window.logoutUser();
    } catch (error) {
      console.error('Error en logout:', error);
    }
  });

 // Inicializar dashboard
  const initDashboard = async (userId) => {
    try {
      await window.loadFinancialData(userId); // Ahora esta función existe
      setupEventHandlers(userId);
    } catch (error) {
      console.error('Error inicializando dashboard:', error);
    }
  };

 // Configurar manejadores de eventos
  const setupEventHandlers = (userId) => {
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
      transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addNewTransaction(userId);
      });
    }
  };

  // Función para añadir transacción
  const addNewTransaction = async (userId) => {
    const form = document.getElementById('transaction-form');
    try {
      await window.addTransaction(userId, {
        description: form['description'].value,
        amount: parseFloat(form['amount'].value),
        type: form['type'].value,
        date: form['date'].value || new Date().toISOString().split('T')[0]
      });
      form.reset();
      await window.loadFinancialData(userId); // Recargar datos
    } catch (error) {
      console.error('Error añadiendo transacción:', error);
    }
  };
});
  
  