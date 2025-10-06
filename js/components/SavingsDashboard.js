// js/components/SavingsDashboard.js
window.SavingsDashboardComponent = {
    template: `
        <div class="savings-dashboard">
            <div class="page-header">
                <h2>Metas de Ahorro</h2>
                <p>Gestiona tus objetivos de ahorro</p>
            </div>

            <!-- Add Goal Button -->
            <div class="actions-header">
                <button @click="showAddGoalModal" class="btn-primary">
                    <i class="fas fa-plus"></i> Nueva Meta de Ahorro
                </button>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando metas...</p>
            </div>

            <!-- Savings Summary Cards -->
            <div v-else class="savings-summary-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>Total Ahorrado</h3>
                    </div>
                    <div class="card-body">
                        <p class="amount positive">{{ formatCurrency(totalSaved) }}</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Metas Activas</h3>
                    </div>
                    <div class="card-body">
                        <p class="amount">{{ activeGoalsCount }}</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Metas Completadas</h3>
                    </div>
                    <div class="card-body">
                        <p class="amount">{{ completedGoalsCount }}</p>
                    </div>
                </div>
            </div>

            <!-- Goals List -->
            <div v-if="!loading" class="goals-section">
                <div class="section-header">
                    <h3>Tus Metas de Ahorro</h3>
                </div>

                <!-- Empty State -->
                <div v-if="goals.length === 0" class="empty-state">
                    <i class="fas fa-piggy-bank"></i>
                    <p>No tienes metas de ahorro aún</p>
                    <button @click="showAddGoalModal" class="btn-primary">
                        Crear tu primera meta
                    </button>
                </div>

                <!-- Goals Grid -->
                <div v-else class="goals-grid">
                    <div v-for="goal in goals" :key="goal.id" 
                         class="goal-card" :class="{ completed: goal.progress >= 100 }">
                        
                        <div class="goal-header">
                            <h4>{{ goal.name }}</h4>
                            
                            <div class="goal-actions">
                                <button @click="addContribution(goal)" class="btn-contribute" title="Añadir aporte">
                                    <i class="fas fa-plus-circle"></i>
                                </button>
                                <button @click="startEditGoal(goal)" class="btn-edit" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button @click="confirmDeleteGoal(goal)" class="btn-delete" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>

                        <div class="goal-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" :class="{ completed: goal.progress >= 100 }" 
                                     :style="{ width: Math.min(goal.progress, 100) + '%' }"></div>
                            </div>
                            <div class="progress-text">
                                <span>{{ formatCurrency(goal.currentAmount) }} / {{ formatCurrency(goal.targetAmount) }}</span>
                                <span>{{ Math.min(goal.progress, 100).toFixed(1) }}%</span>
                            </div>
                        </div>

                        <div class="goal-details">
                            <div class="goal-detail">
                                <i class="fas fa-calendar"></i>
                                <span>Fecha objetivo: {{ formatDate(goal.targetDate) }}</span>
                            </div>
                            <div class="goal-detail">
                                <i class="fas fa-bullseye"></i>
                                <span>Progreso: {{ Math.min(goal.progress, 100).toFixed(1) }}%</span>
                            </div>
                            <div v-if="goal.description" class="goal-detail">
                                <i class="fas fa-sticky-note"></i>
                                <span>{{ goal.description }}</span>
                            </div>
                        </div>

                        <!-- Recent Contributions - UPDATED -->
                        <div v-if="goal.contributions && goal.contributions.length > 0" class="contributions-section">
                            <h5>Últimos aportes:</h5>
                            <div class="contributions-list-mini">
                                <div v-for="contribution in goal.contributions.slice(0, 3)" :key="contribution.id" 
                                     class="contribution-item-mini">
                                    <span class="contribution-date">{{ formatDateShort(contribution.date) }}</span>
                                    <span class="contribution-amount">{{ formatCurrency(contribution.amount) }}</span>
                                </div>
                            </div>
                            <button v-if="goal.contributions.length > 3" @click="viewAllContributions(goal)" 
                                    class="btn-link">
                                Ver todos los aportes
                            </button>
                        </div>

                        <!-- Completed badge -->
                        <div v-if="goal.progress >= 100" class="goal-footer">
                            <span class="completed-badge">¡Completado!</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add/Edit Goal Modal -->
            <div v-if="showGoalModal" class="modal-overlay">
                <div class="modal">
                    <h3>{{ editingGoal ? 'Editar Meta' : 'Nueva Meta de Ahorro' }}</h3>
                    
                    <form @submit.prevent="saveGoal" class="goal-form">
                        <div class="form-group">
                            <label for="goalName">Nombre de la meta *</label>
                            <input type="text" id="goalName" v-model="goalForm.name" required maxlength="100">
                        </div>

                        <!-- Amount - Changed to text input for consistency -->
                        <div class="form-group">
                            <label for="targetAmount">Monto objetivo (Gs.) *</label>
                            <input 
                                type="text" 
                                id="targetAmount" 
                                v-model="goalForm.displayTargetAmount"
                                required 
                                placeholder="500000"
                                @input="formatAmountInput($event, 'targetAmount')"
                                @blur="validateAmount('targetAmount')"
                                :class="{ 'input-error': goalForm.amountError }"
                            >
                            <div v-if="goalForm.amountError" class="error-message">
                                {{ goalForm.amountError }}
                            </div>
                            <small class="input-hint">Ingresa solo números sin puntos ni comas</small>
                        </div>

                        <div class="form-group">
                            <label for="targetDate">Fecha objetivo *</label>
                            <input type="date" id="targetDate" v-model="goalForm.targetDate" required
                                   :min="minDate">
                        </div>

                        <div class="form-group">
                            <label for="goalDescription">Descripción (opcional)</label>
                            <textarea id="goalDescription" v-model="goalForm.description" 
                                      rows="3" maxlength="500"></textarea>
                        </div>

                        <div class="modal-actions">
                            <button type="button" @click="closeGoalModal" class="btn-secondary">Cancelar</button>
                            <button type="submit" :disabled="saving || !isGoalFormValid" class="btn-primary">
                                {{ saving ? 'Guardando...' : (editingGoal ? 'Actualizar' : 'Crear Meta') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Add Contribution Modal -->
            <div v-if="showContributionModal" class="modal-overlay">
                <div class="modal">
                    <h3>Añadir Aporte a: {{ selectedGoal?.name }}</h3>
                    
                    <form @submit.prevent="saveContribution" class="contribution-form">
                        <!-- Amount - Changed to text input for consistency -->
                        <div class="form-group">
                            <label for="contributionAmount">Monto (Gs.) *</label>
                            <input 
                                type="text" 
                                id="contributionAmount" 
                                v-model="contributionForm.displayAmount"
                                required 
                                placeholder="50000"
                                @input="formatAmountInput($event, 'contributionAmount')"
                                @blur="validateAmount('contributionAmount')"
                                :class="{ 'input-error': contributionForm.amountError }"
                            >
                            <div v-if="contributionForm.amountError" class="error-message">
                                {{ contributionForm.amountError }}
                            </div>
                            <small v-if="selectedGoal" class="input-hint">
                                Restante: {{ formatCurrency(remainingAmount) }}
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="contributionDate">Fecha *</label>
                            <input type="date" id="contributionDate" v-model="contributionForm.date" required
                                   :max="maxDate">
                        </div>

                        <div class="modal-actions">
                            <button type="button" @click="closeContributionModal" class="btn-secondary">Cancelar</button>
                            <button type="submit" :disabled="savingContribution || !isContributionFormValid" class="btn-primary">
                                {{ savingContribution ? 'Guardando...' : 'Añadir Aporte' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div v-if="showDeleteModal" class="modal-overlay">
                <div class="modal">
                    <h3>Confirmar Eliminación</h3>
                    <p>¿Estás seguro de que quieres eliminar la meta "{{ goalToDelete?.name }}"?</p>
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
            goals: [],
            loading: false,
            showGoalModal: false,
            showContributionModal: false,
            showDeleteModal: false,
            saving: false,
            savingContribution: false,
            editingGoal: null,
            selectedGoal: null,
            goalToDelete: null,
            goalForm: {
                name: '',
                targetAmount: null, // Stores actual number
                displayTargetAmount: '', // Stores displayed string
                targetDate: '',
                description: '',
                amountError: ''
            },
            contributionForm: {
                amount: null, // Stores actual number
                displayAmount: '', // Stores displayed string
                date: new Date().toISOString().split('T')[0],
                amountError: ''
            },
            minDate: new Date().toISOString().split('T')[0],
            maxDate: new Date().toISOString().split('T')[0]
        }
    },
    computed: {
        totalSaved() {
            return this.goals.reduce((total, goal) => total + (goal.currentAmount || 0), 0);
        },
        activeGoalsCount() {
            return this.goals.filter(goal => (goal.progress || 0) < 100).length;
        },
        completedGoalsCount() {
            return this.goals.filter(goal => (goal.progress || 0) >= 100).length;
        },
        remainingAmount() {
            if (!this.selectedGoal) return 0;
            return Math.max(0, this.selectedGoal.targetAmount - (this.selectedGoal.currentAmount || 0));
        },
        isGoalFormValid() {
            return this.goalForm.targetAmount > 0 && 
                   this.goalForm.name.trim() && 
                   this.goalForm.targetDate &&
                   !this.goalForm.amountError;
        },
        isContributionFormValid() {
            return this.contributionForm.amount > 0 && 
                   this.contributionForm.date &&
                   !this.contributionForm.amountError &&
                   this.contributionForm.amount <= this.remainingAmount;
        }
    },
    methods: {
        async loadGoals() {
            this.loading = true;
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) {
                    window.location.href = "./index.html";
                    return;
                }

                console.log('[SavingsDashboard] Loading goals for user:', user.uid);
                
                this.goals = await window.getSavingsGoals(user.uid);
                console.log('[SavingsDashboard] Goals loaded:', this.goals);
                
            } catch (error) {
                console.error('Error loading goals:', error);
                alert('Error al cargar las metas: ' + (error.message || 'Error desconocido'));
                this.goals = [];
            } finally {
                this.loading = false;
            }
        },

        // Consistent amount formatting with AddTransaction.js
        formatAmountInput(event, fieldType) {
            let value = event.target.value.replace(/[^\d]/g, '');
            
            // Remove leading zeros
            if (value.length > 1) {
                value = value.replace(/^0+/, '');
            }
            
            if (fieldType === 'targetAmount') {
                this.goalForm.displayTargetAmount = value;
                if (value) {
                    this.goalForm.targetAmount = parseInt(value, 10);
                } else {
                    this.goalForm.targetAmount = null;
                }
                this.goalForm.amountError = '';
            } else if (fieldType === 'contributionAmount') {
                this.contributionForm.displayAmount = value;
                if (value) {
                    this.contributionForm.amount = parseInt(value, 10);
                } else {
                    this.contributionForm.amount = null;
                }
                this.contributionForm.amountError = '';
            }
        },

        validateAmount(fieldType) {
            let amount, errorField;
            
            if (fieldType === 'targetAmount') {
                amount = this.goalForm.targetAmount;
                errorField = 'goalForm.amountError';
            } else {
                amount = this.contributionForm.amount;
                errorField = 'contributionForm.amountError';
            }
            
            if (!amount || amount <= 0) {
                this[errorField === 'goalForm.amountError' ? 'goalForm' : 'contributionForm'].amountError = 'El monto debe ser mayor a 0';
                return false;
            }
            
            if (amount > 1000000000000) {
                this[errorField === 'goalForm.amountError' ? 'goalForm' : 'contributionForm'].amountError = 'El monto es demasiado grande';
                return false;
            }
            
            // Additional validation for contributions
            if (fieldType === 'contributionAmount' && amount > this.remainingAmount) {
                this.contributionForm.amountError = 'El aporte no puede exceder el monto restante de la meta';
                return false;
            }
            
            this[errorField === 'goalForm.amountError' ? 'goalForm' : 'contributionForm'].amountError = '';
            return true;
        },

        showAddGoalModal() {
            this.editingGoal = null;
            this.goalForm = {
                name: '',
                targetAmount: null,
                displayTargetAmount: '',
                targetDate: '',
                description: '',
                amountError: ''
            };
            this.showGoalModal = true;
        },

        startEditGoal(goal) {
            this.editingGoal = goal;
            this.goalForm = {
                name: goal.name,
                targetAmount: goal.targetAmount,
                displayTargetAmount: goal.targetAmount.toString(),
                targetDate: this.formatDateForInput(goal.targetDate),
                description: goal.description || '',
                amountError: ''
            };
            this.showGoalModal = true;
        },

        closeGoalModal() {
            this.showGoalModal = false;
            this.editingGoal = null;
            this.goalForm.amountError = '';
        },

        async saveGoal() {
            if (!this.validateAmount('targetAmount') || !this.isGoalFormValid) return;

            this.saving = true;
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                // Ensure we're saving a proper integer
                const goalData = {
                    name: this.goalForm.name.trim(),
                    targetAmount: Math.round(Number(this.goalForm.targetAmount)),
                    targetDate: new Date(this.goalForm.targetDate),
                    description: this.goalForm.description.trim()
                };

                if (this.editingGoal) {
                    await window.updateSavingsGoal(user.uid, this.editingGoal.id, goalData);
                } else {
                    await window.addSavingsGoal(user.uid, goalData);
                }
                
                await this.loadGoals();
                this.closeGoalModal();
                
            } catch (error) {
                console.error('Error saving goal:', error);
                alert('Error al guardar la meta: ' + error.message);
            } finally {
                this.saving = false;
            }
        },

        addContribution(goal) {
            this.selectedGoal = goal;
            this.contributionForm = {
                amount: null,
                displayAmount: '',
                date: new Date().toISOString().split('T')[0],
                amountError: ''
            };
            this.showContributionModal = true;
        },

        closeContributionModal() {
            this.showContributionModal = false;
            this.selectedGoal = null;
            this.contributionForm.amountError = '';
        },

        async saveContribution() {
            if (!this.validateAmount('contributionAmount') || !this.isContributionFormValid) return;

            this.savingContribution = true;
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                const contributionData = {
                    amount: Math.round(Number(this.contributionForm.amount)),
                    date: new Date(this.contributionForm.date),
                    description: `Aporte a meta: ${this.selectedGoal.name}`
                };

                await window.addSavingsContribution(user.uid, this.selectedGoal.id, contributionData);
                await this.loadGoals();
                this.closeContributionModal();
                
            } catch (error) {
                console.error('Error saving contribution:', error);
                alert('Error al guardar el aporte: ' + error.message);
            } finally {
                this.savingContribution = false;
            }
        },

        confirmDeleteGoal(goal) {
            this.goalToDelete = goal;
            this.showDeleteModal = true;
        },

        cancelDelete() {
            this.showDeleteModal = false;
            this.goalToDelete = null;
        },

        async confirmDeleteFinal() {
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                await window.deleteSavingsGoal(user.uid, this.goalToDelete.id);
                
                await this.loadGoals();
                this.showDeleteModal = false;
                this.goalToDelete = null;
            } catch (error) {
                console.error('Error deleting goal:', error);
                alert('Error al eliminar la meta: ' + error.message);
            }
        },

        viewAllContributions(goal) {
            // Use window.location.hash for navigation instead of $router.push()
            window.location.hash = `/savings/${goal.id}/contributions`;
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

        formatDateShort(date) {
            if (!date) return 'Fecha no disponible';
            const dateObj = date.toDate ? date.toDate() : new Date(date);
            return window.Formatters ? window.Formatters.formatDateShort(dateObj) : 
                   new Intl.DateTimeFormat('es-ES', {
                       day: '2-digit',
                       month: '2-digit',
                       year: 'numeric'
                   }).format(dateObj);
        },

        formatDateForInput(date) {
            if (!date) return '';
            const dateObj = date.toDate ? date.toDate() : new Date(date);
            return dateObj.toISOString().split('T')[0];
        }
    },

    async mounted() {
        if (!window.firebaseAuth) {
            console.error('Firebase not initialized - redirecting to login');
            window.location.href = "./index.html";
            return;
        }
        
        window.setupAuthListener((user) => {
            if (user) {
                this.loadGoals();
            } else {
                window.location.href = "./index.html";
            }
        });
        
        await this.loadGoals();
    }
};