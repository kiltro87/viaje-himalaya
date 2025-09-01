/**
 * Main.js - Punto de Entrada Principal de la Aplicación
 * 
 * Este archivo es el punto de entrada principal que coordina la inicialización
 * completa de la aplicación de viaje. Gestiona la creación del UIRenderer,
 * la configuración del sistema de navegación y la exposición de funciones globales.
 * 
 * Funcionalidades principales:
 * - Inicialización del UIRenderer principal
 * - Configuración del sistema de navegación responsive
 * - Gestión de eventos de navegación entre vistas
 * - Exposición de funciones globales para acceso externo
 * - Integración completa con sistema de logging y métricas
 * 
 * Flujo de inicialización:
 * 1. Creación del UIRenderer
 * 2. Renderizado del contenido inicial (vista resumen)
 * 3. Configuración de event listeners de navegación
 * 4. Exposición de funciones globales
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import { UIRenderer } from './components/UIRenderer.js';
import Logger from './utils/Logger.js';
import { weatherConfig, checkWeatherConfig } from './config/weatherConfig.js';
import { getDaySimulator } from './utils/DaySimulator.js';
import stateManager from './utils/StateManager.js';
import { initServiceWorkerCommunication } from './utils/ServiceWorkerUtils.js';
import PullToRefresh from './utils/PullToRefresh.js';
import SmartDarkMode from './utils/SmartDarkMode.js';
import SpendingInsights from './components/SpendingInsights.js';
import SkeletonLoader from './utils/SkeletonLoader.js';
import MobileUX from './utils/MobileUX.js';
import AccessibilityManager from './utils/AccessibilityManager.js';
import PerformanceOptimizer from './utils/PerformanceOptimizer.js';
import AdvancedAnalytics from './components/AdvancedAnalytics.js';

// Verificar que Logger está disponible y iniciar logging
if (Logger && typeof Logger.init === 'function') {
    Logger.init('Application startup initiated');
    Logger.startPerformance('app-initialization');
} else {
    // Fallback si Logger no está disponible
    console.log('🚀 Application startup initiated (Logger not available)');
}

/* ========================================
 * INICIALIZACIÓN DE COMPONENTES PRINCIPALES
 * ======================================== */

// Crear instancia del renderizador principal
if (Logger && Logger.init) Logger.init('Creating UIRenderer instance');
const uiRenderer = new UIRenderer();
if (Logger && Logger.success) Logger.success('UIRenderer created successfully');

// Inicializar funciones de mejora rápida
let pullToRefresh;
let smartDarkMode;
let spendingInsights;
let mobileUX;
let accessibilityManager;
let performanceOptimizer;
let advancedAnalytics;

// Inicializar Smart Dark Mode
if (Logger && Logger.init) Logger.init('Initializing Smart Dark Mode');
smartDarkMode = new SmartDarkMode({
    autoSwitch: true,
    useLocation: true,
    respectSystemPreference: true
});

// Inicializar Pull-to-Refresh
if (Logger && Logger.init) Logger.init('Initializing Pull-to-Refresh');
pullToRefresh = new PullToRefresh({
    threshold: 80,
    refreshCallback: async () => {
        // Refresh current view
        await refreshCurrentView();
        
        // Refresh spending insights if available
        if (spendingInsights) {
            spendingInsights.refresh();
        }
    }
});

// Inicializar Spending Insights
if (Logger && Logger.init) Logger.init('Initializing Spending Insights');
spendingInsights = new SpendingInsights(uiRenderer.budgetManager);

// Inicializar Mobile UX
if (Logger && Logger.init) Logger.init('Initializing Mobile UX');
mobileUX = new MobileUX();

// Inicializar Accessibility Manager
if (Logger && Logger.init) Logger.init('Initializing Accessibility Manager');
accessibilityManager = new AccessibilityManager();

// Inicializar Performance Optimizer
if (Logger && Logger.init) Logger.init('Initializing Performance Optimizer');
performanceOptimizer = new PerformanceOptimizer();

// Inicializar Advanced Analytics
if (Logger && Logger.init) Logger.init('Initializing Advanced Analytics');
advancedAnalytics = new AdvancedAnalytics(uiRenderer.budgetManager);
advancedAnalytics.init().catch(error => {
    Logger.warn('Advanced Analytics initialization failed', error);
});

