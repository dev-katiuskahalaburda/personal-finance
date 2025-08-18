document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard inicializado');
  
  // Verificación robusta de Firebase
  if (!window.firebase || !window.firebaseAuth) {
    console.error('Firebase no está disponible');
// Redirigir solo si no estamos ya en index.html
   // if (!window.location.pathname.includes('index.html')) {
   //   setTimeout(() => window.location.href = 'index.html', 1000);
   // }
  //  return;
  }

  // Observador de autenticación
    let authChecked = false;
  window.setupAuthListener((user) => {
if (authChecked) return;
  authChecked = true;
  
  if (user) {
    console.log('Usuario autenticado:', user.email);
    if (window.location.pathname.includes('index.html')) {
      window.location.href = 'dashboard.html';
    } else {
      initializeDashboard(user.uid);
    }
  } else {
    console.log('Usuario no autenticado');
    if (!window.location.pathname.includes('index.html')) {
      window.location.href = 'index.html';
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
  
  // Verificar que las funciones necesarias existen
  const requiredFunctions = [
    'loadFinancialData',
    'getFinancialSummary',
    'getTransactions',
    'addTransaction'
  ];
  
  const missingFunctions = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
  
  if (missingFunctions.length > 0) {
    throw new Error(`Funciones faltantes: ${missingFunctions.join(', ')}`);
  }
  
  // Cargar datos financieros
  await window.loadFinancialData(userId);
  
  // Configurar manejadores de eventos
  setupEventHandlers(userId);
  
  // Mostrar el dashboard (por si estaba oculto)
  document.getElementById('dashboard-view').style.display = 'block';
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