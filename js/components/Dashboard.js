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
            return window.Formatters.formatCurrency(amount);
        },
        formatDate(date) {
            return window.Formatters.formatDate(date);
        }
    }
};