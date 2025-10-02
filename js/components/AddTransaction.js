// components/AddTransaction.js
window.AddTransactionComponent = {
    template: `
        <div class="form-container">
            <div class="form-header">
                <h2>Añadir Transacción</h2>
            </div>
            
            <form @submit.prevent="submitTransaction" class="transaction-form">
                <!-- Transaction Type -->
                <div class="form-group">
                    <label for="type">Tipo de transacción *</label>
                    <select id="type" v-model="transaction.type" required @change="resetCategory">
                        <option value="expense">Gasto</option>
                        <option value="income">Ingreso</option>
                    </select>
                </div>
                
                <!-- Amount - Changed to text input for better control -->
                <div class="form-group">
                    <label for="amount">Monto (Gs.) *</label>
                    <input 
                        type="text" 
                        id="amount" 
                        v-model="displayAmount"
                        required 
                        placeholder="50000"
                        @input="formatAmountInput"
                        @blur="validateAmount"
                        :class="{ 'input-error': amountError }"
                    >
                    <div v-if="amountError" class="error-message">
                        {{ amountError }}
                    </div>
                    <small class="input-hint">Ingresa solo números sin puntos ni comas</small>
                </div>
                
                <!-- Description -->
                <div class="form-group">
                    <label for="name">Descripción *</label>
                    <input 
                        type="text" 
                        id="name" 
                        v-model="transaction.name" 
                        required 
                        :placeholder="transaction.type === 'income' ? 'Salario mensual' : 'Almuerzo'"
                        maxlength="100"
                    >
                    <div class="character-counter">
                        {{ transaction.name.length }}/100
                    </div>
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
                        <option v-if="transaction.type === 'expense'" value="servicios">Servicios</option>
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
                        placeholder="Detalles adicionales..."
                        maxlength="500"
                    ></textarea>
                    <div class="character-counter">
                        {{ transaction.description.length }}/500
                    </div>
                </div>
                
                <!-- Submit Button -->
                <button 
                    type="submit" 
                    :disabled="loading || !isFormValid" 
                    class="btn-primary submit-btn"
                    :class="{ 'btn-loading': loading, 'btn-disabled': !isFormValid }"
                >
                    <span v-if="!loading">Guardar Transacción</span>
                    <span v-else>Guardando...</span>
                </button>
                
                <!-- Debug info (remove in production) -->
                <div v-if="debugInfo" class="debug-info">
                    <small>Debug: Raw: {{ debugInfo.raw }}, Number: {{ debugInfo.number }}, Storing: {{ debugInfo.storing }}</small>
                </div>
                
                <!-- Status Messages -->
                <div v-if="message" :class="['message', messageType]">
                    {{ message }}
                </div>
            </form>
            
            <!-- Simple Reset Action -->
            <div class="form-actions" v-if="!loading">
                <button @click="resetForm" type="button" class="btn-secondary">
                    Limpiar Formulario
                </button>
            </div>
        </div>
    `,
    data() {
        return {
            transaction: {
                type: 'expense',
                amount: null, // This will store the actual number
                name: '',
                category: 'comida',
                date: new Date().toISOString().split('T')[0],
                description: ''
            },
            displayAmount: '', // This will store the displayed string
            loading: false,
            message: '',
            messageType: '',
            maxDate: new Date().toISOString().split('T')[0],
            amountError: '',
            debugInfo: null // Remove this in production
        }
    },
    computed: {
        isFormValid() {
            return this.transaction.amount > 0 && 
                   this.transaction.name.trim() && 
                   this.transaction.date &&
                   !this.amountError;
        }
    },
    methods: {
        formatAmountInput(event) {
            // Remove any non-digit characters
            let rawValue = event.target.value.replace(/[^\d]/g, '');
            
            // Remove leading zeros
            if (rawValue.length > 1) {
                rawValue = rawValue.replace(/^0+/, '');
            }
            
            // Update display (show raw numbers)
            this.displayAmount = rawValue;
            
            // Convert to number and store
            if (rawValue) {
                const numericValue = parseInt(rawValue, 10);
                if (!isNaN(numericValue)) {
                    this.transaction.amount = numericValue;
                    this.debugInfo = {
                        raw: rawValue,
                        number: numericValue,
                        storing: this.transaction.amount
                    };
                }
            } else {
                this.transaction.amount = null;
                this.debugInfo = null;
            }
            
            this.amountError = '';
        },
        
        validateAmount() {
            if (!this.transaction.amount || this.transaction.amount <= 0) {
                this.amountError = 'El monto debe ser mayor a 0';
                return false;
            }
            
            if (this.transaction.amount > 1000000000000) { // 1 trillion
                this.amountError = 'El monto es demasiado grande';
                return false;
            }
            
            // Ensure it's a whole number (no decimals)
            if (!Number.isInteger(this.transaction.amount)) {
                this.amountError = 'El monto debe ser un número entero';
                return false;
            }
            
            this.amountError = '';
            return true;
        },
        
        resetCategory() {
            if (this.transaction.type === 'income') {
                this.transaction.category = 'salario';
            } else {
                this.transaction.category = 'comida';
            }
        },
        
        async submitTransaction() {
            console.log('Submitting transaction with amount:', {
                displayAmount: this.displayAmount,
                transactionAmount: this.transaction.amount,
                type: typeof this.transaction.amount
            });
            
            if (!this.validateAmount() || !this.isFormValid) return;
            
            this.loading = true;
            this.message = '';
            
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) throw new Error('Usuario no autenticado');
                
                // Ensure we're storing a proper integer
                const finalAmount = Math.round(Number(this.transaction.amount));
                
                console.log('Final amount to store:', finalAmount);
                
                const transactionData = {
                    type: this.transaction.type,
                    amount: finalAmount, // Store as integer
                    name: this.transaction.name.trim(),
                    category: this.transaction.category,
                    date: new Date(this.transaction.date),
                    description: this.transaction.description.trim(),
                    createdAt: new Date()
                };
                
                console.log('Transaction data being sent:', transactionData);
                
                await window.addTransaction(user.uid, transactionData);
                
                this.message = 'Transacción añadida correctamente';
                this.messageType = 'success';
                this.resetForm();
                
                setTimeout(() => {
                    window.location.hash = '/';
                }, 1500);
                
            } catch (error) {
                console.error('Error adding transaction:', error);
                this.message = `Error: ${error.message}`;
                this.messageType = 'error';
            } finally {
                this.loading = false;
            }
        },
        
        resetForm() {
            this.transaction.amount = null;
            this.displayAmount = '';
            this.transaction.name = '';
            this.transaction.description = '';
            this.transaction.date = new Date().toISOString().split('T')[0];
            this.amountError = '';
            this.message = '';
            this.debugInfo = null;
        }
    },
    mounted() {
        window.setupAuthListener((user) => {
            if (!user) window.location.href = "./index.html";
        });
    }
};