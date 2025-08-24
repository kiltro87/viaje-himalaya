/**
 * OptimisticUI - Sistema de UI Optimista
 * 
 * Muestra cambios inmediatamente en la UI antes de confirmar
 * con el servidor, proporcionando una experiencia ultrarrápida.
 * 
 * Funcionalidades:
 * - Actualización instantánea de UI
 * - Rollback automático en caso de error
 * - Queue de operaciones pendientes
 * - Indicadores visuales de estado
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';

export class OptimisticUI {
    constructor() {
        this.pendingOperations = new Map();
        this.rollbackQueue = [];
        this.operationId = 0;
        
        Logger.init('OptimisticUI initialized');
    }

    /**
     * Genera un ID único para la operación
     */
    generateOperationId() {
        return `op_${Date.now()}_${++this.operationId}`;
    }

    /**
     * Añade un gasto de forma optimista
     * @param {Object} expense - Datos del gasto
     * @param {Function} serverOperation - Función que ejecuta la operación en el servidor
     * @param {Function} uiUpdateCallback - Función para actualizar la UI
     */
    async addExpenseOptimistic(expense, serverOperation, uiUpdateCallback) {
        const operationId = this.generateOperationId();
        
        // 1️⃣ ACTUALIZACIÓN INMEDIATA DE UI
        const optimisticExpense = {
            ...expense,
            id: operationId, // ID temporal
            isOptimistic: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Añadir a AppState inmediatamente
        window.AppState.expenses.unshift(optimisticExpense);
        
        // Actualizar UI inmediatamente con mejor rendimiento
        if (uiUpdateCallback) {
            requestAnimationFrame(() => {
                uiUpdateCallback();
            });
        }

        // Guardar operación pendiente
        this.pendingOperations.set(operationId, {
            type: 'add',
            data: optimisticExpense,
            timestamp: Date.now()
        });

        // Mostrar indicador de "enviando"
        this.showOptimisticIndicator(operationId, 'sending');

        try {
            // 2️⃣ OPERACIÓN EN SERVIDOR (en background)
            const realId = await serverOperation(expense);
            
            // 3️⃣ REEMPLAZAR ID TEMPORAL CON REAL
            const expenseIndex = window.AppState.expenses.findIndex(e => e.id === operationId);
            if (expenseIndex !== -1) {
                window.AppState.expenses[expenseIndex] = {
                    ...window.AppState.expenses[expenseIndex],
                    id: realId,
                    isOptimistic: false
                };
            }

            // Limpiar operación pendiente
            this.pendingOperations.delete(operationId);
            
            // Mostrar éxito brevemente antes de ocultar
            this.showOptimisticIndicator(operationId, 'success');
            setTimeout(() => {
                this.hideOptimisticIndicator(operationId);
            }, 1000);
            
            Logger.success(`Optimistic add confirmed: ${operationId} → ${realId}`);
            
            return realId;

        } catch (error) {
            // 4️⃣ ROLLBACK EN CASO DE ERROR
            Logger.error('Optimistic operation failed, rolling back:', error);
            
            // Remover de AppState
            const expenseIndex = window.AppState.expenses.findIndex(e => e.id === operationId);
            if (expenseIndex !== -1) {
                window.AppState.expenses.splice(expenseIndex, 1);
            }

            // Actualizar UI para reflejar el rollback
            if (uiUpdateCallback) {
                uiUpdateCallback();
            }

            // Mostrar error
            this.showOptimisticIndicator(operationId, 'error');
            setTimeout(() => this.hideOptimisticIndicator(operationId), 3000);

            // Limpiar operación pendiente
            this.pendingOperations.delete(operationId);
            
            throw error;
        }
    }

    /**
     * Actualiza un gasto de forma optimista
     */
    async updateExpenseOptimistic(expenseId, updates, serverOperation, uiUpdateCallback) {
        const operationId = this.generateOperationId();
        
        // Encontrar el gasto original
        const expenseIndex = window.AppState.expenses.findIndex(e => e.id === expenseId);
        if (expenseIndex === -1) {
            throw new Error(`Expense ${expenseId} not found for optimistic update`);
        }

        const originalExpense = { ...window.AppState.expenses[expenseIndex] };
        
        // 1️⃣ ACTUALIZACIÓN INMEDIATA
        window.AppState.expenses[expenseIndex] = {
            ...originalExpense,
            ...updates,
            isOptimistic: true,
            updatedAt: new Date().toISOString()
        };

        // Actualizar UI inmediatamente
        if (uiUpdateCallback) {
            uiUpdateCallback();
        }

        // Guardar para rollback
        this.pendingOperations.set(operationId, {
            type: 'update',
            expenseId,
            originalData: originalExpense,
            newData: updates,
            timestamp: Date.now()
        });

        this.showOptimisticIndicator(operationId, 'sending');

        try {
            // 2️⃣ OPERACIÓN EN SERVIDOR
            await serverOperation(expenseId, updates);
            
            // 3️⃣ CONFIRMAR CAMBIOS
            if (window.AppState.expenses[expenseIndex]) {
                window.AppState.expenses[expenseIndex].isOptimistic = false;
            }

            this.pendingOperations.delete(operationId);
            this.hideOptimisticIndicator(operationId);
            
            Logger.success(`Optimistic update confirmed: ${expenseId}`);

        } catch (error) {
            // 4️⃣ ROLLBACK
            Logger.error('Optimistic update failed, rolling back:', error);
            
            if (expenseIndex !== -1) {
                window.AppState.expenses[expenseIndex] = originalExpense;
            }

            if (uiUpdateCallback) {
                uiUpdateCallback();
            }

            this.showOptimisticIndicator(operationId, 'error');
            setTimeout(() => this.hideOptimisticIndicator(operationId), 3000);
            
            this.pendingOperations.delete(operationId);
            throw error;
        }
    }

    /**
     * Elimina un gasto de forma optimista
     */
    async deleteExpenseOptimistic(expenseId, serverOperation, uiUpdateCallback) {
        const operationId = this.generateOperationId();
        
        // Encontrar y guardar el gasto original
        const expenseIndex = window.AppState.expenses.findIndex(e => e.id === expenseId);
        if (expenseIndex === -1) {
            throw new Error(`Expense ${expenseId} not found for optimistic delete`);
        }

        const originalExpense = { ...window.AppState.expenses[expenseIndex] };
        
        // 1️⃣ ELIMINACIÓN INMEDIATA
        window.AppState.expenses.splice(expenseIndex, 1);
        
        if (uiUpdateCallback) {
            uiUpdateCallback();
        }

        // Guardar para rollback
        this.pendingOperations.set(operationId, {
            type: 'delete',
            expenseId,
            originalData: originalExpense,
            originalIndex: expenseIndex,
            timestamp: Date.now()
        });

        this.showOptimisticIndicator(operationId, 'sending');

        try {
            // 2️⃣ OPERACIÓN EN SERVIDOR
            await serverOperation(expenseId);
            
            this.pendingOperations.delete(operationId);
            this.hideOptimisticIndicator(operationId);
            
            Logger.success(`Optimistic delete confirmed: ${expenseId}`);

        } catch (error) {
            // 4️⃣ ROLLBACK - Restaurar el gasto
            Logger.error('Optimistic delete failed, rolling back:', error);
            
            window.AppState.expenses.splice(expenseIndex, 0, originalExpense);

            if (uiUpdateCallback) {
                uiUpdateCallback();
            }

            this.showOptimisticIndicator(operationId, 'error');
            setTimeout(() => this.hideOptimisticIndicator(operationId), 3000);
            
            this.pendingOperations.delete(operationId);
            throw error;
        }
    }

    /**
     * Muestra indicador visual de operación optimista
     */
    showOptimisticIndicator(operationId, status) {
        let indicator = document.getElementById(`optimistic-${operationId}`);
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = `optimistic-${operationId}`;
            indicator.className = 'fixed top-4 right-4 px-3 py-2 rounded-lg text-sm font-medium z-[10000] transition-all duration-300';
            document.body.appendChild(indicator);
        }

        switch (status) {
            case 'sending':
                indicator.className += ' bg-blue-500 text-white animate-pulse';
                indicator.innerHTML = '📤 Enviando...';
                break;
            case 'success':
                indicator.className += ' bg-green-500 text-white';
                indicator.innerHTML = '✅ Guardado';
                break;
            case 'error':
                indicator.className += ' bg-red-500 text-white';
                indicator.innerHTML = '❌ Error de conexión';
                break;
        }
    }

    /**
     * Oculta indicador de operación optimista
     */
    hideOptimisticIndicator(operationId) {
        const indicator = document.getElementById(`optimistic-${operationId}`);
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }
    }

    /**
     * Obtiene el número de operaciones pendientes
     */
    getPendingCount() {
        return this.pendingOperations.size;
    }

    /**
     * Limpia operaciones antiguas (más de 30 segundos)
     */
    cleanupOldOperations() {
        const now = Date.now();
        const maxAge = 30000; // 30 segundos

        for (const [operationId, operation] of this.pendingOperations) {
            if (now - operation.timestamp > maxAge) {
                Logger.warning(`Cleaning up old operation: ${operationId}`);
                this.pendingOperations.delete(operationId);
                this.hideOptimisticIndicator(operationId);
            }
        }
    }
}

// Exportar instancia singleton
export default new OptimisticUI();
