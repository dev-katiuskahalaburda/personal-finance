// Vue App wrapped in IIFE to prevent redeclaration
// Vue App wrapped in IIFE to prevent redeclaration
(function() {
    const { createApp } = Vue;

    const Dashboard = {
        template: `
            <div class="vue-dashboard">
                <div class="dashboard-grid">
                    <!-- Total Balance Card -->
                    <div class="card total-balance">
                        <div class="card-header">
                            <h2>Balance Total</h2>
                        </div>
                        <div class="card-body">
                            <p :class="['amount', (financialSummary.balance || 0) >= 0 ? 'positive' : 'negative']">
                                {{ formatCurrency(financialSummary.balance) }}
                            </p>
                        </div>
                    </div>

                    <!-- Summary Card -->
                    <div class="card summary">
                        <div class="card-header">
                            <h2>Resumen</h2>
                        </div>
                        <div class="card-body">
                            <div class="summary-row income">
                                <span>Ingresos</span>
                                <span class="value">+{{ formatCurrency(financialSummary.totalIncome) }}</span>
                            </div>
                            <div class="summary-row expense">
                                <span>Egresos</span>
                                <span class="value">-{{ formatCurrency(financialSummary.totalExpenses) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Transactions -->
                    <div class="card transactions-table">
                        <div class="card-header">
                            <h2>Últimos Movimientos</h2>
                        </div>
                        <div class="card-body">
                            <div v-if="transactions.length === 0" class="empty-state">
                                No hay transacciones recientes
                            </div>
                            <table v-else class="transactions-list">
                                <thead>
                                    <tr>
                                        <th>Descripción</th>
                                        <th>Categoría</th>
                                        <th>Monto</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="transaction in transactions" :key="transaction.id">
                                        <td>{{ transaction.name || 'Sin descripción' }}</td>
                                        <td>{{ transaction.category || 'Sin categoría' }}</td>
                                        <td :class="transaction.type">
                                            {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                                        </td>
                                        <td>{{ formatDate(transaction.date?.toDate()) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                financialSummary: {
                    balance: 0,
                    totalIncome: 0,
                    totalExpenses: 0,
                    transactionCount: 0
                },
                transactions: [],
                isLoading: true
            }
        },
        async mounted() {
            // Wait for auth to be ready
            await new Promise((resolve) => {
                window.setupAuthListener((user) => {
                    if (user) {
                        resolve();
                    } else {
                        window.location.href = "./index.html";
                    }
                });
            });
            
            console.log('Dashboard mounted - loading data...');
            await this.loadUserData();
            this.isLoading = false;
        },
        methods: {
            async loadUserData() {
                const user = window.firebaseAuth.currentUser;
                if (!user) {
                    console.log('No user found, redirecting...');
                    window.location.href = "./index.html";
                    return;
                }

                console.log('Loading data for user:', user.uid);
                
                try {
                    const summary = await window.getFinancialSummary(user.uid);
                    console.log('Summary loaded:', summary);
                    this.financialSummary = summary;
                    
                    const transactions = await window.getTransactions(user.uid, 5);
                    console.log('Transactions loaded:', transactions);
                    this.transactions = transactions;
                } catch (error) {
                    console.error('Error loading data:', error);
                }
            },
            formatCurrency(amount) {
                // Handle undefined, null, or NaN values
                if (amount === undefined || amount === null || isNaN(amount)) {
                    console.log('Invalid amount detected:', amount);
                    return 'Gs. 0';
                }
                
                // Ensure it's a number
                const numericAmount = Number(amount);
                if (isNaN(numericAmount)) {
                    console.log('Amount is not a number:', amount);
                    return 'Gs. 0';
                }
                
                try {
                    return new Intl.NumberFormat('es-PY', {
                        style: 'currency',
                        currency: 'PYG',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(numericAmount).replace('PYG', 'Gs.');
                } catch (error) {
                    console.error('Error formatting currency:', error, 'Amount:', amount);
                    return `Gs. ${numericAmount.toLocaleString()}`;
                }
            },
            formatDate(date) {
                if (!date) return 'Fecha no disponible';
                return new Intl.DateTimeFormat('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).format(date);
            }
        }
    };

    const AddTransaction = {
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
                            placeholder="50000"
                            @input="validateAmount"
                            :class="{ 'input-error': amountError }"
                        >
                        <div v-if="amountError" class="error-message">
                            {{ amountError }}
                        </div>
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
                    amount: null,
                    name: '',
                    category: 'comida',
                    date: new Date().toISOString().split('T')[0],
                    description: ''
                },
                loading: false,
                message: '',
                messageType: '',
                maxDate: new Date().toISOString().split('T')[0],
                amountError: ''
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
            validateAmount() {
                if (this.transaction.amount && this.transaction.amount <= 0) {
                    this.amountError = 'El monto debe ser mayor a 0';
                    return false;
                }
                
                if (this.transaction.amount > 1000000000) {
                    this.amountError = 'El monto es demasiado grande';
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
                if (!this.validateAmount() || !this.isFormValid) return;
                
                this.loading = true;
                this.message = '';
                
                try {
                    const user = window.firebaseAuth.currentUser;
                    if (!user) throw new Error('Usuario no autenticado');
                    
                    const transactionData = {
                        type: this.transaction.type,
                        amount: Number(this.transaction.amount),
                        name: this.transaction.name.trim(),
                        category: this.transaction.category,
                        date: new Date(this.transaction.date),
                        description: this.transaction.description.trim(),
                        createdAt: new Date()
                    };
                    
                    await window.addTransaction(user.uid, transactionData);
                    
                    this.message = 'Transacción añadida correctamente';
                    this.messageType = 'success';
                    this.resetForm();
                    
                    setTimeout(() => {
                        window.location.hash = '/';
                    }, 1500);
                    
                } catch (error) {
                    this.message = `Error: ${error.message}`;
                    this.messageType = 'error';
                } finally {
                    this.loading = false;
                }
            },
            
            resetForm() {
                this.transaction.amount = null;
                this.transaction.name = '';
                this.transaction.description = '';
                this.transaction.date = new Date().toISOString().split('T')[0];
                this.amountError = '';
                this.message = '';
            }
        },
        mounted() {
            window.setupAuthListener((user) => {
                if (!user) window.location.href = "./index.html";
            });
        }
    };

    const routes = [
        { path: '/', component: Dashboard },
        { path: '/add-transaction', component: AddTransaction }
    ];

    const router = VueRouter.createRouter({
        history: VueRouter.createWebHashHistory(),
        routes
    });

    const app = createApp({
        template: `<router-view></router-view>`
    });

    app.use(router);
    app.mount('#vue-app');
})();