/* ========================================
 * FUNCIONES PÚBLICAS DE LA APLICACIÓN
 * ======================================== */

/**
 * Cambiar vista actual de la aplicación
 * 
 * Función pública para cambiar entre las diferentes vistas disponibles.
 * Incluye logging automático de la navegación para trazabilidad.
 * 
 * @param {string} view - Vista de destino ('resumen', 'itinerario', 'hoy', 'mapa', 'gastos', 'extras')
 * @public
 */
async function changeView(view) {
    if (Logger && Logger.event) Logger.event(`View change requested: ${view}`);
    await uiRenderer.changeView(view);
}

/**
 * Renderizar contenido inicial
 * 
 * Función para disparar el renderizado inicial de la aplicación.
 * Utilizada durante la inicialización y para refrescos manuales.
 * 
 * @public
 */
function renderInitial() {
    if (Logger && Logger.ui) Logger.ui('Rendering initial content');
    uiRenderer.renderMainContent();
}

/**
 * Refrescar vista actual con skeleton loading
 * 
 * @private
 */
async function refreshCurrentView() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    // Show skeleton while refreshing
    SkeletonLoader.showSkeleton(mainContent, 'progress', { text: 'Actualizando...' });
    
    try {
        // Simulate refresh delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Re-render current view
        await uiRenderer.renderMainContent();
        
        if (Logger && Logger.success) Logger.success('View refreshed successfully');
    } catch (error) {
        if (Logger && Logger.error) Logger.error('Failed to refresh view', error);
    }
}

/**
 * Toggle dark mode
 * 
 * @public
 */
function toggleDarkMode() {
    if (smartDarkMode) {
        smartDarkMode.toggle();
        Logger.info('Dark mode toggled manually');
        
        // Visual feedback
        const isDark = document.documentElement.classList.contains('dark');
        const message = isDark ? 'Modo oscuro activado' : 'Modo claro activado';
        showToast(message);
    }
}

/**
 * Show toast notification
 * 
 * @param {string} message - Message to show
 * @private
 */
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification fixed top-20 right-4 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('opacity-100'), 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/**
 * Get spending insights
 * 
 * @public
 */
function getSpendingInsights() {
    return spendingInsights ? spendingInsights.getInsights() : null;
}

/**
 * Render spending insights in container
 * 
 * @param {HTMLElement} container - Container to render insights
 * @param {boolean} advanced - Use advanced analytics with charts
 * @public
 */
async function renderSpendingInsights(container, advanced = false) {
    if ((!spendingInsights && !advancedAnalytics) || !container) return;
    
    SkeletonLoader.showSkeleton(container, 'stats', { text: 'Obteniendo datos de gastos...' });
    
    try {
        // Get real expense data from BudgetManager/Firestore
        const budgetManager = uiRenderer?.budgetManager;
        let expenses = [];
        let budget = {};
        
        if (budgetManager) {
            // Get expenses from Firestore through BudgetManager
            expenses = await budgetManager.getAllExpenses() || [];
            budget = budgetManager.tripConfig?.budgetData || {};
        }
        
        if (advanced && advancedAnalytics) {
            // Pass real data to advanced analytics
            advancedAnalytics.expenses = expenses;
            advancedAnalytics.budget = budget;
            container.innerHTML = advancedAnalytics.renderAdvancedInsights();
                
                // Render charts after DOM is updated
                setTimeout(async () => {
                    const chartContainers = container.querySelectorAll('[data-chart]');
                    for (const chartContainer of chartContainers) {
                        const chartType = chartContainer.dataset.chart;
                        switch (chartType) {
                            case 'spending-overview':
                                await advancedAnalytics.renderSpendingOverview(chartContainer);
                                break;
                            case 'category-breakdown':
                                await advancedAnalytics.renderCategoryBreakdown(chartContainer);
                                break;
                            case 'spending-trends':
                                await advancedAnalytics.renderSpendingTrends(chartContainer);
                                break;
                        }
                    }
                }, 100);
            } else {
                // Simple analytics with real data
                spendingInsights.expenses = expenses;
                spendingInsights.budget = budget;
                const insights = spendingInsights.getInsights();
                container.innerHTML = spendingInsights.renderInsights(insights);
            }
        
    } catch (error) {
        Logger.error('Failed to render spending insights', error);
        container.innerHTML = '<div class="text-center text-red-500">Error al cargar insights de gastos</div>';
    }
    
    container.classList.remove('skeleton-loading');
}

