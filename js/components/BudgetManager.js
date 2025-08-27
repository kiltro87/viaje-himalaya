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
 * @version 2.0.0
 * @since 2025
 */

import Logger from '../utils/Logger.js';
import { FirebaseManager } from '../utils/FirebaseManager.js';
import OptimisticUI from '../utils/OptimisticUI.js';
import BatchManager from '../utils/BatchManager.js';
import { HeaderRenderer } from './renderers/HeaderRenderer.js';
import RealtimeSync from '../utils/RealtimeSync.js';
import OptimizedExpenseManager from '../utils/OptimizedExpenseManager.js';

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
        if (window.budgetInstance) {
            Logger.warning('BudgetManager ya existe, retornando instancia existente');
            return window.budgetInstance;
        }
        
        Logger.init('BudgetManager constructor started');
        Logger.budget('Initializing budget management system');
        
        // Inicializar objetos globales necesarios
        this.initializeGlobals();
        
        // Inicializar Firebase para almacenamiento en la nube
        this.firebaseManager = new FirebaseManager();
        this.setupFirebaseIntegration();
        
        // Exponer FirebaseManager globalmente para otros componentes
        window.FirebaseManager = this.firebaseManager;
        
        // 🚀 SISTEMAS AVANZADOS DE OPTIMIZACIÓN
        this.optimisticUI = OptimisticUI;
        this.batchManager = new BatchManager(this.firebaseManager);
        this.realtimeSync = new RealtimeSync(this.firebaseManager);
        
        // 🎯 EXPENSE MANAGER ULTRA-OPTIMIZADO
        this.optimizedExpenseManager = new OptimizedExpenseManager(this);
        
        // Configurar callbacks del sistema de tiempo real
        this.setupAdvancedSyncCallbacks();
        
        // 🚨 ASIGNAR COMO INSTANCIA SINGLETON
        window.budgetInstance = this;
        
        Logger.success('BudgetManager initialized successfully');
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
            this.updateSummaryCards();
        };
        
        this.firebaseManager.onSyncStatusChanged = (status) => {
            Logger.budget('Sync status changed:', status);
            this.updateSyncStatus(status);
            
            // 🔥 CONFIGURAR LISTENER CUANDO SE CONECTE
            if (status === 'connected' && !this.realtimeUnsubscribe) {
                if (!Logger.isMobile) {
                    console.log('🔥 DEBUG: Firebase connected, setting up realtime listener...');
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
        switch (action) {
            case 'added':
                // Verificar que no existe ya localmente
                const existingIndex = window.AppState.expenses.findIndex(e => e.id === expense.id);
                if (existingIndex === -1) {
                    window.AppState.expenses.unshift(expense);
                    this.updateBudgetUI();
                    this.showNotification(`💰 Nuevo gasto añadido: ${expense.concept}`, 'success');
                }
                break;

            case 'updated':
                const updateIndex = window.AppState.expenses.findIndex(e => e.id === expense.id);
                if (updateIndex !== -1) {
                    window.AppState.expenses[updateIndex] = expense;
                    this.updateBudgetUI();
                    this.showNotification(`✏️ Gasto actualizado: ${expense.concept}`, 'info');
                }
                break;

            case 'deleted':
                const deleteIndex = window.AppState.expenses.findIndex(e => e.id === expense.id);
                if (deleteIndex !== -1) {
                    const deletedExpense = window.AppState.expenses.splice(deleteIndex, 1)[0];
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
            console.log('🔥 DEBUG: setupRealtimeSync called', { 
                isConnected: this.firebaseManager.isConnected,
                hasExistingListener: !!this.realtimeUnsubscribe 
            });
        }
        
        // 🚨 PREVENIR MÚLTIPLES LISTENERS
        if (this.realtimeUnsubscribe) {
            if (!Logger.isMobile) {
                console.log('🔥 DEBUG: Listener ya existe, desuscribiendo el anterior...');
            }
            this.realtimeUnsubscribe();
            this.realtimeUnsubscribe = null;
        }
        
        if (!this.firebaseManager.isConnected) {
            if (!Logger.isMobile) {
                console.log('🔥 DEBUG: Firebase not connected, skipping realtime sync');
            }
            return;
        }
        
        if (!Logger.isMobile) {
            console.log('🔥 DEBUG: Setting up NEW Firebase realtime listener...');
        }
        
        // 🚨 DEBOUNCE para evitar actualizaciones demasiado frecuentes
        let updateTimeout = null;
        
        this.realtimeUnsubscribe = await this.firebaseManager.setupRealtimeListener((expenses) => {
            if (!Logger.isMobile) {
                console.log('🔥 DEBUG: Realtime callback triggered with', expenses.length, 'expenses');
            }
            Logger.budget(`Realtime update: ${expenses.length} expenses received`);
            
            // Cancelar actualización anterior si existe
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
            
            // Debounce más agresivo para mejor rendimiento
            updateTimeout = setTimeout(() => {
                // Solo actualizar si realmente hay cambios
                const currentExpenseIds = window.AppState.expenses.map(e => e.id).sort();
                const newExpenseIds = expenses.map(e => e.id).sort();
                
                if (JSON.stringify(currentExpenseIds) !== JSON.stringify(newExpenseIds)) {
                    this.processFirebaseUpdate(expenses);
                } else {
                    if (!Logger.isMobile) {
                        console.log('🔥 DEBUG: No changes detected, skipping UI update');
                    }
                }
            }, 300); // Aumentado a 300ms para mejor rendimiento
        });
        
        if (!Logger.isMobile) {
            console.log('🔥 DEBUG: Realtime sync setup completed');
        }
    }
    
    /**
     * Procesa una actualización de Firebase de forma segura
     * @private
     */
    processFirebaseUpdate(expenses) {
        try {
            // 🔥 REEMPLAZAR COMPLETAMENTE AppState.expenses (no añadir)
            if (window.AppState) {
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
                
                window.AppState.expenses = processedExpenses;
                if (!Logger.isMobile) {
                    console.log('🔥 DEBUG: AppState.expenses REPLACED with', processedExpenses.length, 'expenses');
                }
                
                // 🚨 NO GUARDAR EN LOCALSTORAGE - Firebase es la fuente de verdad
                // window.AppState.saveAllData(); // COMENTADO para evitar bucle infinito
            }
            
            // Actualizar UI si está visible
            if (document.getElementById('budget-container')) {
                if (!Logger.isMobile) {
                    console.log('🔥 DEBUG: Updating budget UI...');
                }
                this.updateSummaryCards();
                
                // Actualizar contenido de categorías si está abierto
                const categoryContent = document.getElementById('category-content');
                if (categoryContent && !categoryContent.classList.contains('hidden')) {
                    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category;
                    if (activeCategory) {
                        if (!Logger.isMobile) {
                            console.log('🔥 DEBUG: Updating category content for:', activeCategory);
                        }
                        this.showCategoryContent(activeCategory);
                    }
                }
            }
        } catch (error) {
            Logger.error('Error processing Firebase update:', error);
            this.updateSyncStatus('error');
            console.error('🔥 ERROR in processFirebaseUpdate:', error);
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
            statusIndicator.className = 'fixed top-4 left-4 z-50 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300';
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
     * - window.Utils: Utilidades de formateo y cálculo
     * - window.budgetInstance: Referencia a esta instancia
     */
    initializeGlobals() {
        // Inicializar AppState si no existe
        if (!window.AppState) {
            window.AppState = {
                expenses: JSON.parse(localStorage.getItem('tripExpensesV1')) || [],
                saveAllData() {
                    try {
                        localStorage.setItem('tripExpensesV1', JSON.stringify(this.expenses));
                        console.log('💾 Gastos guardados en localStorage');
                    } catch (error) {
                        console.error('❌ Error al guardar gastos:', error);
                    }
                }
            };
        }

        // 🚀 INICIALIZAR EXPENSE MANAGER ULTRA-OPTIMIZADO V4.0
        if (!window.ExpenseManager) {
            window.ExpenseManager = {
                // ⚡ MÉTODOS OPTIMIZADOS CON OPTIMISTIC UI
                add: async (expense) => {
                    const budgetInstance = window.budgetInstance;
                    if (!budgetInstance?.optimizedExpenseManager) {
                        throw new Error('OptimizedExpenseManager not available');
                    }
                    return await budgetInstance.optimizedExpenseManager.add(expense);
                },
                
                update: async (id, updates) => {
                    const budgetInstance = window.budgetInstance;
                    if (!budgetInstance?.optimizedExpenseManager) {
                        throw new Error('OptimizedExpenseManager not available');
                    }
                    return await budgetInstance.optimizedExpenseManager.update(id, updates);
                },
                
                remove: async (id) => {
                    const budgetInstance = window.budgetInstance;
                    if (!budgetInstance?.optimizedExpenseManager) {
                        throw new Error('OptimizedExpenseManager not available');
                    }
                    return await budgetInstance.optimizedExpenseManager.remove(id);
                },
                
                // 🚀 MÉTODOS AVANZADOS EXCLUSIVOS
                addMultiple: async (expenses) => {
                    const budgetInstance = window.budgetInstance;
                    if (!budgetInstance?.optimizedExpenseManager) {
                        throw new Error('OptimizedExpenseManager not available');
                    }
                    return await budgetInstance.optimizedExpenseManager.addMultiple(expenses);
                },
                
                forceSync: async () => {
                    const budgetInstance = window.budgetInstance;
                    if (!budgetInstance?.optimizedExpenseManager) {
                        throw new Error('OptimizedExpenseManager not available');
                    }
                    return await budgetInstance.optimizedExpenseManager.forceSync();
                },
                
                getStats: () => {
                    const budgetInstance = window.budgetInstance;
                    if (!budgetInstance?.optimizedExpenseManager) {
                        return { error: 'OptimizedExpenseManager not available' };
                    }
                    return budgetInstance.optimizedExpenseManager.getPerformanceStats();
                }
            };
        }

        // Inicializar Utils si no existe
        if (!window.Utils) {
            window.Utils = {
                formatCurrency(amount, showSymbol = false) {
                    if (typeof amount !== 'number' || isNaN(amount)) {
                        return showSymbol ? '0,00 €' : '0,00';
                    }
                    
                    if (showSymbol) {
                        // Usar Intl.NumberFormat para formato correcto español (€ al final)
                        return new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }).format(amount);
                    } else {
                        return amount.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                },
                calculateSubtotal(expenses) {
                    return expenses.reduce((sum, item) => {
                        if (item.cost) return sum + item.cost;
                        if (item.subItems) return sum + item.subItems.reduce((subSum, subItem) => subSum + (subItem.cost || 0), 0);
                        return sum;
                    }, 0);
                }
            };
        }

        // Registrar esta instancia globalmente
        window.budgetInstance = this;
    }

    getCategoryIcon(category) {
        // Limpiar el nombre de la categoría eliminando emojis
        const cleanCategory = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        
        const icons = {
            'Ropa': 'checkroom',
            'Calzado': 'footprint', 
            'Equipo': 'backpack',
            'Documentos y Salud': 'medical_services',
            'Vuelos': 'flight',
            'Alojamiento': 'hotel',
            'Transporte': 'directions_bus',
            'Comida': 'restaurant',
            'Comida y Bebida': 'restaurant',
            'Actividades': 'hiking',
            'Visados': 'description',
            'Entradas y Visados': 'description',
            'Seguro': 'security',
            'Equipamiento': 'backpack',
            'Tour': 'tour',
            'Varios': 'more_horiz',
            'Contingencia': 'emergency'
        };
        return icons[cleanCategory] || icons[category] || 'inventory_2';
    }

    getCategoryColor(category) {
        // Limpiar el nombre de la categoría eliminando emojis
        const cleanCategory = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        
        const colors = {
            'Ropa': 'bg-blue-500',
            'Calzado': 'bg-green-500',
            'Equipo': 'bg-purple-500',
            'Documentos y Salud': 'bg-red-500',
            'Vuelos': 'bg-blue-500',
            'Alojamiento': 'bg-purple-500',
            'Transporte': 'bg-green-500',
            'Comida': 'bg-orange-500',
            'Comida y Bebida': 'bg-orange-500',
            'Actividades': 'bg-red-500',
            'Visados': 'bg-yellow-500',
            'Entradas y Visados': 'bg-yellow-500',
            'Seguro': 'bg-indigo-500',
            'Equipamiento': 'bg-pink-500',
            'Tour': 'bg-teal-500',
            'Varios': 'bg-gray-500',
            'Contingencia': 'bg-amber-500'
        };
        return colors[cleanCategory] || colors[category] || 'bg-slate-500';
    }

    render(container, tripConfig) {
        console.log('💰 Renderizando presupuesto...');
        const budgetData = tripConfig.budgetData.budgetData;
        const allExpenses = Object.values(budgetData).flat();
        const allCategories = [...new Set(allExpenses.map(item => item.category))];
        const categoryOptionsHTML = allCategories.map(cat => {
            const icon = this.getCategoryIcon(cat);
            return `<option value="${cat}" data-icon="${icon}">${cat}</option>`;
        }).join('');

        // Renderizar cabecera estandarizada ANTES del contenido
        const headerHTML = HeaderRenderer.renderPresetHeader('budget');

        container.innerHTML = `
            ${headerHTML}
            <!-- Resumen de presupuesto -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                
                <!-- Resumen General Simplificado -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Presupuesto Total</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white" data-summary="budget-total">${window.Utils.formatCurrency(window.Utils.calculateSubtotal(allExpenses), true)}</p>
                    </div>
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Gastado</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white" data-summary="total-spent">${window.Utils.formatCurrency(window.AppState.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0), true)}</p>
                    </div>
                    <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Gastos Registrados</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-white" data-summary="expenses-count">${window.AppState.expenses.length}</p>
                    </div>
                </div>
            </div>
            
            <!-- Filtros de Categoría -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-400">filter_list</span>
                        <h3 class="font-bold text-lg text-slate-900 dark:text-white">Análisis por Categorías</h3>
                    </div>

                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3" id="budget-category-filters">
                    ${allCategories.map(cat => {
                        const icon = this.getCategoryIcon(cat);
                        const color = this.getCategoryColor(cat);
                        return `<button data-category="${cat}" class="budget-filter-btn group flex items-center gap-3 p-4 text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-md">
                            <span class="material-symbols-outlined text-2xl ${color.replace('bg-', 'text-')} flex-shrink-0">${icon}</span>
                            <span class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${cat}</span>
                        </button>`;
                    }).join('')}
                </div>
            </div>
            
            <!-- Contenido Dinámico -->
            <div id="budget-content" class="mb-6" style="display: none;">
                <div class="text-center text-slate-500 dark:text-slate-400 py-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <span class="material-symbols-outlined text-4xl mb-2 opacity-50">analytics</span>
                    <p class="text-lg font-medium">Haz clic en las categorías para ver el análisis</p>
                </div>
            </div>
            
            <!-- Formulario de Nuevo Gasto -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
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
                                   class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400"
                                   placeholder="Ej: Cena en restaurante">
                        </div>
                        
                        <div>
                            <label for="expense-amount" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cantidad (€)</label>
                            <div class="relative">
                                <input type="number" id="expense-amount" step="0.01" required 
                                       class="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400"
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
                                        class="w-full px-4 py-3 pl-12 pr-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200 text-slate-900 dark:text-white text-left cursor-pointer">
                                    <span id="selected-category-text">Seleccionar categoría</span>
                                </button>
                                <span id="category-icon" class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none">
                                    category
                                </span>
                                <span class="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none">
                                    expand_more
                                </span>
                                
                                <!-- Lista desplegable -->
                                <div id="category-dropdown-list" class="fixed bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto hidden" style="z-index: 99999 !important; min-width: 200px;">
                                    ${allCategories.map(cat => {
                                        const icon = this.getCategoryIcon(cat);
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
                                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap">
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
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
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
                    const icon = this.getCategoryIcon(value);
                    
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
                    const existingIndex = window.AppState.expenses.findIndex(exp => exp.id === editId);
                    if (existingIndex !== -1) {
                        window.AppState.expenses[existingIndex] = { ...window.AppState.expenses[existingIndex], ...newExpense };
                    }
                    this.cancelEditMode();
                } else {
                    // ➕ ADICIÓN OPTIMISTA
                    window.AppState.expenses.unshift(newExpense);
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
                        await window.ExpenseManager.update(editId, { concept, amount, category });
                    } else {
                        const firebaseId = await window.ExpenseManager.add(newExpense);
                        // Actualizar el ID local con el ID de Firebase si es diferente
                        if (firebaseId && firebaseId !== newExpense.id) {
                            const localIndex = window.AppState.expenses.findIndex(exp => exp.id === newExpense.id);
                            if (localIndex !== -1) {
                                window.AppState.expenses[localIndex].id = firebaseId;
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
                            const index = window.AppState.expenses.findIndex(exp => exp.id === editId);
                            if (index !== -1) {
                                window.AppState.expenses[index] = originalExpense;
                            }
                        }
                    } else {
                        // Revertir adición
                        window.AppState.expenses = window.AppState.expenses.filter(exp => exp.id !== newExpense.id);
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
            const allCategoryExpenses = window.AppState.expenses.filter(exp => selectedCategories.includes(exp.category));
            
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
                const categoryIcon = this.getCategoryIcon(cat);
                const categoryColor = this.getCategoryColor(cat);
                
                return `
                    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-200">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="material-symbols-outlined text-3xl ${categoryColor.replace('bg-', 'text-')}">${categoryIcon}</span>
                            <div class="flex-1">
                                <h4 class="font-bold text-lg text-slate-900 dark:text-white">${cat}</h4>
                                <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                    <span class="text-slate-600 dark:text-slate-400">${window.Utils.formatCurrency(expensesTotal, true)}</span>
                                    <span class="text-slate-400 dark:text-slate-500 text-lg"> / </span>
                                    <span class="text-slate-500 dark:text-slate-400 text-lg">${window.Utils.formatCurrency(budgetTotal, true)}</span>
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
                                                        <span class="font-bold text-slate-900 dark:text-white">${window.Utils.formatCurrency(item.cost || 0, true)}</span>
                                                    </div>
                                                    <div class="space-y-1 ml-3">
                                                        ${item.subItems.map(subItem => {
                                                            const subItemId = `budget-${cat}-${item.concept}-${subItem.concept}`.replace(/[^a-zA-Z0-9-]/g, '-');
                                                            return `
                                                                <div class="budget-subitem-wrapper" data-item-id="${subItemId}">
                                                                    <!-- SubItem Presupuestado -->
                                                                    <div class="budget-subitem-clickable flex justify-between text-sm text-slate-600 dark:text-slate-400 py-1 px-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer transition-all duration-200"
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
                                                                            <span>${window.Utils.formatCurrency(subItem.cost || 0, true)}</span>
                                                                            <span class="material-symbols-outlined text-xs text-slate-400">add_circle</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <!-- Formulario Inline para SubItem (Oculto por defecto) -->
                                                                    <div class="budget-inline-form hidden mt-2 ml-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border-2 border-green-300 dark:border-green-700 shadow-sm" data-item-id="${subItemId}">
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
                                                                                <select class="budget-inline-category w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                                                                                    ${allCategories.map(category => `<option value="${category}" ${category === cat ? 'selected' : ''}>${this.getCategoryIcon(category)} ${category}</option>`).join('')}
                                                                                </select>
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
                                                    <div class="budget-item-clickable flex justify-between items-center py-2 px-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-all duration-200" 
                                                         data-concept="${item.concept}" 
                                                         data-amount="${item.cost || 0}" 
                                                         data-category="${cat}"
                                                         data-item-id="${itemId}"
                                                         title="Click para crear gasto basado en este item">
                                                        <span class="text-slate-700 dark:text-slate-300">${item.concept}</span>
                                                        <div class="flex items-center gap-2">
                                                            <span class="font-medium text-slate-900 dark:text-white">${window.Utils.formatCurrency(item.cost || 0, true)}</span>
                                                            <span class="material-symbols-outlined text-sm text-slate-400">add_circle</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Formulario Inline para Crear Gasto (Oculto por defecto) -->
                                                    <div class="budget-inline-form hidden mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-md" data-item-id="${itemId}">
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
                                                                <select class="budget-inline-category w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                                                                    ${allCategories.map(category => `<option value="${category}" ${category === cat ? 'selected' : ''}>${this.getCategoryIcon(category)} ${category}</option>`).join('')}
                                                                </select>
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
                                            <div class="expense-item-category group flex justify-between items-center py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer transition-all duration-200" data-expense-id="${exp.id}">
                                                <span class="text-slate-700 dark:text-slate-300 ${exp.paid ? 'line-through opacity-60' : ''}">${exp.concept}</span>
                                                <div class="flex items-center gap-2">
                                                    <span class="font-medium text-green-700 dark:text-green-400 ${exp.paid ? 'line-through opacity-60' : ''}">${window.Utils.formatCurrency(exp.amount, true)}</span>
                                                    <button class="delete-expense-btn opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center transition-all duration-200" data-expense-id="${exp.id}" title="Eliminar gasto">
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
                                                        <select class="inline-category w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                                                            ${allCategories.map(cat => `<option value="${cat}" ${cat === exp.category ? 'selected' : ''}>${cat}</option>`).join('')}
                                                        </select>
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
                
                // 💾 GUARDAR EDICIÓN INLINE
                document.querySelectorAll('.save-inline-edit').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const expenseId = btn.dataset.expenseId;
                        await this.saveInlineEdit(expenseId);
                    });
                });
                
                // ❌ CANCELAR EDICIÓN INLINE
                document.querySelectorAll('.cancel-inline-edit').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const expenseId = btn.dataset.expenseId;
                        this.hideInlineEdit(expenseId);
                    });
                });
                
                // 🗑️ ELIMINAR GASTO
                document.querySelectorAll('.delete-expense-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const expenseId = btn.dataset.expenseId;
                        if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
                            try {
                                await window.ExpenseManager.remove(expenseId);
                                
                                // 🚀 ACTUALIZACIÓN INMEDIATA DE UI (sin setTimeout)
                                this.updateSummaryCards();
                                
                                // 🔄 ACTUALIZAR CONTENIDO DE CATEGORÍAS SELECCIONADAS
                                const selectedCategories = Array.from(document.querySelectorAll('.budget-filter-btn.ring-2'));
                                if (selectedCategories.length > 0) {
                                    // Si hay categorías seleccionadas, actualizar su contenido
                                    this.showCategoryContent();
                                } else {
                                    // Si no hay categorías seleccionadas, ocultar contenido
                                    const contentContainer = document.getElementById('budget-content');
                                    if (contentContainer) {
                                        contentContainer.style.display = 'none';
                                    }
                                }
                            } catch (error) {
                                console.error('Error al eliminar gasto:', error);
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
            }, 100);
            
        } catch (error) {
            console.error('Error al mostrar contenido de categorías:', error);
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
                const existingIndex = window.AppState.expenses.findIndex(exp => exp.id === expenseId);
                if (existingIndex !== -1) {
                    window.AppState.expenses[existingIndex] = {
                        ...window.AppState.expenses[existingIndex],
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
                await window.ExpenseManager.update(expenseId, { concept, amount, category });
                
                // ✅ Sincronización completada
                this.updateSyncStatus('connected');
                this.showNotification('✅ Gasto actualizado correctamente', 'success');

            } catch (error) {
                Logger.error('Error updating expense inline:', error);
                
                // ❌ REVERTIR CAMBIOS OPTIMISTAS
                const originalExpense = JSON.parse(localStorage.getItem('tripExpensesV1') || '[]')
                    .find(exp => exp.id === expenseId);
                if (originalExpense) {
                    const index = window.AppState.expenses.findIndex(exp => exp.id === expenseId);
                    if (index !== -1) {
                        window.AppState.expenses[index] = originalExpense;
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
        if (categoryIcon) categoryIcon.textContent = this.getCategoryIcon(category);
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
                window.AppState.expenses.unshift(newExpense);

                // 🎯 ACTUALIZAR UI INMEDIATAMENTE
                this.updateSummaryCards();
                this.showCategoryContent();
                this.hideBudgetInlineForm(itemId);

                // 🔄 Indicar que se está sincronizando
                this.updateSyncStatus('syncing');

                // 🔥 FIREBASE EN BACKGROUND
                const firebaseId = await window.ExpenseManager.add(newExpense);
                
                // Actualizar el ID local con el ID de Firebase si es diferente
                if (firebaseId && firebaseId !== newExpense.id) {
                    const localIndex = window.AppState.expenses.findIndex(exp => exp.id === newExpense.id);
                    if (localIndex !== -1) {
                        window.AppState.expenses[localIndex].id = firebaseId;
                    }
                }

                // ✅ Sincronización completada
                this.updateSyncStatus('connected');
                this.showNotification(`✅ Gasto creado: ${concept} - ${window.Utils.formatCurrency(amount, true)}`, 'success');

            } catch (error) {
                Logger.error('Error creating expense from budget item:', error);
                
                // ❌ REVERTIR CAMBIOS OPTIMISTAS
                window.AppState.expenses = window.AppState.expenses.filter(exp => 
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
        const expense = window.AppState.expenses.find(exp => exp.id === id);
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
            budgetTotalElement.textContent = window.Utils.formatCurrency(window.Utils.calculateSubtotal(allExpenses), true);
        }
        
        // Actualizar Gastos Registrados
        const expensesCountElement = document.querySelector('[data-summary="expenses-count"]');
        if (expensesCountElement) {
            expensesCountElement.textContent = window.AppState.expenses.length;
        }
        
        // Actualizar Total Gastado
        const totalSpentElement = document.querySelector('[data-summary="total-spent"]');
        if (totalSpentElement) {
            const totalSpent = window.AppState.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
            totalSpentElement.textContent = window.Utils.formatCurrency(totalSpent, true);
        }
    }
}
