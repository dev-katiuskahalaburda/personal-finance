<template>
  <div class="form-container">
    <h2>Añadir Nueva Transacción</h2>
    
    <form @submit.prevent="submitTransaction" class="transaction-form">
      <!-- Transaction Type -->
      <div class="form-group">
        <label for="type">Tipo de transacción *</label>
        <select id="type" v-model="transaction.type" required @change="resetCategory">
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>
      </div>
      
      <!-- Amount -->
      <div class="form-group">
        <label for="amount">Monto (Gs.) *</label>
        <input 
          type="number" 
          id="amount" 
          v-model.number="transaction.amount" 
          min="1" 
          step="1000" 
          required 
          placeholder="Ej: 50000"
        >
      </div>
      
      <!-- Name/Description -->
      <div class="form-group">
        <label for="name">Descripción *</label>
        <input 
          type="text" 
          id="name" 
          v-model="transaction.name" 
          required 
          :placeholder="transaction.type === 'income' ? 'Ej: Salario mensual' : 'Ej: Almuerzo'"
          maxlength="100"
        >
      </div>
      
      <!-- Category -->
      <div class="form-group">
        <label for="category">Categoría *</label>
        <select id="category" v-model="transaction.category" required>
          <option v-if="transaction.type === 'income'" value="salario">Salario</option>
          <option v-if="transaction.type === 'income'" value="freelance">Freelance</option>
          <option v-if="transaction.type === 'income'" value="inversion">Inversión</option>
          <option v-if="transaction.type === 'income'" value="regalo">Regalo</option>
          <option v-if="transaction.type === 'income'" value="otros">Otros ingresos</option>
          
          <option v-if="transaction.type === 'expense'" value="comida">Comida</option>
          <option v-if="transaction.type === 'expense'" value="transporte">Transporte</option>
          <option v-if="transaction.type === 'expense'" value="servicios">Servicios (luz, agua, etc.)</option>
          <option v-if="transaction.type === 'expense'" value="entretenimiento">Entretenimiento</option>
          <option v-if="transaction.type === 'expense'" value="salud">Salud</option>
          <option v-if="transaction.type === 'expense'" value="educacion">Educación</option>
          <option v-if="transaction.type === 'expense'" value="ropa">Ropa</option>
          <option v-if="transaction.type === 'expense'" value="otros">Otros gastos</option>
        </select>
      </div>
      
      <!-- Date -->
      <div class="form-group">
        <label for="date">Fecha *</label>
        <input 
          type="date" 
          id="date" 
          v-model="transaction.date" 
          required
          :max="maxDate"
        >
      </div>
      
      <!-- Additional Notes -->
      <div class="form-group">
        <label for="description">Notas adicionales (opcional)</label>
        <textarea 
          id="description" 
          v-model="transaction.description" 
          rows="3" 
          placeholder="Detalles adicionales sobre esta transacción..."
          maxlength="500"
        ></textarea>
      </div>
      
      <!-- Submit Button -->
      <button 
        type="submit" 
        :disabled="loading" 
        class="btn-primary"
        :class="{ 'btn-loading': loading }"
      >
        <span v-if="!loading">💾 Guardar Transacción</span>
        <span v-else>⏳ Guardando...</span>
      </button>
      
      <!-- Status Messages -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </form>
    
    <!-- Quick Actions -->
    <div class="quick-actions" v-if="!loading">
      <button @click="fillExample" type="button" class="btn-secondary">
        🎯 Rellenar Ejemplo
      </button>
      <button @click="resetForm" type="button" class="btn-secondary">
        🔄 Limpiar Formulario
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddTransactionView',
  data() {
    return {
      transaction: {
        type: 'expense',
        amount: null,
        name: '',
        category: 'comida',
        date: new Date().toISOString().split('T')[0], // Today's date
        description: ''
      },
      loading: false,
      message: '',
      messageType: '', // 'success' or 'error'
      maxDate: new Date().toISOString().split('T')[0] // Can't select future dates
    }
  },
  methods: {
    resetCategory() {
      // Reset category when transaction type changes
      if (this.transaction.type === 'income') {
        this.transaction.category = 'salario';
      } else {
        this.transaction.category = 'comida';
      }
    },
    
    async submitTransaction() {
      // Validation
      if (!this.validateForm()) {
        return;
      }
      
      this.loading = true;
      this.message = '';
      
      try {
        const user = window.firebaseAuth.currentUser;
        if (!user) {
          throw new Error('Usuario no autenticado. Por favor, inicia sesión nuevamente.');
        }
        
        // Prepare transaction data
        const transactionData = {
          type: this.transaction.type,
          amount: Number(this.transaction.amount),
          name: this.transaction.name.trim(),
          category: this.transaction.category,
          date: new Date(this.transaction.date),
          description: this.transaction.description.trim()
        };
        
        console.log('Enviando transacción:', transactionData);
        
        // Use your existing Firestore function (will be updated with new summary logic)
        await window.addTransaction(user.uid, transactionData);
        
        // Success
        this.message = '✅ Transacción añadida correctamente';
        this.messageType = 'success';
        
        // Reset form but keep the same type
        this.resetForm();
        
        // Optional: Redirect to dashboard after success
        setTimeout(() => {
          window.location.hash = '/';
        }, 1500);
        
      } catch (error) {
        console.error('Error adding transaction:', error);
        this.message = `❌ Error: ${error.message}`;
        this.messageType = 'error';
      } finally {
        this.loading = false;
      }
    },
    
    validateForm() {
      if (!this.transaction.amount || this.transaction.amount <= 0) {
        this.message = '❌ El monto debe ser mayor a 0';
        this.messageType = 'error';
        return false;
      }
      
      if (!this.transaction.name.trim()) {
        this.message = '❌ La descripción es requerida';
        this.messageType = 'error';
        return false;
      }
      
      if (!this.transaction.date) {
        this.message = '❌ La fecha es requerida';
        this.messageType = 'error';
        return false;
      }
      
      return true;
    },
    
    resetForm() {
      this.transaction.amount = null;
      this.transaction.name = '';
      this.transaction.description = '';
      // Keep type, category, and date
      this.transaction.date = new Date().toISOString().split('T')[0];
      this.message = '';
    },
    
    fillExample() {
      this.transaction.amount = 50000;
      this.transaction.name = this.transaction.type === 'income' 
        ? 'Pago por trabajo freelance' 
        : 'Almuerzo en restaurante';
      this.transaction.description = this.transaction.type === 'income'
        ? 'Pago completo por proyecto de diseño'
        : 'Almuerzo con clientes';
      this.message = '🎯 Ejemplo cargado. Revisa y modifica los datos.';
      this.messageType = 'success';
    }
  },
  
  mounted() {
    console.log('AddTransaction component mounted');
    
    // Ensure user is authenticated
    window.setupAuthListener((user) => {
      if (!user) {
        window.location.href = "./index.html";
      }
    });
  }
}
</script>

<style scoped>
.transaction-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

input, select, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-loading {
  position: relative;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
}

.btn-secondary {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e1e5e9;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e9ecef;
  border-color: #4a90e2;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-weight: 500;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Responsive */
@media (max-width: 768px) {
  .form-container {
    padding: 1rem;
  }
  
  .quick-actions {
    flex-direction: column;
  }
}
</style>