/**
 * Toggle high contrast mode for accessibility
 * 
 * @public
 */
function toggleHighContrast() {
    if (accessibilityManager) {
        accessibilityManager.toggleHighContrast();
        Logger.info('High contrast mode toggled');
        
        // Visual feedback
        const isHighContrast = document.body.classList.contains('high-contrast');
        const message = isHighContrast ? 'Alto contraste activado' : 'Alto contraste desactivado';
        showToast(message);
    }
}

/**
 * Trigger haptic feedback
 * 
 * @param {string} intensity - Intensity level (light, medium, heavy)
 * @public
 */
function triggerHaptic(intensity = 'light') {
    if (mobileUX) {
        mobileUX.triggerHaptic(intensity);
    }
}

/**
 * Get performance metrics
 * 
 * @public
 */
function getPerformanceMetrics() {
    return performanceOptimizer ? performanceOptimizer.getPerformanceMetrics() : null;
}

/**
 * Preload module for better performance
 * 
 * @param {string} moduleName - Name of module to preload
 * @public
 */
function preloadModule(moduleName) {
    if (performanceOptimizer) {
        return performanceOptimizer.preloadModule(moduleName);
    }
}

/**
 * Show performance metrics in demo container
 * 
 * @public
 */
function showPerformanceMetrics() {
    const container = document.getElementById('performance-demo');
    if (!container || !performanceOptimizer) return;
    
    const metrics = performanceOptimizer.getPerformanceMetrics();
    if (!metrics) {
        container.innerHTML = '<div class="text-red-500">No disponible</div>';
        return;
    }
    
    // Simplified metrics with explanations
    const loadTime = metrics.loadTime || performance.now();
    const memoryMB = Math.round((performance.memory?.usedJSHeapSize || 0) / 1024 / 1024);
    const status = loadTime < 1000 ? '🟢 Rápida' : loadTime < 3000 ? '🟡 Normal' : '🔴 Lenta';
    
    container.innerHTML = `
        <div class="space-y-2">
            <div class="flex justify-between">
                <span>Velocidad:</span>
                <span class="font-semibold">${status}</span>
            </div>
            <div class="flex justify-between">
                <span>Carga:</span>
                <span>${Math.round(loadTime)}ms</span>
            </div>
            <div class="flex justify-between">
                <span>Memoria:</span>
                <span>${memoryMB}MB</span>
            </div>
            <div class="text-xs text-gray-500 mt-2">
                ${new Date().toLocaleTimeString()}
            </div>
        </div>
    `;
}

/**
 * Configurar sistema de navegación
 * 
 * Inicializa el sistema de navegación de la aplicación configurando
 * event listeners para todos los botones de navegación. Incluye
 * gestión de estados activos y logging de interacciones.
 * 
 * @private
 */
