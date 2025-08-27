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
                Logger.ui('Rendering map view with consistent header');
                const mainContent = document.getElementById('main-content');
                
                // Aplicar header consistente con Itinerario
                mainContent.innerHTML = `
                    <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                        <!-- Header del Mapa (estilo Itinerario) -->
                        <div class="mb-12">
                            <div class="flex items-center gap-4 mb-4">
                                <span class="material-symbols-outlined text-6xl text-blue-600 dark:text-blue-400">map</span>
                                <div>
                                    <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Mapa del Viaje</h1>
                                    <p class="text-lg text-slate-600 dark:text-slate-400">Explora todos los destinos y lugares que visitarás en tu aventura</p>
                                </div>
                            </div>
                        </div>

                        <!-- Contenedor del Mapa -->
                        <div id="map-container" class="w-full h-[70vh] min-h-[500px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
                            <!-- El mapa se renderizará aquí -->
                        </div>
                    </div>
                `;
                
                // Renderizar el mapa en el contenedor específico
                const mapContainer = document.getElementById('map-container');
                if (mapContainer) {
                    mapRenderer.renderMap(mapContainer);
                }
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
     * Renderizar vista "Hoy" (header estilo Itinerario) - ACTUALIZACIÓN DINÁMICA
     */
    renderToday() {
        Logger.ui('📅 Rendering today view');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        try {
            // Render estructura básica
            mainContent.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                    <!-- Header de Hoy (estilo Itinerario) -->
                    <div class="mb-12">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="material-symbols-outlined text-6xl text-green-600 dark:text-green-400">today</span>
                            <div>
                                <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">¿Qué hacemos hoy?</h1>
                                <p class="text-lg text-slate-600 dark:text-slate-400" id="today-current-date">Descubre las actividades y planes del día actual</p>
                            </div>
                        </div>
                    </div>

                    <!-- Contenido dinámico -->
                    <div id="today-dynamic-content" class="space-y-8">
                        <!-- Se actualizará dinámicamente -->
                    </div>
                </div>
            `;
            
            // Actualizar contenido dinámicamente
            this.updateTodayDynamicContent();
            
            Logger.success('✅ Today view rendered successfully');
        } catch (error) {
            Logger.error('❌ Error rendering today view:', error);
            this.renderErrorView(error);
        }
    }

    /**
     * 🌅 ACTUALIZAR CONTENIDO DINÁMICO DE HOY
     */
    updateTodayDynamicContent() {
        const container = document.getElementById('today-dynamic-content');
        const dateElement = document.getElementById('today-current-date');
        
        if (!container) return;

        try {
            // Usar fecha simulada si el Day Simulator está activo
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            // Actualizar fecha en header
            if (dateElement) {
                const todayFormatted = DateUtils.formatMediumDate(today);
                dateElement.textContent = `Fecha actual: ${todayFormatted}`;
            }
            
            Logger.data('📅 Today dynamic update', { dayDiff, tripLength: tripConfig.itineraryData.length });
            
            if (dayDiff < 0) {
                // ANTES DEL VIAJE
                this.renderPreTripToday(container, Math.abs(dayDiff));
            } else if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                // DURANTE EL VIAJE
                this.renderDuringTripToday(container, dayDiff);
            } else {
                // DESPUÉS DEL VIAJE
                this.renderPostTripToday(container);
            }
            
        } catch (error) {
            Logger.error('Error updating today dynamic content:', error);
            container.innerHTML = '<p class="text-slate-600 dark:text-slate-400">Error al cargar información del día</p>';
        }
    }

    /**
     * 🚀 RENDERIZAR CONTENIDO PRE-VIAJE DE HOY
     */
    renderPreTripToday(container, daysUntil) {
        container.innerHTML = `
            <div class="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-8 border border-orange-200 dark:border-orange-800">
                <div class="text-center mb-8">
                    <div class="text-8xl font-black text-orange-600 dark:text-orange-400 mb-4">
                        ${daysUntil}
                    </div>
                    <h2 class="text-3xl font-bold text-orange-800 dark:text-orange-200 mb-2">
                        ${daysUntil === 1 ? 'día' : 'días'} para la aventura
                    </h2>
                    <p class="text-orange-700 dark:text-orange-300">
                        ¡El Himalaya nos espera! Es momento de finalizar los preparativos.
                    </p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4">
                        <h3 class="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <span class="material-symbols-outlined text-green-600">check_circle</span>
                            Preparativos completados
                        </h3>
                        <ul class="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                            <li>✈️ Vuelos confirmados</li>
                            <li>📄 Documentación en orden</li>
                            <li>💉 Vacunas aplicadas</li>
                            <li>💰 Presupuesto planificado</li>
                        </ul>
                    </div>
                    
                    <div class="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4">
                        <h3 class="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <span class="material-symbols-outlined text-orange-600">schedule</span>
                            Tareas pendientes
                        </h3>
                        <ul class="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                            <li>🎒 Revisar equipaje</li>
                            <li>📱 Descargar mapas offline</li>
                            <li>💊 Preparar botiquín</li>
                            <li>📞 Avisar familiares</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 🏔️ RENDERIZAR CONTENIDO DURANTE EL VIAJE DE HOY
     */
    renderDuringTripToday(container, dayIndex) {
        const currentDay = tripConfig.itineraryData[dayIndex];
        if (!currentDay) return;

        const dayNumber = dayIndex + 1;
        const totalDays = tripConfig.itineraryData.length;

        container.innerHTML = `
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
                <div class="flex items-start gap-6 mb-6">
                    <div class="text-center">
                        <span class="material-symbols-outlined text-6xl text-green-600 dark:text-green-400">${currentDay.icon || 'hiking'}</span>
                        <div class="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                            Día ${dayNumber}/${totalDays}
                        </div>
                    </div>
                    
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold text-green-800 dark:text-green-200 mb-2">${currentDay.title}</h2>
                        <p class="text-green-700 dark:text-green-300 text-lg leading-relaxed">
                            ${currentDay.description}
                        </p>
                        
                        <div class="flex gap-3 mt-4">
                            <span class="px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                                📍 ${currentDay.location || 'En ruta'}
                            </span>
                            ${currentDay.country ? 
                                `<span class="px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                                    🏳️ ${currentDay.country}
                                </span>` : ''
                            }
                        </div>
                    </div>
                </div>

                ${currentDay.activities && currentDay.activities.length > 0 ? `
                    <div class="bg-white/70 dark:bg-slate-800/70 rounded-xl p-6">
                        <h3 class="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined text-blue-600">event_note</span>
                            Actividades del día
                        </h3>
                        <div class="grid gap-3">
                            ${currentDay.activities.map(activity => `
                                <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">${activity.icon || 'star'}</span>
                                    <span class="text-slate-700 dark:text-slate-300">${activity.name || activity}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 🏁 RENDERIZAR CONTENIDO POST-VIAJE DE HOY
     */
    renderPostTripToday(container) {
        container.innerHTML = `
            <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800 text-center">
                <div class="text-8xl mb-6">🏔️</div>
                <h2 class="text-3xl font-bold text-purple-800 dark:text-purple-200 mb-4">¡Misión cumplida!</h2>
                <p class="text-purple-700 dark:text-purple-300 text-lg mb-6">
                    Has conquistado el Himalaya y vivido una aventura inolvidable. 
                    ¡Seguro que tienes miles de historias que contar!
                </p>
                
                <div class="grid md:grid-cols-3 gap-4">
                    <div class="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4">
                        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${tripConfig.itineraryData.length}</div>
                        <div class="text-sm text-purple-700 dark:text-purple-300">Días completados</div>
                    </div>
                    <div class="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4">
                        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">2</div>
                        <div class="text-sm text-purple-700 dark:text-purple-300">Países visitados</div>
                    </div>
                    <div class="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4">
                        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">∞</div>
                        <div class="text-sm text-purple-700 dark:text-purple-300">Recuerdos creados</div>
                    </div>
                </div>
            </div>
        `;
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
     * Renderizar vista de extras completa (header estilo Itinerario)
     */
    renderExtras() {
        Logger.ui('🎒 Rendering extras section');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        try {
            // Usar mismo patrón de header que Itinerario
            mainContent.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                    <!-- Header de Extras (estilo Itinerario) -->
                    <div class="mb-12">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="material-symbols-outlined text-6xl text-purple-600 dark:text-purple-400">inventory_2</span>
                            <div>
                                <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Extras del Viaje</h1>
                                <p class="text-lg text-slate-600 dark:text-slate-400">Equipaje, clima y toda la información práctica para tu aventura</p>
                            </div>
                        </div>
                    </div>

                    <!-- Lista de equipaje -->
                    <div id="packing-list" class="space-y-6 md:space-y-8">
                        <!-- El contenido se generará dinámicamente -->
                    </div>

                    <!-- Información climática -->
                    <div id="weather" class="space-y-6 md:space-y-8">
                        <!-- El contenido se generará dinámicamente -->
                    </div>

                    <!-- Información de Agencias -->
                    <div id="agencies" class="space-y-6 md:space-y-8">
                        <!-- El contenido se generará dinámicamente -->
                    </div>
                </div>
            `;
            
            // Renderizar cada sección inmediatamente
            setTimeout(async () => {
                await this.renderPackingList();
                await this.renderWeather();
                this.renderAgencies();
            }, 100);
            
            Logger.success('✅ Extras structure rendered');
        } catch (error) {
            Logger.error('❌ Error rendering extras view:', error);
            this.renderErrorView(error);
        }
    }

    /**
     * Renderizar vista de gastos (header estilo Itinerario)
     */
    renderGastos() {
        Logger.ui('💰 Rendering budget section');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        try {
            mainContent.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                    <!-- Header de Gastos (estilo Itinerario) -->
                    <div class="mb-12">
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
     * Renderizar información de agencias
     */
    renderAgencies() {
        Logger.ui('🏢 Rendering agencies information');
        const container = document.getElementById('agencies');
        if (!container) {
            Logger.warning('⚠️ Container #agencies not found');
            return;
        }

        const agencies = tripConfig.agenciesData;
        
        const agenciesHTML = `
            <div class="flex items-center gap-3 mb-8">
                <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">business</span>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Información de Agencias</h2>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
                <!-- WeRoad Nepal -->
                <div class="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 border border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${agencies.weroad.color}">${agencies.weroad.icon}</span>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${agencies.weroad.name}</h3>
                    </div>
                    <div class="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">tour</span>
                            <span>Tour: "${agencies.weroad.tour}"</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">language</span>
                            <span>${agencies.weroad.website}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">info</span>
                            <span>${agencies.weroad.description}</span>
                        </div>
                    </div>
                </div>

                <!-- Best of Bhutan -->
                <div class="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 border border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${agencies.bhutan.color}">${agencies.bhutan.icon}</span>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${agencies.bhutan.name}</h3>
                    </div>
                    <div class="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">tour</span>
                            <span>Tour: "${agencies.bhutan.tour}"</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">info</span>
                            <span>${agencies.bhutan.description}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">phone</span>
                            <span>Contacto: ${agencies.bhutan.contact}</span>
                        </div>
                    </div>
                </div>

                <!-- Seguro de Viaje -->
                <div class="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 border border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${agencies.insurance.color}">${agencies.insurance.icon}</span>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${agencies.insurance.name}</h3>
                    </div>
                    <div class="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">info</span>
                            <span>${agencies.insurance.description}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">pending</span>
                            <span>Estado: ${agencies.insurance.status}</span>
                        </div>
                    </div>
                </div>

                <!-- Información de Emergencia -->
                <div class="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl text-red-600 dark:text-red-400">emergency</span>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Información de Emergencia</h3>
                    </div>
                    <div class="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                        <div class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-sm mt-0.5">emergency</span>
                            <div>
                                <div class="font-medium text-slate-900 dark:text-white">Emergencias</div>
                                <div>${agencies.emergency.embassy}</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-sm mt-0.5">local_hospital</span>
                            <div>
                                <div class="font-medium text-slate-900 dark:text-white">Hospital Recomendado</div>
                                <div>${agencies.emergency.hospital}</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-sm mt-0.5">schedule</span>
                            <div>
                                <div class="font-medium text-slate-900 dark:text-white">Zona Horaria</div>
                                <div>${agencies.emergency.timezone}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = agenciesHTML;
        Logger.success('✅ Agencies information rendered');
    }

    /**
     * Renderizar lista de equipaje (estilo original restaurado)
     */
    async renderPackingList() {
        Logger.ui('🎒 Rendering packing list');
        const container = document.getElementById('packing-list');
        if (!container) {
            Logger.warning('⚠️ Container #packing-list not found');
            return;
        }
        Logger.debug('✅ Container #packing-list found');

        // Inicializar PackingListManager si no existe (como en el original)
        let packingManager = stateManager.getPackingListManager();
        if (!packingManager) {
            try {
                const { getPackingListManager } = await import('../utils/PackingListManager.js');
                packingManager = getPackingListManager();
                stateManager.setPackingListManager(packingManager);
                
                // Inicializar con FirebaseManager si está disponible
                const firebaseManager = stateManager.getFirebaseManager();
                if (firebaseManager) {
                    await packingManager.initialize(firebaseManager);
                }
            } catch (error) {
                Logger.warning('PackingListManager not available, using simple implementation');
                packingManager = null;
            }
        }

        const saved = packingManager ? packingManager.getItems() : {};
        
        // Función para obtener icono de categoría (sin círculos de relleno)
        const getCategoryIcon = (category) => {
            const cleanCategory = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
            const icons = {
                'Ropa': 'checkroom',
                'Calzado': 'footprint', 
                'Equipo': 'backpack',
                'Documentos y Salud': 'medical_services',
                'Otros': 'inventory_2'
            };
            return icons[cleanCategory] || 'inventory_2';
        };

        // Función para obtener color de categoría (como texto, no fondo)
        const getCategoryColor = (category) => {
            const cleanCategory = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
            const colors = {
                'Ropa': 'text-blue-600',
                'Calzado': 'text-green-600',
                'Equipo': 'text-purple-600', 
                'Documentos y Salud': 'text-red-600',
                'Otros': 'text-gray-600'
            };
            return colors[cleanCategory] || 'text-gray-600';
        };

        const listHTML = Object.entries(tripConfig.packingListData).map(([category, items]) => {
            const categoryIcon = getCategoryIcon(category);
            const categoryColor = getCategoryColor(category);
            const cleanCategoryName = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
            
            return `
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${categoryColor}">${categoryIcon}</span>
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white">${cleanCategoryName}</h3>
                    </div>
                    <div class="space-y-2">
                        ${items.map(item => {
                            const itemKey = `${category}-${item}`;
                            const isChecked = saved[itemKey] || false;
                            return `
                                <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                    <input type="checkbox" ${isChecked ? 'checked' : ''} 
                                           data-item-key="${itemKey}"
                                           class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
                                    <span class="text-slate-700 dark:text-slate-300 ${isChecked ? 'line-through opacity-50' : ''}">${item}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="flex items-center gap-3 mb-8">
                <span class="material-symbols-outlined text-3xl text-teal-600 dark:text-teal-400">luggage</span>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Lista de Equipaje</h2>
            </div>
            
            <!-- Estadísticas de empacado -->
            <div id="packing-stats" class="mb-6"></div>
            
            <div class="grid gap-6 md:grid-cols-2">
                ${listHTML}
            </div>
        `;
        
        // Actualizar estadísticas (con delay para asegurar que DOM esté listo)
        if (packingManager) {
            setTimeout(() => {
                packingManager.updatePackingStats();
            }, 100);
        }
        
        // Asegurar que el contenedor sea visible
        container.style.opacity = '1 !important';
        
        // Configurar event listeners para los checkboxes con Firebase (estilo original)
        container.addEventListener('change', async e => {
            if (e.target.matches('input[type="checkbox"]')) {
                const itemKey = e.target.getAttribute('data-item-key');
                if (itemKey) {
                    // Actualizar visual inmediatamente (optimistic UI)
                    const label = e.target.closest('label');
                    const span = label.querySelector('span');
                    if (span) {
                        if (e.target.checked) {
                            span.classList.add('line-through', 'opacity-50');
                        } else {
                            span.classList.remove('line-through', 'opacity-50');
                        }
                    }
                    
                    // Actualizar PackingListManager si está disponible
                    if (packingManager) {
                        await packingManager.toggleItem(itemKey, e.target.checked);
                        packingManager.updatePackingStats();
                    }
                }
            }
        });
        
        Logger.success('✅ Packing list rendered with original style');
    }

    /**
     * Renderizar información del clima
     */
    async renderWeather() {
        Logger.ui('🌤️ Rendering weather information');
        const container = document.getElementById('weather');
        if (!container) {
            Logger.warning('⚠️ Container #weather not found');
            return;
        }

        const weatherHTML = `
            <div class="flex items-center gap-3 mb-8">
                <span class="material-symbols-outlined text-3xl text-orange-600 dark:text-orange-400">wb_sunny</span>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Información Climática</h2>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                ${tripConfig.weatherLocations.map(location => `
                    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="material-symbols-outlined ${location.color}">${location.icon}</span>
                            <h3 class="font-semibold text-slate-900 dark:text-white">${location.location}</h3>
                        </div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-slate-600 dark:text-slate-400">Día:</span>
                                <span class="font-medium text-slate-900 dark:text-white">${location.dayTemp}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-600 dark:text-slate-400">Noche:</span>
                                <span class="font-medium text-slate-900 dark:text-white">${location.nightTemp}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = weatherHTML;
        Logger.success('✅ Weather information rendered');
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
