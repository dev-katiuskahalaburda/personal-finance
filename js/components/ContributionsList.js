// js/components/ContributionsList.js
window.ContributionsListComponent = {
    template: `
        <div class="contributions-list">
            <div class="page-header">
                <div class="header-content">
                    <button @click="goBack" class="btn-back">
                        <i class="fas fa-arrow-left"></i> Volver a Metas
                    </button>
                    <div class="header-title">
                        <h2>Aportes: {{ goal?.name }}</h2>
                        <p>Total ahorrado: {{ formatCurrency(goal?.currentAmount || 0) }} de {{ formatCurrency(goal?.targetAmount || 0) }} ({{ (goal?.progress || 0).toFixed(1) }}%)</p>
                    </div>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="summary-cards">
                <div class="card">
                    <div class="card-header">
                        <h3>Total Aportado</h3>
                    </div>
                    <div class="card-body">
                        <p class="amount positive">{{ formatCurrency(totalContributions) }}</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Número de Aportes</h3>
                    </div>
                    <div class="card-body">
                        <p class="amount">{{ contributions.length }}</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Aporte Promedio</h3>
                    </div>
                    <div class="card-body">
                        <p class="amount">{{ formatCurrency(averageContribution) }}</p>
                    </div>
                </div>
            </div>

            <!-- Add Contribution Button -->
            <div class="actions-header">
                <button @click="showAddContributionModal" class="btn-primary">
                    <i class="fas fa-plus"></i> Añadir Aporte
                </button>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando aportes...</p>
            </div>

            <!-- Contributions Table -->
            <div v-else class="contributions-table-container">
                <div class="table-header">
                    <h3>Historial de Aportes</h3>
                    <div class="table-actions">
                        <button @click="exportToCSV" class="btn-secondary" :disabled="contributions.length === 0">
                            <i class="fas fa-download"></i> Exportar CSV
                        </button>
                    </div>
                </div>

                <div v-if="contributions.length === 0" class="empty-state">
                    <i class="fas fa-piggy-bank"></i>
                    <p>No hay aportes registrados para esta meta</p>
                    <button @click="showAddContributionModal" class="btn-primary">
                        Añadir primer aporte
                    </button>
                </div>

                <table v-else class="contributions-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Monto</th>
                            <th>Descripción</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="contribution in sortedContributions" :key="contribution.id">
                            <td>{{ formatDate(contribution.date) }}</td>
                            <td class="amount positive">{{ formatCurrency(contribution.amount) }}</td>
                            <td>{{ contribution.description || 'Aporte a meta' }}</td>
                            <td class="actions">
                                <button @click="editContribution(contribution)" class="btn-edit" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button @click="confirmDeleteContribution(contribution)" class="btn-delete" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Pagination (if needed in the future) -->
                <div v-if="contributions.length > 10" class="pagination">
                    <button class="btn-pagination" :disabled="currentPage === 1" @click="previousPage">
                        <i class="fas fa-chevron-left"></i> Anterior
                    </button>
                    <span>Página {{ currentPage }} de {{ totalPages }}</span>
                    <button class="btn-pagination" :disabled="currentPage === totalPages" @click="nextPage">
                        Siguiente <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            <!-- Add/Edit Contribution Modal -->
            <div v-if="showContributionModal" class="modal-overlay">
                <div class="modal">
                    <h3>{{ editingContribution ? 'Editar Aporte' : 'Añadir Aporte' }}</h3>
                    
                    <form @submit.prevent="saveContribution" class="contribution-form">
                        <div class="form-group">
                            <label for="contributionAmount">Monto (Gs.) *</label>
                            <input 
                                type="text" 
                                id="contributionAmount" 
                                v-model="contributionForm.displayAmount"
                                required 
                                placeholder="50000"
                                @input="formatAmountInput"
                                @blur="validateAmount"
                                :class="{ 'input-error': contributionForm.amountError }"
                                :max="remainingAmount"
                            >
                            <div v-if="contributionForm.amountError" class="error-message">
                                {{ contributionForm.amountError }}
                            </div>
                            <small class="input-hint">
                                Restante: {{ formatCurrency(remainingAmount) }}
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="contributionDate">Fecha *</label>
                            <input type="date" id="contributionDate" v-model="contributionForm.date" required
                                   :max="maxDate">
                        </div>

                        <div class="form-group">
                            <label for="contributionDescription">Descripción (opcional)</label>
                            <textarea 
                                id="contributionDescription" 
                                v-model="contributionForm.description" 
                                rows="3" 
                                placeholder="Descripción del aporte..."
                                maxlength="500"
                            ></textarea>
                            <div class="character-counter">
                                {{ contributionForm.description.length }}/500
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button type="button" @click="closeContributionModal" class="btn-secondary">Cancelar</button>
                            <button type="submit" :disabled="saving || !isFormValid" class="btn-primary">
                                {{ saving ? 'Guardando...' : (editingContribution ? 'Actualizar' : 'Añadir Aporte') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div v-if="showDeleteModal" class="modal-overlay">
                <div class="modal">
                    <h3>Confirmar Eliminación</h3>
                    <p>¿Estás seguro de que quieres eliminar este aporte de {{ formatCurrency(contributionToDelete?.amount) }}?</p>
                    <p class="warning-text">Esta acción no se puede deshacer.</p>
                    <div class="modal-actions">
                        <button @click="cancelDelete" class="btn-secondary">Cancelar</button>
                        <button @click="confirmDeleteFinal" class="btn-danger">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            goal: null,
            contributions: [],
            loading: false,
            showContributionModal: false,
            showDeleteModal: false,
            saving: false,
            editingContribution: null,
            contributionToDelete: null,
            currentPage: 1,
            itemsPerPage: 10,
            goalId: null, // Add goalId to data
            contributionForm: {
                amount: null,
                displayAmount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                amountError: ''
            },
            maxDate: new Date().toISOString().split('T')[0]
        }
    },
    computed: {
        // Remove the goalId computed property and handle it in mounted
        totalContributions() {
            return this.contributions.reduce((total, contribution) => total + contribution.amount, 0);
        },
        averageContribution() {
            return this.contributions.length > 0 ? this.totalContributions / this.contributions.length : 0;
        },
        remainingAmount() {
            if (!this.goal) return 0;
            return Math.max(0, this.goal.targetAmount - (this.goal.currentAmount || 0));
        },
        sortedContributions() {
            return [...this.contributions].sort((a, b) => {
                const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
                return dateB - dateA; // Most recent first
            });
        },
        totalPages() {
            return Math.ceil(this.contributions.length / this.itemsPerPage);
        },
        isFormValid() {
            return this.contributionForm.amount > 0 && 
                   this.contributionForm.date &&
                   !this.contributionForm.amountError &&
                   this.contributionForm.amount <= this.remainingAmount;
        }
    },
    methods: {
        async loadGoalAndContributions() {
            if (!this.goalId) {
                console.error('No goalId available');
                return;
            }

            this.loading = true;
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) {
                    window.location.href = "./index.html";
                    return;
                }

                // Load goal details
                this.goal = await window.getSavingsGoal(user.uid, this.goalId);
                
                // Load contributions for this goal
                this.contributions = await window.getGoalContributions(user.uid, this.goalId);
                
                console.log('[ContributionsList] Loaded:', {
                    goal: this.goal,
                    contributions: this.contributions
                });
                
            } catch (error) {
                console.error('Error loading goal and contributions:', error);
                alert('Error al cargar los datos: ' + error.message);
            } finally {
                this.loading = false;
            }
        },

        goBack() {
            this.$router.push('/savings');
        },

        showAddContributionModal() {
            this.editingContribution = null;
            this.contributionForm = {
                amount: null,
                displayAmount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                amountError: ''
            };
            this.showContributionModal = true;
        },

        editContribution(contribution) {
            this.editingContribution = contribution;
            this.contributionForm = {
                amount: contribution.amount,
                displayAmount: contribution.amount.toString(),
                date: this.formatDateForInput(contribution.date),
                description: contribution.description || '',
                amountError: ''
            };
            this.showContributionModal = true;
        },

        closeContributionModal() {
            this.showContributionModal = false;
            this.editingContribution = null;
            this.contributionForm.amountError = '';
        },

        formatAmountInput(event) {
            let value = event.target.value.replace(/[^\d]/g, '');
            
            if (value.length > 1) {
                value = value.replace(/^0+/, '');
            }
            
            this.contributionForm.displayAmount = value;
            
            if (value) {
                this.contributionForm.amount = parseInt(value, 10);
            } else {
                this.contributionForm.amount = null;
            }
            
            this.contributionForm.amountError = '';
        },

        validateAmount() {
            if (!this.contributionForm.amount || this.contributionForm.amount <= 0) {
                this.contributionForm.amountError = 'El monto debe ser mayor a 0';
                return false;
            }
            
            if (this.contributionForm.amount > 1000000000000) {
                this.contributionForm.amountError = 'El monto es demasiado grande';
                return false;
            }
            
            if (this.contributionForm.amount > this.remainingAmount) {
                this.contributionForm.amountError = 'El aporte no puede exceder el monto restante de la meta';
                return false;
            }
            
            this.contributionForm.amountError = '';
            return true;
        },

        async saveContribution() {
            if (!this.validateAmount() || !this.isFormValid) return;

            this.saving = true;
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                const contributionData = {
                    amount: Math.round(Number(this.contributionForm.amount)),
                    date: new Date(this.contributionForm.date),
                    description: this.contributionForm.description.trim() || `Aporte a meta: ${this.goal.name}`
                };

                if (this.editingContribution) {
                    await window.updateSavingsContribution(user.uid, this.goalId, this.editingContribution.id, contributionData);
                } else {
                    await window.addSavingsContribution(user.uid, this.goalId, contributionData);
                }
                
                await this.loadGoalAndContributions();
                this.closeContributionModal();
                
            } catch (error) {
                console.error('Error saving contribution:', error);
                alert('Error al guardar el aporte: ' + error.message);
            } finally {
                this.saving = false;
            }
        },

        confirmDeleteContribution(contribution) {
            this.contributionToDelete = contribution;
            this.showDeleteModal = true;
        },

        cancelDelete() {
            this.showDeleteModal = false;
            this.contributionToDelete = null;
        },

        async confirmDeleteFinal() {
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                await window.deleteSavingsContribution(user.uid, this.goalId, this.contributionToDelete.id);
                
                await this.loadGoalAndContributions();
                this.showDeleteModal = false;
                this.contributionToDelete = null;
            } catch (error) {
                console.error('Error deleting contribution:', error);
                alert('Error al eliminar el aporte: ' + error.message);
            }
        },

        exportToCSV() {
            const headers = ['Fecha', 'Monto', 'Descripción'];
            const csvData = this.sortedContributions.map(contribution => [
                this.formatDate(contribution.date),
                contribution.amount,
                contribution.description || 'Aporte a meta'
            ]);

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += headers.join(',') + '\n';
            csvData.forEach(row => {
                csvContent += row.join(',') + '\n';
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `aportes_${this.goal.name}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        previousPage() {
            if (this.currentPage > 1) this.currentPage--;
        },

        nextPage() {
            if (this.currentPage < this.totalPages) this.currentPage++;
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
            const dateObj = date.toDate ? date.toDate() : new Date(date);
            return window.Formatters ? window.Formatters.formatDate(dateObj) : 
                   new Intl.DateTimeFormat('es-ES').format(dateObj);
        },

        formatDateForInput(date) {
            if (!date) return '';
            const dateObj = date.toDate ? date.toDate() : new Date(date);
            return dateObj.toISOString().split('T')[0];
        }
    },

    async mounted() {
        if (!window.firebaseAuth) {
            window.location.href = "./index.html";
            return;
        }

        // Use Vue Router's route params instead of parsing URL hash directly
        if (this.$route && this.$route.params.goalId) {
            this.goalId = this.$route.params.goalId;
            console.log('Extracted goalId from route:', this.goalId);
        } else {
            // Fallback: Extract goalId from URL hash
            const hash = window.location.hash;
            console.log('Current hash:', hash);
            
            // Parse the goalId from the URL
            // Expected format: #/savings/{goalId}/contributions
            const match = hash.match(/\/savings\/([^\/]+)\/contributions/);
            if (match && match[1]) {
                this.goalId = match[1];
                console.log('Extracted goalId from URL:', this.goalId);
            } else {
                console.error('Could not extract goalId from URL:', hash);
                alert('Error: No se pudo identificar la meta de ahorro');
                this.$router.push('/savings');
                return;
            }
        }
        
        window.setupAuthListener((user) => {
            if (user) {
                this.loadGoalAndContributions();
            } else {
                window.location.href = "./index.html";
            }
        });
        
        await this.loadGoalAndContributions();
    }
};