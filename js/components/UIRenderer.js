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
        
        // Vista actual del sistema (por defecto: HOY como landing page)
        this.currentView = VIEWS.TODAY;
        
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
        
        // Registrar esta instancia en StateManager para eliminar window.uiRenderer
        stateManager.updateState('instances.uiRenderer', this);
        
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

        // Mapeo de vistas a métodos de renderizado - NUEVA ESTRUCTURA 4 SECCIONES
        const viewRenderers = {
            [VIEWS.TODAY]: () => {
                Logger.ui('🌅 Rendering TODAY view (landing page principal)');
                this.renderTodayLanding();
            },
            [VIEWS.ITINERARY]: () => {
                Logger.ui('📅 Rendering ITINERARY view - delegating to ItineraryRenderer');
                const mainContent = document.getElementById('main-content');
                itineraryRenderer.renderItinerary(mainContent);
            },
            [VIEWS.PLANNING]: () => {
                Logger.ui('🎯 Rendering PLANNING view (gastos + extras + packing)');
                this.renderPlanning();
            },
            [VIEWS.TRACKING]: () => {
                Logger.ui('📊 Rendering TRACKING view (mapa + analytics)');
                this.renderTracking();
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
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-4xl text-red-600 dark:text-red-400 mb-4 block">error</span>
                    <h2 class="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Error de renderizado</h2>
                    <p class="text-red-700 dark:text-red-400 mb-4">${error.message}</p>
                    <button onclick="location.reload()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl">
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
            
            // Solo actualizar si estamos en vista planificación (donde está el presupuesto)
            if (this.currentView !== VIEWS.PLANNING) {
                Logger.debug('Not in planning view, skipping budget summary update');
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
        Logger.ui('🌅 Renderizando hoy (versión original)...');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
                <!-- Header de Hoy -->
                <div class="mb-12">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-6xl text-orange-600 dark:text-orange-400">today</span>
                        <div>
                            <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Hoy en tu Viaje</h1>
                            <p id="today-current-date" class="text-lg text-slate-600 dark:text-slate-400">Cargando información del día...</p>
                        </div>
                    </div>
                </div>

                <!-- Resumen del día actual -->
                <div id="today-main-content" class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-8">
                    <!-- El contenido se generará dinámicamente -->
                </div>

                <!-- Estado y progreso del viaje -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Progreso del viaje -->
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">trending_up</span>
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Progreso del Viaje</h3>
                    </div>
                    
                        <div class="space-y-4">
                            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-medium text-blue-800 dark:text-blue-200">Días completados</span>
                                    <span class="text-lg font-bold text-blue-900 dark:text-blue-100" id="progress-days">-</span>
                                </div>
                                <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                    <div id="progress-bar" class="bg-blue-600 h-2 rounded-full transition-normal" style="width: 0%"></div>
                                </div>
                                </div>
                            
                            <div class="grid grid-cols-2 gap-3 text-center">
                                <div class="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                                    <div class="text-2xl font-bold text-slate-900 dark:text-white" id="total-days">${tripConfig.itineraryData.length}</div>
                                    <div class="text-xs text-slate-600 dark:text-slate-400">días totales</div>
                            </div>
                                <div class="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                                    <div class="text-2xl font-bold text-slate-900 dark:text-white" id="remaining-days">-</div>
                                    <div class="text-xs text-slate-600 dark:text-slate-400">días restantes</div>
                        </div>
                                </div>
                                </div>
                                </div>

                    <!-- Información del clima de hoy -->
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="material-symbols-outlined text-2xl text-orange-600 dark:text-orange-400">wb_sunny</span>
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Clima de Hoy</h3>
                            </div>
                        
                        <div id="today-weather-info" class="space-y-4">
                            <!-- Contenido dinámico del clima -->
                        </div>
                    </div>
                </div>

                <!-- Información del día (solo si hay vuelos) -->
                ${this.renderFlightInfoForToday()}




            </div>
        `;

        // Actualizar información dinámica
        this.updateTodayDynamicContent();
    }

    /**
     * 🌅 ACTUALIZAR CONTENIDO DINÁMICO DE HOY (VERSIÓN MEJORADA)
     */
    updateTodayDynamicContent() {
        Logger.ui('📅 Updating today dynamic content (improved implementation)');
        
        try {
        // Actualizar contenido del today-main-content (como en la versión original)
        this.updateTodayMainContent();
        
        // Actualizar fecha en header
            this.updateTodayDateHeader();
            
            // Actualizar progreso del viaje
            this.updateTripProgress();
            
            // Actualizar información climática
            this.updateTodayWeather();
            
            // Actualizar micro-stats si estamos en la vista HOY
        if (this.currentView === VIEWS.TODAY) {
            this.updateTodayMicroStats();
        }
        
        Logger.success('✅ Today dynamic content updated successfully');
        } catch (error) {
            Logger.error('❌ Error updating today dynamic content:', error);
        }
    }

    /**
     * 📅 ACTUALIZAR HEADER DE FECHA DE HOY
     */
    updateTodayDateHeader() {
        const dateElement = document.getElementById('today-current-date');
        if (!dateElement) return;

        try {
            const today = stateManager.getCurrentDate();
            const daySimulator = stateManager.getState('instances.daySimulator');
            
            let dateText = '';
            if (daySimulator && daySimulator.isSimulating) {
                dateText = `${DateUtils.formatMediumDate(today)} (Simulando día ${daySimulator.simulatedDay})`;
            } else {
                dateText = `Fecha actual: ${DateUtils.formatMediumDate(today)}`;
            }
            
            dateElement.textContent = dateText;
        } catch (error) {
            Logger.error('Error updating today date header:', error);
        }
    }

    /**
     * 📊 ACTUALIZAR PROGRESO DEL VIAJE
     */
    updateTripProgress() {
        try {
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            const totalDays = tripConfig.itineraryData.length;
            
            const progressDaysElement = document.getElementById('progress-days');
            const progressBarElement = document.getElementById('progress-bar');
            const remainingDaysElement = document.getElementById('remaining-days');
            
            if (dayDiff < 0) {
                // Antes del viaje
                if (progressDaysElement) progressDaysElement.textContent = '0';
                if (progressBarElement) progressBarElement.style.width = '0%';
                if (remainingDaysElement) remainingDaysElement.textContent = totalDays.toString();
            } else if (dayDiff >= 0 && dayDiff < totalDays) {
                // Durante el viaje
                const completedDays = dayDiff + 1;
                const progress = (completedDays / totalDays) * 100;
                const remainingDays = totalDays - completedDays;
                
                if (progressDaysElement) progressDaysElement.textContent = completedDays.toString();
                if (progressBarElement) progressBarElement.style.width = `${progress}%`;
                if (remainingDaysElement) remainingDaysElement.textContent = remainingDays.toString();
            } else {
                // Después del viaje
                if (progressDaysElement) progressDaysElement.textContent = totalDays.toString();
                if (progressBarElement) progressBarElement.style.width = '100%';
                if (remainingDaysElement) remainingDaysElement.textContent = '0';
            }
            
            Logger.debug('Trip progress updated:', { dayDiff, totalDays });
        } catch (error) {
            Logger.error('Error updating trip progress:', error);
        }
    }

    /**
     * 🌤️ ACTUALIZAR CLIMA DE HOY
     */
    updateTodayWeather() {
        const weatherContainer = document.getElementById('today-weather-info');
        if (!weatherContainer) return;

        try {
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            let weatherHTML = '';
            
            if (dayDiff < 0 || dayDiff >= tripConfig.itineraryData.length) {
                // Fuera del viaje
                weatherHTML = `
                    <div class="text-center p-6 text-slate-600 dark:text-slate-400">
                        <span class="material-symbols-outlined text-4xl mb-3 block text-slate-400">schedule</span>
                        <p>Información climática disponible durante el viaje</p>
                    </div>
                `;
            } else {
                // Durante el viaje
                const currentDayData = tripConfig.itineraryData[dayDiff];
                const location = this.extractLocationFromDay(currentDayData);
                const weatherData = this.getWeatherForLocation(location);
                
                weatherHTML = `
                    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <h4 class="font-semibold text-slate-900 dark:text-white">${location}</h4>
                                <p class="text-sm text-slate-600 dark:text-slate-400">${currentDayData.country || 'Nepal/Bután'}</p>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-bold text-orange-600">${weatherData.temperature}</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">${weatherData.condition}</div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3 mb-3">
                            <div class="text-center">
                                <span class="material-symbols-outlined text-orange-600">water_drop</span>
                                <div class="text-sm font-medium">${weatherData.humidity}</div>
                                <div class="text-xs text-slate-600 dark:text-slate-400">Humedad</div>
                            </div>
                            <div class="text-center">
                                <span class="material-symbols-outlined text-orange-600">air</span>
                                <div class="text-sm font-medium">${weatherData.wind}</div>
                                <div class="text-xs text-slate-600 dark:text-slate-400">Viento</div>
                            </div>
                        </div>
                        
                        <div class="text-sm text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-800/30 rounded-xl p-2">
                            💡 ${weatherData.recommendation}
                        </div>
                    </div>
                `;
            }
            
            weatherContainer.innerHTML = weatherHTML;
            Logger.debug('Today weather updated for location:', this.extractLocationFromDay(tripConfig.itineraryData[dayDiff] || {}));
            
        } catch (error) {
            Logger.error('Error updating today weather:', error);
            weatherContainer.innerHTML = '<p class="text-slate-600 dark:text-slate-400">Error al cargar información climática</p>';
        }
    }

    /**
     * 📍 EXTRAER UBICACIÓN DEL DÍA
     */
    extractLocationFromDay(dayData) {
        if (!dayData) return 'Ubicación desconocida';
        if (dayData.location) return dayData.location;
        
        // Verificar que existe title antes de usar toLowerCase
        if (!dayData.title) return 'Ubicación desconocida';
        
        // Extraer ubicación del título
        const title = dayData.title.toLowerCase();
        if (title.includes('katmandú') || title.includes('kathmandu')) return 'Katmandú';
        if (title.includes('pokhara')) return 'Pokhara';
        if (title.includes('chitwan')) return 'Chitwan';
        if (title.includes('thimphu')) return 'Thimphu';
        if (title.includes('paro')) return 'Paro';
        if (title.includes('punakha')) return 'Punakha';
        
        return dayData.country === 'Bután' ? 'Thimphu' : 'Katmandú';
    }

    /**
     * 🌤️ OBTENER CLIMA PARA UBICACIÓN
     */
    getWeatherForLocation(location) {
        // Datos climáticos simplificados por ubicación
        const weatherData = {
            'Katmandú': { temperature: '24°C', condition: 'Soleado', humidity: '65%', wind: '12 km/h', recommendation: 'Día perfecto para explorar la ciudad' },
            'Pokhara': { temperature: '22°C', condition: 'Parcialmente nublado', humidity: '70%', wind: '8 km/h', recommendation: 'Ideal para actividades al aire libre' },
            'Chitwan': { temperature: '28°C', condition: 'Cálido y húmedo', humidity: '80%', wind: '6 km/h', recommendation: 'Hidratarse bien durante el safari' },
            'Thimphu': { temperature: '18°C', condition: 'Fresco y despejado', humidity: '55%', wind: '15 km/h', recommendation: 'Llevar una chaqueta ligera' },
            'Paro': { temperature: '16°C', condition: 'Montañoso', humidity: '60%', wind: '18 km/h', recommendation: 'Perfecto para trekking' },
            'Punakha': { temperature: '21°C', condition: 'Templado', humidity: '68%', wind: '10 km/h', recommendation: 'Clima ideal para visitas culturales' }
        };
        
        return weatherData[location] || { 
            temperature: '20°C', 
            condition: 'Variable', 
            humidity: '65%', 
            wind: '10 km/h', 
            recommendation: 'Consultar pronóstico local' 
        };
    }

    /**
     * 🏔️ ACTUALIZAR CONTENIDO PRINCIPAL DE HOY (IMPLEMENTACIÓN ORIGINAL)
     */
    updateTodayMainContent() {
        Logger.ui('📅 Actualizando contenido principal de Hoy (versión original)...');
        try {
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            const mainContentContainer = document.querySelector('#today-main-content');
            if (!mainContentContainer) {
                Logger.warning('⚠️ Contenedor #today-main-content no encontrado');
                return;
            }
            
            if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                const currentDayData = tripConfig.itineraryData[dayDiff];
                Logger.debug(`📅 HOY DEBUG: dayDiff=${dayDiff}, accessing day ${dayDiff + 1}, data:`, currentDayData.title, `ID: ${currentDayData.id}`);
                
                // Determinar el icono y tipo de actividad
                let activityIcon = 'hiking';
                let activityType = 'Actividades del día';
                
                if (currentDayData.icon === '✈️') {
                    activityIcon = 'flight_takeoff';
                    activityType = 'Vuelo';
                } else if (currentDayData.icon === '🏛️') {
                    activityIcon = 'temple_buddhist';
                    activityType = 'Visita cultural';
                } else if (currentDayData.icon === '🏔️') {
                    activityIcon = 'hiking';
                    activityType = 'Trekking';
                } else if (currentDayData.icon === '🚣') {
                    activityIcon = 'kayaking';
                    activityType = 'Aventura';
                } else if (currentDayData.icon === '♨️') {
                    activityIcon = 'hot_tub';
                    activityType = 'Relajación';
                } else if (currentDayData.icon === '🛬') {
                    activityIcon = 'flight_land';
                    activityType = 'Llegada';
                }
                
                // Determinar colores dinámicos según la fase del viaje
                const phaseColors = {
                    'nepal': { 
                        main: 'from-green-500 to-emerald-600', 
                        light: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
                        border: 'border-green-200 dark:border-green-800',
                        text: 'text-green-600 dark:text-green-400',
                        accent: 'bg-green-100 dark:bg-green-900/30'
                    },
                    'bhutan': { 
                        main: 'from-purple-500 to-indigo-600', 
                        light: 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
                        border: 'border-purple-200 dark:border-purple-800',
                        text: 'text-purple-600 dark:text-purple-400',
                        accent: 'bg-purple-100 dark:bg-purple-900/30'
                    },
                    'vuelos': { 
                        main: 'from-blue-500 to-cyan-600', 
                        light: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
                        border: 'border-blue-200 dark:border-blue-800',
                        text: 'text-blue-600 dark:text-blue-400',
                        accent: 'bg-blue-100 dark:bg-blue-900/30'
                    }
                };
                
                const colors = phaseColors[currentDayData.phase] || phaseColors['nepal'];
                const dayNumber = dayDiff + 1;
                
                let contentHTML = `
                    <div class="flex items-center gap-4 mb-6">
                        <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">${activityIcon}</span>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">${activityType}</h2>
                    </div>
                    
                    <!-- Tarjeta principal del día -->
                    <div class="bg-white dark:bg-slate-800 radius-card p-6 border border-slate-200 dark:border-slate-700 mb-6">
                        <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">${currentDayData.title}</h3>
                        <p class="text-slate-600 dark:text-slate-400 mb-6 text-lg leading-relaxed">${currentDayData.description}</p>`;
                        
                if (currentDayData.planA) {
                    contentHTML += `
                        <div class="space-y-3 mb-6">
                            
                        <div class="space-y-3">
                                <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                    <h5 class="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        <span class="material-symbols-outlined text-sm text-slate-600 dark:text-slate-400">schedule</span>
                                    Plan Principal
                                    </h5>
                                    <p class="text-slate-600 dark:text-slate-400 leading-relaxed">${currentDayData.planA}</p>
                            </div>`;
                    
                    if (currentDayData.planB) {
                        contentHTML += `
                                <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                    <h5 class="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        <span class="material-symbols-outlined text-sm text-slate-600 dark:text-slate-400">alt_route</span>
                                    Plan Alternativo
                                    </h5>
                                    <p class="text-slate-600 dark:text-slate-400 leading-relaxed">${currentDayData.planB}</p>
                            </div>`;
                    }
                    contentHTML += `</div>`;
                }
                
                contentHTML += `
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4">`;
                
                if (currentDayData.consejo) {
                    contentHTML += `
                        <div class="bg-blue-50 dark:bg-blue-900/20 radius-card p-6 border border-blue-200 dark:border-blue-800">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="material-symbols-outlined text-lg text-blue-600 dark:text-blue-400">lightbulb</span>
                                <h4 class="font-semibold text-slate-900 dark:text-white">Consejo</h4>
                            </div>
                            <p class="text-slate-600 dark:text-slate-400">${currentDayData.consejo}</p>
                        </div>`;
                }
                
                if (currentDayData.bocado) {
                    contentHTML += `
                        <div class="bg-green-50 dark:bg-green-900/20 radius-card p-6 border border-green-200 dark:border-green-800">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="material-symbols-outlined text-lg text-green-600 dark:text-green-400">restaurant</span>
                                <h4 class="font-semibold text-slate-900 dark:text-white">Bocado</h4>
                            </div>
                            <p class="text-slate-600 dark:text-slate-400">${currentDayData.bocado}</p>
                        </div>`;
                }
                
                contentHTML += `</div>`;
                mainContentContainer.innerHTML = contentHTML;
            } else {
                // Antes o después del viaje
                const statusTitle = dayDiff < 0 ? 'Preparando el viaje' : 'Viaje completado';
                const statusMessage = dayDiff < 0 ? 
                    `Faltan ${Math.abs(dayDiff)} días para comenzar la aventura` : 
                    'El viaje ha terminado. ¡Esperamos que hayas disfrutado!';
                    
                mainContentContainer.innerHTML = `
                    <div class="flex items-center gap-4 mb-6">
                        <span class="material-symbols-outlined text-3xl text-slate-600 dark:text-slate-400">event</span>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Información del Viaje</h2>
                    </div>
                    
                    <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 text-center">
                        <span class="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-500 mb-4 block">schedule</span>
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">${statusTitle}</h3>
                        <p class="text-slate-600 dark:text-slate-400">${statusMessage}</p>
                    </div>
                `;
            }
        } catch (error) {
            Logger.error('Error al actualizar contenido principal de hoy:', error);
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
                
                <div class="bg-white dark:bg-slate-800 radius-card p-6 md:p-8 shadow-card border border-slate-200 dark:border-slate-700">
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
                <div class="bg-white dark:bg-slate-800 radius-card p-8 shadow-card border border-slate-200 dark:border-slate-700">
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
                        <div class="bg-white dark:bg-slate-800 radius-card p-6 shadow-card border border-slate-200 dark:border-slate-700">
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
            
            // Buscar la fecha del primer vuelo internacional (misma lógica que SummaryRenderer)
            const firstInternationalFlight = tripConfig.flightsData.find(f => f.type === 'Internacional');
            if (firstInternationalFlight && firstInternationalFlight.segments && firstInternationalFlight.segments.length > 0) {
                const firstSegment = firstInternationalFlight.segments[0];
                // Extraer la fecha del string "9 de Octubre 22:45"
                const departureDate = firstSegment.fromDateTime;
                const year = tripConfig.tripInfo.year; // Usar el año del tripConfig
                
                // Parsear la fecha (ej. "9 de Octubre 22:45" en 2025)
                const months = {
                    'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
                    'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
                };
                
                const match = departureDate.match(/(\d+) de (\w+)/);
                if (match) {
                    const day = parseInt(match[1]);
                    const monthName = match[2];
                    const month = months[monthName];
                    if (month !== undefined) {
                        const parsedDate = new Date(year, month, day);
                        Logger.debug(`📅 Trip start date parsed from flight data: ${parsedDate}`);
                        return parsedDate;
                    }
                }
            }
            
            // Fallback final: fecha del vuelo basada en tripConfig
            Logger.warning('⚠️ Could not determine trip start date from flights or itinerary, using default.');
            return new Date('2025-10-09T22:45:00Z'); // Fecha por defecto si no se encuentra
            
        } catch (error) {
            Logger.error('Error getting trip start date:', error);
            return new Date('2025-10-09T22:45:00Z');
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
     * 🗑️ OBSOLETO: renderGastos() - Migrado a renderPlanning()
     * @deprecated Usar renderPlanning() en su lugar
     */
    renderGastos() {
        Logger.warning('⚠️ renderGastos() obsoleto - redirigiendo a PLANNING');
        this.changeView(VIEWS.PLANNING);
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
                <div class="bg-white dark:bg-slate-900 radius-card w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-[999999]" style="pointer-events: auto;">
                    <button id="close-modal-btn" class="absolute top-4 right-4 z-[999999] p-2 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    <img src="${day.image}" alt="${day.title}" class="w-full h-64 md:h-72 object-cover rounded-t-2xl" onerror="this.onerror=null;this.src='https://placehold.co/800x400/4f46e5/ffffff?text=Himalaya';">
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
                <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
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
                <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
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
                <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
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
                <div class="bg-red-50 dark:bg-red-900/20 radius-card p-6 border border-red-200 dark:border-red-800">
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
                <div class="bg-white dark:bg-slate-800 p-6 radius-card shadow-card border border-slate-200 dark:border-slate-700">
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
     * Renderizar información del clima con detalles completos
     */
    async renderWeather() {
        Logger.ui('🌤️ Rendering enhanced weather information');
        const container = document.getElementById('weather');
        if (!container) {
            Logger.warning('⚠️ Container #weather not found');
            return;
        }

        // Información climática detallada para el período de viaje
        const enhancedWeatherData = [
            {
                location: 'Katmandú',
                country: 'Nepal',
                dayTemp: '22-25°C',
                nightTemp: '5-10°C',
                humidity: '65%',
                condition: 'Despejado',
                uvIndex: '7 (Alto)',
                wind: '12 km/h',
                forecast: ['☀️ 24°C', '⛅ 21°C', '🌤️ 23°C'],
                icon: 'location_city',
                color: 'text-green-600'
            },
            {
                location: 'Pokhara',
                country: 'Nepal',
                dayTemp: '22-25°C',
                nightTemp: '5-10°C',
                humidity: '70%',
                condition: 'Templado',
                uvIndex: '6 (Moderado)',
                wind: '8 km/h',
                forecast: ['🌤️ 23°C', '☁️ 20°C', '🌦️ 18°C'],
                icon: 'landscape',
                color: 'text-green-600'
            },
            {
                location: 'Chitwan',
                country: 'Nepal',
                dayTemp: '25-30°C',
                nightTemp: '15-20°C',
                humidity: '80%',
                condition: 'Húmedo',
                uvIndex: '8 (Alto)',
                wind: '6 km/h',
                forecast: ['☀️ 28°C', '🌤️ 26°C', '⛅ 24°C'],
                icon: 'wb_sunny',
                color: 'text-green-600'
            },
            {
                location: 'Thimphu',
                country: 'Bután',
                dayTemp: '15-22°C',
                nightTemp: '0-7°C',
                humidity: '55%',
                condition: 'Fresco',
                uvIndex: '5 (Moderado)',
                wind: '15 km/h',
                forecast: ['🌤️ 18°C', '❄️ 12°C', '☁️ 16°C'],
                icon: 'terrain',
                color: 'text-blue-600'
            },
            {
                location: 'Paro',
                country: 'Bután',
                dayTemp: '15-22°C',
                nightTemp: '0-7°C',
                humidity: '60%',
                condition: 'Montañoso',
                uvIndex: '6 (Moderado)',
                wind: '18 km/h',
                forecast: ['⛅ 17°C', '🌨️ 10°C', '🌤️ 19°C'],
                icon: 'terrain',
                color: 'text-blue-600'
            },
            {
                location: 'Punakha',
                country: 'Bután',
                dayTemp: '18-25°C',
                nightTemp: '10-15°C',
                humidity: '62%',
                condition: 'Templado',
                uvIndex: '6 (Moderado)',
                wind: '10 km/h',
                forecast: ['☀️ 22°C', '🌤️ 20°C', '⛅ 18°C'],
                icon: 'landscape',
                color: 'text-blue-600'
            }
        ];

        const weatherHTML = `
            <div class="flex items-center gap-4 mb-12">
                <span class="material-symbols-outlined text-3xl text-orange-600 dark:text-orange-400">wb_sunny</span>
                <div>
                    <h2 class="text-3xl font-black text-slate-900 dark:text-white">Información Climática</h2>
                    <p class="text-lg text-slate-600 dark:text-slate-400">Condiciones actuales en cada destino</p>
                </div>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${enhancedWeatherData.map(location => `
                    <div class="bg-white dark:bg-slate-800 radius-card p-6 shadow-card shadow-card-hover border border-slate-200 dark:border-slate-700 transition-standard">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-2xl ${location.color}">${location.icon}</span>
                            <div>
                                <h3 class="font-bold text-slate-900 dark:text-white">${location.location}</h3>
                                <p class="text-sm text-slate-600 dark:text-slate-400">${location.condition}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-bold ${location.color}">${location.forecast[0]}</div>
                                <div class="text-xs font-medium ${location.color}">${location.country}</div>
                            </div>
                        </div>
                        
                        <!-- Temperaturas principales -->
                        <div class="grid grid-cols-2 gap-3 mb-4">
                            <div class="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center border border-orange-200 dark:border-orange-700 hover:shadow-md transition-standard">
                                <span class="material-symbols-outlined text-orange-600 text-sm animate-pulse">wb_sunny</span>
                                <div class="text-sm font-medium text-orange-800 dark:text-orange-200">Día</div>
                                <div class="text-lg font-bold text-orange-900 dark:text-orange-100">${location.dayTemp}</div>
                            </div>
                            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-700 hover:shadow-md transition-standard">
                                <span class="material-symbols-outlined text-blue-600 text-sm">nights_stay</span>
                                <div class="text-sm font-medium text-blue-800 dark:text-blue-200">Noche</div>
                                <div class="text-lg font-bold text-blue-900 dark:text-blue-100">${location.nightTemp}</div>
                            </div>
                        </div>
                        
                        <!-- Detalles climáticos -->
                        <div class="space-y-2 text-sm mb-4">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">water_drop</span>
                                    Humedad:
                                </span>
                                <span class="font-medium text-slate-900 dark:text-white">${location.humidity}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">light_mode</span>
                                    UV:
                                </span>
                                <span class="font-medium text-slate-900 dark:text-white">${location.uvIndex}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">air</span>
                                    Viento:
                                </span>
                                <span class="font-medium text-slate-900 dark:text-white">${location.wind}</span>
                            </div>
                        </div>
                        
                        <!-- Previsión 3 días -->
                        <div class="border-t border-slate-200 dark:border-slate-700 pt-3">
                            <div class="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Previsión:</div>
                            <div class="flex justify-between">
                                ${location.forecast.map((day, index) => `
                                    <div class="text-center">
                                        <div class="text-xs text-slate-500 dark:text-slate-500">${index === 0 ? 'Hoy' : index === 1 ? 'Mañana' : 'Pasado'}</div>
                                        <div class="text-sm">${day}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            

        `;

        container.innerHTML = weatherHTML;
        Logger.success('✅ Enhanced weather information rendered');
    }

    /**
     * 🛫 RENDERIZAR INFORMACIÓN DE VUELOS PARA HOY (solo si hay vuelos)
     */
    renderFlightInfoForToday() {
        try {
            const today = stateManager.getCurrentDate();
            const todayFormatted = DateUtils.formatMediumDate(today);
            
            // Buscar si hay vuelos en la fecha actual
            const flightForToday = this.getFlightForDate(today);
            
            if (!flightForToday) {
                Logger.debug('📅 No flights for today, skipping flight info cards');
                return '';
            }
            
            Logger.debug(`✈️ Flight found for today: ${flightForToday.title}`);
            
            // Obtener información específica del vuelo
            const flightInfo = this.getFlightDetails(flightForToday);
            
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-slate-800 p-6 radius-card shadow-card border border-slate-200 dark:border-slate-700 text-center">
                        <span class="material-symbols-outlined text-4xl text-green-600 dark:text-green-400 mx-auto mb-4 block">location_on</span>
                        <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">Origen</h3>
                        <p class="text-slate-600 dark:text-slate-400">${flightInfo.origin}</p>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 p-6 radius-card shadow-card border border-slate-200 dark:border-slate-700 text-center">
                        <span class="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400 mx-auto mb-4 block">flight_land</span>
                        <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">Destino</h3>
                        <p class="text-slate-600 dark:text-slate-400">${flightInfo.destination}</p>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 p-6 radius-card shadow-card border border-slate-200 dark:border-slate-700 text-center">
                        <span class="material-symbols-outlined text-4xl text-orange-600 dark:text-orange-400 mx-auto mb-4 block">schedule</span>
                        <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">Horario</h3>
                        <p class="text-slate-600 dark:text-slate-400">${flightInfo.time}</p>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 p-6 radius-card shadow-card border border-slate-200 dark:border-slate-700 text-center">
                        <span class="material-symbols-outlined text-4xl text-purple-600 dark:text-purple-400 mx-auto mb-4 block">airplane_ticket</span>
                        <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">Aerolínea</h3>
                        <p class="text-slate-600 dark:text-slate-400">${flightInfo.airline}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            Logger.error('Error rendering flight info for today:', error);
            return '';
        }
    }

    /**
     * 🔍 OBTENER VUELO PARA UNA FECHA ESPECÍFICA
     */
    getFlightForDate(date) {
        try {
            const targetDateFormatted = DateUtils.formatMediumDate(date);
            Logger.debug(`🔍 Looking for flights on: ${targetDateFormatted}`);
            
            // Buscar en todos los vuelos
            for (const flight of tripConfig.flightsData) {
                if (flight.segments) {
                    for (const segment of flight.segments) {
                        if (segment.fromDateTime) {
                            // Extraer fecha del formato "9 de Octubre 22:45"
                            const flightDate = this.parseFlightDate(segment.fromDateTime);
                            if (flightDate && this.isSameDay(date, flightDate)) {
                                Logger.debug(`✈️ Found matching flight: ${flight.title} on ${segment.fromDateTime}`);
                                return flight;
                            }
                        }
                    }
                }
            }
            
            return null;
        } catch (error) {
            Logger.error('Error getting flight for date:', error);
            return null;
        }
    }

    /**
     * 📅 PARSEAR FECHA DE VUELO
     */
    parseFlightDate(dateTimeString) {
        try {
            // Parsear "9 de Octubre 22:45" a Date object
            const months = {
                'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
                'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
            };
            
            const parts = dateTimeString.split(' ');
            const day = parseInt(parts[0]);
            const monthName = parts[2];
            const monthIndex = months[monthName];
            
            if (monthIndex !== undefined) {
                const year = tripConfig.tripInfo?.year || 2025;
                return new Date(year, monthIndex, day);
            }
            
            return null;
        } catch (error) {
            Logger.error('Error parsing flight date:', error);
            return null;
        }
    }

    /**
     * 📅 VERIFICAR SI DOS FECHAS SON EL MISMO DÍA
     */
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    /**
     * ✈️ OBTENER DETALLES DEL VUELO
     */
    getFlightDetails(flight) {
        try {
            if (!flight.segments || flight.segments.length === 0) {
                return {
                    origin: 'No especificado',
                    destination: 'No especificado',
                    time: 'Por confirmar',
                    airline: flight.airline || 'No especificado'
                };
            }
            
            const firstSegment = flight.segments[0];
            const lastSegment = flight.segments[flight.segments.length - 1];
            
            // Mapear códigos de aeropuerto a nombres
            const airportNames = {
                'MAD': 'Madrid, España',
                'DOH': 'Doha, Qatar',
                'KTM': 'Katmandú, Nepal',
                'PBH': 'Paro, Bután'
            };
            
            return {
                origin: airportNames[firstSegment.from] || firstSegment.from,
                destination: airportNames[lastSegment.to] || lastSegment.to,
                time: firstSegment.fromDateTime,
                airline: flight.airline || 'No especificado'
            };
        } catch (error) {
            Logger.error('Error getting flight details:', error);
            return {
                origin: 'Error',
                destination: 'Error',
                time: 'Error',
                airline: 'Error'
            };
        }
    }

    /**
     * 🌅 NUEVA ESTRUCTURA - TODAY LANDING PAGE
     * Combina la vista HOY con micro-stats como página principal
     */
    renderTodayLanding() {
        Logger.ui('🌅 Rendering TODAY as landing page with micro-stats');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-48 sm:pb-52 lg:pb-56">
                <!-- Header de Hoy -->
                <div class="mb-12">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-6xl text-orange-600 dark:text-orange-400">today</span>
                        <div>
                            <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Hoy en tu Viaje</h1>
                            <p class="text-lg text-slate-600 dark:text-slate-400">Tu compañero de aventura día a día</p>
                        </div>
                    </div>
                    <div class="text-sm text-slate-500 dark:text-slate-500" id="today-date">Cargando fecha...</div>
                </div>

                <!-- Estado y progreso del viaje -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Progreso del viaje -->
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">trending_up</span>
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Progreso del Viaje</h3>
                        </div>
                    
                        <div class="space-y-4">
                            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-medium text-blue-800 dark:text-blue-200">Días completados</span>
                                    <span class="text-xs text-blue-600 dark:text-blue-400" id="trip-progress-percentage">0%</span>
                                </div>
                                <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                    <div id="progress-bar" class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-standard" style="width: 0%"></div>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-3 text-center">
                                <div class="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                                    <div class="text-2xl font-bold text-slate-900 dark:text-white" id="total-days">${tripConfig.itineraryData.length}</div>
                                    <div class="text-xs text-slate-600 dark:text-slate-400">días totales</div>
                                </div>
                                <div class="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                                    <div class="text-2xl font-bold text-slate-900 dark:text-white" id="days-elapsed">0</div>
                                    <div class="text-xs text-slate-600 dark:text-slate-400">días transcurridos</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Clima de hoy -->
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="material-symbols-outlined text-2xl text-orange-600 dark:text-orange-400">wb_sunny</span>
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Clima de Hoy</h3>
                        </div>
                        
                        <div id="today-weather-info" class="space-y-4">
                            <!-- Contenido dinámico del clima -->
                        </div>
                    </div>
                </div>

                <!-- Actividades del día -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <div id="today-main-content" class="min-h-[200px]">
                        <!-- Contenido dinámico de actividades -->
                    </div>
                </div>

                <!-- Micro-stats específicas de HOY (integradas en el flujo) -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card p-4 text-center border border-slate-200 dark:border-slate-700">
                        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400" id="today-current-day">Día 1</div>
                        <div class="text-sm text-slate-600 dark:text-slate-400">de 18</div>
                    </div>
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card p-4 text-center border border-slate-200 dark:border-slate-700">
                        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400" id="today-remaining-days">17</div>
                        <div class="text-sm text-slate-600 dark:text-slate-400">días restantes</div>
                    </div>
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card p-4 text-center border border-slate-200 dark:border-slate-700">
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400" id="today-total-budget">€0</div>
                        <div class="text-sm text-slate-600 dark:text-slate-400">presupuesto total</div>
                    </div>
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card p-4 text-center border border-slate-200 dark:border-slate-700">
                        <div class="text-2xl font-bold text-orange-600 dark:text-orange-400" id="today-progress-percent">0%</div>
                        <div class="text-sm text-slate-600 dark:text-slate-400">completado</div>
                    </div>
                </div>
            </div>
        `;

        // Cargar contenido dinámico después de renderizar el HTML
        this.loadTodayContent();
    }

    /**
     * 🔄 CARGAR CONTENIDO DINÁMICO DE HOY
     * Método auxiliar para cargar el contenido específico del día
     */
    loadTodayContent() {
        // Actualizar fecha
        this.updateTodayDateHeader();
        
        // Cargar información del día en el contenedor principal
        const mainContentContainer = document.getElementById('today-main-content');
        if (mainContentContainer) {
            this.loadTodayMainInfo(mainContentContainer);
        }
        
        // Actualizar clima
        this.updateTodayWeather();
        
        // Actualizar micro-stats
        this.updateTodayMicroStats();
    }
    }

    /**
     * 🧮 CALCULAR PRESUPUESTO TOTAL REAL
     * Calcula el presupuesto total desde tripConfig.budgetData
     */
    calculateTotalBudget() {
        try {
            const budgetCategories = tripConfig.budgetData?.budgetData || {};
            let totalBudget = 0;
            
            // Iterar por todas las categorías del presupuesto
            Object.values(budgetCategories).forEach(categoryItems => {
                if (Array.isArray(categoryItems)) {
                    categoryItems.forEach(item => {
                        const cost = parseFloat(item.cost) || 0;
                        totalBudget += cost;
                        
                        // Si hay subitems, también sumarlos
                        if (item.subItems && Array.isArray(item.subItems)) {
                            item.subItems.forEach(subItem => {
                                totalBudget += parseFloat(subItem.cost) || 0;
                            });
                        }
                    });
                }
            });
            
            return totalBudget;
        } catch (error) {
            Logger.error('Error calculating total budget:', error);
            return 0;
        }
    }

    /**
     * 📊 ACTUALIZAR MICRO-STATS DE HOY
     * Actualiza las estadísticas específicas y dinámicas del día actual
     */
    updateTodayMicroStats() {
        try {
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            const totalDays = tripConfig.itineraryData.length;
            
            // Calcular día actual y días restantes
            let currentDay, remainingDays;
            if (dayDiff < 0) {
                // Antes del viaje
                currentDay = 0;
                remainingDays = totalDays;
            } else if (dayDiff >= 0 && dayDiff < totalDays) {
                // Durante el viaje
                currentDay = dayDiff + 1;
                remainingDays = totalDays - currentDay;
            } else {
                // Después del viaje
                currentDay = totalDays;
                remainingDays = 0;
            }
            
            // Actualizar día actual
            const currentDayElement = document.getElementById('today-current-day');
            if (currentDayElement) {
                if (currentDay === 0) {
                    currentDayElement.textContent = '¡Pronto!';
                } else if (currentDay > totalDays) {
                    currentDayElement.textContent = '¡Terminado!';
                } else {
                    currentDayElement.textContent = `Día ${currentDay}`;
                }
            }
            
            // Actualizar días restantes
            const remainingDaysElement = document.getElementById('today-remaining-days');
            if (remainingDaysElement) {
                remainingDaysElement.textContent = remainingDays.toString();
            }
            
            // Actualizar presupuesto real (mantener por relevancia)
            const budgetElement = document.getElementById('today-total-budget');
            if (budgetElement) {
                const totalBudget = this.calculateTotalBudget();
                budgetElement.textContent = `€${Math.round(totalBudget).toLocaleString('es-ES')}`;
            }
            
            // Calcular y actualizar progreso
            const progressElement = document.getElementById('today-progress-percent');
            if (progressElement) {
                let progress = 0;
                
                if (dayDiff < 0) {
                    progress = 0;
                } else if (dayDiff >= 0 && dayDiff < totalDays) {
                    progress = Math.round((currentDay / totalDays) * 100);
                } else {
                    progress = 100;
                }
                
                progressElement.textContent = `${progress}%`;
                
                // Cambiar color según el progreso (más dinámico)
                progressElement.className = progressElement.className.replace(/text-\w+-\d+/g, '');
                if (progress === 0) {
                    progressElement.classList.add('text-slate-600', 'dark:text-slate-400');
                } else if (progress < 25) {
                    progressElement.classList.add('text-red-600', 'dark:text-red-400');
                } else if (progress < 75) {
                    progressElement.classList.add('text-orange-600', 'dark:text-orange-400');
                } else if (progress < 100) {
                    progressElement.classList.add('text-green-600', 'dark:text-green-400');
                } else {
                    progressElement.classList.add('text-blue-600', 'dark:text-blue-400'); // Azul para completado
                }
            }
            
            Logger.debug('Today micro-stats updated:', { currentDay, remainingDays, progress, dayDiff });
        } catch (error) {
            Logger.error('Error updating today micro-stats:', error);
        }
    }

    /**
     * 🎯 NUEVA ESTRUCTURA - PLANNING (gastos + extras + packing)
     * Combina gestión de presupuesto, packing list y herramientas
     */
    renderPlanning() {
        Logger.ui('🎯 Rendering PLANNING view (budget + packing + tools)');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                <!-- Header de Planificación -->
                <div class="mb-12">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-6xl text-indigo-600 dark:text-indigo-400">checklist</span>
                        <div>
                            <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Planificación</h1>
                            <p class="text-lg text-slate-600 dark:text-slate-400">Gestiona tu presupuesto, packing y preparativos del viaje</p>
                        </div>
                    </div>
                </div>

                <!-- Sección de Presupuesto -->
                <div id="budget-section" class="mb-12">
                    <!-- Contenedor para el BudgetManager -->
                    <div id="budget-container">
                        <!-- El BudgetManager se renderizará aquí con título integrado -->
                    </div>
                </div>

                <!-- Sección de Packing List -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-teal-600 dark:text-teal-400">inventory_2</span>
                        Lista de Equipaje
                    </h2>
                    <div id="packing-list-content">
                        <p class="text-slate-600 dark:text-slate-400">Cargando lista de equipaje...</p>
                    </div>
                </div>

                <!-- Sección de Agencias de Viaje -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-orange-600 dark:text-orange-400">business</span>
                        Agencias de Viaje
                    </h2>
                    <div id="agencies-content">
                        <!-- Las agencias se renderizarán aquí -->
                    </div>
                </div>

                <!-- Sección de Alojamientos -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">hotel</span>
                        Alojamientos del Viaje
                    </h2>
                    <div id="accommodations-content">
                        <!-- Los alojamientos se renderizarán aquí -->
                    </div>
                </div>
            </div>
        `;

        // Renderizar el presupuesto en la sección dedicada
        const budgetContainer = document.getElementById('budget-container');
        if (budgetContainer) {
            this.budgetManager.render(budgetContainer);
        }

        // Cargar packing list (si existe)
        this.loadPackingList();
        
        // Cargar agencias de viaje
        this.loadAgencies();
        
        // Cargar información de alojamientos
        this.loadAccommodations();
        
        // Actualizar micro-stats dinámicamente
        this.updateTodayMicroStats();
    }

    /**
     * 📊 NUEVA ESTRUCTURA - TRACKING (mapa + analytics)
     * Combina mapa del viaje con analytics y progreso
     */
    renderTracking() {
        Logger.ui('📊 Rendering TRACKING view (map + analytics)');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                <!-- Header de Seguimiento -->
                <div class="mb-12">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-6xl text-emerald-600 dark:text-emerald-400">analytics</span>
                        <div>
                            <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Seguimiento</h1>
                            <p class="text-lg text-slate-600 dark:text-slate-400">Mapa del viaje y análisis de progreso</p>
                        </div>
                    </div>
                </div>



                <!-- Resumen/Analytics aquí (se renderiza dinámicamente) -->
                <div id="summary-stats" class="mb-8">
                    <!-- Las estadísticas del resumen se renderizarán aquí -->
                </div>

                <!-- Mapa del Viaje -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-2 relative z-10">
                    <div class="flex items-center gap-3 mb-4 p-4">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">map</span>
                        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Mapa del Viaje</h2>
                    </div>
                    <div id="map-container" class="w-full h-[80vh] min-h-[600px] rounded-xl overflow-hidden relative">
                        <!-- El mapa se renderizará aquí -->
                    </div>
                </div>
            </div>
        `;

        // Renderizar el resumen/analytics COMPLETO usando SummaryRenderer (SIN sección duplicada "Hoy")
                    const summaryStats = document.getElementById('summary-stats');
        
        if (summaryStats) {
            // Renderizar SummaryRenderer directamente en main-content
            const mainContent = document.getElementById('main-content');
            const originalHTML = mainContent.innerHTML;
            
            this.summaryRenderer.renderSummary();
            
            // Extraer solo las secciones de contenido (sin header y sin "Qué hacemos hoy")
            const sections = mainContent.querySelectorAll('section');
            
            const summaryContent = [];
            sections.forEach((section, index) => {
                // Filtrar SOLO la sección específica "¿Qué hacemos hoy?" usando el título h2
                const h2Title = section.querySelector('h2')?.textContent || '';
                const h3Title = section.querySelector('h3')?.textContent || '';
                const isHoySection = h2Title.includes('¿Qué hacemos hoy?');
                

                
                if (!isHoySection) {
                    const clonedSection = section.cloneNode(true);
                    summaryContent.push(clonedSection);
                }
            });
            
            // Restaurar el HTML original del tracking y agregar las secciones filtradas
            mainContent.innerHTML = originalHTML;
            const summaryStatsRestored = document.getElementById('summary-stats');
            summaryStatsRestored.innerHTML = '';
            
            // Agregar las secciones con el wrapper correcto para mantener el estilo
            if (summaryContent.length > 0) {
                const wrapper = document.createElement('div');
                wrapper.className = 'space-y-8 md:space-y-12 lg:space-y-16';
                summaryContent.forEach(section => {
                    wrapper.appendChild(section);
                });
                summaryStatsRestored.appendChild(wrapper);
            }
            
        }

        // Renderizar el mapa usando la instancia global importada (DESPUÉS del contenido)
        setTimeout(() => {
            const mapContainer = document.getElementById('map-container');
            
            if (mapRenderer && typeof mapRenderer.renderMap === 'function' && mapContainer) {
                try {
                    mapRenderer.renderMap(mapContainer);
                } catch (error) {
                    Logger.error('❌ Error rendering map in tracking view:', error);
                    mapContainer.innerHTML = `
                        <div class="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                            <div class="text-center">
                                <span class="material-symbols-outlined text-6xl mb-4 block">map</span>
                                <p>Error al cargar el mapa</p>
                                <button onclick="window.location.reload()" class="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white radius-standard transition-standard">
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    `;
                }
            }
        }, 500); // Aumentar delay para asegurar que el DOM esté completamente listo
    }

    /**
     * Helper: Cargar packing list REAL con PackingListManager
     */
    async loadPackingList() {
        const packingContent = document.getElementById('packing-list-content');
        if (!packingContent) return;

        // Usar datos REALES de tripConfig en lugar de Firestore
        const packingData = tripConfig.packingListData || {};
        const categories = Object.keys(packingData);
        
        if (categories.length === 0) {
            // Fallback si no hay datos en tripConfig
            packingContent.innerHTML = `
                <div class="text-center py-8">
                    <div class="mb-4">
                        <span class="material-symbols-outlined text-4xl text-slate-400">inventory_2</span>
                    </div>
                    <p class="text-slate-600 dark:text-slate-400 mb-4">No hay datos de equipaje en la configuración</p>
                </div>
            `;
        } else {
            // Mostrar resumen de las categorías de tripConfig
            const totalItems = Object.values(packingData).flat().length;
            const categoriesPreview = categories.slice(0, 3);
            
            packingContent.innerHTML = `
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-teal-50 dark:bg-teal-900/20 radius-standard">
                        <span class="font-medium text-teal-800 dark:text-teal-200">Lista de equipaje</span>
                        <span class="text-2xl font-bold text-teal-600 dark:text-teal-400">${totalItems}</span>
                        <span class="text-sm text-teal-700 dark:text-teal-300">items</span>
                    </div>
                    
                    <div class="space-y-2">
                        <h4 class="font-medium text-slate-700 dark:text-slate-300">Categorías:</h4>
                        ${categoriesPreview.map(category => `
                            <div class="flex items-center gap-2 text-sm">
                                <span class="w-4 h-4 text-teal-600">📦</span>
                                <span class="text-slate-600 dark:text-slate-400">${category} (${packingData[category].length} items)</span>
                            </div>
                        `).join('')}
                        ${categories.length > 3 ? `<div class="text-xs text-slate-500">... y ${categories.length - 3} categorías más</div>` : ''}
                    </div>
                    
                    <div class="text-center">
                        <button id="show-full-packing-list" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white radius-standard transition-standard">
                            Ver Lista Completa
                        </button>
                    </div>
                </div>
            `;
            
            // Event listener para mostrar lista completa
            const showButton = document.getElementById('show-full-packing-list');
            if (showButton) {
                showButton.addEventListener('click', () => {
                    this.renderFullPackingListFromConfig(packingContent, packingData);
                });
            }
        }
    }

    /**
     * Helper: Renderizar lista completa de equipaje desde tripConfig
     */
    renderFullPackingListFromConfig(container, packingData) {
        try {
            const categories = Object.keys(packingData);
            
            container.innerHTML = `
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white">Lista Completa de Equipaje</h4>
                        <button id="collapse-packing-list" class="text-sm text-teal-600 dark:text-teal-400 hover:underline">
                            ← Volver al resumen
                        </button>
                    </div>
                    
                    ${categories.map(category => `
                        <div class="bg-slate-50 dark:bg-slate-700 radius-standard p-4">
                            <h5 class="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                                <span class="text-teal-600">📦</span> ${category}
                                <span class="text-sm text-slate-500">(${packingData[category].length} items)</span>
                            </h5>
                            <div class="grid md:grid-cols-2 gap-2">
                                ${packingData[category].map(item => `
                                    <div class="flex items-center gap-3 p-2 bg-white dark:bg-slate-600 radius-standard text-sm">
                                        <input type="checkbox" class="w-4 h-4 text-teal-600">
                                        <span class="text-slate-700 dark:text-slate-300">${item}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Event listener para volver
            const collapseBtn = document.getElementById('collapse-packing-list');
            if (collapseBtn) {
                collapseBtn.addEventListener('click', () => {
                    this.loadPackingList(); // Volver al resumen
                });
            }
            
        } catch (error) {
            Logger.error('Error rendering full packing list from config:', error);
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-600 dark:text-red-400 mb-4">Error al mostrar la lista completa</p>
                    <button onclick="this.loadPackingList()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white radius-standard transition-standard">
                        Volver al resumen
                    </button>
                </div>
            `;
        }
    }

    /**
     * Helper: Renderizar lista completa de equipaje (Firestore - deprecated)
     */
    renderFullPackingList(container, packingManager) {
        try {
            const allItems = packingManager.localCache || {};
            const itemEntries = Object.entries(allItems);
            
            container.innerHTML = `
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white">Lista Completa de Equipaje</h4>
                        <button id="collapse-packing-list" class="text-sm text-teal-600 dark:text-teal-400 hover:underline">
                            ← Volver al resumen
                        </button>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-3">
                        ${itemEntries.map(([itemKey, checked]) => `
                            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 radius-standard hover:bg-slate-100 dark:hover:bg-slate-600 transition-standard">
                                <input type="checkbox" 
                                       id="item-${itemKey}" 
                                       ${checked ? 'checked' : ''} 
                                       data-item-key="${itemKey}"
                                       class="w-5 h-5 text-teal-600 dark:text-teal-400">
                                <label for="item-${itemKey}" class="flex-1 text-slate-700 dark:text-slate-300 cursor-pointer ${checked ? 'line-through text-slate-400' : ''}">
                                    ${itemKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="flex gap-3">
                        <button id="add-packing-item" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white radius-standard transition-standard">
                            + Agregar Item
                        </button>
                        <button id="save-packing-list" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white radius-standard transition-standard">
                            💾 Guardar Cambios
                        </button>
                    </div>
                </div>
            `;
            
            // Event listeners
            const collapseBtn = document.getElementById('collapse-packing-list');
            if (collapseBtn) {
                collapseBtn.addEventListener('click', () => {
                    this.loadPackingList(); // Volver al resumen
                });
            }
            
            // Listeners para checkboxes
            itemEntries.forEach(([itemKey]) => {
                const checkbox = document.getElementById(`item-${itemKey}`);
                if (checkbox) {
                    checkbox.addEventListener('change', async (e) => {
                        try {
                            await packingManager.toggleItem(itemKey, e.target.checked);
                            
                            // Actualizar visualmente
                            const label = checkbox.nextElementSibling;
                            if (label) {
                                if (e.target.checked) {
                                    label.classList.add('line-through', 'text-slate-400');
                                } else {
                                    label.classList.remove('line-through', 'text-slate-400');
                                }
                            }
                        } catch (error) {
                            Logger.error('Error toggling item:', error);
                            // Revertir checkbox en caso de error
                            checkbox.checked = !checkbox.checked;
                        }
                    });
                }
            });
            
            // Agregar nuevo item
            const addBtn = document.getElementById('add-packing-item');
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    const itemName = prompt('Nombre del nuevo item:');
                    if (itemName && itemName.trim()) {
                        const itemKey = itemName.trim().toLowerCase().replace(/\s+/g, '-');
                        packingManager.toggleItem(itemKey, false);
                        this.renderFullPackingList(container, packingManager);
                    }
                });
            }
            
        } catch (error) {
            Logger.error('Error rendering full packing list:', error);
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-600 dark:text-red-400 mb-4">Error al mostrar la lista completa</p>
                    <button onclick="this.loadPackingList()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white radius-standard transition-standard">
                        Volver al resumen
                    </button>
                </div>
            `;
        }
    }

    /**
     * Helper: Cargar agencias de viaje
     */
    loadAgencies() {
        const agenciesContent = document.getElementById('agencies-content');
        if (!agenciesContent) return;

        // Llamar al método renderAgencies existente que ya tenemos en el UIRenderer
        const agencies = tripConfig.agenciesData;
        
        agenciesContent.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6">
                <!-- WeRoad Nepal -->
                <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${agencies.weroad.color}">${agencies.weroad.icon}</span>
                        <div>
                            <h3 class="font-bold text-lg text-slate-900 dark:text-white">${agencies.weroad.name}</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">${agencies.weroad.tour}</p>
                        </div>
                    </div>
                    <p class="text-slate-700 dark:text-slate-300 mb-4">${agencies.weroad.description}</p>
                    <div class="flex gap-3">
                        <a href="${agencies.weroad.url}" target="_blank" 
                           class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white radius-standard transition-standard text-sm">
                            Ver Paquete
                        </a>
                        <span class="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 radius-standard text-sm font-medium">
                            ${agencies.weroad.price}
                        </span>
                    </div>
                </div>

                <!-- Best of Bhutan -->
                <div class="bg-slate-50 dark:bg-slate-700 radius-card p-6 border border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${agencies.bhutan.color}">${agencies.bhutan.icon}</span>
                        <div>
                            <h3 class="font-bold text-lg text-slate-900 dark:text-white">${agencies.bhutan.name}</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">${agencies.bhutan.tour}</p>
                        </div>
                    </div>
                    <p class="text-slate-700 dark:text-slate-300 mb-4">${agencies.bhutan.description}</p>
                    <div class="flex gap-3">
                        <a href="${agencies.bhutan.url}" target="_blank" 
                           class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white radius-standard transition-standard text-sm">
                            Ver Tour
                        </a>
                        <span class="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 radius-standard text-sm font-medium">
                            ${agencies.bhutan.price}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Información de Emergencia y Contactos -->
            <div class="mt-8 bg-red-50 dark:bg-red-900/20 radius-card p-6 border border-red-200 dark:border-red-800">
                <h3 class="font-bold text-lg text-red-800 dark:text-red-200 mb-4 flex items-center gap-3">
                    <span class="material-symbols-outlined text-2xl ${agencies.emergency.color}">${agencies.emergency.icon}</span>
                    ${agencies.emergency.name}
                </h3>
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                    <div class="space-y-2">
                        <div class="font-medium text-red-700 dark:text-red-300">📞 Embajada de España</div>
                        <div class="text-red-600 dark:text-red-400">${agencies.emergency.embassy}</div>
                    </div>
                    <div class="space-y-2">
                        <div class="font-medium text-red-700 dark:text-red-300">🏥 Hospital Internacional</div>
                        <div class="text-red-600 dark:text-red-400">${agencies.emergency.hospital}</div>
                    </div>
                    <div class="space-y-2 md:col-span-2">
                        <div class="font-medium text-red-700 dark:text-red-300">🕒 Zonas Horarias</div>
                        <div class="text-red-600 dark:text-red-400">${agencies.emergency.timezone}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Helper: Cargar información de alojamientos
     */
    loadAccommodations() {
        const accommodationsContent = document.getElementById('accommodations-content');
        if (!accommodationsContent) return;

        // Extraer información de alojamientos del tripConfig
        const accommodationsByLocation = {};
        
        tripConfig.itineraryData.forEach(day => {
            if (day.accommodation && day.accommodation !== 'Vuelo nocturno') {
                const location = this.extractLocationFromDay(day);
                if (!accommodationsByLocation[location]) {
                    accommodationsByLocation[location] = [];
                }
                if (!accommodationsByLocation[location].includes(day.accommodation)) {
                    accommodationsByLocation[location].push(day.accommodation);
                }
            }
        });

        let accommodationsHTML = '<div class="space-y-4">';
        
        Object.entries(accommodationsByLocation).forEach(([location, hotels]) => {
            accommodationsHTML += `
                <div class="border border-slate-200 dark:border-slate-600 radius-standard p-4">
                    <h4 class="font-bold text-slate-900 dark:text-white mb-2">📍 ${location}</h4>
                    <div class="space-y-1">
                        ${hotels.map(hotel => `
                            <div class="text-slate-700 dark:text-slate-300 text-sm">🏨 ${hotel}</div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        accommodationsHTML += '</div>';
        accommodationsContent.innerHTML = accommodationsHTML;
    }

    /**
     * Cambiar vista
     */
    changeView(view) {
        Logger.ui(`🔄 Changing view from '${this.currentView}' to '${view}'`);
        this.currentView = view;
        
        // Log específico para herramientas y views obsoletas
        if (view === 'herramientas') {
            Logger.ui('🛠️ Tools view detected, calling renderMainContent...');
        }
        
        // Redirecciones para vistas obsoletas → NUEVA ESTRUCTURA 4 SECCIONES
        const obsoleteRedirects = {
            'extras': VIEWS.PLANNING,         // extras → planificacion
            'gastos': VIEWS.PLANNING,         // gastos → planificacion  
            'summary': VIEWS.TRACKING,        // summary → seguimiento
            'resumen': VIEWS.TRACKING,        // resumen → seguimiento
            'map': VIEWS.TRACKING,            // map → seguimiento
            'mapa': VIEWS.TRACKING            // mapa → seguimiento
        };
        
        if (obsoleteRedirects[view]) {
            Logger.warning(`⚠️ Vista "${view}" obsoleta, redirigiendo a "${obsoleteRedirects[view]}"`);
            this.currentView = obsoleteRedirects[view];
            return; // Early return para evitar renderizar la vista obsoleta
        }
        
        this.renderMainContent();
    }
}
