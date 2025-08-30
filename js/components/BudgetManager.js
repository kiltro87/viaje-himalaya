/**
 * BudgetManager - Gestor de Presupuesto y Gastos
 * 
 * Clase especializada en la gestión completa del presupuesto del viaje.
 * Maneja operaciones CRUD de gastos, análisis por categorías, 
 * comparativas presupuesto vs gastos reales, y persistencia de datos.
 * 
 * Funcionalidades principales:
 * - Gestión de gastos con operaciones CRUD completas
 * - Análisis por categorías con filtros múltiples
 * - Comparativas visuales presupuesto vs gastos reales
 * - Persistencia en localStorage con sincronización automática
 * - Interfaz responsive con formularios dinámicos
 * - Integración con sistema de trazabilidad
 * 
 * Datos gestionados:
 * - Gastos del usuario (concepto, cantidad, categoría, fecha)
 * - Presupuesto por categorías desde tripConfig
 * - Estado de la aplicación con persistencia
 * - Utilidades de formateo y cálculo
 * 
 * @author David Ferrer Figueroa
 * @version 3.0.0
 * @since 2025
 */

import Logger from '../utils/Logger.js';
import stateManager from '../utils/StateManager.js';
import { FirebaseManager } from '../utils/FirebaseManager.js';
import OptimisticUI from '../utils/OptimisticUI.js';
import BatchManager from '../utils/BatchManager.js';
import { HeaderRenderer } from './renderers/HeaderRenderer.js';
import RealtimeSync from '../utils/RealtimeSync.js';
import { ExpenseOrchestrator } from '../utils/ExpenseOrchestrator.js';
import { container } from '../core/DependencyContainer.js';
import { tripConfig } from '../config/tripConfig.js';
import { getBudgetCategoryColors, getBudgetCategoryIcon } from '../utils/CategoryUtils.js';
import { COLORS, RADIUS, SHADOW } from '../config/DesignTokens.js';

export class BudgetManager {
    /**
     * Constructor del BudgetManager
     * 
     * Inicializa el sistema de gestión de presupuesto configurando
     * todas las dependencias globales necesarias para el funcionamiento
     * de la aplicación de gastos.
     * 
     * @constructor
     */
    constructor() {
        // 🚨 PREVENIR MÚLTIPLES INSTANCIAS (Singleton pattern)
        const existingInstance = stateManager.getState('instances.budgetManager');
        if (existingInstance) {
            Logger.warning('BudgetManager ya existe, retornando instancia existente');
            return existingInstance;
        }
        
        // ✅ LoggingStandardizer ELIMINADO - Usamos Logger directamente
        
        Logger.init('BudgetManager constructor started');
        Logger.budget('Initializing budget management system');
        
        // Inicializar objetos globales necesarios
        this.initializeStateManager();
        
        // Inicializar Firebase para almacenamiento en la nube
        this.firebaseManager = new FirebaseManager();
        this.setupFirebaseIntegration();
        
        // Exponer FirebaseManager globalmente para otros componentes
        stateManager.setFirebaseManager(this.firebaseManager);
        
        // 🚀 SISTEMAS AVANZADOS DE OPTIMIZACIÓN
        this.optimisticUI = OptimisticUI;
        this.batchManager = new BatchManager(this.firebaseManager);
        this.realtimeSync = new RealtimeSync(this.firebaseManager);
        
        // 🎯 EXPENSE MANAGER ULTRA-OPTIMIZADO
        this.expenseOrchestrator = new ExpenseOrchestrator(this);
        
        // Configurar callbacks del sistema de tiempo real
        this.setupAdvancedSyncCallbacks();
        
        // 🚨 ASIGNAR COMO INSTANCIA SINGLETON
        stateManager.updateState('instances.budgetManager', this);
        
        // Registrar en DependencyContainer para uso futuro
        container.registerSingleton('budgetManagerInstance', () => this);
        
        Logger.success('✅ BudgetManager inicializado correctamente');
    }

    /**
     * Configurar integración con Firebase
     * 
     * Establece los callbacks y listeners necesarios para sincronizar
     * los gastos con Firebase Firestore en tiempo real.
     * 
     * @private
     */
    setupFirebaseIntegration() {
        if (!this.firebaseManager) return;
        
        // Configurar callbacks para eventos de Firebase
        this.firebaseManager.onExpenseAdded = (expense) => {
            this.updateSummaryCards();
        };
        
        this.firebaseManager.onExpenseUpdated = (expenseId, updates) => {
            this.updateSummaryCards();
        };
        
        this.firebaseManager.onExpenseDeleted = (expenseId) => {
            Logger.debug(`🔔 FirebaseManager onExpenseDeleted callback triggered for: ${expenseId}`);
            
            // 🔄 ACTUALIZAR ESTADO LOCAL: Remover el gasto eliminado
            const currentExpenses = stateManager.getState('expenses');
            const filteredExpenses = currentExpenses.filter(exp => exp.id !== expenseId);
            stateManager.updateState('expenses', filteredExpenses);
            
            Logger.debug(`📊 State updated after delete: ${currentExpenses.length} → ${filteredExpenses.length} expenses`);
            
            // 🚀 ACTUALIZAR UI
            this.updateSummaryCards();
            this.showCategoryContent(); // Refresh category content if visible
            
            Logger.debug(`✅ onExpenseDeleted callback completed successfully`);
        };
        
        this.firebaseManager.onSyncStatusChanged = (status) => {
            Logger.budget('Sync status changed:', status);
            this.updateSyncStatus(status);
            
            // 🔥 CONFIGURAR LISTENER CUANDO SE CONECTE
            if (status === 'connected' && !this.realtimeUnsubscribe) {
                if (!Logger.isMobile) {
                    Logger.data('🔥 Firebase conectado, configurando listener en tiempo real...');
                }
                this.setupRealtimeSync();
            }
        };
        
        // Configurar listener en tiempo real
        this.setupRealtimeSync();
        
        Logger.success('Firebase integration configured');
    }

    /**
     * Configurar callbacks del sistema de sincronización avanzado
     * @private
     */
    setupAdvancedSyncCallbacks() {
        // Configurar RealtimeSync callbacks
        this.realtimeSync.onExpenseAdded = (expense) => {
            Logger.data('Real-time expense added from another device:', expense.id);
            this.handleRemoteExpenseChange('added', expense);
        };

        this.realtimeSync.onExpenseUpdated = (expense) => {
            Logger.data('Real-time expense updated from another device:', expense.id);
            this.handleRemoteExpenseChange('updated', expense);
        };

        this.realtimeSync.onExpenseDeleted = (expense) => {
            Logger.data('Real-time expense deleted from another device:', expense.id);
            this.handleRemoteExpenseChange('deleted', expense);
        };

        this.realtimeSync.onConnectionStatusChanged = (status) => {
            Logger.data('Real-time connection status changed:', status);
            this.updateConnectionIndicator(status);
        };


    }

    /**
     * Actualiza la UI del presupuesto de forma optimizada
     * @private
     */
    updateBudgetUI() {
        // Usar requestAnimationFrame para mejor rendimiento
        requestAnimationFrame(() => {
            try {
                // Actualizar tarjetas de resumen
                this.updateSummaryCards();
                
                // Si hay una categoría activa, actualizar su contenido
                const activeCategory = document.querySelector('.category-btn.active')?.dataset.category;
                if (activeCategory) {
                    this.showCategoryContent(activeCategory);
                }
                
                Logger.success('UI updated successfully');
            } catch (error) {
                Logger.error('Error updating budget UI:', error);
            }
        });
    }

    /**
     * Maneja cambios de gastos desde otros dispositivos
     * @private
     */
    handleRemoteExpenseChange(action, expense) {
        // Obtener expenses una sola vez para evitar conflictos de declaración
        let currentExpenses = stateManager.getState('expenses') || [];
        
        switch (action) {
            case 'added':
                // Verificar que no existe ya localmente
                const existingIndex = currentExpenses.findIndex(e => e.id === expense.id);
                if (existingIndex === -1) {
                    currentExpenses.unshift(expense);
                    stateManager.updateState('expenses', currentExpenses);
                    this.updateBudgetUI();
                    this.showNotification(`💰 Nuevo gasto añadido: ${expense.concept}`, 'success');
                }
                break;

            case 'updated':
                const updateIndex = currentExpenses.findIndex(e => e.id === expense.id);
                if (updateIndex !== -1) {
                    currentExpenses[updateIndex] = expense;
                    stateManager.updateState('expenses', currentExpenses);
                    this.updateBudgetUI();
                    this.showNotification(`✏️ Gasto actualizado: ${expense.concept}`, 'info');
                }
                break;

            case 'deleted':
                const deleteIndex = currentExpenses.findIndex(e => e.id === expense.id);
                if (deleteIndex !== -1) {
                    const deletedExpense = currentExpenses.splice(deleteIndex, 1)[0];
                    stateManager.updateState('expenses', currentExpenses);
                    this.updateBudgetUI();
                    this.showNotification(`🗑️ Gasto eliminado: ${deletedExpense.concept}`, 'warning');
                }
                break;
        }
    }