function setupNavigation() {
    if (Logger && Logger.init) Logger.init('Setting up navigation system');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    if (Logger && Logger.init) Logger.init(`Found ${navButtons.length} navigation elements`);
    
    navButtons.forEach((button, index) => {
        const view = button.dataset.view;
        if (Logger && Logger.init) Logger.init(`Setting up navigation ${index + 1}: ${view}`);
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            if (Logger && Logger.event) {
                Logger.event(`Navigation clicked: ${view}`, { 
                    buttonIndex: index,
                    breakpoint: window.innerWidth >= 768 ? 'desktop' : 'mobile'
                });
            }
            
            // Remover clase activa de todos
            navButtons.forEach(nav => nav.classList.remove('active'));
            
            // Agregar clase activa al seleccionado
            button.classList.add('active');
            
            // Cambiar vista
            await changeView(view);
        });
    });
    
    if (Logger && Logger.success) Logger.success('Navigation system configured successfully');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (Logger && Logger.init) Logger.init('DOM loaded, starting initialization');
    
    try {
        // Renderizar contenido inicial
        renderInitial();
        
        // Configurar navegación
        setupNavigation();
        
        // Verificar configuración del clima
        const weatherStatus = checkWeatherConfig();
        if (Logger && Logger.info) Logger.info(weatherStatus.message);
        
        // Inicializar Day Simulator para desarrollo
        const daySimulator = getDaySimulator();
        stateManager.updateState('instances.daySimulator', daySimulator);
        if (Logger && Logger.info) Logger.info('🎯 Day Simulator initialized - Use showDaySimulator() to open panel');
        
        // Inicializar PackingListManager cuando Firebase esté disponible
        setTimeout(async () => {
            const firebaseManager = stateManager.getFirebaseManager();
            const packingListManager = stateManager.getState('instances.packingListManager');
            
            if (firebaseManager && !packingListManager) {
                const { getPackingListManager } = await import('./utils/PackingListManager.js');
                const packingManager = getPackingListManager();
                await packingManager.initialize(firebaseManager);
                stateManager.updateState('instances.packingListManager', packingManager);
                if (Logger && Logger.success) Logger.success('🎒 PackingListManager initialized with Firebase');
            }
        }, 2000); // Esperar a que Firebase se inicialice
        
        // Añadir botón flotante del simulador (solo en desarrollo)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
            setTimeout(() => {
                const simulatorBtn = document.createElement('button');
                simulatorBtn.innerHTML = `
                    <span class="material-symbols-outlined">science</span>
                `;
                simulatorBtn.className = 'fixed bottom-4 right-4 z-40 w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110';
                simulatorBtn.title = 'Day Simulator (Development)';
                simulatorBtn.onclick = () => window.showDaySimulator();
                
                document.body.appendChild(simulatorBtn);
                
                if (Logger && Logger.info) Logger.info('🎯 Day Simulator button added (development mode)');
            }, 1000);
        }
        
        if (Logger && Logger.endPerformance) Logger.endPerformance('app-initialization');
        if (Logger && Logger.success) {
            const summary = Logger.getPerformanceSummary ? Logger.getPerformanceSummary() : {};
            Logger.success('Application initialized successfully', summary);
        }
        
        // Inicializar comunicación con Service Worker
        if (Logger && Logger.init) Logger.init('Initializing Service Worker communication');
        initServiceWorkerCommunication();
        if (Logger && Logger.success) Logger.success('Service Worker communication initialized');
        
    } catch (error) {
        if (Logger && Logger.error) {
            Logger.error('Application initialization failed', error);
        } else {
            Logger.error('❌ Application initialization failed:', error);
        }
    }
});

// Exponer funciones globalmente para acceso desde HTML y otros scripts
window.changeView = changeView;
window.renderInitial = renderInitial;
window.uiRenderer = uiRenderer;
window.toggleDarkMode = toggleDarkMode;
window.getSpendingInsights = getSpendingInsights;
window.renderSpendingInsights = renderSpendingInsights;
window.refreshCurrentView = refreshCurrentView;
window.toggleHighContrast = toggleHighContrast;
window.triggerHaptic = triggerHaptic;
window.getPerformanceMetrics = getPerformanceMetrics;
window.preloadModule = preloadModule;
window.showPerformanceMetrics = showPerformanceMetrics;

// Exponer utilidades para desarrollo
window.SkeletonLoader = SkeletonLoader;
window.smartDarkMode = smartDarkMode;
window.pullToRefresh = pullToRefresh;
window.spendingInsights = spendingInsights;
window.mobileUX = mobileUX;
window.accessibilityManager = accessibilityManager;
window.performanceOptimizer = performanceOptimizer;
window.advancedAnalytics = advancedAnalytics;

// Función para limpiar cache (debugging)
window.clearAppCache = async () => {
    try {
        // Limpiar cache del Service Worker
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            Logger.success('✅ Service Worker cache cleared');
        }
        
        // Recargar página
        window.location.reload(true);
    } catch (error) {
        Logger.error('❌ Error clearing cache:', error);
    }
};

if (Logger && Logger.init) Logger.init('Global functions exposed to window object');
