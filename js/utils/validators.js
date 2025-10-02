// utils/validators.js
window.Validators = {
    validateAmount(amount) {
        const errors = [];
        
        if (!amount && amount !== 0) {
            errors.push('El monto es requerido');
            return { isValid: false, errors };
        }
        
        const numericAmount = Number(amount);
        
        if (isNaN(numericAmount)) {
            errors.push('El monto debe ser un número válido');
        }
        
        if (numericAmount <= 0) {
            errors.push('El monto debe ser mayor a 0');
        }
        
        if (numericAmount > 1000000000000) {
            errors.push('El monto es demasiado grande');
        }
        
        if (!Number.isInteger(numericAmount)) {
            errors.push('El monto debe ser un número entero (sin decimales)');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    validateTransaction(transaction) {
        const errors = [];
        
        if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
            errors.push('Tipo de transacción inválido');
        }
        
        const amountValidation = this.validateAmount(transaction.amount);
        if (!amountValidation.isValid) {
            errors.push(...amountValidation.errors);
        }
        
        if (!transaction.name || !transaction.name.trim()) {
            errors.push('La descripción es requerida');
        }
        
        if (!transaction.date) {
            errors.push('La fecha es requerida');
        }
        
        if (!transaction.category) {
            errors.push('La categoría es requerida');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};