/**
 * OptimizedExpenseManager - Gestor Ultra-Optimizado de Gastos
 * 
 * Sistema avanzado que combina todas las optimizaciones:
 * - OptimisticUI para cambios instantáneos
 * - BatchManager para operaciones agrupadas
 * - RealtimeSync para notificaciones instantáneas
 * - Service Worker sync para offline
 * 
 * @author David Ferrer Figueroa
 * @version 4.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import OptimisticUI from './OptimisticUI.js';

export class OptimizedExpenseManager {
    constructor(budgetManager) {
        this.budgetManager = budgetManager;
        this.firebaseManager = budgetManager.firebaseManager;
        this.batchManager = budgetManager.batchManager;
        this.realtimeSync = budgetManager.realtimeSync;
        this.optimisticUI = budgetManager.optimisticUI;
        
        // Configurar notificaciones en tiempo real
        this.setupRealtimeNotifications();
        
        Logger.init('OptimizedExpenseManager initialized');
    }

    /**
     * Configura las notificaciones en tiempo real
     */
    setupRealtimeNotifications() {
        // Notificar cambios a otros dispositivos
        this.realtimeSync.onExpenseAdded = (expense) => {
            this.budgetManager.handleRemoteExpenseChange('added', expense);
        };

        this.realtimeSync.onExpenseUpdated = (expense) => {
            this.budgetManager.handleRemoteExpenseChange('updated', expense);
        };

        this.realtimeSync.onExpenseDeleted = (expense) => {
            this.budgetManager.handleRemoteExpenseChange('deleted', expense);
        };
    }

    /**
     * 🚀 AÑADIR GASTO CON OPTIMISTIC UI
     * Muestra el cambio inmediatamente, luego sincroniza en background
     */
    async add(expense) {
        Logger.data('ExpenseManager.add started');
        
        try {
            const result = await this.optimisticUI.addExpenseOptimistic(
                expense,
                // Operación en servidor
                async (expenseData) => {
                    return await this.performServerAdd(expenseData);
                },
                // Callback de actualización UI
                () => {
                    this.budgetManager.updateBudgetUI();
                }
            );

            // Notificar a otros dispositivos
            this.realtimeSync.notifyExpenseChange('added', {
                ...expense,
                id: result
            });

            Logger.success('ExpenseManager.add completed');
            return result;

        } catch (error) {
            Logger.error('Failed to add expense:', error);
            this.budgetManager.showNotification('❌ Error al añadir gasto', 'error');
            throw error;
        }
    }

    /**
     * 🔄 ACTUALIZAR GASTO CON OPTIMISTIC UI
     */
    async update(id, updates) {
        Logger.data('ExpenseManager.update started');
        
        try {
            await this.optimisticUI.updateExpenseOptimistic(
                id,
                updates,
                // Operación en servidor
                async (expenseId, updateData) => {
                    return await this.performServerUpdate(expenseId, updateData);
                },
                // Callback de actualización UI
                () => {
                    this.budgetManager.updateBudgetUI();
                }
            );

            // Notificar a otros dispositivos
            this.realtimeSync.notifyExpenseChange('updated', {
                id,
                ...updates
            });

            Logger.success('ExpenseManager.update completed');

        } catch (error) {
            Logger.error('Failed to update expense:', error);
            this.budgetManager.showNotification('❌ Error al actualizar gasto', 'error');
            throw error;
        }
    }

    /**
     * 🗑️ ELIMINAR GASTO CON OPTIMISTIC UI
     */
    async remove(id) {
        Logger.data('ExpenseManager.remove started');
        
        try {
            await this.optimisticUI.deleteExpenseOptimistic(
                id,
                // Operación en servidor
                async (expenseId) => {
                    return await this.performServerDelete(expenseId);
                },
                // Callback de actualización UI
                () => {
                    this.budgetManager.updateBudgetUI();
                }
            );

            // Notificar a otros dispositivos
            this.realtimeSync.notifyExpenseChange('deleted', { id });

            Logger.success('ExpenseManager.remove completed');

        } catch (error) {
            Logger.error('Failed to remove expense:', error);
            this.budgetManager.showNotification('❌ Error al eliminar gasto', 'error');
            throw error;
        }
    }

    /**
     * 📦 OPERACIONES POR LOTES
     * Para múltiples cambios simultáneos
     */
    async addMultiple(expenses) {
        Logger.data(`Adding ${expenses.length} expenses in batch`);
        
        const promises = expenses.map(expense => 
            this.batchManager.addToBatch('add', expense)
        );

        try {
            const results = await Promise.all(promises);
            
            // Actualizar UI una sola vez
            this.budgetManager.updateBudgetUI();
            
            // Notificar cambios
            expenses.forEach((expense, index) => {
                this.realtimeSync.notifyExpenseChange('added', {
                    ...expense,
                    id: results[index]
                });
            });

            this.budgetManager.showNotification(
                `✅ ${expenses.length} gastos añadidos correctamente`, 
                'success'
            );

            return results;

        } catch (error) {
            Logger.error('Batch add failed:', error);
            this.budgetManager.showNotification('❌ Error en operación por lotes', 'error');
            throw error;
        }
    }

    /**
     * 🔄 FORZAR SINCRONIZACIÓN
     * Para sincronizar manualmente cuando sea necesario
     */
    async forceSync() {
        Logger.data('Force syncing all pending operations');
        
        try {
            // Flush batch operations
            await this.batchManager.forceFlush();
            
            // Trigger service worker sync
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('expense-sync');
            }

            this.budgetManager.showNotification('🔄 Sincronización completada', 'success');

        } catch (error) {
            Logger.error('Force sync failed:', error);
            this.budgetManager.showNotification('❌ Error en sincronización', 'error');
        }
    }

    /**
     * 📊 ESTADÍSTICAS DE RENDIMIENTO
     */
    getPerformanceStats() {
        return {
            pendingOptimisticOps: this.optimisticUI.getPendingCount(),
            pendingBatchOps: this.batchManager.getPendingCount(),
            connectionStatus: this.realtimeSync.getConnectionStatus(),
            lastSync: localStorage.getItem('lastSyncTime') || 'Never'
        };
    }

    // ========================================
    // MÉTODOS PRIVADOS PARA OPERACIONES EN SERVIDOR
    // ========================================

    /**
     * Realiza la operación de añadir en el servidor
     * @private
     */
    async performServerAdd(expense) {
        if (this.firebaseManager.isConnected) {
            // Usar BatchManager para mejor rendimiento
            return await this.batchManager.addToBatch('add', expense);
        } else {
            // Fallback offline
            return await this.addToOfflineQueue(expense);
        }
    }

    /**
     * Realiza la operación de actualizar en el servidor
     * @private
     */
    async performServerUpdate(id, updates) {
        if (this.firebaseManager.isConnected) {
            return await this.batchManager.addToBatch('update', { id, updates });
        } else {
            return await this.addUpdateToOfflineQueue(id, updates);
        }
    }

    /**
     * Realiza la operación de eliminar en el servidor
     * @private
     */
    async performServerDelete(id) {
        if (this.firebaseManager.isConnected) {
            return await this.batchManager.addToBatch('delete', { id });
        } else {
            return await this.addDeleteToOfflineQueue(id);
        }
    }

    /**
     * Añade operación a la cola offline
     * @private
     */
    async addToOfflineQueue(expense) {
        const offlineOp = {
            type: 'add',
            data: expense,
            timestamp: Date.now(),
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Guardar en IndexedDB para Service Worker
        await this.saveToIndexedDB('pendingExpenses', offlineOp);
        
        // Programar sync cuando haya conexión
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('expense-sync');
        }

        return offlineOp.id;
    }

    /**
     * Añade actualización a la cola offline
     * @private
     */
    async addUpdateToOfflineQueue(id, updates) {
        const offlineOp = {
            type: 'update',
            data: { id, updates },
            timestamp: Date.now(),
            id: `offline_update_${Date.now()}`
        };

        await this.saveToIndexedDB('pendingExpenses', offlineOp);
        
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('expense-sync');
        }

        return id;
    }

    /**
     * Añade eliminación a la cola offline
     * @private
     */
    async addDeleteToOfflineQueue(id) {
        const offlineOp = {
            type: 'delete',
            data: { id },
            timestamp: Date.now(),
            id: `offline_delete_${Date.now()}`
        };

        await this.saveToIndexedDB('pendingExpenses', offlineOp);
        
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('expense-sync');
        }

        return id;
    }

    /**
     * Guarda datos en IndexedDB
     * @private
     */
    async saveToIndexedDB(storeName, data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ViajeHimalayaDB', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const addRequest = store.add(data);
                
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error);
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            };
        });
    }
}

export default OptimizedExpenseManager;
