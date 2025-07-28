document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard inicializado');
  
  // Verificación robusta de Firebase
  if (!window.firebase || !window.firebaseAuth) {
    console.error('Firebase no está disponible');
// Redirigir solo si no estamos ya en index.html
    if (!window.location.pathname.includes('index.html')) {
      setTimeout(() => window.location.href = 'index.html', 1000);
    }
    return;
  }

  // Observador de autenticación
    let authChecked = false;
  window.setupAuthListener((user) => {
if (authChecked) return;
    authChecked = true;
    
    if (user) {
      console.log('Usuario autenticado:', user.email);
      initializeDashboard(user.uid);
    } else {
      console.log('Usuario no autenticado');
      // Solo redirigir si no estamos en index.html
      if (!window.location.pathname.includes('index.html')) {
        setTimeout(() => window.location.href = 'index.html', 500);
      }
    }
  });

  // Manejador de logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await window.logoutUser();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  });
});

// Función mejorada para inicializar el dashboard
async function initializeDashboard(userId) {
  console.log('Inicializando dashboard para usuario:', userId);
  
  // Debug: Verificar funciones disponibles
  console.log('Funciones disponibles:', {
    loadFinancialData: typeof window.loadFinancialData,
    getFinancialSummary: typeof window.getFinancialSummary,
    getTransactions: typeof window.getTransactions,
    firebaseDb: typeof window.firebaseDb
  });

  try {
    // Verificación exhaustiva de dependencias
    if (typeof window.loadFinancialData !== 'function') {
      throw new Error('loadFinancialData no está definida');
    }
    
    if (typeof window.firebaseDb === 'undefined') {
      throw new Error('Firebase Firestore no está inicializado');
    }

    console.log('Cargando datos financieros...');
    await window.loadFinancialData(userId);
    console.log('Datos financieros cargados exitosamente');
    
    // Configurar manejadores de eventos
    setupEventHandlers(userId);
    
  } catch (error) {
    console.error('Error al inicializar dashboard:', {
      error: error.message,
      stack: error.stack
    });
    
    // Mostrar error al usuario de forma más amigable
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.innerHTML = `
      <h3>Error al cargar el dashboard</h3>
      <p>${error.message}</p>
      <p>Intenta recargar la página o contactar al soporte.</p>
    `;
    
    document.getElementById('dashboard-view')?.prepend(errorMessage);
  }
}

function setupEventHandlers(userId) {
  console.log('Configurando manejadores de eventos para:', userId);
  
  // Manejador para el formulario de transacciones (si existe)
  document.getElementById('transaction-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.target);
      const transactionData = {
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description'),
        type: formData.get('type'),
        category: formData.get('category')
      };
      
      console.log('Agregando transacción:', transactionData);
      await window.addTransaction(userId, transactionData);
      await window.loadFinancialData(userId); // Refrescar datos
      e.target.reset();
      
    } catch (error) {
      console.error('Error al agregar transacción:', error);
    }
  });
}