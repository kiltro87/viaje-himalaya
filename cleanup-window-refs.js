/**
 * Script de Limpieza Masiva - Window References
 * 
 * Reemplaza todas las referencias window.* restantes en BudgetManager.js
 * con llamadas al StateManager centralizado.
 */

const fs = require('fs');

const filePath = 'js/components/BudgetManager.js';
let content = fs.readFileSync(filePath, 'utf8');

// Contadores para tracking
let totalReplacements = 0;

// 1. Reemplazar todas las referencias a window.AppState.expenses
const appStateReplacements = [
    {
        from: /window\.AppState\.expenses\.map\(e => e\.id\)\.sort\(\)/g,
        to: 'stateManager.getState(\'expenses\').map(e => e.id).sort()',
        desc: 'AppState.expenses.map operations'
    },
    {
        from: /window\.AppState\.expenses/g,
        to: 'stateManager.getState(\'expenses\')',
        desc: 'AppState.expenses direct access'
    },
    {
        from: /window\.AppState/g,
        to: 'stateManager',
        desc: 'AppState object references'
    }
];

// 2. Reemplazar window.ExpenseManager con métodos directos
const expenseManagerReplacements = [
    {
        from: /window\.ExpenseManager\.add/g,
        to: 'this.addExpenseToFirebase',
        desc: 'ExpenseManager.add calls'
    },
    {
        from: /window\.ExpenseManager\.update/g,
        to: 'this.updateExpenseInFirebase',
        desc: 'ExpenseManager.update calls'
    },
    {
        from: /window\.ExpenseManager\.remove/g,
        to: 'this.removeExpenseFromFirebase',
        desc: 'ExpenseManager.remove calls'
    },
    {
        from: /window\.ExpenseManager/g,
        to: 'this.expenseManager',
        desc: 'ExpenseManager object references'
    }
];

// 3. Reemplazar window.Utils con método directo 
const utilsReplacements = [
    {
        from: /window\.Utils\.formatCurrency/g,
        to: 'this.formatCurrency',
        desc: 'Utils.formatCurrency calls'
    },
    {
        from: /window\.Utils\.calculateSubtotal/g,
        to: 'this.calculateSubtotal',
        desc: 'Utils.calculateSubtotal calls'
    },
    {
        from: /window\.Utils/g,
        to: 'this.utils',
        desc: 'Utils object references'
    }
];

// 4. Reemplazar window.innerWidth/Height con StateManager
const viewportReplacements = [
    {
        from: /window\.innerWidth/g,
        to: 'stateManager.getState(\'ui.viewportWidth\')',
        desc: 'window.innerWidth calls'
    },
    {
        from: /window\.innerHeight/g,
        to: 'stateManager.getState(\'ui.viewportHeight\')',
        desc: 'window.innerHeight calls'
    }
];

// Aplicar todos los reemplazos
const allReplacements = [
    ...appStateReplacements,
    ...expenseManagerReplacements,
    ...utilsReplacements,
    ...viewportReplacements
];

console.log('🔧 Starting massive window.* cleanup in BudgetManager.js...\n');

allReplacements.forEach(({ from, to, desc }) => {
    const matches = content.match(from);
    if (matches) {
        content = content.replace(from, to);
        totalReplacements += matches.length;
        console.log(`✅ ${desc}: ${matches.length} replacements`);
    }
});

// Agregar métodos helper necesarios al final de la clase
const helperMethods = `
    /**
     * 💾 HELPER: Save expenses to localStorage
     */
    saveExpensesToLocalStorage() {
        try {
            const expenses = stateManager.getState('expenses') || [];
            localStorage.setItem('tripExpensesV1', JSON.stringify(expenses));
            Logger.data('💾 Expenses saved to localStorage');
        } catch (error) {
            Logger.error('❌ Error saving expenses:', error);
        }
    }

    /**
     * 💰 HELPER: Format currency (migrated from window.Utils)
     */
    formatCurrency(amount, showSymbol = false) {
        if (isNaN(amount)) return showSymbol ? '€0' : '0';
        const formatted = parseFloat(amount).toFixed(2);
        return showSymbol ? \`€\${formatted}\` : formatted;
    }

    /**
     * 🧮 HELPER: Calculate subtotal (migrated from window.Utils)
     */
    calculateSubtotal(items) {
        if (!Array.isArray(items)) return 0;
        return items.reduce((sum, item) => {
            const cost = parseFloat(item.cost) || 0;
            const subItems = item.subItems || [];
            const subTotal = subItems.reduce((subSum, subItem) => subSum + (parseFloat(subItem.cost) || 0), 0);
            return sum + cost + subTotal;
        }, 0);
    }

    /**
     * 🔥 HELPER: Add expense to Firebase (migrated from window.ExpenseManager)
     */
    async addExpenseToFirebase(expense) {
        try {
            return await this.firebaseManager.addExpense(expense);
        } catch (error) {
            Logger.error('Error adding expense to Firebase:', error);
            throw error;
        }
    }

    /**
     * ✏️ HELPER: Update expense in Firebase (migrated from window.ExpenseManager)
     */
    async updateExpenseInFirebase(id, updates) {
        try {
            return await this.firebaseManager.updateExpense(id, updates);
        } catch (error) {
            Logger.error('Error updating expense in Firebase:', error);
            throw error;
        }
    }

    /**
     * 🗑️ HELPER: Remove expense from Firebase (migrated from window.ExpenseManager)
     */
    async removeExpenseFromFirebase(id) {
        try {
            return await this.firebaseManager.removeExpense(id);
        } catch (error) {
            Logger.error('Error removing expense from Firebase:', error);
            throw error;
        }
    }
`;

// Agregar métodos helper antes del cierre de la clase
content = content.replace(/}\s*$/, helperMethods + '\n}');

// Escribir archivo actualizado
fs.writeFileSync(filePath, content);

console.log(`\n🎯 CLEANUP COMPLETE!`);
console.log(`📊 Total replacements made: ${totalReplacements}`);
console.log(`✅ BudgetManager.js cleaned successfully`);
console.log(`🔧 Helper methods added for compatibility`);
