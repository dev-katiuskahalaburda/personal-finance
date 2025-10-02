// utils/formatters.js
window.Formatters = {
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
    },

    formatDateTime(date) {
        if (!date) return 'Fecha no disponible';
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
};