    /**
     * Actualiza el indicador de conexión
     * @private
     */
    updateConnectionIndicator(status) {
        const indicator = document.getElementById('connection-indicator');
        if (!indicator) return;

        switch (status) {
            case 'websocket_connected':
                indicator.className = 'connection-indicator websocket';
                indicator.textContent = '⚡ Tiempo Real';
                break;
            case 'firebase_realtime_connected':
                indicator.className = 'connection-indicator firebase';
                indicator.textContent = '🔥 Firebase RT';
                break;
            case 'websocket_disconnected':
                indicator.className = 'connection-indicator offline';
                indicator.textContent = '📱 Offline';
                break;
        }
    }

    /**
     * Muestra notificación temporal
     * @private
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        // Colores según tipo
        switch (type) {
            case 'success': notification.style.backgroundColor = '#10b981'; break;
            case 'warning': notification.style.backgroundColor = '#f59e0b'; break;
            case 'error': notification.style.backgroundColor = '#ef4444'; break;
            default: notification.style.backgroundColor = '#3b82f6';
        }

        document.body.appendChild(notification);

        // Animación de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto-eliminar después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Configurar sincronización en tiempo real
     * 
     * Establece un listener que actualiza automáticamente la UI
     * cuando otros dispositivos modifican los gastos.
     * 
     * @private
     */
    async setupRealtimeSync() {
        if (!Logger.isMobile) {
            Logger.data('🔄 Configurando sincronización en tiempo real', {
                isConnected: this.firebaseManager.isConnected,
                hasExistingListener: !!this.realtimeUnsubscribe 
            });
        }
        
        // 🚨 PREVENIR MÚLTIPLES LISTENERS
        if (this.realtimeUnsubscribe) {
            if (!Logger.isMobile) {
                Logger.debug('Firebase listener exists, unsubscribing previous one');
            }
            this.realtimeUnsubscribe();
            this.realtimeUnsubscribe = null;
        }
        
        if (!this.firebaseManager.isConnected) {
            if (!Logger.isMobile) {
                Logger.warning('Firebase not connected, skipping realtime sync');
            }
            return;
        }
        
        if (!Logger.isMobile) {
            Logger.debug('Setting up NEW Firebase realtime listener');
        }
        
        // 🚨 DEBOUNCE para evitar actualizaciones demasiado frecuentes
        let updateTimeout = null;
        
        this.realtimeUnsubscribe = await this.firebaseManager.setupRealtimeListener((expenses) => {
            if (!Logger.isMobile) {
                Logger.debug('🔥 DEBUG: Realtime callback triggered with', expenses.length, 'expenses');
            }
            Logger.budget(`Realtime update: ${expenses.length} expenses received`);
            
            // Cancelar actualización anterior si existe
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
            
            // Debounce más agresivo para mejor rendimiento
            updateTimeout = setTimeout(() => {
                // Solo actualizar si realmente hay cambios
                const currentExpenseIds = stateManager.getState('expenses').map(e => e.id).sort();
                const newExpenseIds = expenses.map(e => e.id).sort();
                
                if (JSON.stringify(currentExpenseIds) !== JSON.stringify(newExpenseIds)) {
                    this.processFirebaseUpdate(expenses);
                } else {
                    if (!Logger.isMobile) {
                        Logger.debug('🔥 DEBUG: No changes detected, skipping UI update');
                    }
                }
            }, 300); // Aumentado a 300ms para mejor rendimiento
        });
        
        if (!Logger.isMobile) {
            Logger.debug('🔥 DEBUG: Realtime sync setup completed');
        }
    }
    
    /**
     * Procesa una actualización de Firebase de forma segura
     * @private
     */
    processFirebaseUpdate(expenses) {
        try {
            // 🔥 REEMPLAZAR COMPLETAMENTE AppState.expenses (no añadir)
            if (stateManager.getState('expenses')) {
                // Convertir timestamps de Firebase a formato local
                const processedExpenses = expenses.map(expense => {
                    const processed = { ...expense };
                    
                    // Convertir Firestore Timestamp a string si es necesario
                    if (processed.createdAt && processed.createdAt.toDate) {
                        processed.createdAt = processed.createdAt.toDate().toISOString();
                    }
                    if (processed.updatedAt && processed.updatedAt.toDate) {
                        processed.updatedAt = processed.updatedAt.toDate().toISOString();
                    }
                    
                    return processed;
                });
                
                stateManager.updateState('expenses', processedExpenses);
                if (!Logger.isMobile) {
                    Logger.debug('🔥 DEBUG: AppState.expenses REPLACED with', processedExpenses.length, 'expenses');
                }
                
                // 🚨 NO GUARDAR EN LOCALSTORAGE - Firebase es la fuente de verdad
                // Save expenses to localStorage
                this.saveExpensesToLocalStorage();
            }
            
            // Actualizar UI si está visible
            if (document.getElementById('budget-container')) {
                if (!Logger.isMobile) {
                    Logger.debug('🔥 DEBUG: Updating budget UI...');
                }
                this.updateSummaryCards();
                
                // Actualizar contenido de categorías si está abierto
                const categoryContent = document.getElementById('category-content');
                if (categoryContent && !categoryContent.classList.contains('hidden')) {
                    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category;
                    if (activeCategory) {
                        if (!Logger.isMobile) {
                            Logger.debug('🔥 DEBUG: Updating category content for:', activeCategory);
                        }
                        this.showCategoryContent(activeCategory);
                    }
                }
            }
        } catch (error) {
            Logger.error('Error processing Firebase update:', error);
            this.updateSyncStatus('error');
            Logger.error('🔥 ERROR in processFirebaseUpdate:', error);
        }
    }

    /**
     * Actualizar indicador de estado de sincronización
     * 
     * @private
     * @param {string} status - Estado: 'connected', 'offline', 'syncing'
     */
    updateSyncStatus(status) {
        // Crear o actualizar indicador de estado
        let statusIndicator = document.getElementById('sync-status-indicator');
        
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'sync-status-indicator';
            statusIndicator.className = 'fixed top-4 left-4 z-50 px-3 py-1 rounded-full text-sm font-medium transition-normal';
            document.body.appendChild(statusIndicator);
        }
        
        // Actualizar apariencia según estado
        switch (status) {
            case 'connected':
                statusIndicator.className = statusIndicator.className.replace(/bg-\w+-\d+/g, '') + ' bg-green-500 text-white';
                statusIndicator.innerHTML = '☁️ Sincronizado';
                break;
            case 'offline':
                statusIndicator.className = statusIndicator.className.replace(/bg-\w+-\d+/g, '') + ' bg-yellow-500 text-white';
                statusIndicator.innerHTML = '📱 Sin conexión';
                break;
            case 'syncing':
                statusIndicator.className = statusIndicator.className.replace(/bg-\w+-\d+/g, '') + ' bg-blue-500 text-white';
                statusIndicator.innerHTML = '🔄 Sincronizando...';
                break;
        }
        
