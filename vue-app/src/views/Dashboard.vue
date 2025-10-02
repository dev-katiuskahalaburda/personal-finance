<template>
  <div class="dashboard-vue">
    <div class="dashboard-grid">
      <!-- Total Balance Card -->
      <div class="card total-balance">
        <div class="card-header">
          <h2>Balance Total</h2>
        </div>
        <div class="card-body">
          <p :class="['amount', financialSummary.balance >= 0 ? 'positive' : 'negative']">
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
            <span class="value">+{{ formatCurrency(financialSummary.income) }}</span>
          </div>
          <div class="summary-row expense">
            <span>Egresos</span>
            <span class="value">-{{ formatCurrency(financialSummary.expenses) }}</span>
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
                <td>{{ transaction.description || 'Sin descripción' }}</td>
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
</template>

<script>
import { auth, db } from '@/services/firebase'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'

export default {
  name: 'DashboardView',
  data() {
    return {
      financialSummary: {
        income: 0,
        expenses: 0,
        balance: 0
      },
      transactions: []
    }
  },
  async mounted() {
    await this.loadUserData()
  },
  methods: {
    async loadUserData() {
      const user = auth.currentUser
      if (!user) return

      try {
        await this.loadFinancialSummary(user.uid)
        await this.loadRecentTransactions(user.uid)
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    },

    async loadFinancialSummary(userId) {
      // Reuse your existing logic but adapt for Vue
      const transactionsRef = collection(db, 'users', userId, 'transactions')
      const snapshot = await getDocs(transactionsRef)
      
      const summary = { income: 0, expenses: 0, balance: 0 }
      
      snapshot.forEach(doc => {
        const data = doc.data()
        if (data.type === 'income') {
          summary.income += data.amount
        } else {
          summary.expenses += data.amount
        }
      })
      
      summary.balance = summary.income - summary.expenses
      this.financialSummary = summary
    },

    async loadRecentTransactions(userId, limitCount = 5) {
      const transactionsRef = collection(db, 'users', userId, 'transactions')
      const q = query(transactionsRef, orderBy('date', 'desc'), limit(limitCount))
      const querySnapshot = await getDocs(q)
      
      this.transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG'
      }).format(amount).replace('PYG', 'Gs.')
    },

    formatDate(date) {
      if (!date) return 'Fecha no disponible'
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date)
    }
  }
}
</script>

<style scoped>
/* Your existing dashboard.css styles will work with these components */
.dashboard-vue {
  padding: 1rem;
}
</style>