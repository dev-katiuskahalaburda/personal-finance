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

  // Inicializar lógica del dashboard
  const initDashboard = (userId) => {
    // Cargar datos financieros
    loadFinancialData(userId);
    
    // Configurar manejadores de eventos
    setupEventHandlers(userId);
  };
  
  // Resto de la lógica específica del dashboard...
});