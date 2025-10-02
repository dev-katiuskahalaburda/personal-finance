const AddTransaction = {
    template: `
        <div class="form-container">
            <h2>Añadir Nueva Transacción</h2>
            <form @submit.prevent="submitTransaction">
                <div class="form-group">
                    <label for="type">Tipo de transacción</label>
                    <select id="type" v-model="transaction.type" required>
                        <option value="income">Ingreso</option>
                        <option value="expense">Gasto</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="amount">Monto (Gs.)</label>
                    <input type="number" id="amount" v-model.number="transaction.amount" min="0" step="1000" required>
                </div>
                
                <div class="form-group">
                    <label for="name">Nombre/Descripción</label>
                    <input type="text" id="name" v-model="transaction.name" required>
                </div>
                
                <div class="form-group">
                    <label for="category">Categoría</label>
                    <select id="category" v-model="transaction.category" required>
                        <option value="comida">Comida</option>
                        <option value="transporte">Transporte</option>
                        <option value="servicios">Servicios</option>
                        <option value="entretenimiento">Entretenimiento</option>
                        <option value="salario">Salario</option>
                        <option value="otros">Otros</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="date">Fecha</label>
                    <input type="date" id="date" v-model="transaction.date" required>
                </div>
                
                <button type="submit" :disabled="loading" class="btn-primary">
                    {{ loading ? 'Guardando...' : 'Guardar Transacción' }}
                </button>
                
                <p v-if="message" :class="['message', messageType]">{{ message }}</p>
            </form>
        </div>
    `,
    data() {
        return {
            transaction: {
                type: 'expense',
                amount: 0,
                name: '',
                category: 'comida',
                date: new Date().toISOString().split('T')[0] // Today's date
            },
            loading: false,
            message: '',
            messageType: ''
        }
    },
    methods: {
        async submitTransaction() {
            this.loading = true;
            this.message = '';
            
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) throw new Error('Usuario no autenticado');
                
                // Use your existing Firestore function
                await window.addTransaction(user.uid, this.transaction);
                
                this.message = 'Transacción añadida correctamente';
                this.messageType = 'success';
                
                // Reset form
                this.transaction = {
                    type: 'expense',
                    amount: 0,
                    name: '',
                    category: 'comida',
                    date: new Date().toISOString().split('T')[0]
                };
                
                // Optional: Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.hash = '/';
                }, 2000);
                
            } catch (error) {
                this.message = 'Error: ' + error.message;
                this.messageType = 'error';
                console.error('Error adding transaction:', error);
            } finally {
                this.loading = false;
            }
        }
    }
};