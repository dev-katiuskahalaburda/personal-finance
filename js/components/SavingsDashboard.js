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
                                <button @click="startEditGoal(goal)" class="btn-edit" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button @click="addContribution(goal)" class="btn-contribute" title="Añadir aporte">
                                    <i class="fas fa-plus-circle"></i>
                                </button>
                                <button @click="confirmDeleteGoal(goal)" class="btn-delete" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>

                        <div class="goal-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" :style="{ width: Math.min(goal.progress, 100) + '%' }"></div>
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

                        <!-- Archive button for completed goals -->
                        <div v-if="goal.progress >= 100" class="goal-footer">
                            <button @click="archiveGoal(goal.id)" class="btn-secondary">
                                <i class="fas fa-archive"></i> Archivar
                            </button>
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

                        <div class="form-group">
                            <label for="targetAmount">Monto objetivo (Gs.) *</label>
                            <input type="number" id="targetAmount" v-model.number="goalForm.targetAmount" 
                                   required min="1" step="1000">
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
                            <button type="submit" :disabled="saving" class="btn-primary">
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
                        <div class="form-group">
                            <label for="contributionAmount">Monto (Gs.) *</label>
                            <input type="number" id="contributionAmount" v-model.number="contributionForm.amount" 
                                   required min="1" step="1000" :max="remainingAmount">
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
                            <button type="submit" :disabled="savingContribution" class="btn-primary">
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
                targetAmount: null,
                targetDate: '',
                description: ''
            },
            contributionForm: {
                amount: null,
                date: new Date().toISOString().split('T')[0]
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

                // For now, use mock data until Firestore functions are implemented
                this.goals = await this.getMockGoals();
                
            } catch (error) {
                console.error('Error loading goals:', error);
                // Fallback to mock data
                this.goals = await this.getMockGoals();
            } finally {
                this.loading = false;
            }
        },

        // Mock data for testing
        async getMockGoals() {
            return [
                {
                    id: '1',
                    name: 'Vacaciones en la playa',
                    targetAmount: 1000000,
                    currentAmount: 350000,
                    progress: 35,
                    targetDate: new Date('2024-12-31'),
                    description: 'Ahorro para viaje familiar'
                },
                {
                    id: '2',
                    name: 'Nueva laptop',
                    targetAmount: 3000000,
                    currentAmount: 1500000,
                    progress: 50,
                    targetDate: new Date('2024-10-15'),
                    description: 'Para trabajo y estudios'
                }
            ];
        },

        showAddGoalModal() {
            this.editingGoal = null;
            this.goalForm = {
                name: '',
                targetAmount: null,
                targetDate: '',
                description: ''
            };
            this.showGoalModal = true;
        },

        startEditGoal(goal) {
            this.editingGoal = goal;
            this.goalForm = {
                name: goal.name,
                targetAmount: goal.targetAmount,
                targetDate: goal.targetDate.toISOString().split('T')[0],
                description: goal.description || ''
            };
            this.showGoalModal = true;
        },

        closeGoalModal() {
            this.showGoalModal = false;
            this.editingGoal = null;
        },

        async saveGoal() {
            if (!this.validateGoalForm()) return;

            this.saving = true;
            try {
                // For now, just update local state
                if (this.editingGoal) {
                    const index = this.goals.findIndex(g => g.id === this.editingGoal.id);
                    if (index !== -1) {
                        this.goals[index] = {
                            ...this.goals[index],
                            name: this.goalForm.name,
                            targetAmount: this.goalForm.targetAmount,
                            targetDate: new Date(this.goalForm.targetDate),
                            description: this.goalForm.description,
                            progress: (this.goals[index].currentAmount / this.goalForm.targetAmount) * 100
                        };
                    }
                } else {
                    const newGoal = {
                        id: Date.now().toString(),
                        name: this.goalForm.name,
                        targetAmount: this.goalForm.targetAmount,
                        currentAmount: 0,
                        progress: 0,
                        targetDate: new Date(this.goalForm.targetDate),
                        description: this.goalForm.description
                    };
                    this.goals.push(newGoal);
                }

                this.closeGoalModal();
                
            } catch (error) {
                console.error('Error saving goal:', error);
                alert('Error al guardar la meta: ' + error.message);
            } finally {
                this.saving = false;
            }
        },

        validateGoalForm() {
            if (!this.goalForm.name.trim()) {
                alert('El nombre de la meta es requerido');
                return false;
            }
            if (!this.goalForm.targetAmount || this.goalForm.targetAmount <= 0) {
                alert('El monto objetivo debe ser mayor a 0');
                return false;
            }
            if (!this.goalForm.targetDate) {
                alert('La fecha objetivo es requerida');
                return false;
            }
            return true;
        },

        addContribution(goal) {
            this.selectedGoal = goal;
            this.contributionForm = {
                amount: null,
                date: new Date().toISOString().split('T')[0]
            };
            this.showContributionModal = true;
        },

        closeContributionModal() {
            this.showContributionModal = false;
            this.selectedGoal = null;
        },

        async saveContribution() {
            if (!this.validateContributionForm()) return;

            this.savingContribution = true;
            try {
                // Update local state
                const index = this.goals.findIndex(g => g.id === this.selectedGoal.id);
                if (index !== -1) {
                    const newAmount = this.goals[index].currentAmount + this.contributionForm.amount;
                    this.goals[index].currentAmount = newAmount;
                    this.goals[index].progress = (newAmount / this.goals[index].targetAmount) * 100;
                }

                this.closeContributionModal();
                
            } catch (error) {
                console.error('Error saving contribution:', error);
                alert('Error al guardar el aporte: ' + error.message);
            } finally {
                this.savingContribution = false;
            }
        },

        validateContributionForm() {
            if (!this.contributionForm.amount || this.contributionForm.amount <= 0) {
                alert('El monto del aporte debe ser mayor a 0');
                return false;
            }
            if (this.contributionForm.amount > this.remainingAmount) {
                alert('El aporte no puede exceder el monto restante de la meta');
                return false;
            }
            if (!this.contributionForm.date) {
                alert('La fecha del aporte es requerida');
                return false;
            }
            return true;
        },

        async archiveGoal(goalId) {
            try {
                // Remove from local state
                this.goals = this.goals.filter(goal => goal.id !== goalId);
            } catch (error) {
                console.error('Error archiving goal:', error);
                alert('Error al archivar la meta: ' + error.message);
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
                // Remove from local state
                this.goals = this.goals.filter(goal => goal.id !== this.goalToDelete.id);
                this.showDeleteModal = false;
                this.goalToDelete = null;
            } catch (error) {
                console.error('Error deleting goal:', error);
                alert('Error al eliminar la meta: ' + error.message);
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
            return new Intl.DateTimeFormat('es-ES').format(new Date(date));
        }
    },

    async mounted() {
        // Setup auth listener
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