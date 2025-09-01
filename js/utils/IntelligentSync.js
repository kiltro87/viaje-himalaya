/**
 * 🔄 INTELLIGENT SYNC - SINCRONIZACIÓN INTELIGENTE OFFLINE
 * 
 * Sistema avanzado de sincronización que maneja conexiones intermitentes,
 * prioriza datos críticos y optimiza el uso de batería y datos móviles.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { stateManager } from './StateManager.js';

export class IntelligentSync {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.priorityQueue = [];
        this.lastSyncAttempt = null;
        this.syncInterval = null;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        // Configuración de sincronización inteligente
        this.config = {
            // Intervalos de sincronización (ms)
            intervals: {
                online: 30000,      // 30 segundos cuando online
                offline: 300000,    // 5 minutos cuando offline (para retry)
                lowBattery: 120000, // 2 minutos con batería baja
                roaming: 600000     // 10 minutos en roaming
            },
            
            // Prioridades de datos
            priorities: {
                CRITICAL: 1,    // Gastos, ubicación actual
                HIGH: 2,        // Itinerario, alertas
                MEDIUM: 3,      // Configuración, preferencias
                LOW: 4          // Analytics, logs
            },
            
            // Límites de datos
            dataLimits: {
                roaming: 50 * 1024,      // 50KB en roaming
                lowBattery: 100 * 1024,  // 100KB con batería baja
                normal: 1024 * 1024      // 1MB normal
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupNetworkListeners();
        this.setupBatteryMonitoring();
        this.setupConnectionTypeDetection();
        this.startIntelligentSync();
        
        Logger.success('IntelligentSync initialized');
    }
    
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            Logger.info('Network: Online - Starting sync');
            this.onNetworkChange('online');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            Logger.warn('Network: Offline - Queuing operations');
            this.onNetworkChange('offline');
        });
    }
    
    async setupBatteryMonitoring() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                
                battery.addEventListener('levelchange', () => {
                    this.onBatteryChange(battery.level, battery.charging);
                });
                
                battery.addEventListener('chargingchange', () => {
                    this.onBatteryChange(battery.level, battery.charging);
                });
                
                // Initial battery check
                this.onBatteryChange(battery.level, battery.charging);
                
            } catch (error) {
                Logger.warn('Battery API not available', error);
            }
        }
    }
    
    setupConnectionTypeDetection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            connection.addEventListener('change', () => {
                this.onConnectionChange(connection);
            });
            
            // Initial connection check
            this.onConnectionChange(connection);
        }
    }
    
    onNetworkChange(status) {
        if (status === 'online') {
            // Procesar cola de sincronización inmediatamente
            this.processSyncQueue();
            this.adjustSyncInterval('online');
        } else {
            // Cambiar a modo offline
            this.adjustSyncInterval('offline');
        }
        
        // Notificar cambio de estado
        this.notifyNetworkStatus(status);
    }
    
    onBatteryChange(level, charging) {
        const isLowBattery = level < 0.2 && !charging;
        
        if (isLowBattery) {
            Logger.warn(`Low battery detected: ${Math.round(level * 100)}%`);
            this.adjustSyncInterval('lowBattery');
            // Pausar sincronizaciones no críticas
            this.pauseNonCriticalSync();
        } else if (charging && level > 0.5) {
            // Reanudar sincronización normal
            this.resumeNormalSync();
        }
        
        stateManager.updateState('device.battery', { level, charging, isLow: isLowBattery });
    }
    
    onConnectionChange(connection) {
        const isRoaming = connection.type === 'cellular' && this.detectRoaming();
        const isSlowConnection = ['slow-2g', '2g'].includes(connection.effectiveType);
        
        if (isRoaming) {
            Logger.warn('Roaming detected - Limiting sync');
            this.adjustSyncInterval('roaming');
            this.limitDataUsage('roaming');
        } else if (isSlowConnection) {
            Logger.info('Slow connection - Optimizing sync');
            this.optimizeForSlowConnection();
        }
        
        stateManager.updateState('device.connection', {
            type: connection.type,
            effectiveType: connection.effectiveType,
            isRoaming,
            isSlowConnection
        });
    }
    
    detectRoaming() {
        // Heurística simple para detectar roaming
        // En una implementación real, usarías APIs específicas del dispositivo
        const connection = navigator.connection;
        return connection.type === 'cellular' && connection.downlink < 1;
    }
    
    adjustSyncInterval(mode) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        const interval = this.config.intervals[mode] || this.config.intervals.online;
        
        this.syncInterval = setInterval(() => {
            this.performIntelligentSync();
        }, interval);
        
        Logger.info(`Sync interval adjusted to ${interval}ms for mode: ${mode}`);
    }
    
    startIntelligentSync() {
        this.adjustSyncInterval(this.isOnline ? 'online' : 'offline');
    }
    
    /**
     * Añadir operación a la cola de sincronización
     */
    queueOperation(operation, priority = this.config.priorities.MEDIUM) {
        const queueItem = {
            id: this.generateOperationId(),
            operation,
            priority,
            timestamp: Date.now(),
            retries: 0,
            dataSize: this.estimateDataSize(operation)
        };
        
        if (priority === this.config.priorities.CRITICAL) {
            this.priorityQueue.push(queueItem);
            // Intentar sincronizar inmediatamente si es crítico
            if (this.isOnline) {
                this.processPriorityQueue();
            }
        } else {
            this.syncQueue.push(queueItem);
        }
        
        Logger.debug(`Operation queued: ${operation.type} (Priority: ${priority})`);
        this.persistQueue();
    }
    
    async performIntelligentSync() {
        if (!this.isOnline) {
            Logger.debug('Offline - Skipping sync attempt');
            return;
        }
        
        try {
            // Procesar cola de prioridad primero
            await this.processPriorityQueue();
            
            // Luego procesar cola normal según capacidad
            await this.processSyncQueue();
            
            this.lastSyncAttempt = Date.now();
            
        } catch (error) {
            Logger.error('Intelligent sync failed', error);
        }
    }
    
    async processPriorityQueue() {
        while (this.priorityQueue.length > 0 && this.isOnline) {
            const item = this.priorityQueue.shift();
            await this.executeOperation(item);
        }
    }
    
    async processSyncQueue() {
        const deviceState = stateManager.getState('device') || {};
        const dataLimit = this.getCurrentDataLimit(deviceState);
        let processedData = 0;
        
        // Ordenar por prioridad y timestamp
        this.syncQueue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.timestamp - b.timestamp;
        });
        
        const itemsToProcess = [];
        
        // Seleccionar operaciones que caben en el límite de datos
        for (const item of this.syncQueue) {
            if (processedData + item.dataSize <= dataLimit) {
                itemsToProcess.push(item);
                processedData += item.dataSize;
            }
        }
        
        // Ejecutar operaciones seleccionadas
        for (const item of itemsToProcess) {
            if (!this.isOnline) break;
            
            const success = await this.executeOperation(item);
            if (success) {
                this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
            }
        }
        
        this.persistQueue();
    }
    
    async executeOperation(item) {
        try {
            Logger.debug(`Executing operation: ${item.operation.type}`);
            
            const result = await this.performOperation(item.operation);
            
            if (result.success) {
                this.retryAttempts.delete(item.id);
                Logger.success(`Operation completed: ${item.operation.type}`);
                return true;
            } else {
                throw new Error(result.error || 'Operation failed');
            }
            
        } catch (error) {
            Logger.warn(`Operation failed: ${item.operation.type}`, error);
            
            item.retries++;
            if (item.retries < this.maxRetries) {
                // Reencolar con backoff exponencial
                setTimeout(() => {
                    if (item.priority === this.config.priorities.CRITICAL) {
                        this.priorityQueue.push(item);
                    } else {
                        this.syncQueue.push(item);
                    }
                }, Math.pow(2, item.retries) * 1000);
            } else {
                Logger.error(`Operation failed permanently: ${item.operation.type}`);
                this.handlePermanentFailure(item);
            }
            
            return false;
        }
    }
    
    async performOperation(operation) {
        // Aquí implementarías las operaciones específicas
        switch (operation.type) {
            case 'sync_expenses':
                return await this.syncExpenses(operation.data);
            case 'sync_location':
                return await this.syncLocation(operation.data);
            case 'sync_itinerary':
                return await this.syncItinerary(operation.data);
            case 'backup_data':
                return await this.backupData(operation.data);
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }
    
    async syncExpenses(data) {
        // Implementar sincronización de gastos
        return { success: true };
    }
    
    async syncLocation(data) {
        // Implementar sincronización de ubicación
        return { success: true };
    }
    
    async syncItinerary(data) {
        // Implementar sincronización de itinerario
        return { success: true };
    }
    
    async backupData(data) {
        // Implementar backup de datos
        return { success: true };
    }
    
    getCurrentDataLimit(deviceState) {
        if (deviceState.connection?.isRoaming) {
            return this.config.dataLimits.roaming;
        } else if (deviceState.battery?.isLow) {
            return this.config.dataLimits.lowBattery;
        } else {
            return this.config.dataLimits.normal;
        }
    }
    
    estimateDataSize(operation) {
        // Estimación heurística del tamaño de datos
        const baseSizes = {
            sync_expenses: 2048,    // 2KB por gasto
            sync_location: 512,     // 512B por ubicación
            sync_itinerary: 1024,   // 1KB por actualización
            backup_data: 10240      // 10KB por backup
        };
        
        return baseSizes[operation.type] || 1024;
    }
    
    pauseNonCriticalSync() {
        // Filtrar solo operaciones críticas
        this.syncQueue = this.syncQueue.filter(item => 
            item.priority === this.config.priorities.CRITICAL
        );
        Logger.info('Non-critical sync paused due to low battery');
    }
    
    resumeNormalSync() {
        Logger.info('Normal sync resumed');
        // La cola se reanudará automáticamente en el próximo ciclo
    }
    
    limitDataUsage(mode) {
        Logger.info(`Data usage limited for mode: ${mode}`);
        // La limitación se aplica en processSyncQueue()
    }
    
    optimizeForSlowConnection() {
        // Reducir frecuencia y tamaño de sincronización
        this.adjustSyncInterval('lowBattery'); // Usar intervalo más largo
        Logger.info('Sync optimized for slow connection');
    }
    
    notifyNetworkStatus(status) {
        const message = status === 'online' ? 
            '🟢 Conectado - Sincronizando datos' : 
            '🔴 Sin conexión - Modo offline activo';
            
        // Mostrar notificación temporal
        this.showNetworkNotification(message, status);
    }
    
    showNetworkNotification(message, status) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${
            status === 'online' ? 'bg-green-600' : 'bg-orange-600'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    persistQueue() {
        // Guardar cola en localStorage para persistencia
        try {
            localStorage.setItem('intelligentSync_queue', JSON.stringify({
                syncQueue: this.syncQueue,
                priorityQueue: this.priorityQueue,
                timestamp: Date.now()
            }));
        } catch (error) {
            Logger.warn('Failed to persist sync queue', error);
        }
    }
    
    loadPersistedQueue() {
        try {
            const stored = localStorage.getItem('intelligentSync_queue');
            if (stored) {
                const data = JSON.parse(stored);
                this.syncQueue = data.syncQueue || [];
                this.priorityQueue = data.priorityQueue || [];
                Logger.info(`Loaded ${this.syncQueue.length + this.priorityQueue.length} queued operations`);
            }
        } catch (error) {
            Logger.warn('Failed to load persisted queue', error);
        }
    }
    
    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    handlePermanentFailure(item) {
        // Guardar operación fallida para revisión manual
        const failedOps = JSON.parse(localStorage.getItem('failed_operations') || '[]');
        failedOps.push({
            ...item,
            failedAt: Date.now()
        });
        localStorage.setItem('failed_operations', JSON.stringify(failedOps));
    }
    
    // API pública
    
    /**
     * Forzar sincronización inmediata
     */
    async forcSync() {
        Logger.info('Force sync requested');
        await this.performIntelligentSync();
    }
    
    /**
     * Obtener estado de sincronización
     */
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            queuedOperations: this.syncQueue.length + this.priorityQueue.length,
            lastSync: this.lastSyncAttempt,
            deviceState: stateManager.getState('device')
        };
    }
    
    /**
     * Limpiar cola de sincronización
     */
    clearQueue() {
        this.syncQueue = [];
        this.priorityQueue = [];
        this.persistQueue();
        Logger.info('Sync queue cleared');
    }
}

// Exportar instancia singleton
export const intelligentSync = new IntelligentSync();
export default intelligentSync;
