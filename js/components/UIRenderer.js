/**
 * UIRenderer - Renderizador Principal de la Aplicación de Viaje (REFACTORIZADO)
 * 
 * Esta clase es el núcleo del sistema de renderizado de la aplicación.
 * Gestiona la navegación entre vistas, el renderizado dinámico de contenido
 * y la integración con todos los componentes del sistema.
 * 
 * REFACTORING APLICADO:
 * - SummaryRenderer extraído (514 líneas reducidas)
 * - MapRenderer y ItineraryRenderer integrados
 * - Delegación completa a renderizadores especializados
 * - Eliminación de código duplicado
 * - Migración a StateManager
 * 
 * @author David Ferrer Figueroa
 * @version 3.0.0 - MODULAR
 * @since 2024
 */

import { tripConfig } from '../config/tripConfig.js';
import { VIEWS, SELECTORS, COLORS, ICONS, RESPONSIVE_CLASSES } from '../config/AppConstants.js';
import Logger from '../utils/Logger.js';
import { DOMUtils } from '../utils/DOMUtils.js';
import { FormatUtils } from '../utils/FormatUtils.js';
import { DateUtils } from '../utils/DateUtils.js';
import { ResponsiveUtils } from '../utils/ResponsiveUtils.js';
import { BudgetManager } from './BudgetManager.js';
import { HeaderRenderer } from './renderers/HeaderRenderer.js';
import { WeatherRenderer } from './renderers/WeatherRenderer.js';
import { mapRenderer } from './renderers/MapRenderer.js';
import { itineraryRenderer } from './renderers/ItineraryRenderer.js';
import { SummaryRenderer } from './renderers/SummaryRenderer.js';
import { UIHelpers } from '../utils/UIHelpers.js';
import stateManager from '../utils/StateManager.js';

