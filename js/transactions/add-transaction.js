// add-transaction.js
document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticación
  window.setupAuthListener(async (user) => {
    if (!user) {
      window.location.href = "./index.html";
      return;
    }
    
    // Configurar navegación
    setupNavigation();
    
    // Configurar formulario
    setupTransactionForm(user.uid);
  });
});

// Configurar navegación (similar al dashboard)
function setupNavigation() {
  // Botón para volver al dashboard
  const dashboardBtn = document.getElementById("dashboard-btn");
  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  // Botón de logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await window.logoutUser();
        window.location.href = "./index.html";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar sesión. Intenta de nuevo.");
      }
    });
  }
  
  // Establecer fecha actual por defecto
  document.getElementById('date').valueAsDate = new Date();
}

// Configurar el formulario de transacción
function setupTransactionForm(userId) {
  const form = document.getElementById('transaction-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener datos del formulario
    const formData = new FormData(form);
    const transactionData = {
      type: formData.get('type'),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description'),
      category: formData.get('category'),
      date: new Date(formData.get('date'))
    };
    
    try {
      // Guardar transacción en Firestore
      await window.addTransaction(userId, transactionData);
      
      // Mostrar mensaje de éxito
      showMessage('Transacción añadida correctamente', 'success');
      
      // Limpiar formulario
      form.reset();
      document.getElementById('date').valueAsDate = new Date();
      
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 2000);
      
    } catch (error) {
      console.error("Error añadiendo transacción:", error);
      showMessage('Error al añadir la transacción: ' + error.message, 'error');
    }
  });
}

// Mostrar mensajes de éxito/error
function showMessage(text, type) {
  // Eliminar mensajes anteriores
  const existingMessage = document.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Crear nuevo mensaje
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  
  // Insertar después del título
  const formTitle = document.querySelector('.form-container h2');
  formTitle.parentNode.insertBefore(messageDiv, formTitle.nextSibling);
}