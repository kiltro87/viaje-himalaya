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
        // Implementación simple del observer responsive
        let currentBreakpoint = ResponsiveUtils.getCurrentBreakpoint();
        
        const handleResize = () => {
            const newBreakpoint = ResponsiveUtils.getCurrentBreakpoint();
            const viewportInfo = ResponsiveUtils.getViewportInfo();
            
            if (newBreakpoint !== currentBreakpoint) {
                Logger.responsive(`Breakpoint changed in UIRenderer: ${currentBreakpoint} → ${newBreakpoint}`, viewportInfo);
                currentBreakpoint = newBreakpoint;
                
                // Actualizar estado global del viewport
                stateManager.updateState('ui.isMobile', ResponsiveUtils.isMobile());
                stateManager.updateState('ui.viewportWidth', viewportInfo.width);
                stateManager.updateState('ui.viewportHeight', viewportInfo.height);
                
                // Re-renderizar vista actual si es necesaria
                if (this.currentView === VIEWS.BUDGET) {
                    this.budgetManager.render();
                }
            }
        };
        
        // Throttled resize listener para performance
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 150);
        });
        
        Logger.debug('Responsive observer configured successfully');
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
                Logger.ui('💰 Rendering budget view');
                this.renderGastos();
            },
            [VIEWS.FLIGHTS]: () => {
                Logger.ui('✈️ Rendering flights view');
                this.renderFlights();
            },
            ['extras']: () => {
                Logger.ui('🎁 Rendering extras view');
                this.renderExtras();
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
            
            Logger.data('📅 Trip dates calculated', { tripStartDate, today, dayDiff, totalDays: tripConfig.itineraryData.length });
            
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
            // Primero intentar obtener la fecha desde calendarData
            if (tripConfig.calendarData && tripConfig.calendarData.tripStartDate) {
                Logger.debug('Using tripStartDate from calendarData:', tripConfig.calendarData.tripStartDate);
                return new Date(tripConfig.calendarData.tripStartDate);
            }
            
            // Fallback: calcular desde getFormattedStartDate si está disponible
            if (tripConfig.calendarData && typeof tripConfig.calendarData.getFormattedStartDate === 'function') {
                const startDateString = tripConfig.calendarData.getFormattedStartDate();
                Logger.debug('Using getFormattedStartDate:', startDateString);
                return new Date(startDateString);
            }
            
            // Fallback: usar primera fecha del itinerario si está disponible
            if (tripConfig.itineraryData && tripConfig.itineraryData.length > 0) {
                const firstDay = tripConfig.itineraryData[0];
                if (firstDay.date) {
                    Logger.debug('Using first day date from itinerary:', firstDay.date);
                    return new Date(firstDay.date);
                }
            }
            
            // Fallback final: fecha predeterminada del viaje
            Logger.warning('Using fallback date: 2024-12-19');
            return new Date('2024-12-19');
            
        } catch (error) {
            Logger.error('Error getting trip start date:', error);
            return new Date('2024-12-19');
        }
    }

    /**
     * Renderizar vista de extras
     */
    renderExtras() {
        Logger.ui('🎁 Rendering extras view');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        try {
            mainContent.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                    <div class="flex items-center gap-4 mb-8">
                        <span class="material-symbols-outlined text-4xl text-purple-600 dark:text-purple-400">extension</span>
                        <div>
                            <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Extras del Viaje</h1>
                            <p class="text-lg text-slate-600 dark:text-slate-400">Información adicional y herramientas útiles</p>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-green-600">info</span>
                                Información General
                            </h2>
                            <div class="space-y-4 text-slate-600 dark:text-slate-400">
                                <p>Esta sección contiene información adicional sobre el viaje, agencias, contactos de emergencia y más.</p>
                                <p>Próximamente se añadirá más contenido útil para el viaje.</p>
                            </div>
                        </div>
                        
                        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-blue-600">settings</span>
                                Herramientas
                            </h2>
                            <div class="space-y-4 text-slate-600 dark:text-slate-400">
                                <p>Herramientas útiles para gestionar y personalizar la experiencia del viaje.</p>
                                <p>Funciones de exportación, simulador de fechas y más.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            Logger.success('✅ Extras view rendered successfully');
        } catch (error) {
            Logger.error('❌ Error rendering extras view:', error);
            this.renderErrorView(error);
        }
    }

    /**
     * Renderizar vista de gastos
     */
    renderGastos() {
        Logger.ui('💰 Rendering budget section');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        try {
            mainContent.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                    <!-- Header de Gastos -->
                    <div class="mb-12 hidden md:block">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="material-symbols-outlined text-6xl text-green-600 dark:text-green-400">account_balance_wallet</span>
                            <div>
                                <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Gestión de Gastos</h1>
                                <p class="text-lg text-slate-600 dark:text-slate-400">Controla tu presupuesto y registra todos los gastos de tu aventura</p>
                            </div>
                        </div>
                    </div>

                    <!-- Contenido de Gastos -->
                    <div id="budget" class="space-y-6 md:space-y-8">
                        <!-- El contenido se generará dinámicamente -->
                    </div>
                </div>
            `;
            
            // Renderizar presupuesto inmediatamente
            setTimeout(() => {
                this.renderBudget();
            }, 100);
            
            Logger.success('✅ Budget structure rendered');
        } catch (error) {
            Logger.error('❌ Error rendering budget view:', error);
            this.renderErrorView(error);
        }
    }

    /**
     * Renderizar presupuesto en el contenedor
     */
    renderBudget() {
        Logger.ui('💰 Rendering budget content');
        const container = document.getElementById('budget');
        if (!container) {
            Logger.error('❌ Container #budget not found');
            Logger.debug('🔍 Available elements with ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            return;
        }
        Logger.debug('✅ Container #budget found:', container);

        // Usar la implementación del presupuesto
        Logger.ui('💰 Calling budgetManager.render...');
        this.budgetManager.render(container, tripConfig);
        
        Logger.success('✅ Budget rendered completely');
    }

    /**
     * Mostrar modal de detalles del itinerario
     */
    showItineraryModal(dayId) {
        const day = tripConfig.itineraryData.find(d => d.id === dayId);
        if (!day) {
            Logger.warning(`showItineraryModal not available for day: ${dayId}`);
            return;
        }

        const detailCard = (icon, title, content) => content ? `
            <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                <h4 class="font-semibold text-md flex items-center gap-2">
                    <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">${icon}</span> 
                    ${title}
                </h4>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-2 pl-10">${content}</p>
            </div>
        ` : '';

        const modalHTML = `
            <div id="itinerary-modal-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4" style="pointer-events: auto;">
                <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-[999999]" style="pointer-events: auto;">
                    <button id="close-modal-btn" class="absolute top-4 right-4 z-[999999] p-2 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    <img src="${day.image}" alt="${day.title}" class="w-full h-60 object-cover rounded-t-2xl" onerror="this.onerror=null;this.src='https://placehold.co/800x400/4f46e5/ffffff?text=Himalaya';">
                    <div class="p-6 space-y-4">
                        <p class="text-sm font-semibold text-blue-600 dark:text-blue-400">DÍA ${day.id.replace('day-','')}</p>
                        <h3 class="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            ${this.getActivityIconHTML(day.icon, 'text-4xl')} 
                            ${day.title}
                        </h3>
                        ${day.coords ? `
                            <div class="mt-6">
                                <h4 class="font-semibold text-md flex items-center gap-2 mb-4">
                                    <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">map</span> 
                                    Lugares de interés
                                </h4>
                                <div id="modal-map-${day.id}" class="h-64 w-full rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <div class="text-center">
                                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                        <p class="text-sm text-slate-500">Cargando mapa...</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        ${detailCard('map', 'Itinerario', day.planA)}
                        ${detailCard('coffee', 'Tiempo Libre', day.planB)}
                        ${detailCard('lightbulb', 'Consejo del Día', day.consejo)}
                        ${detailCard('restaurant', 'Bocado del Día', day.bocado)}
                    </div>
                </div>
            </div>
        `;
        
        // Crear contenedor del modal si no existe
        let modalContainer = document.getElementById('itinerary-modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'itinerary-modal-container';
            modalContainer.style.zIndex = '999999';
            modalContainer.style.position = 'fixed';
            modalContainer.style.top = '0';
            modalContainer.style.left = '0';
            modalContainer.style.width = '100%';
            modalContainer.style.height = '100%';
            modalContainer.style.pointerEvents = 'none';
            document.body.appendChild(modalContainer);
        }
        
        modalContainer.innerHTML = modalHTML;

        // Event listeners para cerrar el modal
        document.getElementById('itinerary-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'itinerary-modal-overlay') {
                modalContainer.innerHTML = '';
            }
        });
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        // Crear mapa del modal si hay coordenadas
        if (day.coords) {
            setTimeout(() => {
                mapRenderer.createModalMap(day.id, day.coords, day.title);
            }, 500);
        }
    }

    /**
     * Obtener HTML del icono de actividad
     */
    getActivityIconHTML(icon, size = 'text-xl') {
        return `<span class="material-symbols-outlined ${size} text-blue-600 dark:text-blue-400">${icon}</span>`;
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