export class UIRenderer {
    /**
     * Constructor del UIRenderer
     * 
     * Inicializa el renderizador principal con todas las dependencias necesarias.
     * Configura el estado inicial, detecta el breakpoint responsive actual
     * y prepara el sistema de gestión de presupuesto.
     * 
     * @constructor
     */
    constructor() {
        Logger.init('UIRenderer constructor started');
        Logger.startPerformance('UIRenderer-init');
        
        // Vista actual del sistema (por defecto: resumen)
        this.currentView = VIEWS.SUMMARY;
        
        // Instancia del gestor de presupuesto para operaciones financieras
        this.budgetManager = new BudgetManager();
        
        // Instancias de los renderizadores especializados
        this.summaryRenderer = new SummaryRenderer();
        
        // Configurar observer para cambios de breakpoint
        this.setupResponsiveObserver();
        
        // Detectar breakpoint inicial
        const initialBreakpoint = ResponsiveUtils.getCurrentBreakpoint();
        Logger.responsive(`Initial breakpoint detected: ${initialBreakpoint}`, 
            ResponsiveUtils.getViewportInfo());
        
        Logger.endPerformance('UIRenderer-init');
        Logger.success('UIRenderer initialized successfully', { 
            currentView: this.currentView,
            breakpoint: initialBreakpoint,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Configurar observer para cambios responsive
     * 
     * Configura un observer que detecta cambios en el breakpoint
     * y ejecuta acciones específicas cuando la pantalla cambia de tamaño.
     * 
     * @private
     */
    setupResponsiveObserver() {
        ResponsiveUtils.addBreakpointObserver((breakpoint, viewportInfo) => {
            Logger.responsive(`Breakpoint changed in UIRenderer: ${breakpoint}`, viewportInfo);
            
            // Actualizar estado global del viewport
            stateManager.updateState('ui.isMobile', ResponsiveUtils.isMobile());
            stateManager.updateState('ui.viewportWidth', viewportInfo.width);
            stateManager.updateState('ui.viewportHeight', viewportInfo.height);
            
            // Re-renderizar vista actual si es necesaria
            if (this.currentView === VIEWS.BUDGET) {
                this.budgetManager.render();
            }
        });
    }

    /**
     * Renderizar contenido principal basado en la vista actual
     * 
     * Método central que coordina el renderizado de todas las vistas.
     * Utiliza un mapeo de vistas a métodos de renderizado para
     * mantener un código limpio y escalable.
     */
    renderMainContent() {
        Logger.ui(`🎨 Rendering main content for view: ${this.currentView}`);
        Logger.startPerformance('render-main-content');

        // Mapeo de vistas a métodos de renderizado
        const viewRenderers = {
            [VIEWS.SUMMARY]: () => {
                Logger.ui('Rendering summary view');
                this.summaryRenderer.renderSummary();
            },
            [VIEWS.ITINERARY]: () => {
                Logger.ui('Rendering itinerary view - delegating to ItineraryRenderer');
                const mainContent = document.getElementById('main-content');
                itineraryRenderer.renderItinerary(mainContent);
            },
            [VIEWS.TODAY]: () => {
                Logger.ui('Rendering today view');
                this.renderToday();
            },
            [VIEWS.MAP]: () => {
                Logger.ui('Rendering map view - delegating to MapRenderer');
                const mainContent = document.getElementById('main-content');
                mapRenderer.renderMap(mainContent);
            },
            [VIEWS.BUDGET]: () => {
                Logger.ui('💰 Rendering budget view - delegating to BudgetManager');
                this.budgetManager.render();
            },
            [VIEWS.FLIGHTS]: () => {
                Logger.ui('✈️ Rendering flights view');
                this.renderFlights();
            }
        };

        // Ejecutar renderizador correspondiente
        const renderer = viewRenderers[this.currentView];
        if (renderer) {
            try {
                renderer();
                Logger.endPerformance('render-main-content');
                Logger.success(`✅ View '${this.currentView}' rendered successfully`);
            } catch (error) {
                Logger.error(`❌ Error rendering view '${this.currentView}':`, error);
                this.renderErrorView(error);
            }
        } else {
            Logger.warning(`⚠️ Unknown view: ${this.currentView}`);
            this.renderErrorView(new Error(`Vista desconocida: ${this.currentView}`));
        }
    }

    /**
     * Renderizar vista de error
     * 
     * @param {Error} error - Error que causó el problema
     */
    renderErrorView(error) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="w-full max-w-4xl mx-auto p-6">
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                    <span class="material-symbols-outlined text-4xl text-red-600 dark:text-red-400 mb-4 block">error</span>
                    <h2 class="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Error de renderizado</h2>
                    <p class="text-red-700 dark:text-red-400 mb-4">${error.message}</p>
                    <button onclick="location.reload()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                        Recargar página
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Actualizar resumen del presupuesto
     * 
     * Método que actualiza dinámicamente las tarjetas de resumen
     * del presupuesto cuando hay cambios en los gastos.
     */
    updateBudgetSummary() {
        try {
            Logger.ui('💰 Updating budget summary cards');
            
            // Solo actualizar si estamos en vista resumen
            if (this.currentView !== VIEWS.SUMMARY) {
                Logger.debug('Not in summary view, skipping budget summary update');
                return;
            }

            // Delegar actualización al SummaryRenderer
            if (this.summaryRenderer && this.summaryRenderer.updateDynamicContent) {
                this.summaryRenderer.updateDynamicContent();
            }

            Logger.success('✅ Budget summary updated successfully');
        } catch (error) {
            Logger.error('Error updating budget summary:', error);
        }
    }

    // MÉTODOS DELEGADOS A RENDERIZADORES ESPECIALIZADOS
    // ==================================================

    /**
     * Renderizado de resumen - DELEGADO a SummaryRenderer
     */
    renderSummary() {
        Logger.ui('📊 Delegating to SummaryRenderer');
        this.summaryRenderer.renderSummary();
    }

    /**
     * Métodos de cálculo - DELEGADOS a SummaryRenderer
     */
    calculateTotalBudget() {
        return this.summaryRenderer.calculateTotalBudget();
    }
    
    calculateTotalSpent() {
        return this.summaryRenderer.calculateTotalSpent();
    }

    /**
     * Análisis de estilo de viaje - DELEGADO a SummaryRenderer
     */
    renderTripStyleAnalysis() {
        return this.summaryRenderer.renderTripStyleAnalysis();
    }

    /**
     * Sección de vuelos - DELEGADO a SummaryRenderer
     */
    renderFlightsSection() {
        return this.summaryRenderer.renderFlightsSection ? this.summaryRenderer.renderFlightsSection() : '';
    }

    // MÉTODOS DE VISTA ESPECÍFICOS
    // =============================

    /**
     * Renderizar vista "Hoy"
     */
    renderToday() {
        Logger.ui('📅 Rendering today view');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        try {
            // Usar fecha simulada si el Day Simulator está activo
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            Logger.data('📅 Trip dates calculated', { tripStartDate, today, dayDiff });
            
            if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                const currentDayData = tripConfig.itineraryData[dayDiff];
                Logger.data('📅 Current day data loaded', currentDayData);
                
                mainContent.innerHTML = this.generateTodayContent(currentDayData, dayDiff);
            } else {
                // Antes o después del viaje
                const statusTitle = dayDiff < 0 ? 'Preparando el viaje' : 'Viaje completado';
                const statusMessage = dayDiff < 0 ? 
                    `Faltan ${Math.abs(dayDiff)} días para comenzar la aventura` : 
                    'El viaje ha terminado. ¡Esperamos que hayas disfrutado!';
                    
                mainContent.innerHTML = this.generatePrePostTripContent(statusTitle, statusMessage);
            }
            
            Logger.success('✅ Today view rendered successfully');
        } catch (error) {
            Logger.error('❌ Error rendering today view:', error);
            this.renderErrorView(error);
        }
    }

    /**
     * Generar contenido para el día actual
     */
    generateTodayContent(dayData, dayIndex) {
        return `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                <div class="flex items-center gap-4 mb-8">
                    <span class="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400">today</span>
                    <div>
                        <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Día ${dayIndex + 1}</h1>
                        <p class="text-lg text-slate-600 dark:text-slate-400">${dayData.title}</p>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Actividades del día</h2>
                    <p class="text-slate-600 dark:text-slate-400">${dayData.description || 'Sin descripción disponible'}</p>
                </div>
            </div>
        `;
    }

    /**
     * Generar contenido para antes/después del viaje
     */
    generatePrePostTripContent(title, message) {
        return `
            <div class="w-full max-w-4xl mx-auto p-6 text-center">
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                    <span class="material-symbols-outlined text-6xl text-slate-400 mb-4 block">event</span>
                    <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">${title}</h1>
                    <p class="text-slate-600 dark:text-slate-400">${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar información de vuelos
     */
    renderFlights() {
        Logger.ui('✈️ Rendering flights information');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            Logger.error('❌ Container main-content not found');
            return;
        }

        try {
            mainContent.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                    <div class="flex items-center gap-3 mb-8">
                        <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">flight</span>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Información de Vuelos</h2>
                    </div>
                    <div class="space-y-8">
                        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                            <p class="text-slate-600 dark:text-slate-400">Información de vuelos disponible próximamente...</p>
                        </div>
                    </div>
                </div>`;

            Logger.success('✅ Flights information rendered successfully');
        } catch (error) {
            Logger.error('❌ Error rendering flights:', error);
            this.renderErrorView(error);
        }
    }

    // MÉTODOS AUXILIARES
    // ==================

    /**
     * Obtener fecha de inicio del viaje
     */
    getTripStartDate() {
        try {
            const calendarData = tripConfig.calendarData;
            if (calendarData && calendarData.tripStartDate) {
                return new Date(calendarData.tripStartDate);
            }
            
            // Fallback: usar primera fecha del itinerario si está disponible
            if (tripConfig.itineraryData && tripConfig.itineraryData.length > 0) {
                const firstDay = tripConfig.itineraryData[0];
                if (firstDay.date) {
                    return new Date(firstDay.date);
                }
            }
            
            // Fallback final: fecha predeterminada
            return new Date('2024-12-19');
            
        } catch (error) {
            Logger.error('Error getting trip start date:', error);
            return new Date('2024-12-19');
        }
    }

    /**
     * Cambiar vista
     */
    changeView(view) {
        Logger.ui(`🔄 Changing view from '${this.currentView}' to '${view}'`);
        this.currentView = view;
        
        // Log específico para herramientas
        if (view === 'herramientas') {
            Logger.ui('🛠️ Tools view detected, calling renderMainContent...');
        }
        
        this.renderMainContent();
    }
}
