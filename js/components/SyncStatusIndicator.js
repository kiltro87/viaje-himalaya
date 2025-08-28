/**
 * SyncStatusIndicator - Indicador Visual de Sincronización
 * 
 * Componente que muestra el estado de sincronización con Firebase
 * de forma visual y no intrusiva para el usuario.
 * 
 * Estados:
 * - 🔗 Conectado: Verde, se oculta automáticamente
 * - 📱 Sin conexión: Amarillo, persistente
 * - 🔄 Sincronizando: Azul, con animación
 * - ❌ Error: Rojo, con opción de reintentar
 * 
 * @author David Ferrer Figueroa
 * @version 2.1.0
 * @since 2024
 */

import Logger from '../utils/Logger.js';

export class SyncStatusIndicator {
    /**
     * Constructor del SyncStatusIndicator
     * 
     * @constructor
     */
    constructor() {
        this.indicator = null;
        this.currentStatus = null;
        this.hideTimeout = null;
        
        this.createIndicator();
        Logger.ui('SyncStatusIndicator initialized');
    }

    /**
     * Crear el elemento indicador en el DOM
     * 
     * @private
     */
    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.id = 'sync-status-indicator';
        this.indicator.className = `
            fixed top-4 left-4 z-50 
            px-3 py-2 rounded-full 
            text-sm font-medium 
            transition-all var(--transition-fast) 
            shadow-lg border
            transform translate-y-0 opacity-0
            pointer-events-none
        `.replace(/\s+/g, ' ').trim();
        
        // Añadir al DOM
        document.body.appendChild(this.indicator);
    }

    /**
     * Actualizar el estado del indicador
     * 
     * @param {string} status - Estado: 'connected', 'offline', 'syncing', 'error'
     * @param {Object} options - Opciones adicionales
     */
    updateStatus(status, options = {}) {
        if (this.currentStatus === status) return;
        
        this.currentStatus = status;
        this.clearHideTimeout();
        
        // Mostrar indicador
        this.show();
        
        // Actualizar contenido y estilo según estado
        switch (status) {
            case 'connected':
                this.setConnectedState(options);
                break;
            case 'offline':
                this.setOfflineState(options);
                break;
            case 'syncing':
                this.setSyncingState(options);
                break;
            case 'error':
                this.setErrorState(options);
                break;
            default:
                Logger.warning('Unknown sync status:', status);
        }
        
        Logger.ui('Sync status updated:', status);
    }

    /**
     * Configurar estado conectado
     * 
     * @private
     * @param {Object} options - Opciones
     */
    setConnectedState(options) {
        this.indicator.className = this.getBaseClasses() + ' bg-green-500 text-white border-green-600';
        this.indicator.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-xs">☁️</span>
                <span>Sincronizado</span>
            </div>
        `;
        
        // Auto-ocultar después de 3 segundos
        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, 3000);
    }

    /**
     * Configurar estado offline
     * 
     * @private
     * @param {Object} options - Opciones
     */
    setOfflineState(options) {
        this.indicator.className = this.getBaseClasses() + ' bg-yellow-500 text-white border-yellow-600';
        this.indicator.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-xs">📱</span>
                <span>Sin conexión</span>
            </div>
        `;
        
        // No auto-ocultar en modo offline
    }

    /**
     * Configurar estado sincronizando
     * 
     * @private
     * @param {Object} options - Opciones
     */
    setSyncingState(options) {
        this.indicator.className = this.getBaseClasses() + ' bg-blue-500 text-white border-blue-600';
        this.indicator.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-xs animate-spin">🔄</span>
                <span>Sincronizando...</span>
            </div>
        `;
        
        // Mostrar progreso si está disponible
        if (options.progress) {
            this.indicator.innerHTML += `
                <div class="ml-2 text-xs opacity-75">${options.progress}</div>
            `;
        }
    }

    /**
     * Configurar estado de error
     * 
     * @private
     * @param {Object} options - Opciones
     */
    setErrorState(options) {
        this.indicator.className = this.getBaseClasses() + ' bg-red-500 text-white border-red-600 cursor-pointer pointer-events-auto';
        this.indicator.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-xs">❌</span>
                <span>Error de conexión</span>
                <button class="ml-2 text-xs underline hover:no-underline" onclick="window.retryFirebaseConnection?.()">
                    Reintentar
                </button>
            </div>
        `;
        
        // Configurar callback de reintento
        window.retryFirebaseConnection = () => {
            if (options.onRetry) {
                options.onRetry();
            }
            this.updateStatus('syncing');
        };
    }

    /**
     * Obtener clases base del indicador
     * 
     * @private
     * @returns {string} Clases CSS base
     */
    getBaseClasses() {
        return `
            fixed top-4 left-4 z-50 
            px-3 py-2 rounded-full 
            text-sm font-medium 
            transition-all var(--transition-fast) 
            shadow-lg border
            transform translate-y-0 opacity-100
        `.replace(/\s+/g, ' ').trim();
    }

    /**
     * Mostrar el indicador
     * 
     * @private
     */
    show() {
        if (this.indicator) {
            this.indicator.style.opacity = '1';
            this.indicator.style.transform = 'translateY(0)';
        }
    }

    /**
     * Ocultar el indicador
     * 
     * @private
     */
    hide() {
        if (this.indicator) {
            this.indicator.style.opacity = '0';
            this.indicator.style.transform = 'translateY(-10px)';
        }
    }

    /**
     * Limpiar timeout de ocultación
     * 
     * @private
     */
    clearHideTimeout() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }

    /**
     * Mostrar estadísticas de sincronización
     * 
     * @param {Object} stats - Estadísticas de Firebase
     */
    showStats(stats) {
        if (!stats) return;
        
        const statsText = `
            📊 Estadísticas:
            • Gastos locales: ${stats.localExpenses || 0}
            • Operaciones pendientes: ${stats.pendingSyncOperations || 0}
            • Estado: ${stats.isConnected ? 'Conectado' : 'Desconectado'}
        `;
        
        // Mostrar en consola para debugging
        Logger.data('Firebase stats:', stats);
        
        // Opcional: Mostrar tooltip con estadísticas
        if (this.indicator) {
            this.indicator.title = statsText;
        }
    }

    /**
     * Destruir el indicador
     */
    destroy() {
        this.clearHideTimeout();
        
        if (this.indicator && this.indicator.parentNode) {
            this.indicator.parentNode.removeChild(this.indicator);
        }
        
        // Limpiar callback global
        if (window.retryFirebaseConnection) {
            delete window.retryFirebaseConnection;
        }
        
        Logger.ui('SyncStatusIndicator destroyed');
    }
}
