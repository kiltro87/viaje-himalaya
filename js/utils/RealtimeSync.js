/**
 * RealtimeSync - Sistema de Sincronización en Tiempo Real
 * 
 * Implementa WebSocket directo y Firebase Realtime para
 * notificaciones instantáneas entre dispositivos.
 * 
 * Funcionalidades:
 * - WebSocket para comunicación directa
 * - Fallback a Firebase Realtime
 * - Detección automática de conexión
 * - Reconexión automática
 * - Compresión de datos
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';

export class RealtimeSync {
    constructor(firebaseManager) {
        this.firebaseManager = firebaseManager;
        this.websocket = null;
        this.isWebSocketConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = null;
        this.messageQueue = [];
        
        // Callbacks
        this.onExpenseAdded = null;
        this.onExpenseUpdated = null;
        this.onExpenseDeleted = null;
        this.onConnectionStatusChanged = null;
        
        if (Logger && Logger.init) Logger.init('RealtimeSync initialized');
        this.initializeConnection();
    }

    /**
     * Inicializa la conexión de tiempo real
     */
    async initializeConnection() {
        // Skip WebSocket en localhost para evitar errores molestos
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        if (!isLocalhost) {
            // Intentar WebSocket primero en producción
            await this.tryWebSocketConnection();
        } else {
            if (Logger && Logger.data) Logger.data('Localhost detected, skipping WebSocket connection');
        }
        
        if (!this.isWebSocketConnected) {
            if (!isLocalhost && Logger && Logger.warning) {
                Logger.warning('WebSocket failed, falling back to Firebase Realtime');
            }
            await this.setupFirebaseRealtime();
        }
    }

    /**
     * Intenta establecer conexión WebSocket
     */
    async tryWebSocketConnection() {
        // Para desarrollo local, usar WebSocket server
        const wsUrl = this.getWebSocketUrl();
        
        if (!wsUrl) {
            if (Logger && Logger.data) Logger.data('No WebSocket server available, skipping');
            return;
        }

        try {
            if (Logger && Logger.data) Logger.data(`Attempting WebSocket connection to: ${wsUrl}`);
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                if (Logger && Logger.success) Logger.success('WebSocket connected successfully');
                this.isWebSocketConnected = true;
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.flushMessageQueue();
                
                if (this.onConnectionStatusChanged) {
                    this.onConnectionStatusChanged('websocket_connected');
                }

                // Enviar identificación del dispositivo
                this.sendMessage({
                    type: 'identify',
                    deviceId: this.firebaseManager.getDeviceId(),
                    timestamp: Date.now()
                });
            };

            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };

            this.websocket.onclose = () => {
                if (Logger && Logger.warning) Logger.warning('WebSocket connection closed');
                this.isWebSocketConnected = false;
                this.stopHeartbeat();
                this.scheduleReconnect();
                
                if (this.onConnectionStatusChanged) {
                    this.onConnectionStatusChanged('websocket_disconnected');
                }
            };

            this.websocket.onerror = (error) => {
                if (Logger && Logger.error) Logger.error('WebSocket error:', error);
                this.isWebSocketConnected = false;
            };

        } catch (error) {
            if (Logger && Logger.error) Logger.error('Failed to create WebSocket connection:', error);
            this.isWebSocketConnected = false;
        }
    }

    /**
     * Obtiene la URL del servidor WebSocket
     */
    getWebSocketUrl() {
        // En producción, usar servicio WebSocket dedicado
        if (window.location.hostname === 'kiltro87.github.io') {
            // Usar servicio WebSocket en la nube (ej: Railway, Heroku)
            return 'wss://viaje-himalaya-ws.railway.app';
        }
        
        // En desarrollo local
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'ws://localhost:8080';
        }
        
        return null;
    }

    /**
     * Configura Firebase Realtime como fallback
     * 
     * NOTA: Deshabilitado - Solo usamos Firestore, no Realtime Database
     */
    async setupFirebaseRealtime() {
        if (Logger && Logger.info) Logger.info('Firebase Realtime Database disabled - Using Firestore only');
        
        // Simular conexión exitosa para mantener compatibilidad
        if (this.onConnectionStatusChanged) {
            this.onConnectionStatusChanged('firestore_only');
        }
        
        // No configurar Realtime Database para evitar warnings
        // Solo usamos Firestore para almacenamiento y sincronización
    }

    /**
     * Maneja mensajes de WebSocket
     */
    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            if (Logger && Logger.data) Logger.data('WebSocket message received:', message.type);

            switch (message.type) {
                case 'expense_added':
                    if (this.onExpenseAdded) {
                        this.onExpenseAdded(message.data);
                    }
                    break;
                
                case 'expense_updated':
                    if (this.onExpenseUpdated) {
                        this.onExpenseUpdated(message.data);
                    }
                    break;
                
                case 'expense_deleted':
                    if (this.onExpenseDeleted) {
                        this.onExpenseDeleted(message.data);
                    }
                    break;
                
                case 'pong':
                    // Heartbeat response
                    break;
                
                default:
                    if (Logger && Logger.warning) Logger.warning('Unknown WebSocket message type:', message.type);
            }

        } catch (error) {
            if (Logger && Logger.error) Logger.error('Error parsing WebSocket message:', error);
        }
    }

    /**
     * Maneja cambios de Firebase Realtime
     */
    handleRealtimeChange(change) {
        // Ignorar cambios de nuestro propio dispositivo
        if (change.deviceId === this.firebaseManager.getDeviceId()) {
            return;
        }

        if (Logger && Logger.data) Logger.data('Firebase Realtime change received:', change.type);

        switch (change.type) {
            case 'expense_added':
                if (this.onExpenseAdded) {
                    this.onExpenseAdded(change.data);
                }
                break;
            
            case 'expense_updated':
                if (this.onExpenseUpdated) {
                    this.onExpenseUpdated(change.data);
                }
                break;
            
            case 'expense_deleted':
                if (this.onExpenseDeleted) {
                    this.onExpenseDeleted(change.data);
                }
                break;
        }
    }

    /**
     * Envía un mensaje por WebSocket
     */
    sendMessage(message) {
        if (this.isWebSocketConnected && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
            if (Logger && Logger.data) Logger.data('WebSocket message sent:', message.type);
        } else {
            // Añadir a cola para enviar cuando se reconecte
            this.messageQueue.push(message);
            if (Logger && Logger.data) Logger.data('Message queued (WebSocket not available):', message.type);
        }
    }

    /**
     * Notifica cambio de gasto a otros dispositivos
     */
    notifyExpenseChange(type, expenseData) {
        const message = {
            type: `expense_${type}`,
            data: expenseData,
            deviceId: this.firebaseManager.getDeviceId(),
            timestamp: Date.now()
        };

        // Enviar por WebSocket si está disponible
        this.sendMessage(message);

        // También enviar por Firebase Realtime como backup
        this.sendFirebaseRealtimeNotification(message);
    }

    /**
     * ❌ DESHABILITADO: Firebase Realtime Database
     * 
     * Solo usamos Firestore para evitar warnings y simplificar la arquitectura.
     * Las notificaciones en tiempo real se manejan a través de Firestore listeners.
     */
    async sendFirebaseRealtimeNotification(message) {
        if (Logger && Logger.info) Logger.info('Firebase Realtime Database disabled - Using Firestore listeners only');
        
        // Las notificaciones en tiempo real se manejan automáticamente
        // a través de los listeners de Firestore en FirebaseManager
        
        // Fallback a WebSocket si está disponible
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
                if (Logger && Logger.data) Logger.data('WebSocket notification sent as fallback');
            } catch (error) {
                if (Logger && Logger.warning) Logger.warning('WebSocket fallback failed:', error);
            }
        }
    }

    /**
     * Inicia el heartbeat para mantener la conexión WebSocket
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isWebSocketConnected) {
                this.sendMessage({ type: 'ping', timestamp: Date.now() });
            }
        }, 30000); // Cada 30 segundos
    }

    /**
     * Detiene el heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Programa reconexión automática
     */
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
            
            setTimeout(() => {
                this.reconnectAttempts++;
                if (Logger && Logger.data) Logger.data(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                this.tryWebSocketConnection();
            }, delay);
        } else {
            if (Logger && Logger.warning) Logger.warning('Max reconnect attempts reached, falling back to Firebase only');
        }
    }

    /**
     * Envía mensajes en cola cuando se reconecta
     */
    flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.sendMessage(message);
        }
    }

    /**
     * Obtiene el estado de la conexión
     */
    getConnectionStatus() {
        return {
            websocket: this.isWebSocketConnected,
            firebase: this.firebaseManager.isConnected,
            pendingMessages: this.messageQueue.length
        };
    }

    /**
     * Cierra todas las conexiones
     */
    disconnect() {
        this.stopHeartbeat();
        
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        this.isWebSocketConnected = false;
        this.messageQueue = [];
        
        if (Logger && Logger.data) Logger.data('RealtimeSync disconnected');
    }
}

export default RealtimeSync;
