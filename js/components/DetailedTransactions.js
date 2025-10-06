
// js/components/DetailedTransactions.js
window.DetailedTransactionsComponent = {
    template: `
        <div class="detailed-transactions">
            <div class="page-header">
                <h2>Transacciones Detalladas</h2>
                <p>Gestiona y exporta todas tus transacciones</p>
            </div>

            <!-- Filters -->
            <div class="filters-card">
                <div class="filters-grid">
                    <!-- Month/Year Filter -->
                    <div class="filter-group">
                        <label for="month">Mes</label>
                        <select id="month" v-model="filters.month" @change="loadTransactions">
                            <option value="all">Todos los meses</option>
                            <option v-for="month in months" :key="month.value" :value="month.value">
                                {{ month.label }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="year">Año</label>
                        <select id="year" v-model="filters.year" @change="loadTransactions">
                            <option v-for="year in years" :key="year" :value="year">
                                {{ year }}
                            </option>
                        </select>
                    </div>

                    <!-- Type Filter -->
                    <div class="filter-group">
                        <label for="type">Tipo</label>
                        <select id="type" v-model="filters.type" @change="loadTransactions">
                            <option value="all">Todos los tipos</option>
                            <option value="income">Ingresos</option>
                            <option value="expense">Gastos</option>
                        </select>
                    </div>

                    <!-- Search -->
                    <div class="filter-group search-group">
                        <label for="search">Buscar</label>
                        <div class="search-input">
                            <input 
                                type="text" 
                                id="search" 
                                v-model="filters.search" 
                                placeholder="Buscar por descripción..."
                                @input="debouncedSearch"
                            >
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                </div>

                <!-- Export Buttons -->
                <div class="export-actions">
                    <button @click="exportToCSV" class="btn-export" :disabled="filteredTransactions.length === 0">
                        <i class="fas fa-file-csv"></i> Exportar CSV
                    </button>
                    <button @click="exportToPDF" class="btn-export" :disabled="filteredTransactions.length === 0">
                        <i class="fas fa-file-pdf"></i> Exportar PDF
                    </button>
                </div>
            </div>

            <!-- Transactions Table -->
            <div class="transactions-card">
                <div class="card-header">
                    <h3>Lista de Transacciones</h3>
                    <div class="table-info">
                        <span v-if="!loading">
                            Mostrando {{ filteredTransactions.length }} de {{ totalTransactions }} transacciones
                        </span>
                        <span v-else>Cargando...</span>
                    </div>
                </div>

                <div class="card-body">
                    <!-- Loading State -->
                    <div v-if="loading" class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando transacciones...</p>
                    </div>

                    <!-- Empty State -->
                    <div v-else-if="filteredTransactions.length === 0" class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <p>No se encontraron transacciones</p>
                        <button @click="resetFilters" class="btn-primary">
                            Mostrar todas las transacciones
                        </button>
                    </div>

                    <!-- Transactions Table -->
                    <table v-else class="transactions-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción</th>
                                <th>Categoría</th>
                                <th>Tipo</th>
                                <th>Monto</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="transaction in paginatedTransactions" :key="transaction.id" 
                                :class="{'editing': editingTransaction === transaction.id}">
                                
                                <!-- View Mode -->
                                <template v-if="editingTransaction !== transaction.id">
                                    <td>{{ formatDate(transaction.date) }}</td>
                                    <td>{{ transaction.name }}</td>
                                    <td>
                                        <span class="category-tag" :class="transaction.type">
                                            {{ getCategoryLabel(transaction.category) }}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="type-badge" :class="transaction.type">
                                            {{ transaction.type === 'income' ? 'Ingreso' : 'Gasto' }}
                                        </span>
                                    </td>
                                    <td :class="transaction.type">
                                        {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                                    </td>
                                    <td class="actions">
                                        <button @click="startEdit(transaction)" class="btn-edit" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button @click="confirmDelete(transaction)" class="btn-delete" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </template>

                                <!-- Edit Mode -->
                                <template v-else>
                                    <td>{{ formatDate(transaction.date) }}</td>
                                    <td>
                                        <input v-model="editForm.name" class="edit-input">
                                    </td>
                                    <td>
                                        <select v-model="editForm.category" class="edit-select">
                                            <option v-for="category in getCategories(editForm.type)" 
                                                    :key="category.value" 
                                                    :value="category.value">
                                                {{ category.label }}
                                            </option>
                                        </select>
                                    </td>
                                    <td>
                                        <select v-model="editForm.type" class="edit-select" @change="resetEditCategory">
                                            <option value="income">Ingreso</option>
                                            <option value="expense">Gasto</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input type="number" v-model.number="editForm.amount" 
                                               class="edit-input" min="1" step="1000">
                                    </td>
                                    <td class="actions">
                                        <button @click="saveEdit(transaction.id)" class="btn-save" title="Guardar">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button @click="cancelEdit" class="btn-cancel" title="Cancelar">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </td>
                                </template>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Pagination -->
                    <div v-if="filteredTransactions.length > itemsPerPage" class="pagination">
                        <button @click="prevPage" :disabled="currentPage === 1" class="pagination-btn">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="pagination-info">
                            Página {{ currentPage }} de {{ totalPages }}
                        </span>
                        <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-btn">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div v-if="showDeleteModal" class="modal-overlay">
                <div class="modal">
                    <h3>Confirmar Eliminación</h3>
                    <p>¿Estás seguro de que quieres eliminar la transacción "{{ transactionToDelete?.name }}"?</p>
                    <div class="modal-actions">
                        <button @click="cancelDelete" class="btn-secondary">Cancelar</button>
                        <button @click="confirmDeleteFinal" class="btn-danger">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        const currentYear = new Date().getFullYear();
        return {
            allTransactions: [],
            loading: false,
            filters: {
                month: 'all',
                year: currentYear,
                type: 'all',
                search: ''
            },
            currentPage: 1,
            itemsPerPage: 10,
            editingTransaction: null,
            editForm: {
                name: '',
                category: '',
                type: 'expense',
                amount: 0
            },
            showDeleteModal: false,
            transactionToDelete: null,
            searchTimeout: null,
            authUnsubscribe: null, // Track auth listener
            exportUrls: [] // Track created URLs for cleanup
        }
    },
    computed: {
        months() {
            return [
                { value: 1, label: 'Enero' },
                { value: 2, label: 'Febrero' },
                { value: 3, label: 'Marzo' },
                { value: 4, label: 'Abril' },
                { value: 5, label: 'Mayo' },
                { value: 6, label: 'Junio' },
                { value: 7, label: 'Julio' },
                { value: 8, label: 'Agosto' },
                { value: 9, label: 'Septiembre' },
                { value: 10, label: 'Octubre' },
                { value: 11, label: 'Noviembre' },
                { value: 12, label: 'Diciembre' }
            ];
        },
        years() {
            const currentYear = new Date().getFullYear();
            return Array.from({ length: 10 }, (_, i) => currentYear - i);
        },
        filteredTransactions() {
            let filtered = this.allTransactions;

            // Filter by month and year
            if (this.filters.month !== 'all' || this.filters.year !== 'all') {
                filtered = filtered.filter(transaction => {
                    const date = this.getJsDate(transaction.date);
                    if (!date) return false;

                    const transactionYear = date.getFullYear();
                    const transactionMonth = date.getMonth() + 1;

                    if (this.filters.month !== 'all' && this.filters.year !== 'all') {
                        return transactionMonth === parseInt(this.filters.month) && 
                               transactionYear === parseInt(this.filters.year);
                    } else if (this.filters.month !== 'all') {
                        return transactionMonth === parseInt(this.filters.month);
                    } else {
                        return transactionYear === parseInt(this.filters.year);
                    }
                });
            }

            // Filter by type
            if (this.filters.type !== 'all') {
                filtered = filtered.filter(transaction => transaction.type === this.filters.type);
            }

            // Filter by search
            if (this.filters.search) {
                const searchLower = this.filters.search.toLowerCase();
                filtered = filtered.filter(transaction => 
                    transaction.name.toLowerCase().includes(searchLower) ||
                    transaction.category.toLowerCase().includes(searchLower) ||
                    transaction.description?.toLowerCase().includes(searchLower)
                );
            }

            return filtered;
        },
        paginatedTransactions() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.filteredTransactions.slice(start, end);
        },
        totalPages() {
            return Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
        },
        totalTransactions() {
            return this.allTransactions.length;
        }
    },
    methods: {
        async loadTransactions() {
            this.loading = true;
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) {
                    window.location.href = "./index.html";
                    return;
                }

                const transactions = await window.getAllTransactions(user.uid);
                this.allTransactions = transactions;
                this.currentPage = 1; // Reset to first page when filters change
            } catch (error) {
                console.error('Error loading transactions:', error);
            } finally {
                this.loading = false;
            }
        },

        debouncedSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                if (this._isMounted) { // Check if component is still mounted
                    this.loadTransactions();
                }
            }, 500);
        },

        resetFilters() {
            this.filters = {
                month: 'all',
                year: new Date().getFullYear(),
                type: 'all',
                search: ''
            };
            this.loadTransactions();
        },

        startEdit(transaction) {
            this.editingTransaction = transaction.id;
            this.editForm = {
                name: transaction.name,
                category: transaction.category,
                type: transaction.type,
                amount: transaction.amount
            };
        },

        cancelEdit() {
            this.editingTransaction = null;
            this.editForm = {
                name: '',
                category: '',
                type: 'expense',
                amount: 0
            };
        },

        resetEditCategory() {
            if (this.editForm.type === 'income') {
                this.editForm.category = 'salario';
            } else {
                this.editForm.category = 'comida';
            }
        },

        async saveEdit(transactionId) {
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                await window.updateTransaction(user.uid, transactionId, this.editForm);
                this.editingTransaction = null;
                await this.loadTransactions(); // Reload to get updated data
            } catch (error) {
                console.error('Error updating transaction:', error);
                alert('Error al actualizar la transacción: ' + error.message);
            }
        },

        confirmDelete(transaction) {
            this.transactionToDelete = transaction;
            this.showDeleteModal = true;
        },

        cancelDelete() {
            this.showDeleteModal = false;
            this.transactionToDelete = null;
        },

        async confirmDeleteFinal() {
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                await window.deleteTransaction(user.uid, this.transactionToDelete.id);
                this.showDeleteModal = false;
                this.transactionToDelete = null;
                await this.loadTransactions(); // Reload to get updated data
            } catch (error) {
                console.error('Error deleting transaction:', error);
                alert('Error al eliminar la transacción: ' + error.message);
            }
        },

        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },

        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        },

        exportToCSV() {
            const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', 'Notas'];
            const csvData = this.filteredTransactions.map(transaction => [
                this.formatDate(transaction.date),
                `"${transaction.name}"`,
                transaction.category,
                transaction.type === 'income' ? 'Ingreso' : 'Gasto',
                transaction.amount,
                `"${transaction.description || ''}"`
            ]);

            const csvContent = [headers, ...csvData]
                .map(row => row.join(','))
                .join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            // Store URL for cleanup
            this.exportUrls.push(url);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `transacciones_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up URL after a reasonable time
            setTimeout(() => {
                this.cleanupExportUrl(url);
            }, 60000); // Clean up after 1 minute
        },
        
        cleanupExportUrl(url) {
            URL.revokeObjectURL(url);
            this.exportUrls = this.exportUrls.filter(u => u !== url);
        },

        exportToPDF() {
            // Simple PDF export using browser print
            const printWindow = window.open('', '_blank');
            const transactionRows = this.filteredTransactions.map(transaction => `
                <tr>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>${transaction.name}</td>
                    <td>${this.getCategoryLabel(transaction.category)}</td>
                    <td>${transaction.type === 'income' ? 'Ingreso' : 'Gasto'}</td>
                    <td>${this.formatCurrency(transaction.amount)}</td>
                </tr>
            `).join('');

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Transacciones - ${new Date().toLocaleDateString()}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .income { color: green; }
                            .expense { color: red; }
                        </style>
                    </head>
                    <body>
                        <h1>Transacciones</h1>
                        <p>Generado el: ${new Date().toLocaleDateString()}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Descripción</th>
                                    <th>Categoría</th>
                                    <th>Tipo</th>
                                    <th>Monto</th>
                                </tr>
                            </thead>
                            <tbody>${transactionRows}</tbody>
                        </table>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        },

        getCategories(type) {
            const incomeCategories = [
                { value: 'salario', label: 'Salario' },
                { value: 'freelance', label: 'Freelance' },
                { value: 'inversion', label: 'Inversión' },
                { value: 'regalo', label: 'Regalo' },
                { value: 'otros', label: 'Otros ingresos' }
            ];
            
            const expenseCategories = [
                { value: 'comida', label: 'Comida' },
                { value: 'transporte', label: 'Transporte' },
                { value: 'servicios', label: 'Servicios' },
                { value: 'entretenimiento', label: 'Entretenimiento' },
                { value: 'salud', label: 'Salud' },
                { value: 'educacion', label: 'Educación' },
                { value: 'ropa', label: 'Ropa' },
                { value: 'otros', label: 'Otros gastos' }
            ];
            
            return type === 'income' ? incomeCategories : expenseCategories;
        },

        getCategoryLabel(categoryValue) {
            const allCategories = [...this.getCategories('income'), ...this.getCategories('expense')];
            const category = allCategories.find(cat => cat.value === categoryValue);
            return category ? category.label : categoryValue;
        },

        formatCurrency(amount) {
            return window.Formatters ? window.Formatters.formatCurrency(amount) : 
                   new Intl.NumberFormat('es-PY', {
                       style: 'currency',
                       currency: 'PYG',
                       minimumFractionDigits: 0
                   }).format(amount).replace('PYG', 'Gs.');
        },

        // Make sure dates are properly converted
        formatDate(date) {
            if (!date) return 'Fecha no disponible';
            
            // Handle both Date objects and Firestore Timestamps
            const jsDate = this.getJsDate(date);
            return window.Formatters ? window.Formatters.formatDate(jsDate) : 
                   jsDate ? new Intl.DateTimeFormat('es-ES').format(jsDate) : 'Fecha no disponible';
        },

        // Helper method to convert Firestore Timestamp to JS Date
        getJsDate(date) {
            if (!date) return null;
            return date.toDate ? date.toDate() : new Date(date);
        },
        
        // Add cleanup method
        cleanup() {
            // Clear any pending timeouts
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = null;
            }
            
            // Unsubscribe from auth listener
            if (this.authUnsubscribe) {
                this.authUnsubscribe();
                this.authUnsubscribe = null;
            }
            
            // Clean up export URLs
            this.exportUrls.forEach(url => {
                URL.revokeObjectURL(url);
            });
            this.exportUrls = [];
        }
    },
    
    async mounted() {
        // Add this check to all components
        if (!window.firebaseAuth) {
            console.error('Firebase not initialized - redirecting to login');
            window.location.href = "./index.html";
            return;
        }
        
        this._isMounted = true;
        
        // Store the unsubscribe function
        this.authUnsubscribe = window.setupAuthListener((user) => {
            if (user && this._isMounted) {
                this.loadTransactions();
            } else if (this._isMounted) {
                window.location.href = "./index.html";
            }
        });
        
        if (this._isMounted) {
            await this.loadTransactions();
        }
    },
    
    // Vue 3 lifecycle for cleanup
    unmounted() {
        this._isMounted = false;
        this.cleanup();
    },
    
    // Vue 2 compatibility
    beforeDestroy() {
        this._isMounted = false;
        this.cleanup();
    },

    // Add Vue 3 beforeUnmount for consistency
    beforeUnmount() {
        this._isMounted = false;
        this.cleanup();
    }
};