        // Auto-ocultar después de 3 segundos si está conectado
        if (status === 'connected') {
            setTimeout(() => {
                if (statusIndicator) {
                    statusIndicator.style.opacity = '0';
                    setTimeout(() => {
                        if (statusIndicator && statusIndicator.parentNode) {
                            statusIndicator.parentNode.removeChild(statusIndicator);
                        }
                    }, 300);
                }
            }, 3000);
        }
    }

    /**
     * Inicializar objetos globales
     * 
     * Configura los objetos globales necesarios para el funcionamiento
     * del sistema de presupuesto: AppState, ExpenseManager y Utils.
     * Estos objetos se crean en el scope global para facilitar el acceso
     * desde diferentes partes de la aplicación.
     * 
     * Objetos inicializados:
     * - window.AppState: Estado de la aplicación con persistencia
     * - window.ExpenseManager: Gestor CRUD de gastos
     * - Class methods: Utilidades de formateo y cálculo
     * - DependencyContainer: Referencia a esta instancia
     */
    initializeGlobals() {
        // Inicializar expenses en StateManager si no existen
        if (!stateManager.getState('expenses') || stateManager.getState('expenses').length === 0) {
            const savedExpenses = JSON.parse(localStorage.getItem('tripExpensesV1')) || [];
            stateManager.updateState('expenses', savedExpenses);
            Logger.data('💾 Expenses loaded from localStorage into StateManager');
        }

        // ✅ WINDOW.EXPENSEMANAGER ELIMINADO COMPLETAMENTE
        // Todas las operaciones van directo a this.expenseOrchestrator
        Logger.data('💳 ExpenseManager operations delegated to ExpenseOrchestrator (NO MORE WINDOW.*)');

        // ✅ WINDOW.UTILS ELIMINADO COMPLETAMENTE
        // Todas las utilidades son métodos de clase
        Logger.data('🛠️ Utils methods available as class methods (NO MORE WINDOW.*)');
        // Registrar esta instancia globalmente
        stateManager.updateState('instances.budgetManager', this);
    }

    /**
     * Inicializar datos del StateManager
     * 
     * Reemplaza initializeGlobals() - Solo maneja inicialización de datos
     * en el StateManager centralizado sin contaminar window.*
     */
    initializeStateManager() {
        // Inicializar expenses en StateManager si no existen
        if (!stateManager.getState('expenses') || stateManager.getState('expenses').length === 0) {
            const savedExpenses = JSON.parse(localStorage.getItem('tripExpensesV1')) || [];
            stateManager.updateState('expenses', savedExpenses);
            Logger.data('💾 Expenses loaded from localStorage into StateManager');
        }

        // Registrar esta instancia en StateManager
        stateManager.updateState('instances.budgetManager', this);
        Logger.ui('BudgetManager registered in StateManager');
    }

    // MÉTODO ELIMINADO - Ahora se usa getBudgetCategoryIcon de CategoryUtils

    getCategoryColor(category) {
        // Usar Design Tokens para colores consistentes
        const categoryColors = getBudgetCategoryColors(category);
        return categoryColors.bg;
    }

    /**
     * 🎨 OBTENER COLORES COMPLETOS DE CATEGORÍA
     * 
     * @param {string} category - Nombre de la categoría
     * @returns {object} Objeto con todas las clases de color (bg, text, border)
     */
    getCategoryColorSet(category) {
        return getBudgetCategoryColors(category);
    }

    render(container, tripConfigParam) {
        Logger.debug('💰 Renderizando presupuesto...');
        // Usar tripConfig importado si no se pasa como parámetro
        const tripConfigToUse = tripConfigParam || tripConfig;
        const budgetData = tripConfigToUse.budgetData.budgetData;
        const allExpenses = Object.values(budgetData).flat();
        const allCategories = [...new Set(allExpenses.map(item => item.category))];
        const categoryOptionsHTML = allCategories.map(cat => {
            const icon = getBudgetCategoryIcon(cat);
            return `<option value="${cat}" data-icon="${icon}">${cat}</option>`;
        }).join('');

        // Cabecera ya se renderiza en UIRenderer.renderGastos()
        // const headerHTML = HeaderRenderer.renderPresetHeader('budget');

        container.innerHTML = `
            <!-- Resumen de presupuesto -->
            <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-6">
                
                <!-- Header de Presupuesto -->
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-green-600 dark:text-green-400">account_balance_wallet</span>
                        Gestión de Presupuesto
                    </h2>
                </div>
                
                <!-- Resumen General Simplificado -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Presupuesto Total</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white" data-summary="budget-total">${this.formatCurrency(this.calculateSubtotal(allExpenses), true)}</p>
                    </div>
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Gastado</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white" data-summary="total-spent">${this.formatCurrency(stateManager.getState('expenses').reduce((sum, exp) => sum + (exp.amount || 0), 0), true)}</p>
                    </div>
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Gastos Registrados</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white" data-summary="expenses-count">${stateManager.getState('expenses').length}</p>
                    </div>
                </div>
                
                <!-- Separador visual -->
                <div class="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
                    <div class="mb-6">
                        <h3 class="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-3">
                            <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">filter_list</span>
                            Análisis por Categorías
                        </h3>
                    </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3" id="budget-category-filters">
                    ${allCategories.map(cat => {
                        const icon = getBudgetCategoryIcon(cat);
                        const color = this.getCategoryColor(cat);
                        return `<button data-category="${cat}" class="budget-filter-btn group flex items-center gap-3 p-4 text-left bg-white dark:bg-slate-800 radius-standard border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-standard">
                            <span class="material-symbols-outlined text-2xl ${color.replace('bg-', 'text-')} flex-shrink-0">${icon}</span>
                            <span class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${cat}</span>
                        </button>`;
                    }).join('')}
                </div>
                </div>
            </div>
            
            <!-- Contenido Dinámico -->
            <div id="budget-content" class="mb-6" style="display: none;">
                <div class="text-center text-slate-500 dark:text-slate-400 py-8 bg-slate-50 dark:bg-slate-800 radius-card border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <span class="material-symbols-outlined text-4xl mb-2 opacity-50">analytics</span>
                    <p class="text-lg font-medium">Haz clic en las categorías para ver el análisis</p>
                </div>
            </div>
            
            <!-- Formulario de Nuevo Gasto -->
            <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-6">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-400">add_circle</span>
                        <h3 class="font-bold text-lg text-slate-900 dark:text-white">Nuevo Gasto</h3>
                    </div>
                    <!-- Indicador de sincronización -->
                    <div id="sync-status" class="flex items-center gap-2 text-sm">
                        <div id="sync-indicator" class="w-2 h-2 rounded-full bg-green-500"></div>
                        <span id="sync-text" class="text-slate-600 dark:text-slate-400">Sincronizado</span>
                    </div>
                </div>
                <form id="expense-form" class="space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label for="expense-concept" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Concepto</label>
                            <input type="text" id="expense-concept" required 
                                   class="w-full px-4 py-3 radius-standard bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-standard text-slate-900 dark:text-white placeholder-slate-400"
                                   placeholder="Ej: Cena en restaurante">
                        </div>
                        
                        <div>
                            <label for="expense-amount" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cantidad (€)</label>
                            <div class="relative">
                                <input type="number" id="expense-amount" step="0.01" required 
                                       class="w-full pl-4 pr-12 py-3 radius-standard bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-standard text-slate-900 dark:text-white placeholder-slate-400"
                                       placeholder="0,00">
                                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium pointer-events-none">€</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <div class="flex-1 relative" style="overflow: visible;">
                            <!-- Desplegable personalizado con iconos -->
                            <div id="custom-category-dropdown" class="relative" style="overflow: visible;">
                                <button type="button" id="category-dropdown-btn" 
                                        class="w-full px-4 py-3 pl-12 pr-10 radius-standard bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-standard text-slate-900 dark:text-white text-left cursor-pointer">
                                    <span id="selected-category-text">Seleccionar categoría</span>
                                </button>
                                <span id="category-icon" class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none">
                                    category
                                </span>
                                <span class="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none">
                                    expand_more
                                </span>
                                
                                <!-- Lista desplegable -->
                                <div id="category-dropdown-list" class="fixed bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 radius-standard shadow-card max-h-60 overflow-y-auto hidden" style="z-index: 99999 !important; min-width: 200px;">
                                    ${allCategories.map(cat => {
                                        const icon = getBudgetCategoryIcon(cat);
                                        return `
                                            <div class="category-option flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors" data-value="${cat}">
                                                <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">${icon}</span>
                                                <span class="text-slate-900 dark:text-white">${cat}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            
                            <!-- Input oculto para el formulario -->
                            <input type="hidden" id="expense-category" name="category" required>
                        </div>
                        <button type="submit" id="add-expense-btn"
                                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold radius-standard shadow-card shadow-card-hover transition-standard flex items-center gap-2 whitespace-nowrap">
                            <span class="material-symbols-outlined" id="add-btn-icon">add</span>
                            <span id="add-btn-text">Añadir</span>
                        </button>
                    </div>
                </form>
            </div>

        `;

        container.style.opacity = '1 !important';
        this.tripConfig = tripConfig;
                                    this.setupEventListeners();
    }

    setupEventListeners() {
        // Desplegable personalizado de categorías
        const dropdownBtn = document.getElementById('category-dropdown-btn');
        const dropdownList = document.getElementById('category-dropdown-list');
        const categoryInput = document.getElementById('expense-category');
        const categoryIcon = document.getElementById('category-icon');
        const selectedText = document.getElementById('selected-category-text');
        
        if (dropdownBtn && dropdownList && categoryInput) {
            // Abrir/cerrar desplegable
            dropdownBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (dropdownList.classList.contains('hidden')) {
                    const rect = dropdownBtn.getBoundingClientRect();
                    const viewportWidth = stateManager.getState('ui.viewportWidth');
                    const viewportHeight = stateManager.getState('ui.viewportHeight');
                    const dropdownHeight = 240; // max-h-60 = 240px aprox
                    
                    // 📱 RESPONSIVE: Diferentes posicionamientos según el tamaño de pantalla
                    if (viewportWidth <= 640) {
                        // 📱 MÓVIL: Dropdown centrado y ancho completo
                        dropdownList.style.top = `${rect.bottom + 8}px`;
                        dropdownList.style.left = '1rem';
                        dropdownList.style.right = '1rem';
                        dropdownList.style.width = 'calc(100vw - 2rem)';
                        dropdownList.style.maxWidth = 'calc(100vw - 2rem)';
                        dropdownList.style.minWidth = 'calc(100vw - 2rem)';
                        
                        // Verificar si se sale por abajo en móvil
                        if (rect.bottom + dropdownHeight > viewportHeight - 20) {
                            dropdownList.style.top = `${rect.top - dropdownHeight - 8}px`;
                        }
                    } else {
                        // 🖥️ DESKTOP: Dropdown alineado con el botón
                        dropdownList.style.top = `${rect.bottom + 4}px`;
                        dropdownList.style.left = `${rect.left}px`;
                        dropdownList.style.width = `${Math.max(rect.width, 250)}px`;
                        dropdownList.style.maxWidth = `${Math.max(rect.width, 250)}px`;
                        dropdownList.style.minWidth = `${Math.max(rect.width, 250)}px`;
                        
                        // Verificar si se sale por la derecha
                        if (rect.left + 250 > viewportWidth - 20) {
                            dropdownList.style.left = `${viewportWidth - 270}px`;
                        }
                        
                        // Verificar si se sale por abajo
                        if (rect.bottom + dropdownHeight > viewportHeight - 20) {
                            dropdownList.style.top = `${rect.top - dropdownHeight - 4}px`;
                        }
                    }
                    
                    dropdownList.classList.remove('hidden');
                } else {
                    dropdownList.classList.add('hidden');
                }
            });
            
            // Seleccionar opción
            dropdownList.addEventListener('click', (e) => {
                const option = e.target.closest('.category-option');
                if (option) {
                    const value = option.dataset.value;
                    const icon = getBudgetCategoryIcon(value);
                    
                    // Actualizar valores
                    categoryInput.value = value;
                    selectedText.textContent = value;
                    categoryIcon.textContent = icon;
                    categoryIcon.classList.remove('text-slate-500');
                    categoryIcon.classList.add('text-blue-600');
                    
                    // Cerrar desplegable
                    dropdownList.classList.add('hidden');
                }
            });
            
            // Cerrar al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!dropdownBtn.contains(e.target) && !dropdownList.contains(e.target)) {
                    dropdownList.classList.add('hidden');
                }
            });
        }
        
        // Filtros de categoría
        document.getElementById('budget-category-filters').addEventListener('click', (e) => {
            const btn = e.target.closest('.budget-filter-btn');
            if (!btn) return;
            
            // Toggle selección visual
            btn.classList.toggle('ring-2');
            btn.classList.toggle('ring-blue-500');
            btn.classList.toggle('dark:ring-blue-400');
            btn.classList.toggle('bg-blue-100');
            btn.classList.toggle('dark:bg-blue-800');

            // Mostrar contenido de las categorías seleccionadas
            setTimeout(() => this.showCategoryContent(), 100);
        });

        // Formulario de gastos
        document.getElementById('expense-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const concept = document.getElementById('expense-concept').value;
            const amount = parseFloat(document.getElementById('expense-amount').value);
            const category = document.getElementById('expense-category').value;
            
            if (concept && amount > 0 && category) {
                const submitBtn = e.target.querySelector('button[type="submit"]');
                const editId = submitBtn.dataset.editId;
                
                // 🚀 OPTIMISTIC UI: Actualizar inmediatamente ANTES de Firebase
                const newExpense = {
                    id: editId || Date.now().toString(),
                    concept,
                    amount,
                    category,
                    date: new Date().toISOString(),
                    deviceId: this.firebaseManager?.getDeviceId() || 'local'
                };
                
                if (editId) {
                    // 🔄 ACTUALIZACIÓN OPTIMISTA
                    const existingIndex = stateManager.getState('expenses').findIndex(exp => exp.id === editId);
                    if (existingIndex !== -1) {
                        stateManager.getState('expenses')[existingIndex] = { ...stateManager.getState('expenses')[existingIndex], ...newExpense };
                    }
                    this.cancelEditMode();
                } else {
                    // ➕ ADICIÓN OPTIMISTA
                    stateManager.getState('expenses').unshift(newExpense);
                }
                
                // 🎯 ACTUALIZAR UI INMEDIATAMENTE (sin esperar Firebase)
                this.updateSummaryCards();
                this.showCategoryContent();
                e.target.reset();
                
                // 🔄 Indicar que se está sincronizando
                this.updateSyncStatus('syncing');
                
                try {
                    // 🔥 FIREBASE EN BACKGROUND (no bloquea UI)
                    if (editId) {
                        await this.firebaseManager.updateExpense(editId, { concept, amount, category });
                    } else {
                        const firebaseId = await this.firebaseManager.addExpense(newExpense);
                        // Actualizar el ID local con el ID de Firebase si es diferente
                        if (firebaseId && firebaseId !== newExpense.id) {
                            const localIndex = stateManager.getState('expenses').findIndex(exp => exp.id === newExpense.id);
                            if (localIndex !== -1) {
                                stateManager.getState('expenses')[localIndex].id = firebaseId;
                            }
                        }
                    }
                    
                    // ✅ Sincronización completada
                    this.updateSyncStatus('connected');
                    
                } catch (error) {
                    // ❌ ERROR: Revertir cambios optimistas
                    Logger.error('Error syncing expense, reverting optimistic update:', error);
                    
                    if (editId) {
                        // Revertir actualización
                        const originalExpense = JSON.parse(localStorage.getItem('tripExpensesV1') || '[]')
                            .find(exp => exp.id === editId);
                        if (originalExpense) {
                            const index = stateManager.getState('expenses').findIndex(exp => exp.id === editId);
                            if (index !== -1) {
                                stateManager.getState('expenses')[index] = originalExpense;
                            }
                        }
                    } else {
                        // Revertir adición
                        const filteredExpenses = stateManager.getState('expenses').filter(exp => exp.id !== newExpense.id);
                        stateManager.updateState('expenses', filteredExpenses);
                    }
                    
                    // Actualizar UI para reflejar el rollback
                    this.updateSummaryCards();
                    this.showCategoryContent();
                    this.updateSyncStatus('error');
                    this.showNotification('❌ Error al sincronizar. Cambios revertidos.', 'error');
                }
            }
        });


    }

    showCategoryContent() {
        const contentContainer = document.getElementById('budget-content');
        if (!contentContainer) return;
        
        try {
            // Obtener todas las categorías seleccionadas
            const selectedCategories = Array.from(document.querySelectorAll('.budget-filter-btn.ring-2')).map(btn => btn.dataset.category);
            
            if (selectedCategories.length === 0) {
                // Ocultar el contenedor cuando no hay categorías seleccionadas
                contentContainer.style.display = 'none';
                return;
            }
            
            // Mostrar el contenedor cuando hay categorías seleccionadas
            contentContainer.style.display = 'block';
            
            // Obtener datos de todas las categorías seleccionadas
            const budgetData = this.tripConfig.budgetData.budgetData;
            const allCategoryItems = Object.values(budgetData).flat().filter(item => selectedCategories.includes(item.category));
            const allCategoryExpenses = stateManager.getState('expenses').filter(exp => selectedCategories.includes(exp.category));
            
            // 🔧 DEFINIR allCategories para el formulario inline (mismo código que en render())
            const allExpenses = Object.values(budgetData).flat();
            const allCategories = [...new Set(allExpenses.map(item => item.category))];
            
            // Crear tarjetas de comparativa como en la imagen
            const categoryCards = selectedCategories.map(cat => {
                const catItems = allCategoryItems.filter(item => item.category === cat);
                const catExpenses = allCategoryExpenses.filter(exp => exp.category === cat);
                
                const budgetTotal = catItems.reduce((sum, item) => {
                    if (item.cost) return sum + item.cost;
                    if (item.subItems) return sum + item.subItems.reduce((subSum, subItem) => subSum + (subItem.cost || 0), 0);
                    return sum;
                }, 0);
                
                const expensesTotal = catExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                const categoryIcon = getBudgetCategoryIcon(cat);
                const categoryColor = this.getCategoryColor(cat);
                
                return `
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card shadow-card-hover border border-slate-200 dark:border-slate-700 p-6 transition-standard">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="material-symbols-outlined text-3xl ${categoryColor.replace('bg-', 'text-')}">${categoryIcon}</span>
                            <div class="flex-1">
                                <h4 class="font-bold text-lg text-slate-900 dark:text-white">${cat}</h4>
                                <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                    <span class="text-slate-600 dark:text-slate-400">${this.formatCurrency(expensesTotal, true)}</span>
                                    <span class="text-slate-400 dark:text-slate-500 text-lg"> / </span>
                                    <span class="text-slate-500 dark:text-slate-400 text-lg">${this.formatCurrency(budgetTotal, true)}</span>
                                </div>
                                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">${catItems.length} items presupuestados • ${catExpenses.length} gastos registrados</p>
                            </div>
                        </div>
                        
                        <!-- Desglose Detallado -->
                        <div class="space-y-4">
                            ${catItems.length > 0 ? `
                            <div>
                                <h5 class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-lg text-slate-500">receipt_long</span>
                                    Items Presupuestados
                                </h5>
                                <div class="space-y-3">
                                    ${catItems.map(item => {
                                        // Manejar items con subitems
                                        if (item.subItems && item.subItems.length > 0) {
                                            return `
                                                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                                                    <div class="flex justify-between items-center mb-2">
                                                        <span class="font-medium text-slate-800 dark:text-slate-200">${item.concept}</span>
                                                        <span class="font-bold text-slate-900 dark:text-white">${this.formatCurrency(item.cost || 0, true)}</span>
                                                    </div>
                                                    <div class="space-y-1 ml-3">
                                                        ${item.subItems.map(subItem => {
                                                            const subItemId = `budget-${cat}-${item.concept}-${subItem.concept}`.replace(/[^a-zA-Z0-9-]/g, '-');
                                                            return `
                                                                <div class="budget-subitem-wrapper" data-item-id="${subItemId}">
                                                                    <!-- SubItem Presupuestado -->
                                                                    <div class="budget-subitem-clickable flex justify-between text-sm text-slate-600 dark:text-slate-400 py-1 px-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer transition-standard"
                                                                         data-concept="${subItem.concept}" 
                                                                         data-amount="${subItem.cost || 0}" 
                                                                         data-category="${cat}"
                                                                         data-item-id="${subItemId}"
                                                                         title="Click para crear gasto basado en este subitem">
                                                                        <span class="flex items-center gap-2">
                                                                            <span class="w-1 h-1 bg-slate-400 rounded-full"></span>
                                                                            ${subItem.concept}
                                                                        </span>
                                                                        <div class="flex items-center gap-1">
                                                                            <span>${this.formatCurrency(subItem.cost || 0, true)}</span>
                                                                            <span class="material-symbols-outlined text-xs text-slate-400">add_circle</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <!-- Formulario Inline para SubItem (Oculto por defecto) -->
                                                                    <div class="budget-inline-form hidden mt-2 ml-4 p-3 bg-green-50 dark:bg-green-900/30 radius-standard border-2 border-green-300 dark:border-green-700 shadow-card" data-item-id="${subItemId}">
                                                                        <div class="flex items-center gap-2 mb-2">
                                                                            <span class="material-symbols-outlined text-green-600 text-sm">add_circle</span>
                                                                            <h5 class="text-xs font-medium text-green-800 dark:text-green-200">Crear gasto: ${subItem.concept}</h5>
                                                                        </div>
                                                                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                                                                            <div>
                                                                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Concepto</label>
                                                                                <input type="text" class="budget-inline-concept w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value="${subItem.concept}">
                                                                            </div>
                                                                            <div>
                                                                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cantidad</label>
                                                                                <div class="relative">
                                                                                    <input type="number" step="0.01" class="budget-inline-amount w-full px-2 py-1 pr-6 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value="${subItem.cost || 0}">
                                                                                    <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">€</span>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Categoría</label>
                                                                                <!-- Dropdown personalizado con iconos -->
                                                                                <div class="relative">
                                                                                    <button type="button" class="budget-inline-category-btn w-full px-2 py-1 pl-8 pr-8 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-left cursor-pointer" data-item-id="${subItemId}">
                                                                                        <span class="budget-inline-category-text">${cat}</span>
                                                                                    </button>
                                                                                    <span class="budget-inline-category-icon absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-xs text-slate-500 pointer-events-none">
                                                                                        ${getBudgetCategoryIcon(cat)}
                                                                                    </span>
                                                                                    <span class="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-xs text-slate-500 pointer-events-none">
                                                                                        expand_more
                                                                                    </span>
                                                                                    
                                                                                    <!-- Lista desplegable -->
                                                                                    <div class="budget-inline-category-dropdown hidden fixed bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 radius-standard shadow-card max-h-48 overflow-y-auto" style="z-index: 99999 !important; min-width: 200px;" data-item-id="${subItemId}">
                                                                                        ${allCategories.map(category => `
                                                                                            <div class="budget-inline-category-option flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors text-xs" data-value="${category}" data-item-id="${subItemId}">
                                                                                                <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">${getBudgetCategoryIcon(category)}</span>
                                                                                                <span class="text-slate-900 dark:text-white">${category}</span>
                                                                                            </div>
                                                                                        `).join('')}
                                                                                    </div>
                                                                                    
                                                                                    <!-- Input oculto para el valor -->
                                                                                    <input type="hidden" class="budget-inline-category" value="${cat}">
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="flex gap-2 justify-end">
                                                                            <button class="cancel-budget-inline px-2 py-1 text-xs bg-slate-500 hover:bg-slate-600 text-white rounded transition-colors" data-item-id="${subItemId}">
                                                                                <span class="material-symbols-outlined text-xs mr-1">close</span>Cancelar
                                                                            </button>
                                                                            <button class="create-budget-expense px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors" data-item-id="${subItemId}">
                                                                                <span class="material-symbols-outlined text-xs mr-1">add</span>Crear
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            `;
                                                        }).join('')}
                                                    </div>
                                                </div>
                                            `;
                                        } else {
                                            const itemId = `budget-${cat}-${item.concept}`.replace(/[^a-zA-Z0-9-]/g, '-');
                                            return `
                                                <div class="budget-item-wrapper" data-item-id="${itemId}">
                                                    <!-- Item Presupuestado -->
                                                    <div class="budget-item-clickable flex justify-between items-center py-2 px-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-standard" 
                                                         data-concept="${item.concept}" 
                                                         data-amount="${item.cost || 0}" 
                                                         data-category="${cat}"
                                                         data-item-id="${itemId}"
                                                         title="Click para crear gasto basado en este item">
                                                        <span class="text-slate-700 dark:text-slate-300">${item.concept}</span>
                                                        <div class="flex items-center gap-2">
                                                            <span class="font-medium text-slate-900 dark:text-white">${this.formatCurrency(item.cost || 0, true)}</span>
                                                            <span class="material-symbols-outlined text-sm text-slate-400">add_circle</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Formulario Inline para Crear Gasto (Oculto por defecto) -->
                                                    <div class="budget-inline-form hidden mt-3 p-4 bg-green-50 dark:bg-green-900/30 radius-standard border-2 border-green-300 dark:border-green-700 shadow-card" data-item-id="${itemId}">
                                                        <div class="flex items-center gap-2 mb-3">
                                                            <span class="material-symbols-outlined text-green-600">add_circle</span>
                                                            <h4 class="text-sm font-medium text-green-800 dark:text-green-200">Crear gasto basado en: ${item.concept}</h4>
                                                        </div>
                                                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                                            <div>
                                                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Concepto</label>
                                                                <input type="text" class="budget-inline-concept w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value="${item.concept}">
                                                            </div>
                                                            <div>
                                                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cantidad</label>
                                                                <div class="relative">
                                                                    <input type="number" step="0.01" class="budget-inline-amount w-full px-2 py-1 pr-6 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value="${item.cost || 0}">
                                                                    <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">€</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Categoría</label>
                                                                <!-- Dropdown personalizado con iconos -->
                                                                <div class="relative">
                                                                    <button type="button" class="budget-inline-category-btn w-full px-2 py-1 pl-8 pr-8 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-left cursor-pointer" data-item-id="${itemId}">
                                                                        <span class="budget-inline-category-text">${cat}</span>
                                                                    </button>
                                                                    <span class="budget-inline-category-icon absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-slate-500 pointer-events-none">
                                                                        ${getBudgetCategoryIcon(cat)}
                                                                    </span>
                                                                    <span class="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-slate-500 pointer-events-none">
                                                                        expand_more
                                                                    </span>
                                                                    
                                                                    <!-- Lista desplegable -->
                                                                    <div class="budget-inline-category-dropdown hidden fixed bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 radius-standard shadow-card max-h-48 overflow-y-auto" style="z-index: 99999 !important; min-width: 200px;" data-item-id="${itemId}">
                                                                        ${allCategories.map(category => `
                                                                            <div class="budget-inline-category-option flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors text-sm" data-value="${category}" data-item-id="${itemId}">
                                                                                <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">${getBudgetCategoryIcon(category)}</span>
                                                                                <span class="text-slate-900 dark:text-white">${category}</span>
                                                                            </div>
                                                                        `).join('')}
                                                                    </div>
                                                                    
                                                                    <!-- Input oculto para el valor -->
                                                                    <input type="hidden" class="budget-inline-category" value="${cat}">
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="flex gap-2 justify-end">
                                                            <button class="cancel-budget-inline px-3 py-1 text-xs bg-slate-500 hover:bg-slate-600 text-white rounded transition-colors" data-item-id="${itemId}">
                                                                <span class="material-symbols-outlined text-xs mr-1">close</span>Cancelar
                                                            </button>
                                                            <button class="create-budget-expense px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors" data-item-id="${itemId}">
                                                                <span class="material-symbols-outlined text-xs mr-1">add</span>Crear Gasto
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            `;
                                        }
                                    }).join('')}
                                </div>
                            </div>
                            ` : ''}
                            
                            ${catExpenses.length > 0 ? `
                            <div>
                                <h5 class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-lg text-green-600">payments</span>
                                    Gastos Registrados
                                </h5>
                                <div class="space-y-2">
                                    ${catExpenses.map(exp => `
                                        <div class="expense-item-wrapper" data-expense-id="${exp.id}">
                                            <!-- Vista Normal del Gasto -->
                                            <div class="expense-item-category group flex justify-between items-center py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer transition-standard" data-expense-id="${exp.id}">
                                                <span class="text-slate-700 dark:text-slate-300 ${exp.paid ? 'line-through opacity-60' : ''}">${exp.concept}</span>
                                                <div class="flex items-center gap-2">
                                                    <span class="font-medium text-green-700 dark:text-green-400 ${exp.paid ? 'line-through opacity-60' : ''}">${this.formatCurrency(exp.amount, true)}</span>
                                                    <button class="delete-expense-btn opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center transition-standard" data-expense-id="${exp.id}" title="Eliminar gasto">
                                                        <span class="material-symbols-outlined text-xs">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <!-- Formulario Inline de Edición (Oculto por defecto) -->
                                            <div class="inline-edit-form hidden mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800" data-expense-id="${exp.id}">
                                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                                    <div>
                                                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Concepto</label>
                                                        <input type="text" class="inline-concept w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value="${exp.concept}">
                                                    </div>
                                                    <div>
                                                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cantidad (€)</label>
                                                        <input type="number" step="0.01" class="inline-amount w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value="${exp.amount}">
                                                    </div>
                                                    <div>
                                                        <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Categoría</label>
                                                        <!-- Dropdown personalizado con iconos -->
                                                        <div class="relative">
                                                            <button type="button" class="inline-category-btn w-full px-2 py-1 pl-8 pr-8 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-left cursor-pointer" data-expense-id="${exp.id}">
                                                                <span class="inline-category-text">${exp.category}</span>
                                                            </button>
                                                            <span class="inline-category-icon absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-slate-500 pointer-events-none">
                                                                ${getBudgetCategoryIcon(exp.category)}
                                                            </span>
                                                            <span class="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-slate-500 pointer-events-none">
                                                                expand_more
                                                            </span>
                                                            
                                                            <!-- Lista desplegable -->
                                                            <div class="inline-category-dropdown hidden fixed bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 radius-standard shadow-card max-h-48 overflow-y-auto" style="z-index: 99999 !important; min-width: 200px;" data-expense-id="${exp.id}">
                                                                ${allCategories.map(cat => `
                                                                    <div class="inline-category-option flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors text-sm" data-value="${cat}" data-expense-id="${exp.id}">
                                                                        <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">${getBudgetCategoryIcon(cat)}</span>
                                                                        <span class="text-slate-900 dark:text-white">${cat}</span>
                                                                    </div>
                                                                `).join('')}
                                                            </div>
                                                            
                                                            <!-- Input oculto para el valor -->
                                                            <input type="hidden" class="inline-category" value="${exp.category}">
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="flex gap-2 justify-end">
                                                    <button class="cancel-inline-edit px-3 py-1 text-xs bg-slate-500 hover:bg-slate-600 text-white rounded transition-colors" data-expense-id="${exp.id}">
                                                        <span class="material-symbols-outlined text-xs mr-1">close</span>Cancelar
                                                    </button>
                                                    <button class="save-inline-edit px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors" data-expense-id="${exp.id}">
                                                        <span class="material-symbols-outlined text-xs mr-1">save</span>Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            contentContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${categoryCards}
                </div>
            `;
            
            // Agregar event listeners para edición inline y eliminación
            setTimeout(() => {
                // 📝 EDICIÓN INLINE: Click en gasto para mostrar formulario
                document.querySelectorAll('.expense-item-category').forEach(item => {
                    item.addEventListener('click', (e) => {
                        // Si se hizo clic en el botón de eliminar, no editar
                        if (e.target.closest('.delete-expense-btn')) return;
                        
                        const expenseId = item.dataset.expenseId;
                        this.toggleInlineEdit(expenseId);
                    });
                });
                
                // 💾 GUARDAR EDICIÓN INLINE (con limpieza de listeners anteriores)
                document.querySelectorAll('.save-inline-edit').forEach(btn => {
                    // 🧹 LIMPIAR listeners anteriores para evitar duplicados
                    btn.replaceWith(btn.cloneNode(true));
                });
                
                // 🆕 AÑADIR listeners frescos
                document.querySelectorAll('.save-inline-edit').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const expenseId = btn.dataset.expenseId;
                        await this.saveInlineEdit(expenseId);
                    });
                });
                
                // ❌ CANCELAR EDICIÓN INLINE (con limpieza de listeners anteriores)
                document.querySelectorAll('.cancel-inline-edit').forEach(btn => {
                    // 🧹 LIMPIAR listeners anteriores para evitar duplicados
                    btn.replaceWith(btn.cloneNode(true));
                });
                
                // 🆕 AÑADIR listeners frescos
                document.querySelectorAll('.cancel-inline-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const expenseId = btn.dataset.expenseId;
                        this.hideInlineEdit(expenseId);
                    });
                });
                
                        // 🗑️ ELIMINAR GASTO (con limpieza de listeners anteriores)
        document.querySelectorAll('.delete-expense-btn').forEach(btn => {
            // 🧹 LIMPIAR listeners anteriores para evitar duplicados
            btn.replaceWith(btn.cloneNode(true));
        });
        
        // 🆕 AÑADIR listeners frescos
        document.querySelectorAll('.delete-expense-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const expenseId = btn.dataset.expenseId;
                        Logger.debug(`🗑️ Delete button clicked for expense ID: ${expenseId}`);
                        
                        if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
                            try {
                                Logger.debug(`🔥 Calling Firebase deleteExpense for ID: ${expenseId}`);
                                const deleteResult = await this.firebaseManager.deleteExpense(expenseId);
                                
                                if (!deleteResult) {
                                    Logger.error(`🚨 DELETE FAILED for expense ID: ${expenseId}`);
                                    
                                    // Si el documento no existe en Firebase, pero existe localmente,
                                    // eliminar del estado local (desincronización)
                                    Logger.warning(`🔄 Document doesn't exist in Firebase, removing from local state`);
                                    const currentExpenses = stateManager.getState('expenses');
                                    const filteredExpenses = currentExpenses.filter(exp => exp.id !== expenseId);
                                    stateManager.updateState('expenses', filteredExpenses);
                                    
                                    this.updateSummaryCards();
                                    this.showCategoryContent();
                                    this.showNotification('⚠️ Gasto eliminado (era solo local)', 'warning');
                                    return;
                                }
                                
                                Logger.success(`✅ DELETE CONFIRMED for expense ID: ${expenseId}`);
                                
                                // 🎉 DELETE SUCCESSFUL - UI will be updated by onExpenseDeleted callback
                                Logger.success(`✅ Expense ${expenseId} successfully deleted from Firebase`);
                                this.showNotification('✅ Gasto eliminado correctamente', 'success');
                                
                                // 🔄 ACTUALIZAR CONTENIDO DE CATEGORÍAS SELECCIONADAS
                                const selectedCategories = Array.from(document.querySelectorAll('.budget-filter-btn.ring-2'));
                                if (selectedCategories.length > 0) {
                                    // Si hay categorías seleccionadas, actualizar su contenido
                                    this.showCategoryContent();
                                    // Reconfigurar listeners de presupuesto después de actualizar
                                    setTimeout(() => this.setupBudgetFormListeners(), 100);
                                } else {
                                    // Si no hay categorías seleccionadas, ocultar contenido
                                    const contentContainer = document.getElementById('budget-content');
                                    if (contentContainer) {
                                        contentContainer.style.display = 'none';
                                    }
                                }
                            } catch (error) {
                                Logger.error('Error al eliminar gasto:', error);
                                this.showNotification('❌ Error al eliminar gasto', 'error');
                            }
                        }
                    });
                });

                // 🎯 FORMULARIO INLINE: Items presupuestados
                document.querySelectorAll('.budget-item-clickable').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const itemId = item.dataset.itemId;
                        if (itemId) {
                            this.toggleBudgetInlineForm(itemId);
                        }
                    });
                });

                // 💾 CREAR GASTO DESDE PRESUPUESTO
                document.querySelectorAll('.create-budget-expense').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const itemId = btn.dataset.itemId;
                        await this.createExpenseFromBudget(itemId);
                    });
                });

                // ❌ CANCELAR FORMULARIO PRESUPUESTO
                document.querySelectorAll('.cancel-budget-inline').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const itemId = btn.dataset.itemId;
                        this.hideBudgetInlineForm(itemId);
                    });
                });

                // 🎯 SUBITEMS (usar inline forms como los items principales)
                document.querySelectorAll('.budget-subitem-clickable').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const itemId = item.closest('.budget-subitem-wrapper').dataset.itemId;
                        this.toggleBudgetInlineForm(itemId);
                    });
                });

                // 🎨 DROPDOWNS PERSONALIZADOS DE CATEGORÍAS EN EDICIÓN
                document.querySelectorAll('.inline-category-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const expenseId = btn.dataset.expenseId;
                        const dropdown = document.querySelector(`.inline-category-dropdown[data-expense-id="${expenseId}"]`);
                        
                        if (dropdown) {
                            // Cerrar otros dropdowns abiertos
                            document.querySelectorAll('.inline-category-dropdown').forEach(d => {
                                if (d !== dropdown) d.classList.add('hidden');
                            });
                            
                            // Toggle del dropdown actual
                            if (dropdown.classList.contains('hidden')) {
                                const rect = btn.getBoundingClientRect();
                                const viewportWidth = stateManager.getState('ui.viewportWidth');
                                const viewportHeight = stateManager.getState('ui.viewportHeight');
                                
                                // Posicionamiento responsive
                                if (viewportWidth <= 640) {
                                    // Móvil: centrado y ancho completo
                                    dropdown.style.top = `${rect.bottom + 4}px`;
                                    dropdown.style.left = '1rem';
                                    dropdown.style.right = '1rem';
                                    dropdown.style.width = 'calc(100vw - 2rem)';
                                } else {
                                    // Desktop: alineado con el botón
                                    dropdown.style.top = `${rect.bottom + 4}px`;
                                    dropdown.style.left = `${rect.left}px`;
                                    dropdown.style.width = `${Math.max(rect.width, 200)}px`;
                                    
                                    // Verificar si se sale por la derecha
                                    if (rect.left + 200 > viewportWidth - 20) {
                                        dropdown.style.left = `${viewportWidth - 220}px`;
                                    }
                                }
                                
                                // Verificar si se sale por abajo
                                if (rect.bottom + 192 > viewportHeight - 20) {
                                    dropdown.style.top = `${rect.top - 192 - 4}px`;
                                }
                                
                                dropdown.classList.remove('hidden');
                            } else {
                                dropdown.classList.add('hidden');
                            }
                        }
                    });
                });

                // ✅ SELECCIÓN DE CATEGORÍA EN EDICIÓN
                document.querySelectorAll('.inline-category-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.preventDefault();
                        const expenseId = option.dataset.expenseId;
                        const category = option.dataset.value;
                        const icon = getBudgetCategoryIcon(category);
                        
                        // Actualizar UI del dropdown
                        const btn = document.querySelector(`.inline-category-btn[data-expense-id="${expenseId}"]`);
                        const text = btn?.querySelector('.inline-category-text');
                        const iconEl = document.querySelector(`.inline-category-icon[data-expense-id="${expenseId}"]`) || 
                                      btn?.parentElement.querySelector('.inline-category-icon');
                        const input = document.querySelector(`.inline-category[value="${category}"]`) ||
                                     btn?.parentElement.querySelector('.inline-category');
                        
                        if (text) text.textContent = category;
                        if (iconEl) iconEl.textContent = icon;
                        if (input) input.value = category;
                        
                        // Cerrar dropdown
                        const dropdown = document.querySelector(`.inline-category-dropdown[data-expense-id="${expenseId}"]`);
                        if (dropdown) dropdown.classList.add('hidden');
                    });
                });

                // 🖱️ CERRAR DROPDOWNS AL HACER CLICK FUERA
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.inline-category-btn') && !e.target.closest('.inline-category-dropdown')) {
                        document.querySelectorAll('.inline-category-dropdown').forEach(dropdown => {
                            dropdown.classList.add('hidden');
                        });
                    }
                });

                // 🎨 DROPDOWNS PERSONALIZADOS DE CATEGORÍAS EN FORMULARIOS INLINE DE PRESUPUESTO
                document.querySelectorAll('.budget-inline-category-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const itemId = btn.dataset.itemId;
                        const dropdown = document.querySelector(`.budget-inline-category-dropdown[data-item-id="${itemId}"]`);
                        
                        if (dropdown) {
                            // Cerrar otros dropdowns abiertos
                            document.querySelectorAll('.budget-inline-category-dropdown').forEach(d => {
                                if (d !== dropdown) d.classList.add('hidden');
                            });
                            
                            // Toggle del dropdown actual
                            if (dropdown.classList.contains('hidden')) {
                                const rect = btn.getBoundingClientRect();
                                const viewportWidth = stateManager.getState('ui.viewportWidth');
                                const viewportHeight = stateManager.getState('ui.viewportHeight');
                                
                                // Posicionamiento responsive
                                if (viewportWidth <= 640) {
                                    // Móvil: centrado y ancho completo
                                    dropdown.style.top = `${rect.bottom + 4}px`;
                                    dropdown.style.left = '1rem';
                                    dropdown.style.right = '1rem';
                                    dropdown.style.width = 'calc(100vw - 2rem)';
                                } else {
                                    // Desktop: alineado con el botón
                                    dropdown.style.top = `${rect.bottom + 4}px`;
                                    dropdown.style.left = `${rect.left}px`;
                                    dropdown.style.width = `${Math.max(rect.width, 200)}px`;
                                    
                                    // Verificar si se sale por la derecha
                                    if (rect.left + 200 > viewportWidth - 20) {
                                        dropdown.style.left = `${viewportWidth - 220}px`;
                                    }
                                }
                                
                                // Verificar si se sale por abajo
                                if (rect.bottom + 192 > viewportHeight - 20) {
                                    dropdown.style.top = `${rect.top - 192 - 4}px`;
                                }
                                
                                dropdown.classList.remove('hidden');
                            } else {
                                dropdown.classList.add('hidden');
                            }
                        }
                    });
                });

                // ✅ SELECCIÓN DE CATEGORÍA EN FORMULARIOS INLINE DE PRESUPUESTO
                document.querySelectorAll('.budget-inline-category-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.preventDefault();
                        const itemId = option.dataset.itemId;
                        const category = option.dataset.value;
                        const icon = getBudgetCategoryIcon(category);
                        
                        // Actualizar UI del dropdown
                        const btn = document.querySelector(`.budget-inline-category-btn[data-item-id="${itemId}"]`);
                        const text = btn?.querySelector('.budget-inline-category-text');
                        const iconEl = btn?.parentElement.querySelector('.budget-inline-category-icon');
                        const input = btn?.parentElement.querySelector('.budget-inline-category');
                        
                        if (text) text.textContent = category;
                        if (iconEl) iconEl.textContent = icon;
                        if (input) input.value = category;
                        
                        // Cerrar dropdown
                        const dropdown = document.querySelector(`.budget-inline-category-dropdown[data-item-id="${itemId}"]`);
                        if (dropdown) dropdown.classList.add('hidden');
                    });
                });

                // 🖱️ CERRAR DROPDOWNS DE PRESUPUESTO AL HACER CLICK FUERA
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.budget-inline-category-btn') && !e.target.closest('.budget-inline-category-dropdown')) {
                        document.querySelectorAll('.budget-inline-category-dropdown').forEach(dropdown => {
                            dropdown.classList.add('hidden');
                        });
                    }
                });
            }, 100);
            
        } catch (error) {
            Logger.error('Error al mostrar contenido de categorías:', error);
        }
    }

    cancelEditMode() {
        const submitBtn = document.querySelector('#expense-form button[type="submit"]');
        const form = document.getElementById('expense-form');

        delete submitBtn.dataset.editId;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">add</span>Añadir';
        form.reset();

        // Actualizar las tarjetas de resumen
        this.updateSummaryCards();
        
        // Actualizar el contenido de categorías para reflejar cambios
        this.showCategoryContent();
    }

    /**
     * 📝 EDICIÓN INLINE: Mostrar/ocultar formulario de edición
     */
    toggleInlineEdit(expenseId) {
        // Ocultar todos los otros formularios inline abiertos
        document.querySelectorAll('.inline-edit-form').forEach(form => {
            if (form.dataset.expenseId !== expenseId) {
                form.classList.add('hidden');
            }
        });
        
        // Toggle del formulario específico
        const form = document.querySelector(`.inline-edit-form[data-expense-id="${expenseId}"]`);
        if (form) {
            form.classList.toggle('hidden');
        }
    }

    /**
     * ❌ EDICIÓN INLINE: Ocultar formulario
     */
    hideInlineEdit(expenseId) {
        const form = document.querySelector(`.inline-edit-form[data-expense-id="${expenseId}"]`);
        if (form) {
            form.classList.add('hidden');
        }
    }

    /**
     * 💾 EDICIÓN INLINE: Guardar cambios
     */
    async saveInlineEdit(expenseId) {
        const form = document.querySelector(`.inline-edit-form[data-expense-id="${expenseId}"]`);
        if (!form) return;

        const concept = form.querySelector('.inline-concept').value;
        const amount = parseFloat(form.querySelector('.inline-amount').value);
        const category = form.querySelector('.inline-category').value;

        if (concept && amount > 0 && category) {
            try {
                // 🚀 ACTUALIZACIÓN OPTIMISTA INMEDIATA
                const existingIndex = stateManager.getState('expenses').findIndex(exp => exp.id === expenseId);
                if (existingIndex !== -1) {
                    stateManager.getState('expenses')[existingIndex] = {
                        ...stateManager.getState('expenses')[existingIndex],
                        concept,
                        amount,
                        category
                    };
                }

                // 🎯 ACTUALIZAR UI INMEDIATAMENTE
                this.updateSummaryCards();
                this.showCategoryContent();
                this.hideInlineEdit(expenseId);

                // 🔄 Indicar sincronización
                this.updateSyncStatus('syncing');

                // 🔥 FIREBASE EN BACKGROUND
                await this.firebaseManager.updateExpense(expenseId, { concept, amount, category });
                
                // ✅ Sincronización completada
                this.updateSyncStatus('connected');
                this.showNotification('✅ Gasto actualizado correctamente', 'success');

            } catch (error) {
                Logger.error('Error updating expense inline:', error);
                
                // ❌ REVERTIR CAMBIOS OPTIMISTAS
                const originalExpense = JSON.parse(localStorage.getItem('tripExpensesV1') || '[]')
                    .find(exp => exp.id === expenseId);
                if (originalExpense) {
                    const index = stateManager.getState('expenses').findIndex(exp => exp.id === expenseId);
                    if (index !== -1) {
                        stateManager.getState('expenses')[index] = originalExpense;
                    }
                }
                
                this.updateSummaryCards();
                this.showCategoryContent();
                this.updateSyncStatus('error');
                this.showNotification('❌ Error al actualizar. Cambios revertidos.', 'error');
            }
        }
    }

    /**
     * 🎯 AUTORRELLENAR FORMULARIO: Rellenar formulario con datos del item presupuestado
     */
    autofillExpenseForm(concept, amount, category) {
        // Rellenar campos del formulario
        const conceptInput = document.getElementById('expense-concept');
        const amountInput = document.getElementById('expense-amount');
        const categoryInput = document.getElementById('expense-category');
        const categoryBtn = document.getElementById('category-dropdown-btn');
        const categoryText = document.getElementById('selected-category-text');
        const categoryIcon = document.getElementById('category-icon');

        if (conceptInput) conceptInput.value = concept;
        if (amountInput) amountInput.value = amount;
        
        // Actualizar dropdown personalizado de categoría
        if (categoryInput) categoryInput.value = category;
        if (categoryText) categoryText.textContent = category;
        if (categoryIcon) categoryIcon.textContent = getBudgetCategoryIcon(category);
        if (categoryBtn) {
            categoryBtn.classList.remove('text-slate-500');
            categoryBtn.classList.add('text-slate-900', 'dark:text-white');
        }

        // Hacer scroll suave al formulario
        const form = document.getElementById('expense-form');
        if (form) {
            form.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Destacar brevemente el formulario
            form.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
            setTimeout(() => {
                form.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
            }, 2000);
        }

        // Mostrar notificación
        this.showNotification(`📝 Formulario rellenado: ${concept}`, 'info');

        // Enfocar el primer campo para que el usuario pueda modificar si quiere
        if (conceptInput) {
            setTimeout(() => {
                conceptInput.focus();
                conceptInput.select();
            }, 500);
        }
    }

    /**
     * 🎯 FORMULARIO INLINE PRESUPUESTO: Mostrar/ocultar formulario
     */
    toggleBudgetInlineForm(itemId) {
        // Ocultar todos los otros formularios inline abiertos
        document.querySelectorAll('.budget-inline-form').forEach(form => {
            if (form.dataset.itemId !== itemId && !form.classList.contains('hidden')) {
                form.classList.add('hidden');
            }
        });
        
        // Toggle del formulario específico
        const form = document.querySelector(`.budget-inline-form[data-item-id="${itemId}"]`);
        if (form) {
            const wasHidden = form.classList.contains('hidden');
            form.classList.toggle('hidden');
            
            // Si se acaba de mostrar, hacer scroll y focus
            if (wasHidden) {
                setTimeout(() => {
                    // Scroll suave al formulario
                    form.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest',
                        inline: 'nearest'
                    });
                    
                    // Focus en el primer input
                    const firstInput = form.querySelector('.budget-inline-concept');
                    if (firstInput) {
                        firstInput.focus();
                        firstInput.select();
                    }
                }, 100);
            }
        }
    }

    /**
     * ❌ FORMULARIO INLINE PRESUPUESTO: Ocultar formulario
     */
    hideBudgetInlineForm(itemId) {
        const form = document.querySelector(`.budget-inline-form[data-item-id="${itemId}"]`);
        if (form) {
            form.classList.add('hidden');
        }
    }

    /**
     * 💾 CREAR GASTO DESDE PRESUPUESTO: Crear gasto basado en item presupuestado
     */
    async createExpenseFromBudget(itemId) {
        const form = document.querySelector(`.budget-inline-form[data-item-id="${itemId}"]`);
        if (!form) return;

        const concept = form.querySelector('.budget-inline-concept').value;
        const amount = parseFloat(form.querySelector('.budget-inline-amount').value);
        const category = form.querySelector('.budget-inline-category').value;

        if (concept && amount > 0 && category) {
            try {
                // 🚀 CREAR GASTO AUTOMÁTICAMENTE (Optimistic UI)
                const newExpense = {
                    id: Date.now().toString(),
                    concept,
                    amount,
                    category,
                    date: new Date().toISOString(),
                    deviceId: this.firebaseManager?.getDeviceId() || 'local'
                };

                // ➕ ADICIÓN OPTIMISTA INMEDIATA
                stateManager.getState('expenses').unshift(newExpense);

                // 🎯 ACTUALIZAR UI INMEDIATAMENTE
                this.updateSummaryCards();
                this.showCategoryContent();
                this.hideBudgetInlineForm(itemId);

                // 🔄 Indicar que se está sincronizando
                this.updateSyncStatus('syncing');

                // 🔥 FIREBASE EN BACKGROUND
                const firebaseId = await this.firebaseManager.addExpense(newExpense);
                
                // Actualizar el ID local con el ID de Firebase si es diferente
                if (firebaseId && firebaseId !== newExpense.id) {
                    const localIndex = stateManager.getState('expenses').findIndex(exp => exp.id === newExpense.id);
                    if (localIndex !== -1) {
                        stateManager.getState('expenses')[localIndex].id = firebaseId;
                    }
                }

                // ✅ Sincronización completada
                this.updateSyncStatus('connected');
                this.showNotification(`✅ Gasto creado: ${concept} - ${this.formatCurrency(amount, true)}`, 'success');

            } catch (error) {
                Logger.error('Error creating expense from budget item:', error);
                
                // ❌ REVERTIR CAMBIOS OPTIMISTAS
                stateManager.getState('expenses') = stateManager.getState('expenses').filter(exp => 
                    !(exp.concept === concept && exp.amount === amount && exp.category === category)
                );
                
                this.updateSummaryCards();
                this.showCategoryContent();
                this.updateSyncStatus('error');
                this.showNotification('❌ Error al crear gasto. Inténtalo de nuevo.', 'error');
            }
        }
    }

    editExpense(id) {
        const expense = stateManager.getState('expenses').find(exp => exp.id === id);
        if (!expense) return;

        // Llenar formulario con datos del gasto
        document.getElementById('expense-concept').value = expense.concept;
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-category').value = expense.category;

        // Cambiar a modo edición
        const submitBtn = document.querySelector('#expense-form button[type="submit"]');
        const title = document.querySelector('#expense-form h4');

        submitBtn.dataset.editId = id;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">save</span>Actualizar Gasto';
        if (title) {
            title.textContent = `Editando: ${expense.concept}`;
            title.className = 'font-bold text-xl text-blue-600 dark:text-blue-400';
        }

        // Hacer scroll al formulario
        document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Actualizar las tarjetas de resumen dinámicamente
    updateSummaryCards() {
        const budgetData = this.tripConfig.budgetData.budgetData;
        const allExpenses = Object.values(budgetData).flat();
        
        // Actualizar Presupuesto Total
        const budgetTotalElement = document.querySelector('[data-summary="budget-total"]');
        if (budgetTotalElement) {
            budgetTotalElement.textContent = this.formatCurrency(this.calculateSubtotal(allExpenses), true);
        }
        
        // Actualizar Gastos Registrados
        const expensesCountElement = document.querySelector('[data-summary="expenses-count"]');
        if (expensesCountElement) {
            expensesCountElement.textContent = stateManager.getState('expenses').length;
        }
        
        // Actualizar Total Gastado
        const totalSpentElement = document.querySelector('[data-summary="total-spent"]');
        if (totalSpentElement) {
            const totalSpent = stateManager.getState('expenses').reduce((sum, exp) => sum + (exp.amount || 0), 0);
            totalSpentElement.textContent = this.formatCurrency(totalSpent, true);
        }
    }

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
        return showSymbol ? `€${formatted}` : formatted;
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
     * Configurar event listeners para formularios de presupuesto
     * 
     * Método separado para reconfigurar los listeners de creación de gastos
     * desde items del presupuesto. Se llama después de actualizar el DOM.
     * 
     * @private
     */
    setupBudgetFormListeners() {
        // 💵 PRESUPUESTO: Click en item para mostrar formulario inline
        document.querySelectorAll('.budget-item-clickable').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = item.dataset.itemId;
                if (itemId) {
                    this.toggleBudgetInlineForm(itemId);
                }
            });
        });

        // 💾 CREAR GASTO DESDE PRESUPUESTO
        document.querySelectorAll('.create-budget-expense').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const itemId = btn.dataset.itemId;
                await this.createExpenseFromBudget(itemId);
            });
        });

        // ❌ CANCELAR FORMULARIO PRESUPUESTO
        document.querySelectorAll('.cancel-budget-inline').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = btn.dataset.itemId;
                this.hideBudgetInlineForm(itemId);
            });
        });

        // 🎯 SUBITEMS (usar inline forms como los items principales)
        document.querySelectorAll('.budget-subitem-clickable').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = item.dataset.itemId;
                this.toggleBudgetInlineForm(itemId);
            });
        });

        // 💾 CREAR GASTO DESDE SUBITEM
        document.querySelectorAll('.create-subitem-expense').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const itemId = btn.dataset.itemId;
                await this.createExpenseFromBudget(itemId);
            });
        });

        // ❌ CANCELAR FORMULARIO SUBITEM
        document.querySelectorAll('.cancel-subitem-inline').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = btn.dataset.itemId;
                this.hideBudgetInlineForm(itemId);
            });
        });

        Logger.debug('✅ Budget form listeners configured');
    }
}
