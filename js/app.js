import { signUpUser, signInUser, logoutUser, onAuthStateChangedListener } from './auth.js';

// Elementos del DOM
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutBtn = document.getElementById('logout-btn');
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');

// Manejar registro
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  
  try {
    await signUpUser(email, password);
    alert('Usuario registrado correctamente');
    signupForm.reset();
  } catch (error) {
    console.error('Error al registrar:', error);
    alert(error.message);
  }
});

// Manejar inicio de sesión
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    await signInUser(email, password);
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    alert(error.message);
  }
});

// Manejar cierre de sesión
logoutBtn.addEventListener('click', () => {
  logoutUser();
});

// Observar cambios en la autenticación
onAuthStateChangedListener((user) => {
  if (user) {
    console.log('Usuario autenticado:', user.email);
    authView.classList.add('hidden');
    mainView.classList.remove('hidden');
  } else {
    console.log('No hay usuario autenticado');
    authView.classList.remove('hidden');
    mainView.classList.add('hidden');
  }
});