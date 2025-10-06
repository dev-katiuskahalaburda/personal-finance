// components/Dashboard.js
window.DashboardComponent = {
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

                <!-- Recent Transactions - UPDATED -->
                <div class="list-container">
                    <div class="list-header">
                        <h2>Últimos Movimientos</h2>
                    </div>
                    <div class="list-body">
                        <div v-if="transactions.length === 0" class="empty-state">
                            <i class="fas fa-receipt"></i>
                            <p>No hay transacciones recientes</p>
                        </div>

                        <template v-else>
                            <!-- Desktop Table -->
                            <div class="scrollable-container desktop-view">
                                <table class="responsive-table">
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
                                            <td>{{ formatDate(transaction.date) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Mobile Card List -->
                            <div class="card-list mobile-view">
                                <div v-for="transaction in transactions" :key="transaction.id" 
                                     class="list-card">
                                    <div class="list-card-header">
                                        <h4 class="list-card-title">{{ transaction.name || 'Sin descripción' }}</h4>
                                        <span class="list-card-amount" :class="transaction.type">
                                            {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                                        </span>
                                    </div>
                                    <div class="list-card-details">
                                        <div class="list-card-detail">
                                            <i class="fas fa-tag"></i>
                                            <span>{{ transaction.category || 'Sin categoría' }}</span>
                                        </div>
                                        <div class="list-card-detail">
                                            <i class="fas fa-calendar"></i>
                                            <span>{{ formatDate(transaction.date) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
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
        try {
            // Wait for auth to be ready
            const user = await window.AuthManager.waitForAuth();
            
            if (!user) {
                console.error('No authenticated user - redirecting to login');
                window.location.href = "./index.html";
                return;
            }
            
            console.log('User authenticated:', user.email);
            await this.loadUserData();
            this.isLoading = false;
            
        } catch (error) {
            console.error('Auth error:', error);
            window.location.href = "./index.html";
        }
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
            return window.Formatters ? window.Formatters.formatCurrency(amount) : 
                   new Intl.NumberFormat('es-PY', {
                       style: 'currency',
                       currency: 'PYG',
                       minimumFractionDigits: 0
                   }).format(amount || 0).replace('PYG', 'Gs.');
        },
        formatDate(date) {
            if (!date) return 'Fecha no disponible';
            
            // Handle both Date objects and Firestore Timestamps
            const jsDate = date.toDate ? date.toDate() : new Date(date);
            return window.Formatters ? window.Formatters.formatDate(jsDate) : 
                   new Intl.DateTimeFormat('es-ES').format(jsDate);
        }
    }
};