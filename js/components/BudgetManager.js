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
        Logger.init('BudgetManager constructor started');
        Logger.budget('Initializing budget management system');
        
        // Inicializar objetos globales necesarios
        this.initializeGlobals();
        
        // Inicializar Firebase para almacenamiento en la nube
        this.firebaseManager = new FirebaseManager();
        this.setupFirebaseIntegration();
        
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
            Logger.budget('Expense synced to cloud:', expense.id);
            this.updateSummaryCards();
        };
        
        this.firebaseManager.onExpenseUpdated = (expenseId, updates) => {
            Logger.budget('Expense updated in cloud:', expenseId);
            this.updateSummaryCards();
        };
        
        this.firebaseManager.onExpenseDeleted = (expenseId) => {
            Logger.budget('Expense deleted from cloud:', expenseId);
            this.updateSummaryCards();
        };
        
        this.firebaseManager.onSyncStatusChanged = (status) => {
            Logger.budget('Sync status changed:', status);
            this.updateSyncStatus(status);
        };
        
        // Configurar listener en tiempo real
        this.setupRealtimeSync();
        
        Logger.success('Firebase integration configured');
    }

    /**
     * Configurar sincronización en tiempo real
     * 
     * Establece un listener que actualiza automáticamente la UI
     * cuando otros dispositivos modifican los gastos.
     * 
     * @private
     */
    setupRealtimeSync() {
        if (!this.firebaseManager.isConnected) return;
        
        this.realtimeUnsubscribe = this.firebaseManager.setupRealtimeListener((expenses) => {
            Logger.budget(`Realtime update: ${expenses.length} expenses received`);
            
            // Actualizar AppState global
            if (window.AppState) {
                window.AppState.expenses = expenses;
            }
            
            // Actualizar UI si está visible
            if (document.getElementById('budget-container')) {
                this.updateSummaryCards();
                
                // Actualizar contenido de categorías si está abierto
                const categoryContent = document.getElementById('category-content');
                if (categoryContent && !categoryContent.classList.contains('hidden')) {
                    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category;
                    if (activeCategory) {
                        this.showCategoryContent(activeCategory);
                    }
                }
            }
        });
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

        // Inicializar ExpenseManager si no existe
        if (!window.ExpenseManager) {
            window.ExpenseManager = {
                add(expense) {
                    Logger.budget('Adding new expense', { concept: expense.concept, amount: expense.amount });
                    const newExpense = { ...expense, id: Date.now().toString() };
                    window.AppState.expenses.push(newExpense);
                    window.AppState.saveAllData();
                    Logger.crud('CREATE', 'expense', newExpense);
                    
                    // Actualizar la lista de gastos y totales
                    const budgetInstance = window.budgetInstance;
                    if (budgetInstance) {
                        budgetInstance.updateSummaryCards();

                        budgetInstance.showCategoryContent();
                    }
                },
                
                remove(id) {
                    const expense = window.AppState.expenses.find(exp => exp.id === id);
                    if (!expense) {
                        Logger.error('Expense not found for deletion', { id });
                        return;
                    }
                    Logger.budget('Removing expense', { id, concept: expense.concept });
                    window.AppState.expenses = window.AppState.expenses.filter(exp => exp.id !== id);
                    window.AppState.saveAllData();
                    Logger.crud('DELETE', 'expense', { id, concept: expense.concept });
                    
                    // Actualizar la lista de gastos y totales
                    const budgetInstance = window.budgetInstance;
                    if (budgetInstance) {
                        budgetInstance.updateSummaryCards();

                        budgetInstance.showCategoryContent();
                    }
                },
                
                update(id, updatedExpense) {
                    const index = window.AppState.expenses.findIndex(exp => exp.id === id);
                    if (index === -1) {
                        Logger.error('Expense not found for update', { id });
                        return;
                    }
                    const oldExpense = window.AppState.expenses[index];
                    window.AppState.expenses[index] = { ...oldExpense, ...updatedExpense };
                    window.AppState.saveAllData();
                    Logger.crud('UPDATE', 'expense', { id, old: oldExpense, new: updatedExpense });
                    
                    // Actualizar la lista de gastos y totales
                    const budgetInstance = window.budgetInstance;
                    if (budgetInstance) {
                        budgetInstance.updateSummaryCards();

                        budgetInstance.showCategoryContent();
                    }
                }
            };
        }

        // Inicializar Utils si no existe
        if (!window.Utils) {
            window.Utils = {
                formatCurrency(amount, showSymbol = false) {
                    const formatted = amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return showSymbol ? `${formatted} €` : formatted;
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
        const categoryOptionsHTML = allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

        container.innerHTML = `
            <!-- Encabezado Simplificado -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                <div class="flex items-center gap-4 mb-6">
                    <span class="material-symbols-outlined text-3xl text-slate-600 dark:text-slate-400">account_balance_wallet</span>
                    <div>
                        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Presupuesto del Viaje</h1>
                        <p class="text-slate-600 dark:text-slate-400">Gestiona y controla tus gastos</p>
                    </div>
                </div>
                
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
                    <div class="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                        Selecciona múltiples categorías
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
                    <p class="text-lg font-medium">Selecciona categorías para ver el análisis</p>
                    <p class="text-sm">Puedes seleccionar múltiples categorías para comparar</p>
                </div>
            </div>
            
            <!-- Formulario de Nuevo Gasto -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                <div class="flex items-center gap-3 mb-6">
                    <span class="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-400">add_circle</span>
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white">Nuevo Gasto</h3>
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
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">€</span>
                                <input type="number" id="expense-amount" step="0.01" required 
                                       class="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400"
                                       placeholder="0.00">
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <select id="expense-category" required 
                                class="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200 text-slate-900 dark:text-white appearance-none cursor-pointer">
                            <option value="">Seleccionar categoría</option>
                            ${categoryOptionsHTML}
                        </select>
                        <button type="submit" 
                                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap">
                            <span class="material-symbols-outlined">add</span>
                            Añadir
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
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const concept = document.getElementById('expense-concept').value;
            const amount = parseFloat(document.getElementById('expense-amount').value);
            const category = document.getElementById('expense-category').value;
            
            if (concept && amount > 0 && category) {
                const submitBtn = e.target.querySelector('button[type="submit"]');
                const editId = submitBtn.dataset.editId;
                
                if (editId) {
                    // Actualizar gasto existente
                    window.ExpenseManager.update(editId, { concept, amount, category });
                    this.cancelEditMode();
                } else {
                    // Añadir nuevo gasto
                    window.ExpenseManager.add({ concept, amount, category });
                }
                
                e.target.reset();
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
                                    <span class="text-slate-600 dark:text-slate-400">${window.Utils.formatCurrency(expensesTotal)} €</span>
                                    <span class="text-slate-400 dark:text-slate-500 text-lg"> / </span>
                                    <span class="text-slate-500 dark:text-slate-400 text-lg">${window.Utils.formatCurrency(budgetTotal)} €</span>
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
                                                        <span class="font-bold text-slate-900 dark:text-white">${window.Utils.formatCurrency(item.cost || 0)} €</span>
                                                    </div>
                                                    <div class="space-y-1 ml-3">
                                                        ${item.subItems.map(subItem => `
                                                            <div class="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                                                <span class="flex items-center gap-2">
                                                                    <span class="w-1 h-1 bg-slate-400 rounded-full"></span>
                                                                    ${subItem.concept}
                                                                </span>
                                                                <span>${window.Utils.formatCurrency(subItem.cost || 0)} €</span>
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                            `;
                                        } else {
                                            return `
                                                <div class="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-600 last:border-b-0">
                                                    <span class="text-slate-700 dark:text-slate-300">${item.concept}</span>
                                                    <span class="font-medium text-slate-900 dark:text-white">${window.Utils.formatCurrency(item.cost || 0)} €</span>
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
                                        <div class="expense-item-category group flex justify-between items-center py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer transition-all duration-200" data-expense-id="${exp.id}">
                                            <span class="text-slate-700 dark:text-slate-300">${exp.concept}</span>
                                            <div class="flex items-center gap-2">
                                                <span class="font-medium text-green-700 dark:text-green-400">${window.Utils.formatCurrency(exp.amount)} €</span>
                                                <button class="delete-expense-btn opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center transition-all duration-200" data-expense-id="${exp.id}" title="Eliminar gasto">
                                                    <span class="material-symbols-outlined text-xs">delete</span>
                                                </button>
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
            
            // Agregar event listeners para editar y eliminar gastos desde las categorías
            setTimeout(() => {
                document.querySelectorAll('.expense-item-category').forEach(item => {
                    item.addEventListener('click', (e) => {
                        // Si se hizo clic en el botón de eliminar, no editar
                        if (e.target.closest('.delete-expense-btn')) return;
                        
                        const expenseId = item.dataset.expenseId;
                        this.editExpense(expenseId);
                    });
                });
                
                document.querySelectorAll('.delete-expense-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const expenseId = btn.dataset.expenseId;
                        if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
                            window.ExpenseManager.remove(expenseId);
                        }
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
