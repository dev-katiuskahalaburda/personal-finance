
    

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
