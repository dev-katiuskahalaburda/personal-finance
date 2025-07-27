document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard inicializado');
  
  // Verificar Firebase
  if (!window.firebaseAuth) {
    console.error('Firebase no está disponible');
    window.location.href = 'index.html';
    return;
  }

  // Observador de autenticación
  window.setupAuthListener((user) => {
    if (user) {
      console.log('Usuario autenticado:', user.email);
      initializeDashboard(user.uid);
    } else {
      window.location.href = 'index.html';
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

// Función separada para inicializar el dashboard
async function initializeDashboard(userId) {
  try {
    // Verificar si la función existe
    if (typeof window.loadFinancialData === 'function') {
      await window.loadFinancialData(userId);
    } else {
      throw new Error('loadFinancialData no está definida');
    }
    
    // Configurar otros manejadores de eventos...
    setupEventHandlers(userId);
    
  } catch (error) {
    console.error('Error al inicializar dashboard:', error);
    alert('Error al cargar el dashboard');
  }
}

function setupEventHandlers(userId) {
  // Manejador para el formulario de transacciones
  document.getElementById('transaction-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ... lógica para agregar transacción
  });
}