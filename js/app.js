document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Inicializando aplicación...');
  
  // Elementos del DOM
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');
  
  // Verificar carga de Firebase
  if (!window.firebaseAuth) {
    console.error('[App] Error: Firebase no está disponible');
    return;
  }

  // Manejador de registro
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      
      try {
        await window.signUpUser(email, password);
        alert('¡Registro exitoso!');
        signupForm.reset();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    });
  }

  // Manejador de login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        await window.signInUser(email, password);
        alert('¡Inicio de sesión exitoso!');
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    });
  }

  // Manejador de logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await window.logoutUser();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    });
  }

  // Configurar observador de autenticación
  window.setupAuthListener((user) => {
    const authView = document.getElementById('auth-view');
    const mainView = document.getElementById('main-view');
    
    if (user) {
      console.log('[App] Usuario autenticado:', user.email);
      authView?.classList.add('hidden');
      mainView?.classList.remove('hidden');
    } else {
      console.log('[App] No hay usuario autenticado');
      authView?.classList.remove('hidden');
      mainView?.classList.add('hidden');
    }
  });

  console.log('[App] Aplicación inicializada correctamente');
});