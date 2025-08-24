/**
 * BatchManager - Gestor de Operaciones por Lotes
 * 
 * Agrupa múltiples operaciones de Firebase en lotes para
 * mejorar el rendimiento y reducir el número de llamadas
 * a la base de datos.
 * 
 * Funcionalidades:
 * - Agrupación automática de operaciones
 * - Flush automático por tiempo o cantidad
 * - Transacciones atómicas
 * - Retry automático en caso de error
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';

export class BatchManager {
    constructor(firebaseManager) {
        this.firebaseManager = firebaseManager;
        this.pendingOperations = [];
        this.batchTimeout = null;
        this.maxBatchSize = 10; // Máximo 10 operaciones por lote
        this.maxWaitTime = 2000; // Máximo 2 segundos de espera
        
        Logger.init('BatchManager initialized');
    }

    /**
     * Añade una operación al lote
     * @param {string} type - Tipo de operación: 'add', 'update', 'delete'
     * @param {Object} data - Datos de la operación
     * @returns {Promise} Promise que se resuelve cuando se ejecuta el lote
     */
    addToBatch(type, data) {
        return new Promise((resolve, reject) => {
            const operation = {
                type,
                data,
                resolve,
                reject,
                timestamp: Date.now(),
                id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            this.pendingOperations.push(operation);
            Logger.data(`Operation added to batch: ${type}`, operation.id);

            // Ejecutar inmediatamente si alcanzamos el tamaño máximo
            if (this.pendingOperations.length >= this.maxBatchSize) {
                this.flushBatch();
            } else {
                // Programar flush automático
                this.scheduleBatchFlush();
            }
        });
    }

    /**
     * Programa el flush automático del lote
     */
    scheduleBatchFlush() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }

        this.batchTimeout = setTimeout(() => {
            if (this.pendingOperations.length > 0) {
                this.flushBatch();
            }
        }, this.maxWaitTime);
    }

    /**
     * Ejecuta todas las operaciones pendientes en un lote
     */
    async flushBatch() {
        if (this.pendingOperations.length === 0) return;

        // Limpiar timeout
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        const operations = [...this.pendingOperations];
        this.pendingOperations = [];

        Logger.data(`Flushing batch with ${operations.length} operations`);

        try {
            // Importar módulos de Firestore
            const { writeBatch, doc, collection, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const batch = writeBatch(this.firebaseManager.db);
            const results = [];

            // Procesar cada operación
            for (const operation of operations) {
                try {
                    const result = await this.addOperationToBatch(batch, operation);
                    results.push({ operation, result, success: true });
                } catch (error) {
                    results.push({ operation, result: null, success: false, error });
                }
            }

            // Ejecutar el lote completo
            await batch.commit();
            Logger.success(`Batch committed successfully with ${operations.length} operations`);

            // Resolver todas las promesas
            results.forEach(({ operation, result, success, error }) => {
                if (success) {
                    operation.resolve(result);
                } else {
                    operation.reject(error);
                }
            });

        } catch (error) {
            Logger.error('Batch commit failed:', error);
            
            // Rechazar todas las operaciones
            operations.forEach(operation => {
                operation.reject(error);
            });

            // Intentar retry individual para operaciones críticas
            this.retryFailedOperations(operations);
        }
    }

    /**
     * Añade una operación individual al lote de Firestore
     */
    async addOperationToBatch(batch, operation) {
        const { collection, doc, serverTimestamp } = 
            await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const collectionRef = collection(this.firebaseManager.db, 'expenses');

        switch (operation.type) {
            case 'add':
                const addDocRef = doc(collectionRef);
                const addData = {
                    ...operation.data,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    deviceId: this.firebaseManager.getDeviceId()
                };
                batch.set(addDocRef, addData);
                return addDocRef.id;

            case 'update':
                const updateDocRef = doc(collectionRef, operation.data.id);
                const updateData = {
                    ...operation.data.updates,
                    updatedAt: serverTimestamp(),
                    deviceId: this.firebaseManager.getDeviceId()
                };
                batch.update(updateDocRef, updateData);
                return operation.data.id;

            case 'delete':
                const deleteDocRef = doc(collectionRef, operation.data.id);
                batch.delete(deleteDocRef);
                return operation.data.id;

            default:
                throw new Error(`Unknown batch operation type: ${operation.type}`);
        }
    }

    /**
     * Reintenta operaciones fallidas individualmente
     */
    async retryFailedOperations(operations) {
        Logger.warning(`Retrying ${operations.length} failed operations individually`);

        for (const operation of operations) {
            try {
                let result;
                
                switch (operation.type) {
                    case 'add':
                        result = await this.firebaseManager.addExpense(operation.data, false);
                        break;
                    case 'update':
                        result = await this.firebaseManager.updateExpense(operation.data.id, operation.data.updates);
                        break;
                    case 'delete':
                        result = await this.firebaseManager.deleteExpense(operation.data.id);
                        break;
                }

                operation.resolve(result);
                Logger.success(`Retry successful for operation: ${operation.id}`);

            } catch (error) {
                Logger.error(`Retry failed for operation: ${operation.id}`, error);
                operation.reject(error);
            }
        }
    }

    /**
     * Fuerza el flush inmediato de todas las operaciones pendientes
     */
    async forceFlush() {
        if (this.pendingOperations.length > 0) {
            Logger.data('Force flushing batch');
            await this.flushBatch();
        }
    }

    /**
     * Obtiene el número de operaciones pendientes
     */
    getPendingCount() {
        return this.pendingOperations.length;
    }

    /**
     * Limpia el lote (cancela operaciones pendientes)
     */
    clearBatch() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        // Rechazar operaciones pendientes
        this.pendingOperations.forEach(operation => {
            operation.reject(new Error('Batch cleared'));
        });

        this.pendingOperations = [];
        Logger.warning('Batch cleared');
    }

    /**
     * Destructor - limpia recursos
     */
    destroy() {
        this.clearBatch();
        Logger.data('BatchManager destroyed');
    }
}

export default BatchManager;
