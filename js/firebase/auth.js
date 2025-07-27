// Registro de usuario
window.signUpUser = async (email, password) => {
  try {
    const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
    await window.createUserProfile(userCredential.user.uid, { email });
    return userCredential;
  } catch (error) {
    console.error("[Auth] Error en registro:", error);
    throw error;
  }
};

// Inicio de sesión
window.signInUser = async (email, password) => {
  try {
    return await window.firebaseAuth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    console.error("[Auth] Error en login:", error);
    throw error;
  }
};

// Cierre de sesión
window.logoutUser = async () => {
  try {
    await window.firebaseAuth.signOut();
  } catch (error) {
    console.error("[Auth] Error en logout:", error);
    throw error;
  }
};

// Observador de autenticación
window.setupAuthListener = (callback) => {
  return window.firebaseAuth.onAuthStateChanged(callback);
};

console.log('[Auth] Módulo de autenticación cargado');