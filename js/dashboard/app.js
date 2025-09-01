
  document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticación
  window.setupAuthListener(async (user) => {
    if (!user) {
      // Usuario no autenticado, redirigir al login
      window.location.href = "./index.html";
      return;
    }

    // Usuario autenticado, cargar sus datos
    try {
      await loadUserData(user.uid);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar los datos. Por favor, recarga la página.");
    }
  });

  // Configurar botón de logout
  const logoutBtn = document.querySelector(".logout");
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
});

// Configurar navegación entre páginas
function setupNavigation() {
  // Botón para añadir transacción
  const addTransactionBtn = document.getElementById("add-transaction-btn");
  if (addTransactionBtn) {
    addTransactionBtn.addEventListener("click", () => {
      window.location.href = "add-transaction.html";
    });
  }

  // Botón para ver ahorros (puedes crear savings.html después)
  const savingsBtn = document.getElementById("savings-btn");
  if (savingsBtn) {
    savingsBtn.addEventListener("click", () => {
      alert("Página de ahorros en desarrollo");
      // window.location.href = "savings.html";
    });
  }

  // Botón para volver al dashboard
  const dashboardBtn = document.getElementById("dashboard-btn");
  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }
}


// Cargar datos del usuario desde Firestore
async function loadUserData(userId) {
  try {
    // Obtener resumen financiero
    const summary = await window.getFinancialSummary(userId);
    updateSummaryUI(summary);
    
    // Obtener últimas transacciones
    const transactions = await window.getTransactions(userId, 5);
    updateTransactionsUI(transactions);
  } catch (error) {
    console.error("Error cargando datos del usuario:", error);
    throw error;
  }
}

// Actualizar la UI con el resumen financiero
function updateSummaryUI(summary) {
  // Actualizar balance total
  const balanceElement = document.querySelector('.total-balance .amount');
  if (balanceElement) {
    balanceElement.textContent = formatCurrency(summary.balance);
    balanceElement.className = 'amount ' + (summary.balance >= 0 ? 'positive' : 'negative');
  }
  
  // Actualizar resumen (ingresos, egresos)
  const incomeElement = document.querySelector('.summary-row.income .value');
  const expenseElement = document.querySelector('.summary-row.expense .value');
  
  if (incomeElement) incomeElement.textContent = `+${formatCurrency(summary.income)}`;
  if (expenseElement) expenseElement.textContent = `-${formatCurrency(summary.expenses)}`;
}

// Actualizar la UI con las transacciones
function updateTransactionsUI(transactions) {
  const transactionsContainer = document.querySelector('.transactions-table .card-body');
  
  if (!transactions || transactions.length === 0) {
    transactionsContainer.innerHTML = '<p class="empty-state">No hay transacciones recientes</p>';
    return;
  }
  
  // Crear tabla de transacciones
  let transactionsHTML = `
    <table class="transactions-list">
      <thead>
        <tr>
          <th>Descripción</th>
          <th>Categoría</th>
          <th>Monto</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  transactions.forEach(transaction => {
    transactionsHTML += `
      <tr>
        <td>${transaction.description || 'Sin descripción'}</td>
        <td>${transaction.category || 'Sin categoría'}</td>
        <td class="${transaction.type === 'income' ? 'income' : 'expense'}">
          ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
        </td>
        <td>${formatDate(transaction.date?.toDate())}</td>
      </tr>
    `;
  });
  
  transactionsHTML += `
      </tbody>
    </table>
  `;
  
  transactionsContainer.innerHTML = transactionsHTML;
}

// Formatear moneda (Guaraníes)
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG'
  }).format(amount).replace('PYG', 'Gs.');
}

// Formatear fecha
function formatDate(date) {
  if (!date) return 'Fecha no disponible';
  
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}      

// Manejar cierre de sesión
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await firebase.auth().signOut();
        window.location.href = "./index.html"; // redirigir al login
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar sesión. Intenta de nuevo.");
      }
    });
  }
});
