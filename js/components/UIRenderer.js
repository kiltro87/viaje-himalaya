/**
 * UIRenderer - Renderizador Principal de la Aplicación de Viaje
 * 
 * Esta clase es el núcleo del sistema de renderizado de la aplicación.
 * Gestiona la navegación entre vistas, el renderizado dinámico de contenido
 * y la integración con todos los componentes del sistema.
 * 
 * Funcionalidades principales:
 * - Renderizado de 6 vistas principales (Resumen, Itinerario, Hoy, Mapa, Gastos, Extras)
 * - Sistema de navegación responsive con detección de breakpoints
 * - Integración con sistema de trazabilidad completo
 * - Gestión de datos dinámicos desde tripConfig
 * - Renderizado de mapas interactivos con Leaflet
 * - Sistema de modales para detalles del itinerario
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
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
import { ItineraryRenderer } from './renderers/ItineraryRenderer.js';
import { UIHelpers } from '../utils/UIHelpers.js';

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
        this.cleanupResponsiveObserver = ResponsiveUtils.observeBreakpointChanges(
            (newBreakpoint, previousBreakpoint) => {
                this.onBreakpointChange(newBreakpoint, previousBreakpoint);
            }
        );
    }

    /**
     * Manejar cambios de breakpoint
     * 
     * Se ejecuta cuando cambia el breakpoint responsive.
     * Permite adaptar la interfaz dinámicamente.
     * 
     * @param {string} newBreakpoint - Nuevo breakpoint
     * @param {string} previousBreakpoint - Breakpoint anterior
     * @private
     */
    onBreakpointChange(newBreakpoint, previousBreakpoint) {
        Logger.responsive(`Breakpoint changed in UIRenderer: ${previousBreakpoint} → ${newBreakpoint}`);
        
        // Aquí se pueden agregar adaptaciones específicas por breakpoint
        // Por ejemplo, reorganizar elementos, cambiar layouts, etc.
        
        // Ejemplo: Ocultar/mostrar elementos según el breakpoint
        if (ResponsiveUtils.isMobile() && previousBreakpoint !== 'xs') {
            this.adaptForMobile();
        } else if (!ResponsiveUtils.isMobile() && previousBreakpoint === 'xs') {
            this.adaptForDesktop();
        }
    }

    /**
     * Adaptar interfaz para móvil
     * @private
     */
    adaptForMobile() {
        Logger.responsive('Adapting interface for mobile');
        // Implementar adaptaciones específicas para móvil
    }

    /**
     * Adaptar interfaz para desktop
     * @private
     */
    adaptForDesktop() {
        Logger.responsive('Adapting interface for desktop');
        // Implementar adaptaciones específicas para desktop
    }

    /**
     * Limpiar recursos del UIRenderer
     */
    cleanup() {
        if (this.cleanupResponsiveObserver) {
            this.cleanupResponsiveObserver();
        }
        Logger.init('UIRenderer cleanup completed');
    }

    /**
     * Renderizar la vista principal
     * 
     * Método central que coordina el renderizado de todas las vistas de la aplicación.
     * Utiliza un sistema de switch para determinar qué vista renderizar basándose
     * en this.currentView. Incluye métricas de rendimiento y logging completo.
     * 
     * Vistas soportadas:
     * - resumen: Dashboard principal con resumen del viaje
     * - itinerario: Timeline detallado día por día
     * - hoy: Estado actual del viaje y actividades del día
     * - mapa: Mapa interactivo con ruta y marcadores
     * - gastos: Gestión de presupuesto y gastos
     * - extras: Equipaje, clima e información práctica
     * 
     * @throws {Error} Si no se encuentra el elemento #main-content
     */
    renderMainContent() {
        Logger.ui('Starting main content render', { 
            view: this.currentView,
            viewport: ResponsiveUtils.getViewportInfo()
        });
        Logger.startPerformance(`render-${this.currentView}`);
        
        const mainContent = DOMUtils.getElementById('main-content');
        if (!mainContent) {
            Logger.error('Main content element not found', { selector: SELECTORS.MAIN_CONTENT });
            return;
        }

        // Mapeo de vistas a métodos de renderizado
        const viewRenderers = {
            [VIEWS.SUMMARY]: () => {
                Logger.ui('Rendering summary view');
                this.renderSummary();
            },
            [VIEWS.ITINERARY]: () => {
                Logger.ui('Rendering itinerary view');
                this.renderItinerary();
            },
            [VIEWS.TODAY]: () => {
                Logger.ui('Rendering today view');
                this.renderToday();
            },
            [VIEWS.MAP]: () => {
                Logger.map('Rendering map view');
                this.renderMap();
            },
            [VIEWS.BUDGET]: () => {
                Logger.budget('Rendering budget view');
                this.renderGastos();
            },
            [VIEWS.EXTRAS]: () => {
                Logger.ui('Rendering extras view');
                this.renderExtras();
            }
        };

        // Ejecutar renderer correspondiente o fallback
        const renderer = viewRenderers[this.currentView];
        if (renderer) {
            renderer();
        } else {
            Logger.warning(`Unknown view: ${this.currentView}, falling back to summary`, { 
                requestedView: this.currentView,
                availableViews: Object.keys(viewRenderers)
            });
            viewRenderers[VIEWS.SUMMARY]();
        }
        
        Logger.endPerformance(`render-${this.currentView}`);
        Logger.success(`View rendered successfully: ${this.currentView}`, {
            renderTime: Logger.getPerformanceSummary?.()?.totalRuntime || 0
        });
    }

    /**
     * Cambiar vista actual
     * 
     * Método público para cambiar entre las diferentes vistas de la aplicación.
     * Actualiza el estado interno y dispara el renderizado de la nueva vista.
     * Incluye logging de navegación con contexto responsive.
     * 
     * @param {string} view - La nueva vista a renderizar ('resumen', 'itinerario', 'hoy', 'mapa', 'gastos', 'extras')
     * @example
     * // Cambiar a la vista de gastos
     * uiRenderer.changeView('gastos');
     */
    changeView(view) {
        // Validar que la vista existe
        const validViews = Object.values(VIEWS);
        if (!validViews.includes(view)) {
            Logger.warning(`Invalid view requested: ${view}`, { 
                requestedView: view,
                validViews 
            });
            return;
        }

        const previousView = this.currentView;
        
        // Log de navegación con contexto completo
        Logger.navigation(previousView, view, { 
            timestamp: new Date().toISOString(),
            viewport: ResponsiveUtils.getViewportInfo(),
            navigationSource: 'UIRenderer.changeView'
        });
        
        // Actualizar estado y renderizar nueva vista
        this.currentView = view;
        this.renderMainContent();
        
        // Notificar cambio de vista para otros componentes
        this.notifyViewChange(previousView, view);
    }

    /**
     * Notificar cambio de vista
     * 
     * Permite que otros componentes reaccionen al cambio de vista.
     * 
     * @param {string} previousView - Vista anterior
     * @param {string} newView - Nueva vista
     * @private
     */
    notifyViewChange(previousView, newView) {
        // Disparar evento personalizado para otros componentes
        const event = new CustomEvent('viewChanged', {
            detail: { previousView, newView, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
        
        Logger.event(`View change event dispatched: ${previousView} → ${newView}`);
    }

    /* ========================================
     * UTILIDADES DELEGADAS A CLASES ESPECIALIZADAS
     * ======================================== */

    /**
     * Obtener fecha específica del viaje
     * @param {number} dayNumber - Número del día del viaje (0-based)
     * @returns {Date} Fecha correspondiente al día especificado
     */
    getTripDate(dayNumber) {
        return DateUtils.getTripDate(dayNumber);
    }

    /**
     * Obtiene la fecha de inicio del viaje
     * @returns {Date} Fecha de inicio del viaje (9 de octubre de 2025)
     */
    getTripStartDate() {
        return DateUtils.getTripDate(0);
    }

    /**
     * Formatear fecha en formato corto español
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada (ej: "15 Oct")
     */
    formatShortDate(date) {
        return FormatUtils.formatShortDate(date);
    }

    /**
     * Formatear cantidad monetaria en euros
     * @param {number} amount - Cantidad a formatear
     * @param {boolean} round - Si debe redondear a enteros
     * @returns {string} Cantidad formateada (ej: "1.234,56 €")
     */
    formatCurrency(amount, round = false) {
        return FormatUtils.formatCurrency(amount, round);
    }

    getTripStartDate() {
        if (tripConfig.flightsData && tripConfig.flightsData.length > 0) {
            const firstFlight = tripConfig.flightsData[0];
            if (firstFlight.segments && firstFlight.segments.length > 0) {
                const dateStr = firstFlight.segments[0].fromDateTime;
                const match = dateStr.match(/(\d+) de (\w+)/);
                if (match) {
                    const day = parseInt(match[1]);
                    const monthName = match[2];
                    const months = {
                        'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
                        'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
                    };
                    const month = months[monthName];
                    if (month !== undefined) {
                        // Usar 2025 como año del viaje futuro
                        return new Date(2025, month, day);
                    }
                }
            }
        }
        // Fecha de fallback si no se puede parsear
        return new Date(2025, 9, 9); // 9 de octubre 2025
    }

    updateTripDates() {
        const tripDatesElement = document.getElementById('trip-dates');
        if (!tripDatesElement) return;
        
        try {
            const startDate = this.getTripStartDate();
            const totalDays = tripConfig.itineraryData.length;
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + totalDays - 1);
            
            const startFormatted = startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const endFormatted = endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
            
            tripDatesElement.textContent = `${startFormatted} - ${endFormatted}`;
        } catch (error) {
            tripDatesElement.textContent = 'Fechas no disponibles';
        }
    }

    updateBudgetSummary() {
        try {
            // Obtener gastos del localStorage si existe AppState
            let totalSpent = 0;
            if (window.AppState && window.AppState.expenses) {
                totalSpent = window.AppState.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
            }
            
            // Calcular presupuesto total
            const budgetData = tripConfig.budgetData.budgetData;
            const allExpenses = Object.values(budgetData).flat();
            const totalBudget = allExpenses.reduce((sum, item) => {
                if (item.cost) return sum + item.cost;
                if (item.subItems) return sum + item.subItems.reduce((subSum, subItem) => subSum + (subItem.cost || 0), 0);
                return sum;
            }, 0);
            
            // Actualizar elementos
            const totalSpentElement = document.getElementById('total-spent-summary');
            const progressBar = document.getElementById('budget-progress-bar');
            
            if (totalSpentElement) {
                totalSpentElement.textContent = this.formatCurrency(totalSpent);
                // Cambiar color según si se excede el presupuesto
                if (totalSpent > totalBudget) {
                    totalSpentElement.className = 'text-red-600 dark:text-red-400';
                } else {
                    totalSpentElement.className = 'text-green-600 dark:text-green-400';
                }
            }
            

        } catch (error) {
            console.error('Error al actualizar resumen de presupuesto:', error);
        }
    }

    // Renderizar la vista de resumen (basada en el original)
    renderSummary() {
        console.log('📊 Renderizando resumen...');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Calcular estadísticas dinámicamente
        const totalDays = tripConfig.itineraryData.length;
        const totalCountries = tripConfig.calendarData.getTotalCountries();
        
        // Calcular presupuesto total y gastos reales dinámicamente
        const grandTotal = this.calculateTotalBudget();
        const totalSpent = this.calculateTotalSpent();
        
        // Calcular coste por día usando el mayor entre presupuesto y gasto real
        const costPerDay = Math.max(grandTotal, totalSpent) / totalDays;

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
                <!-- Header con imagen de fondo (exacto del original) -->
                <header class="relative h-96 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-200 dark:border-slate-700">
                    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out" style="background-image: url('https://www.lasociedadgeografica.com/blog/uploads/2019/10/bhutan-peaceful-tours-nido-del-tigre.jpg'); transform: scale(1.1);"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
                    
                    <!-- Floating elements -->
                    <div class="absolute top-6 right-6 flex gap-3">
                        <div class="bg-white/20 backdrop-blur-sm rounded-full p-3 shadow-lg">
                            <span class="material-symbols-outlined text-white text-lg">flight_takeoff</span>
                        </div>
                        <div class="bg-white/20 backdrop-blur-sm rounded-full p-3 shadow-lg">
                            <span class="material-symbols-outlined text-white text-lg">landscape</span>
                        </div>
                    </div>
                    
                    <div class="relative h-full flex flex-col justify-end p-4 sm:p-6 md:p-8 lg:p-12 text-white">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <span class="material-symbols-outlined text-white text-lg sm:text-xl">hiking</span>
                            </div>
                            <div class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                                <span id="trip-dates" class="text-sm font-medium">Cargando fechas...</span>
                            </div>
                        </div>
                        <h1 class="text-4xl md:text-6xl font-black leading-tight mb-3">Mi Aventura en el Himalaya</h1>
                        <p class="text-lg md:text-xl max-w-2xl opacity-90">Un recorrido para descubrir Nepal y Bután</p>
                    </div>
                </header>

                <!-- Cabecera Estado del viaje -->
                ${HeaderRenderer.renderPresetHeader('status')}

                <!-- Panel Estado del viaje -->
                <section class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between mb-8">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm text-slate-600 dark:text-slate-400">calendar_month</span>
                            <span id="today-date" class="text-slate-600 dark:text-slate-400">Cargando...</span>
                        </div>
                        <div class="text-right bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                            <div id="today-day" class="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">-</div>
                            <div id="today-day-label" class="text-blue-600 dark:text-blue-400 text-sm">Día del viaje</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div class="bg-slate-50 dark:bg-slate-700 rounded-2xl p-5 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200">
                            <div class="flex items-center gap-3 mb-3">
                                <span class="material-symbols-outlined text-xl text-blue-600 dark:text-blue-400">location_on</span>
                                <h3 class="font-semibold text-slate-900 dark:text-white">Próximo destino</h3>
                            </div>
                            <p id="next-destination" class="text-slate-600 dark:text-slate-400 text-sm">Cargando...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-700 rounded-2xl p-5 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200">
                            <div class="flex items-center gap-3 mb-3">
                                <span class="material-symbols-outlined text-xl text-green-600 dark:text-green-400">hotel</span>
                                <h3 class="font-semibold text-slate-900 dark:text-white">Alojamiento</h3>
                            </div>
                            <p id="today-accommodation" class="text-slate-600 dark:text-slate-400 text-sm">Cargando...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-700 rounded-2xl p-5 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200">
                            <div class="flex items-center gap-3 mb-3">
                                <span class="material-symbols-outlined text-xl text-orange-600 dark:text-orange-400">hiking</span>
                                <h3 class="font-semibold text-slate-900 dark:text-white">Actividad principal</h3>
                            </div>
                            <p id="today-activity" class="text-slate-600 dark:text-slate-400 text-sm">Cargando...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-700 rounded-2xl p-5 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200">
                            <div class="flex items-center gap-3 mb-3">
                                <span class="material-symbols-outlined text-xl text-sky-600 dark:text-sky-400">partly_cloudy_day</span>
                                <h3 class="font-semibold text-slate-900 dark:text-white">Clima</h3>
                            </div>
                            <p id="today-weather" class="text-slate-600 dark:text-slate-400 text-sm">Cargando...</p>
                        </div>
                    </div>
                    

                </section>



                <!-- Sección de Estilo eliminada - se usa renderTripStyleAnalysis() con gráficos circulares -->
                
                <!-- Análisis de Estilo de Viaje -->
                ${this.renderTripStyleAnalysis()}
                
                <!-- Información de Vuelos -->
                ${this.renderFlightsSection()}
            </div>
        `;

        // Actualizar información dinámica
        this.updateTripDates();
        this.updateTodayInfo();
        this.updateBudgetSummary();

        console.log('✅ Resumen renderizado correctamente');
    }

    /**
     * 💰 CALCULAR PRESUPUESTO TOTAL: Sumar todas las categorías dinámicamente
     */
    calculateTotalBudget() {
        try {
            // Acceder a la estructura correcta: budgetData.budgetData
            const budgetDataSource = window.tripConfig?.budgetData?.budgetData || tripConfig?.budgetData?.budgetData || {};
            let total = 0;
            
            // Sumar todas las categorías de presupuesto
            Object.values(budgetDataSource).forEach(category => {
                if (Array.isArray(category)) {
                    category.forEach(item => {
                        total += item.cost || 0;
                    });
                }
            });
            return total;
        } catch (error) {
            console.error('Error calculating total budget:', error);
            return 4500; // Fallback solo si hay error
        }
    }

    /**
     * 💸 CALCULAR TOTAL GASTADO: Sumar todos los gastos reales del AppState
     */
    calculateTotalSpent() {
        try {
            let totalSpent = 0;
            
            // Obtener gastos del localStorage si existe AppState
            if (window.AppState && window.AppState.expenses && Array.isArray(window.AppState.expenses)) {
                totalSpent = window.AppState.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
            }
            return totalSpent;
        } catch (error) {
            console.error('Error calculating total spent:', error);
            return 0; // Fallback si hay error
        }
    }



    updateTodayInfo() {
        console.log('📅 Actualizando información de hoy...');
        try {
            // Usar fecha simulada si el Day Simulator está activo
            const today = window.DaySimulator && window.DaySimulator.isSimulating 
                ? window.DaySimulator.getSimulatedDate() 
                : new Date();
            const tripStartDate = this.getTripStartDate();
            console.log('📅 Fecha de inicio del viaje:', tripStartDate);
            console.log('📅 Fecha de hoy:', today);
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            console.log('📅 Diferencia en días:', dayDiff);
            
            if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                const currentDayData = tripConfig.itineraryData[dayDiff];
                console.log('📅 Datos del día actual:', currentDayData);
                
                const todayDate = document.getElementById('today-date');
                const todayDay = document.getElementById('today-day');
                const nextDestination = document.getElementById('next-destination');
                const todayAccommodation = document.getElementById('today-accommodation');
                const todayActivity = document.getElementById('today-activity');
                const todayWeather = document.getElementById('today-weather');
                
                console.log('📅 Elementos encontrados:', {
                    todayDate: !!todayDate,
                    todayDay: !!todayDay,
                    nextDestination: !!nextDestination,
                    todayAccommodation: !!todayAccommodation,
                    todayActivity: !!todayActivity,
                    todayWeather: !!todayWeather
                });
                
                if (todayDate) todayDate.textContent = this.formatShortDate(today);
                if (todayDay) todayDay.textContent = `${dayDiff + 1}`;
                if (nextDestination) nextDestination.textContent = currentDayData.title;
                if (todayAccommodation) todayAccommodation.textContent = currentDayData.accommodation || 'Por definir';
                if (todayActivity) todayActivity.textContent = currentDayData.planA || 'Actividades del día';
                if (todayWeather) todayWeather.textContent = this.getWeatherForDay(currentDayData.phase);
                
                // Asegurar que el texto del indicador sea correcto durante el viaje
                const dayLabel = document.getElementById('today-day-label');
                if (dayLabel) dayLabel.textContent = 'Día del viaje';
                
                // Actualizar subtítulo de la página "Hoy"
                const todaySubtitle = document.getElementById('today-subtitle');
                if (todaySubtitle) {
                    todaySubtitle.textContent = `Día ${dayDiff + 1}: ${currentDayData.title}`;
                }
            } else {
                // Antes o después del viaje
                const todayDate = document.getElementById('today-date');
                const todayDay = document.getElementById('today-day');
                const nextDestination = document.getElementById('next-destination');
                const todayAccommodation = document.getElementById('today-accommodation');
                const todayActivity = document.getElementById('today-activity');
                const todayWeather = document.getElementById('today-weather');
                
                if (todayDate) todayDate.textContent = this.formatShortDate(today);
                
                if (dayDiff < 0) {
                    // Viaje futuro
                    const daysUntilTrip = Math.abs(dayDiff);
                    if (todayDay) todayDay.textContent = `${daysUntilTrip}`;
                    if (nextDestination) nextDestination.textContent = 'Preparando el viaje';
                    if (todayAccommodation) todayAccommodation.textContent = 'Reservas confirmadas';
                    if (todayActivity) todayActivity.textContent = 'Planificando aventura';
                    if (todayWeather) todayWeather.textContent = 'Por consultar';
                    
                    // Cambiar el texto del indicador para viajes futuros
                    const dayLabel = document.getElementById('today-day-label');
                    if (dayLabel) dayLabel.textContent = 'Días para el viaje';
                } else {
                    // Viaje completado
                    if (todayDay) todayDay.textContent = '-';
                    if (nextDestination) nextDestination.textContent = 'Viaje completado';
                    if (todayAccommodation) todayAccommodation.textContent = 'Recuerdos increíbles';
                    if (todayActivity) todayActivity.textContent = 'Aventura completada';
                    if (todayWeather) todayWeather.textContent = 'Experiencias vividas';
                }
            }
        } catch (error) {
            console.error('Error actualizando información de hoy:', error);
        }
    }

    updateTodayMainContent() {
        console.log('📅 Actualizando contenido principal de Hoy...');
        try {
            const today = new Date();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            const mainContentContainer = document.querySelector('#today-main-content');
            if (!mainContentContainer) {
                console.warn('⚠️ Contenedor #today-main-content no encontrado');
                return;
            }
            
            if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                const currentDayData = tripConfig.itineraryData[dayDiff];
                console.log('📅 Generando contenido para día:', dayDiff + 1, currentDayData.title);
                
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
                }
                
                let contentHTML = `
                    <div class="flex items-center gap-4 mb-6">
                        <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">${activityIcon}</span>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">${activityType}</h2>
                    </div>
                    
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3">${currentDayData.title}</h3>
                        <p class="text-slate-600 dark:text-slate-400 mb-4">${currentDayData.description}</p>`;
                        
                if (currentDayData.planA) {
                    contentHTML += `
                        <div class="space-y-3">
                            <div class="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                                <h4 class="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm text-blue-600">schedule</span>
                                    Plan Principal
                                </h4>
                                <p class="text-sm text-slate-600 dark:text-slate-400">${currentDayData.planA}</p>
                            </div>`;
                    
                    if (currentDayData.planB) {
                        contentHTML += `
                            <div class="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                                <h4 class="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm text-green-600">alt_route</span>
                                    Plan Alternativo
                                </h4>
                                <p class="text-sm text-slate-600 dark:text-slate-400">${currentDayData.planB}</p>
                            </div>`;
                    }
                    contentHTML += `</div>`;
                }
                
                contentHTML += `
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4">`;
                
                if (currentDayData.consejo) {
                    contentHTML += `
                        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="material-symbols-outlined text-lg text-blue-600 dark:text-blue-400">lightbulb</span>
                                <h4 class="font-semibold text-slate-900 dark:text-white">Consejo</h4>
                            </div>
                            <p class="text-sm text-slate-600 dark:text-slate-400">${currentDayData.consejo}</p>
                        </div>`;
                }
                
                if (currentDayData.bocado) {
                    contentHTML += `
                        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="material-symbols-outlined text-lg text-green-600 dark:text-green-400">restaurant</span>
                                <h4 class="font-semibold text-slate-900 dark:text-white">Bocado</h4>
                            </div>
                            <p class="text-sm text-slate-600 dark:text-slate-400">${currentDayData.bocado}</p>
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
                    
                    <div class="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 text-center">
                        <span class="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-500 mb-4 block">schedule</span>
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">${statusTitle}</h3>
                        <p class="text-slate-600 dark:text-slate-400">${statusMessage}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al actualizar contenido principal de hoy:', error);
        }
    }

    getActivityIconHTML(emoji, sizeClass = 'text-2xl') {
        let materialIcon = 'location_on';
        let iconColor = 'text-blue-600';
        
        if (emoji === '✈️') {
            materialIcon = 'flight';
            iconColor = 'text-blue-600';
        } else if (emoji === '🏛️') {
            materialIcon = 'temple_buddhist';
            iconColor = 'text-purple-600';
        } else if (emoji === '🏔️') {
            materialIcon = 'hiking';
            iconColor = 'text-green-600';
        } else if (emoji === '🚣') {
            materialIcon = 'kayaking';
            iconColor = 'text-orange-600';
        } else if (emoji === '🛬') {
            materialIcon = 'flight_land';
            iconColor = 'text-blue-600';
        } else if (emoji === '🐘') {
            materialIcon = 'pets';
            iconColor = 'text-amber-600';
        } else if (emoji === '♨️') {
            materialIcon = 'hot_tub';
            iconColor = 'text-red-600';
        } else if (emoji === '🚙') {
            materialIcon = 'directions_car';
            iconColor = 'text-gray-600';
        } else if (emoji === '🐅') {
            materialIcon = 'hiking';
            iconColor = 'text-orange-600';
        }
        
        return `<span class="material-symbols-outlined ${sizeClass} ${iconColor}">${materialIcon}</span>`;
    }

    getWeatherForDay(phase) {
        const weather = tripConfig.weatherData[phase];
        if (!weather) return 'Información no disponible';
        
        return `${weather.condition}, ${weather.temperature}`;
    }

    // Renderizar la vista de itinerario usando ItineraryRenderer modular
    renderItinerary() {
        Logger.ui('📅 Renderizando itinerario...');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            Logger.error('Container main-content no encontrado para Itinerario');
            return;
        }

        // Usar ItineraryRenderer modular en lugar de código inline
        try {
            ItineraryRenderer.renderItinerarySection(mainContent);
            Logger.success('✅ Itinerario renderizado correctamente');
        } catch (error) {
            Logger.error('❌ Error renderizando Itinerario', error);
            // Fallback al método original si ItineraryRenderer falla
            this.renderItineraryFallback();
        }
    }

    // Fallback del itinerario original (reducido)
    renderItineraryFallback() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Generar fases dinámicamente basadas en los datos reales del itinerario
        const phases = this.generateItineraryPhases();
        console.log('🎨 Fases para renderizar:', phases);
        
        const timelineHTML = phases.map(p => {
            console.log(`🔄 Procesando fase: ${p.title} con ${p.days ? p.days.length : 0} días`);
            
            const phaseDays = tripConfig.itineraryData.filter(day => day.phase === p.phase);
            console.log(`📋 Días filtrados para fase ${p.phase}:`, phaseDays.length);
            
            return `
            <div class="mb-16">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center">
                        <span class="material-symbols-outlined text-white text-lg sm:text-xl">location_on</span>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-200">${p.title}</h3>
                </div>
                ${phaseDays.map((day, index) => {
                    // Función para obtener el icono específico según la actividad
                    const getActivityIcon = (day) => {
                        const title = day.title.toLowerCase();
                        const description = day.description.toLowerCase();
                        
                        if (title.includes('vuelo') || title.includes('llegada') || title.includes('salida')) return 'flight';
                        if (title.includes('trekking') || title.includes('caminata') || description.includes('trekking')) return 'hiking';
                        if (title.includes('rafting') || description.includes('rafting')) return 'kayaking';
                        if (title.includes('safari') || description.includes('safari') || title.includes('chitwan')) return 'pets';
                        if (title.includes('cocina') || description.includes('cocina') || description.includes('momos')) return 'restaurant';
                        if (title.includes('templo') || title.includes('monasterio') || title.includes('dzong') || title.includes('estupa')) return 'temple_buddhist';
                        if (title.includes('plaza') || title.includes('durbar') || description.includes('palacio')) return 'account_balance';
                        if (title.includes('aguas termales') || description.includes('aguas termales')) return 'hot_tub';
                        if (title.includes('patan') || title.includes('katmandú') || description.includes('ciudad')) return 'location_city';
                        if (title.includes('nido del tigre') || title.includes('taktsang')) return 'temple_buddhist';
                        return 'place';
                    };
                    
                    return `
                    <div class="timeline-item grid grid-cols-[auto,1fr] gap-x-6" id="${day.id}" data-coords="${day.coords ? day.coords.join(',') : ''}">
                        <div class="flex flex-col items-center">
                            <span class="material-symbols-outlined text-4xl text-purple-600 dark:text-purple-400 z-10">${getActivityIcon(day)}</span>
                            ${index < phaseDays.length - 1 ? '<div class="w-0.5 h-full bg-gradient-to-b from-purple-300 to-violet-300 dark:from-purple-600 dark:to-violet-600"></div>' : ''}
                        </div>
                        <div class="pb-12 opacity-0 -translate-y-4" style="animation-delay: ${index * 100}ms;">
                            <div data-day-id="${day.id}" class="itinerary-card bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-200 hover:shadow-xl overflow-hidden">
                                ${day.image ? `
                                    <div class="relative h-48 md:h-56">
                                        <img loading="lazy" src="${day.image}" alt="${day.title}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/1920x1080/4f46e5/ffffff?text=Imagen';">
                                        <div class="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                                            <p class="text-white text-sm font-semibold">${(() => {
                                                const dayNumber = parseInt(day.id.replace('day-', ''));
                                                return `Día ${dayNumber}`;
                                            })()}</p>
                                        </div>
                                    </div>
                                    <div class="p-6">
                                        <h4 class="font-bold text-xl text-slate-900 dark:text-white mb-2">${day.title}</h4>
                                        <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">${day.description}</p>
                                        <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                            <span class="material-symbols-outlined text-sm">touch_app</span>
                                            <span class="text-xs font-medium">Toca para ver detalles</span>
                                        </div>
                                    </div>
                                ` : `
                                    <div class="p-6">
                                        <div class="flex items-center gap-3 mb-4">
                                            <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">${getActivityIcon(day)}</span>
                                            <p class="text-sm font-semibold text-blue-600 dark:text-blue-400">${(() => {
                                                const dayNumber = parseInt(day.id.replace('day-', ''));
                                                const tripDate = this.getTripDate(dayNumber - 1);
                                                return `Día ${dayNumber} • ${this.formatShortDate(tripDate)}`;
                                            })()}</p>
                                        </div>
                                        <h4 class="font-bold text-xl text-slate-900 dark:text-white mb-3">${day.title}</h4>
                                        <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">${day.description}</p>
                                        <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                            <span class="material-symbols-outlined text-sm">touch_app</span>
                                            <span class="text-xs font-medium">Toca para ver detalles</span>
                                        </div>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `}).join('');

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
                <!-- Header del itinerario -->
                ${HeaderRenderer.renderPresetHeader('itinerary')}

                <!-- Timeline del itinerario -->
                <div class="relative">
                    ${timelineHTML}
                </div>
            </div>
        `;

        // Agregar event listeners para los modales
        document.querySelectorAll('.itinerary-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.showItineraryModal(e.currentTarget.dataset.dayId);
            });
        });

        // Configurar Intersection Observer para animaciones
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.querySelector(':scope > div:last-child').classList.add('animate-enter');
                }
            });
        }, { threshold: 0.6 });
        
        document.querySelectorAll('.timeline-item').forEach(item => observer.observe(item));

        // 🎯 AUTO-SCROLL AL DÍA ACTUAL
        this.scrollToCurrentDay();

        console.log('✅ Itinerario renderizado correctamente');
    }

    /**
     * 🎯 SCROLL AL DÍA ACTUAL: Hacer foco en el día actual del viaje en el itinerario
     */
    scrollToCurrentDay() {
        try {
            // Calcular día actual (usando Day Simulator si está activo)
            const today = window.DaySimulator && window.DaySimulator.isSimulating 
                ? window.DaySimulator.getSimulatedDate() 
                : new Date();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            console.log(`🎯 Scroll to current day: dayDiff=${dayDiff}`);
            
            // Si estamos durante el viaje, hacer scroll al día actual
            if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                const currentDayId = `day-${dayDiff + 1}`;
                const targetElement = document.querySelector(`[data-day-id="${currentDayId}"]`);
                
                if (targetElement) {
                    setTimeout(() => {
                        targetElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center',
                            inline: 'nearest' 
                        });
                        
                        // Agregar highlight temporal al día actual
                        targetElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
                        setTimeout(() => {
                            targetElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
                        }, 3000);
                        
                        console.log(`🎯 Scrolled to current day: ${currentDayId}`);
                    }, 500); // Delay para asegurar que el DOM esté renderizado
                }
            }
        } catch (error) {
            console.error('Error scrolling to current day:', error);
        }
    }

    generateItineraryPhases() {
        console.log('🔍 Generando fases del itinerario...');
        console.log('📊 Total días en itineraryData:', tripConfig.itineraryData.length);
        
        const phases = [];
        const nepalDays = tripConfig.itineraryData.filter(day => day.phase === 'nepal');
        const butanDays = tripConfig.itineraryData.filter(day => day.phase === 'butan');
        const farewellDays = tripConfig.itineraryData.filter(day => day.phase === 'farewell');
        
        console.log('🇳🇵 Días de Nepal encontrados:', nepalDays.length);
        console.log('🇧🇹 Días de Bután encontrados:', butanDays.length);
        console.log('👋 Días de Despedida encontrados:', farewellDays.length);

        if (nepalDays.length > 0) {
            phases.push({
                title: 'Nepal - Aventura en el Himalaya',
                emoji: '🇳🇵',
                icon: 'location_on',
                gradient: 'from-purple-500 to-violet-600',
                phase: 'nepal',
                days: nepalDays
            });
            console.log('✅ Fase Nepal agregada con', nepalDays.length, 'días');
        }

        if (butanDays.length > 0) {
            phases.push({
                title: 'Bután - El Reino de la Felicidad',
                emoji: '🇧🇹',
                icon: 'flag',
                gradient: 'from-orange-500 to-amber-600',
                phase: 'butan',
                days: butanDays
            });
            console.log('✅ Fase Bután agregada con', butanDays.length, 'días');
        }

        if (farewellDays.length > 0) {
            phases.push({
                title: 'Despedida - Regreso a Casa',
                emoji: '👋',
                icon: 'home',
                gradient: 'from-slate-500 to-slate-600',
                phase: 'farewell',
                days: farewellDays
            });
            console.log('✅ Fase Despedida agregada con', farewellDays.length, 'días');
        }

        console.log('📋 Total fases generadas:', phases.length);
        return phases;
    }

    getIconGradient(icon) {
        const gradients = {
            'flight': 'from-blue-500 to-indigo-600',
            'temple_buddhist': 'from-orange-500 to-amber-600',
            'account_balance': 'from-purple-500 to-violet-600',
            'hiking': 'from-green-500 to-emerald-600',
            'pets': 'from-yellow-500 to-orange-600',
            'location_city': 'from-slate-500 to-slate-600',
            'place': 'from-teal-500 to-cyan-600'
        };
        return gradients[icon] || 'from-gray-500 to-gray-600';
    }

    showItineraryModal(dayId) {
        const day = tripConfig.itineraryData.find(d => d.id === dayId);
        if (!day) return;

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
            <div id="itinerary-modal-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                    <button id="close-modal-btn" class="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 transition-colors">
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
                                <div id="modal-map-${day.id}" class="h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
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
                this.createModalMap(day.id, day.coords, day.title);
            }, 500);
        }
    }

    createModalMap(dayId, coords, title) {
        console.log(`🗺️ Creando mapa del modal para: ${dayId}`);
        
        const mapContainer = document.getElementById(`modal-map-${dayId}`);
        if (!mapContainer) {
            console.error(`Contenedor del mapa no encontrado: modal-map-${dayId}`);
            return;
        }
        
        try {
            // Limpiar el contenedor
            mapContainer.innerHTML = '';
            
            // Crear el mapa
            const map = L.map(`modal-map-${dayId}`, { 
                closePopupOnClick: false,
                zoomControl: false,
                attributionControl: false
            }).setView(coords, 12);
            
            // Añadir capa de tiles con estilo consistente
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
                attribution: '&copy; OpenStreetMap &copy; CARTO' 
            }).addTo(map);
            
            // Marcador principal del día
            const mainIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    ${this.getActivityIconHTML('📍', 'text-lg').replace('text-blue-600', 'text-white')}
                </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            
            L.marker(coords, { icon: mainIcon })
                .addTo(map)
                .bindPopup(`<b>${title}</b><br><small>Ubicación principal del día</small>`, { closeButton: false });
            
            // Obtener lugares cercanos
            const nearbyPlaces = tripConfig.placesByDay[dayId] || [];
            const markers = [];
            
            nearbyPlaces.forEach(place => {
                const placeIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-200 dark:border-slate-600">
                        ${this.getActivityIconHTML(place.icon, 'text-sm')}
                    </div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
                
                const marker = L.marker(place.coords, { icon: placeIcon })
                    .addTo(map)
                    .bindPopup(`<b>${place.name}</b><br><small>${place.description}</small>`, { closeButton: false });
                
                markers.push(marker);
            });
            
            // Ajustar vista para mostrar todos los marcadores
            if (nearbyPlaces.length > 0) {
                const allCoords = [coords, ...nearbyPlaces.map(p => p.coords)];
                const bounds = L.latLngBounds(allCoords);
                map.fitBounds(bounds, { padding: [20, 20] });
            }
            
            // Forzar redibujado del mapa
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
            
            console.log(`✅ Mapa del modal ${dayId} creado exitosamente`);
        } catch (error) {
            console.error(`Error al crear mapa del modal ${dayId}:`, error);
            mapContainer.innerHTML = '<div class="h-full flex items-center justify-center text-slate-500">Error al cargar el mapa</div>';
        }
    }

    renderToday() {
        console.log('🌅 Renderizando hoy...');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
                <!-- Header de Hoy -->
                ${HeaderRenderer.renderPresetHeader('today')}

                <!-- Resumen del día -->
                <div id="today-main-content" class="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                    <!-- El contenido se generará dinámicamente -->
                </div>

                <!-- Toda la información adicional se genera dinámicamente en updateTodayMainContent() -->


            </div>
        `;

        // Actualizar información dinámica
        this.updateTripDates();
        this.updateTodayInfo();
        this.updateTodayMainContent();
        
        console.log('✅ Hoy renderizado correctamente');
    }

    /**
     * 📅 ACTUALIZAR CONTENIDO PRINCIPAL DEL DÍA: Contenido dinámico según fase del viaje
     */
    updateTodayMainContent() {
        const container = document.getElementById('today-main-content');
        if (!container) return;

        try {
            // Usar fecha simulada si el Day Simulator está activo
            const today = window.DaySimulator && window.DaySimulator.isSimulating 
                ? window.DaySimulator.getSimulatedDate() 
                : new Date();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            console.log(`📅 updateTodayMainContent: dayDiff=${dayDiff}, tripLength=${tripConfig.itineraryData.length}`);

            if (dayDiff < 0) {
                // ANTES DEL VIAJE: Mostrar preparativos
                this.renderPreTripContent(container, Math.abs(dayDiff));
            } else if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                // DURANTE EL VIAJE: Mostrar información del día actual
                this.renderDuringTripContent(container, dayDiff);
            } else {
                // DESPUÉS DEL VIAJE: Mostrar recuerdos
                this.renderPostTripContent(container);
            }
        } catch (error) {
            console.error('Error updating today main content:', error);
            container.innerHTML = '<p class="text-slate-600 dark:text-slate-400">Error al cargar la información del día</p>';
        }
    }

    /**
     * 🚀 RENDERIZAR CONTENIDO PRE-VIAJE: Preparativos y cuenta atrás
     */
    renderPreTripContent(container, daysUntil) {
        container.innerHTML = `
            <div class="text-center mb-8">
                <div class="text-6xl font-black text-orange-600 dark:text-orange-400 mb-4">${daysUntil}</div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    ${daysUntil === 1 ? 'día para el viaje' : 'días para el viaje'}
                </h2>
                <p class="text-slate-600 dark:text-slate-400">¡La aventura está a punto de comenzar!</p>
            </div>
        `;
        
        // Agregar información de vuelos como tarjetas separadas fuera del container principal
        const parentContainer = container.parentElement;
        
        // Información del vuelo
        const flightInfoHtml = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span class="material-symbols-outlined text-4xl text-green-600 dark:text-green-400 mx-auto mb-4 block">location_on</span>
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">Origen</h3>
                    <p class="text-slate-600 dark:text-slate-400">Madrid, España</p>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span class="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400 mx-auto mb-4 block">flight_land</span>
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">Destino</h3>
                    <p class="text-slate-600 dark:text-slate-400">Katmandú, Nepal</p>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span class="material-symbols-outlined text-4xl text-orange-600 dark:text-orange-400 mx-auto mb-4 block">schedule</span>
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">Duración</h3>
                    <p class="text-slate-600 dark:text-slate-400">8h 45m</p>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span class="material-symbols-outlined text-4xl text-purple-600 dark:text-purple-400 mx-auto mb-4 block">airplane_ticket</span>
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">Aerolínea</h3>
                    <p class="text-slate-600 dark:text-slate-400">Qatar Airways</p>
                </div>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                <div class="flex items-center gap-4 mb-6">
                    <span class="material-symbols-outlined text-3xl text-emerald-600 dark:text-emerald-400">checklist</span>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Preparativos para el Viaje</h2>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-green-600">verified</span>
                            Preparativos completados
                        </h3>
                        <div class="space-y-2">
                            <div class="flex items-center gap-2 text-green-600">
                                <span class="material-symbols-outlined text-sm">check_circle</span>
                                <span class="text-sm">Pasaporte válido</span>
                            </div>
                            <div class="flex items-center gap-2 text-green-600">
                                <span class="material-symbols-outlined text-sm">check_circle</span>
                                <span class="text-sm">Visa de Nepal</span>
                            </div>
                            <div class="flex items-center gap-2 text-green-600">
                                <span class="material-symbols-outlined text-sm">check_circle</span>
                                <span class="text-sm">Seguro de viaje</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-orange-600">pending_actions</span>
                            Últimos preparativos
                        </h3>
                        <div class="space-y-2">
                            <div class="flex items-center gap-2 text-orange-600">
                                <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
                                <span class="text-sm">Revisar equipaje</span>
                            </div>
                            <div class="flex items-center gap-2 text-orange-600">
                                <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
                                <span class="text-sm">Comprobar vuelos</span>
                            </div>
                            <div class="flex items-center gap-2 text-orange-600">
                                <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
                                <span class="text-sm">Descargar mapas offline</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar después del container principal
        container.insertAdjacentHTML('afterend', flightInfoHtml);
    }

    /**
     * ✈️ DETECTAR VUELO EN DÍA: Verificar si hay vuelo programado (DINÁMICO)
     */
    getFlightForDay(dayNumber) {
        try {
            const flightsData = window.tripConfig?.flightsData || tripConfig?.flightsData || [];
            const tripStartDate = this.getTripStartDate();
            
            // Mapeo de códigos de aeropuerto a nombres legibles
            const airportNames = {
                'MAD': 'Madrid',
                'DOH': 'Doha', 
                'KTM': 'Katmandú',
                'PBH': 'Paro'
            };
            
            // Buscar vuelos que correspondan al día específico
            for (const flight of flightsData) {
                for (const segment of flight.segments) {
                    // Parsear fecha del vuelo
                    const flightDate = this.parseSpanishDate(segment.fromDateTime);
                    if (!flightDate) continue;
                    
                    // Calcular qué día del viaje es
                    const daysDiff = Math.floor((flightDate - tripStartDate) / (1000 * 60 * 60 * 24)) + 1;
                    
                    if (daysDiff === dayNumber) {
                        // Extraer hora del fromDateTime
                        const time = segment.fromDateTime.split(' ').pop();
                        
                        // Determinar icono según tipo de vuelo y destino
                        let icon = '✈️';
                        let description = flight.title;
                        
                        if (flight.type === 'Internacional') {
                            if (segment.to === 'KTM') {
                                icon = '🛬';
                                description = 'Llegada al valle de Katmandú';
                            } else if (segment.from === 'KTM') {
                                icon = '🛫'; 
                                description = 'Vuelo de regreso a casa';
                            }
                        } else {
                            description = `Vuelo ${flight.type === 'Regional' ? 'panorámico' : ''} ${flight.title.includes('→') ? flight.title.split('→')[1].trim() : ''}`.trim();
                        }
                        
                        return {
                            from: airportNames[segment.from] || segment.from,
                            to: airportNames[segment.to] || segment.to,
                            airline: flight.airline,
                            time: time,
                            icon: icon,
                            description: description,
                            type: flight.type,
                            flightData: flight
                        };
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting flight for day:', error);
            return null;
        }
    }

    /**
     * 📅 PARSEAR FECHA ESPAÑOLA: Convertir "20 de Octubre 09:10" a Date
     */
    parseSpanishDate(dateString) {
        try {
            const months = {
                'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
                'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
            };
            
            const parts = dateString.split(' ');
            if (parts.length < 4) return null;
            
            const day = parseInt(parts[0]);
            const monthName = parts[2]; 
            const timePart = parts[3];
            
            const monthIndex = months[monthName];
            if (monthIndex === undefined) return null;
            
            // Usar el año del viaje calculado dinámicamente
            const tripStartDate = this.getTripStartDate();
            const tripYear = tripStartDate.getFullYear();
            const date = new Date(tripYear, monthIndex, day);
            
            // Agregar hora si está disponible
            if (timePart) {
                const [hours, minutes] = timePart.split(':').map(Number);
                date.setHours(hours, minutes, 0, 0);
            }
            
            return date;
        } catch (error) {
            console.error('Error parsing Spanish date:', dateString, error);
            return null;
        }
    }

    /**
     * 🏔️ RENDERIZAR CONTENIDO DURANTE EL VIAJE: Información del día actual
     */
    renderDuringTripContent(container, dayIndex) {
        const currentDay = tripConfig.itineraryData[dayIndex];
        if (!currentDay) {
            container.innerHTML = '<p class="text-slate-600 dark:text-slate-400">No hay información disponible para este día</p>';
            return;
        }

        const dayNumber = dayIndex + 1;
        const flightInfo = this.getFlightForDay(dayNumber);
        
        container.innerHTML = `
            <div class="text-center mb-8">
                <div class="text-4xl font-black text-orange-600 dark:text-orange-400 mb-2">Día ${dayNumber}</div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">${currentDay.title}</h2>
                <p class="text-slate-600 dark:text-slate-400">${currentDay.description || 'Disfruta tu día de aventura'}</p>
            </div>
            
            <div class="space-y-6">
                ${flightInfo ? `
                    <div class="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-700">
                        <h3 class="font-semibold text-sky-800 dark:text-sky-200 mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined">flight</span>
                            Vuelo del día
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div class="text-center">
                                <p class="text-xs text-sky-600 dark:text-sky-400">Origen</p>
                                <p class="font-medium text-sky-800 dark:text-sky-200">${flightInfo.from}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-sky-600 dark:text-sky-400">Destino</p>
                                <p class="font-medium text-sky-800 dark:text-sky-200">${flightInfo.to}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-sky-600 dark:text-sky-400">Hora</p>
                                <p class="font-medium text-sky-800 dark:text-sky-200">${flightInfo.time}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-sky-600 dark:text-sky-400">Aerolínea</p>
                                <p class="font-medium text-sky-800 dark:text-sky-200">${flightInfo.airline}</p>
                            </div>
                        </div>
                        <p class="text-sky-700 dark:text-sky-300 mt-3 text-sm">${flightInfo.description}</p>
                    </div>
                ` : ''}

                ${currentDay.planA ? `
                    <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h3 class="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined text-slate-600">schedule</span>
                            Plan principal
                        </h3>
                        <p class="text-slate-700 dark:text-slate-300">${currentDay.planA}</p>
                    </div>
                ` : ''}
                
                ${currentDay.planB ? `
                    <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h3 class="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined text-slate-600">alt_route</span>
                            Plan alternativo
                        </h3>
                        <p class="text-slate-700 dark:text-slate-300">${currentDay.planB}</p>
                    </div>
                ` : ''}
                
                ${currentDay.consejo ? `
                    <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h3 class="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined text-amber-600">lightbulb</span>
                            Consejo del día
                        </h3>
                        <p class="text-slate-700 dark:text-slate-300">${currentDay.consejo}</p>
                    </div>
                ` : ''}
                
                ${currentDay.bocado ? `
                    <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h3 class="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined text-orange-600">restaurant</span>
                            Recomendación gastronómica
                        </h3>
                        <p class="text-slate-700 dark:text-slate-300">${currentDay.bocado}</p>
                    </div>
                ` : ''}
                
                ${currentDay.accommodation ? `
                    <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h3 class="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined text-green-600">hotel</span>
                            Alojamiento
                        </h3>
                        <p class="text-slate-700 dark:text-slate-300">${currentDay.accommodation}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 📸 RENDERIZAR CONTENIDO POST-VIAJE: Recuerdos y resumen
     */
    renderPostTripContent(container) {
        container.innerHTML = `
            <div class="text-center mb-8">
                <span class="material-symbols-outlined text-6xl text-green-600 dark:text-green-400 mb-4">flight_land</span>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Viaje completado!</h2>
                <p class="text-slate-600 dark:text-slate-400">Esperamos que hayas disfrutado de tu aventura en el Himalaya</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span class="material-symbols-outlined text-3xl text-blue-600 mb-3">location_on</span>
                    <h3 class="font-bold text-slate-900 dark:text-white">Destinos</h3>
                    <p class="text-2xl font-bold text-blue-600">${tripConfig.itineraryData.length}</p>
                </div>
                <div class="text-center p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span class="material-symbols-outlined text-3xl text-orange-600 mb-3">photo_camera</span>
                    <h3 class="font-bold text-slate-900 dark:text-white">Recuerdos</h3>
                    <p class="text-2xl font-bold text-orange-600">∞</p>
                </div>
                <div class="text-center p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span class="material-symbols-outlined text-3xl text-green-600 mb-3">favorite</span>
                    <h3 class="font-bold text-slate-900 dark:text-white">Experiencia</h3>
                    <p class="text-2xl font-bold text-green-600">Única</p>
                </div>
            </div>
        `;
    }

    renderMap() {
        console.log('🗺️ Renderizando mapa principal...');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        try {
            mainContent.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                    <!-- Header del mapa -->
                    ${HeaderRenderer.renderPresetHeader('map')}

                    <!-- Contenedor del mapa -->
                    <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden" style="height: 70vh; min-height: 500px;">
                        <div id="map" class="w-full h-full rounded-3xl"></div>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                try {
                    // Crear el mapa centrado en Nepal/Bután
                    const map = L.map('map', { closePopupOnClick: false }).setView([28.3949, 84.1240], 7);
                    
                    // Añadir capa de tiles
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
                        attribution: '&copy; OpenStreetMap &copy; CARTO' 
                    }).addTo(map);
                    
                    // Crear marcadores para cada día del itinerario
                    const markers = [];
                    tripConfig.itineraryData.forEach(day => {
                        if (day.coords) {
                            const dayNumber = parseInt(day.id.replace('day-', ''));
                            const tripDate = this.getTripDate(dayNumber - 1);
                            
                            // Contenido del popup
                            const popupContent = `
                                <div class="w-48">
                                    <img src="${day.image || 'https://placehold.co/400x200/4f46e5/ffffff?text=Himalaya'}" 
                                         class="w-full h-24 object-cover rounded-t-lg" alt="${day.title}">
                                    <div class="p-2">
                                        <b class="text-blue-600">${day.title}</b>
                                        <p class="text-xs">Día ${dayNumber} - ${this.formatShortDate(tripDate)}</p>
                                        <p class="text-xs text-slate-600 mt-1">${day.description.substring(0, 80)}...</p>
                                        <button onclick="window.uiRenderer.showItineraryModal('${day.id}')" 
                                                class="text-blue-500 text-xs font-semibold mt-1 block hover:underline">
                                            Ver detalles →
                                        </button>
                                    </div>
                                </div>
                            `;
                            
                            // Determinar icono Material Design
                            let materialIcon = 'location_on';
                            let iconColor = 'text-blue-600';
                            
                            if (day.icon === '✈️') {
                                materialIcon = 'flight';
                                iconColor = 'text-blue-600';
                            } else if (day.icon === '🏛️') {
                                materialIcon = 'temple_buddhist';
                                iconColor = 'text-purple-600';
                            } else if (day.icon === '🏔️') {
                                materialIcon = 'hiking';
                                iconColor = 'text-green-600';
                            } else if (day.icon === '🚣') {
                                materialIcon = 'kayaking';
                                iconColor = 'text-orange-600';
                            } else if (day.icon === '🛬') {
                                materialIcon = 'flight_land';
                                iconColor = 'text-blue-600';
                            } else if (day.icon === '🐘') {
                                materialIcon = 'pets';
                                iconColor = 'text-amber-600';
                            } else if (day.icon === '♨️') {
                                materialIcon = 'hot_tub';
                                iconColor = 'text-red-600';
                            }
                            
                            // Crear icono personalizado con Material Design
                            const customIcon = L.divIcon({
                                className: 'custom-div-icon',
                                html: `<div class="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-200 dark:border-slate-600">
                                    <span class="material-symbols-outlined text-lg ${iconColor}">${materialIcon}</span>
                                </div>`,
                                iconSize: [40, 40],
                                iconAnchor: [20, 20]
                            });
                            
                            // Crear marcador
                            const marker = L.marker(day.coords, { icon: customIcon })
                                .addTo(map)
                                .bindPopup(popupContent, { 
                                    offset: L.point(0, -20), 
                                    autoClose: false, 
                                    closeButton: true 
                                });
                            
                            // Eventos del marcador
                            let hoverTimeout;
                            marker.on('mouseover', function () { 
                                clearTimeout(hoverTimeout); 
                                this.openPopup(); 
                            });
                            marker.on('mouseout', function () { 
                                hoverTimeout = setTimeout(() => this.closePopup(), 2000); 
                            });
                            marker.on('click', () => {
                                this.showItineraryModal(day.id);
                            });
                            
                            markers.push(marker);
                            
                            // Añadir coordenadas para la ruta
                            if (day.coords) {
                                this.routeCoords = this.routeCoords || [];
                                this.routeCoords.push(day.coords);
                            }
                        }
                    });
                    
                    // Crear ruta si hay coordenadas
                    if (this.routeCoords && this.routeCoords.length > 1) {
                        L.polyline(this.routeCoords, {
                            color: '#3b82f6',
                            weight: 3,
                            opacity: 0.7,
                            smoothFactor: 1
                        }).addTo(map);
                    }
                    
                    // Ajustar vista para mostrar todos los marcadores
                    if (markers.length > 0) {
                        const group = new L.featureGroup(markers);
                        map.fitBounds(group.getBounds().pad(0.1));
                    }
                    
                    // Guardar referencia del mapa
                    this.map = map;
                    
                    console.log('✅ Mapa principal creado exitosamente');
                } catch (error) {
                    console.error('❌ Error al crear el mapa:', error);
                    mainContent.innerHTML = `
                        <div class="fixed inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 z-10">
                            <div class="text-center p-8">
                                <div class="text-red-500 text-6xl mb-4">🗺️</div>
                                <h3 class="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Error al cargar el mapa</h3>
                                <p class="text-red-600 dark:text-red-300">${error.message}</p>
                            </div>
                        </div>
                    `;
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ Error al renderizar mapa:', error);
            mainContent.innerHTML = `
                <div class="fixed inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 z-10">
                    <div class="text-center p-8">
                        <div class="text-red-500 text-6xl mb-4">🗺️</div>
                        <h3 class="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Error al cargar el mapa</h3>
                        <p class="text-red-600 dark:text-red-300">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }


    // Renderizar sección de Gastos independiente
    renderGastos() {
        console.log('💰 Renderizando sección de gastos...');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Seguir el mismo patrón que renderItinerary()
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
    }

    // Renderizar sección de Extras independiente
    renderExtras() {
        console.log('🎒 Renderizando sección de extras...');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Seguir el mismo patrón que renderItinerary()
        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                <!-- Header de Extras -->
                <div class="mb-12 hidden md:block">
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
    }

    // Configurar navegación por pestañas de herramientas

    // Renderizar información de agencias
    renderAgencies() {
        console.log('🏢 Renderizando información de agencias');
        const container = document.getElementById('agencies');
        if (!container) {
            console.warn('⚠️ Contenedor #agencies no encontrado');
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
                            <span class="material-symbols-outlined text-sm">contact_page</span>
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
                            <span class="material-symbols-outlined text-sm">edit</span>
                            <span class="text-slate-500 italic">Por completar...</span>
                        </div>
                        <div class="text-xs text-slate-500 mt-2">
                            ${agencies.insurance.description}
                        </div>
                    </div>
                </div>

                <!-- Información Importante -->
                <div class="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 border border-slate-200 dark:border-slate-600">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${agencies.emergency.color}">${agencies.emergency.icon}</span>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${agencies.emergency.name}</h3>
                    </div>
                    <div class="space-y-3 text-sm text-slate-600 dark:text-slate-400">
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
        console.log('✅ Información de agencias renderizada');
    }

    // Renderizar presupuesto
    renderBudget() {
        console.log('💰 Renderizando sección de presupuesto');
        const container = document.getElementById('budget');
        if (!container) {
            console.error('❌ Contenedor #budget no encontrado');
            console.log('🔍 Elementos disponibles con ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            return;
        }
        console.log('✅ Contenedor #budget encontrado:', container);

        // Usar la implementación del presupuesto
        console.log('💰 Llamando budgetManager.render...');
        this.budgetManager.render(container, tripConfig);
        
        console.log('✅ Presupuesto renderizado completamente');
    }

    renderBudgetItems(expenses) {
        return expenses.map(item => {
            // Manejar tanto items simples como items con subItems
            const itemCost = item.cost || 0;
            const itemName = item.concept || item.name || 'Sin nombre';
            const itemCategory = item.category || 'Sin categoría';
            
            return `
                <div class="budget-item flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl" data-category="${itemCategory}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 ${this.getCategoryColor(itemCategory)} rounded-lg flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-sm">${this.getCategoryIcon(itemCategory)}</span>
                        </div>
                        <div>
                            <h4 class="font-semibold text-slate-900 dark:text-white ${item.paid ? 'line-through opacity-60' : ''}">${itemName}</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 ${item.paid ? 'line-through opacity-60' : ''}">${itemCategory}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-lg font-bold text-slate-900 dark:text-white ${item.paid ? 'line-through opacity-60' : ''}">${itemCost.toLocaleString('es-ES')} €</span>
                        ${item.paid ? '<div class="text-xs text-green-600 dark:text-green-400">✓ Pagado</div>' : '<div class="text-xs text-orange-600 dark:text-orange-400">⏳ Pendiente</div>'}
                    </div>
                </div>
            `;
        }).join('');
    }

    calculateTotal(expenses) {
        return expenses.reduce((total, item) => total + (item.cost || 0), 0);
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
            'Actividades': 'hiking',
            'Visados': 'description',
            'Seguro': 'security',
            'Equipamiento': 'backpack',
            'Otros': 'more_horiz'
        };
        return icons[cleanCategory] || 'inventory_2';
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
            'Actividades': 'bg-red-500',
            'Visados': 'bg-yellow-500',
            'Seguro': 'bg-indigo-500',
            'Equipamiento': 'bg-pink-500',
            'Otros': 'bg-gray-500'
        };
        return colors[cleanCategory] || 'bg-slate-500';
    }

    setupBudgetFilters() {
        const filterButtons = document.querySelectorAll('.budget-filter-btn');
        const budgetItems = document.querySelectorAll('.budget-item');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remover clase active de todos los botones
                filterButtons.forEach(btn => btn.classList.remove('active', 'bg-blue-50', 'dark:bg-blue-900/20', 'ring-blue-200', 'dark:ring-blue-800'));
                
                // Agregar clase active al botón clickeado
                button.classList.add('active', 'bg-blue-50', 'dark:bg-blue-900/20', 'ring-blue-200', 'dark:ring-blue-800');

                const category = button.dataset.category;

                budgetItems.forEach(item => {
                    if (category === 'all' || item.dataset.category === category) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // Renderizar lista de equipaje
    async renderPackingList() {
        console.log('🎒 Renderizando lista de equipaje');
        const container = document.getElementById('packing-list');
        if (!container) {
            console.error('❌ Contenedor #packing-list no encontrado');
            console.log('🔍 Elementos disponibles con ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            return;
        }
        console.log('✅ Contenedor #packing-list encontrado');

        // Inicializar PackingListManager si no existe
        if (!window.PackingListManager) {
            const { getPackingListManager } = await import('../utils/PackingListManager.js');
            window.PackingListManager = getPackingListManager();
            
            // Inicializar con FirebaseManager si está disponible
            if (window.FirebaseManager) {
                await window.PackingListManager.initialize(window.FirebaseManager);
            }
        }

        const saved = window.PackingListManager.getItems();
        
        const listHTML = Object.entries(tripConfig.packingListData).map(([category, items]) => {
            const categoryIcon = this.getCategoryIcon(category);
            const categoryColor = this.getCategoryColor(category);
            // Limpiar el nombre de la categoría eliminando emojis
            const cleanCategoryName = category.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
            
            return `
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl ${categoryColor.replace('bg-', 'text-')}">${categoryIcon}</span>
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
        if (window.PackingListManager) {
            setTimeout(() => {
                window.PackingListManager.updatePackingStats();
            }, 100);
        }
        
        // Asegurar que el contenedor sea visible
        container.style.opacity = '1 !important';
        
        // Configurar event listeners para los checkboxes con Firebase
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
                    
                    // Inicializar PackingListManager si no existe
                    if (!window.PackingListManager) {
                        const { getPackingListManager } = await import('../utils/PackingListManager.js');
                        window.PackingListManager = getPackingListManager();
                        
                        // Inicializar con FirebaseManager si está disponible
                        if (window.FirebaseManager) {
                            await window.PackingListManager.initialize(window.FirebaseManager);
                        }
                    }
                    
                    // Actualizar estado del item en el backend
                    await window.PackingListManager.toggleItem(itemKey, e.target.checked);
                    
                    // Actualizar estadísticas
                    window.PackingListManager.updatePackingStats();
                }
            }
        });
        
        console.log('✅ Lista de equipaje renderizada completamente');
    }

    // Renderizar información climática con WeatherRenderer modular
    async renderWeather() {
        console.log('🌤️ Renderizando información climática');
        const container = document.getElementById('weather');
        if (!container) {
            console.error('❌ Contenedor #weather no encontrado');
            return;
        }

        // Usar el nuevo WeatherRenderer modular
        WeatherRenderer.renderWeatherSection(container);
        
        // Asegurar que el contenedor sea visible
        container.style.opacity = '1 !important';
        console.log('✅ Información climática renderizada con WeatherRenderer');
    }

    // ⚠️ DEPRECADO: Método movido a WeatherRenderer.js - Eliminado para evitar duplicación

    // Renderizar análisis de estilo de viaje
    renderTripStyleAnalysis() {
        try {
            const tripStyles = this.calculateTripStyles();
            
            return `
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                    <div class="flex items-center gap-3 mb-6">
                        <span class="material-symbols-outlined text-2xl text-purple-600 dark:text-purple-400">analytics</span>
                        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">Estilo de Viaje</h3>
                    </div>
                    
                    <div class="flex justify-between gap-2 sm:gap-4 lg:gap-8">
                        ${tripStyles.map(style => `
                            <div class="text-center flex-1 min-w-0">
                                <div class="relative w-full aspect-square max-w-32 mx-auto">
                                    <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle class="text-slate-200 dark:text-slate-700" stroke-width="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                                        <circle class="${style.color}" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="${283 - (283 * style.percentage) / 100}" stroke-linecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                                    </svg>
                                    <span class="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl sm:text-3xl lg:text-4xl ${style.color}">${style.icon}</span>
                                </div>
                                <p class="font-semibold mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg">${style.title}</p>
                            </div>
                        `).join('')}
                    </div>
                    

                </div>
            `;
        } catch (error) {
            console.error('Error al renderizar análisis de estilo de viaje:', error);
            return '';
        }
    }

    // Calcular estilos de viaje basado en actividades del itinerario
    calculateTripStyles() {
        // Definir categorías de actividades exactamente como las pasó el usuario
        const activityCategories = {
            'naturaleza': { keywords: ['trekking', 'rafting', 'parque', 'montaña', 'selva', 'río', 'lago'], icon: 'nature', color: 'text-green-500' },
            'cultura': { keywords: ['templo', 'monasterio', 'museo', 'plaza', 'durbar', 'dzong', 'estupa'], icon: 'temple_buddhist', color: 'text-amber-500' },
            'ciudad': { keywords: ['thamel', 'pokhara', 'thimphu', 'paro', 'katmandú', 'mercado', 'restaurante'], icon: 'location_city', color: 'text-red-500' },
            'aventura': { keywords: ['parapente', 'rafting', 'trekking', 'safari'], icon: 'hiking', color: 'text-purple-500' },
            'relax': { keywords: ['aguas termales', 'spa', 'descanso', 'tarde libre'], icon: 'spa', color: 'text-sky-500' }
        };
        
        // Contar actividades por categoría
        const categoryCounts = {};
        const totalDays = tripConfig.itineraryData.length;
        
        // Inicializar contadores
        Object.keys(activityCategories).forEach(category => {
            categoryCounts[category] = 0;
        });
        
        // Analizar cada día del itinerario
        tripConfig.itineraryData.forEach(day => {
            const dayText = `${day.title} ${day.description} ${day.planA || ''} ${day.planB || ''}`.toLowerCase();
            
            Object.entries(activityCategories).forEach(([category, config]) => {
                if (config.keywords.some(keyword => dayText.includes(keyword))) {
                    categoryCounts[category]++;
                }
            });
        });
        
        // Calcular porcentajes y generar estilos
        return Object.entries(categoryCounts)
            .map(([category, count]) => {
                const config = activityCategories[category];
                return {
                    title: this.capitalizeFirst(category),
                    percentage: Math.round((count / totalDays) * 100),
                    color: config.color,
                    icon: config.icon,
                    count: count
                };
            })
            .sort((a, b) => b.percentage - a.percentage);
    }

    // Capitalizar primera letra
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Obtener descripción del estilo
    getStyleDescription(style) {
        const descriptions = {
            'naturaleza': 'enfocado en la conexión con la naturaleza y actividades al aire libre',
            'cultura': 'rico en experiencias culturales y patrimonio histórico',
            'ciudad': 'urbano con exploración de mercados y vida local',
            'aventura': 'lleno de emociones fuertes y actividades extremas',
            'relax': 'orientado al descanso y bienestar personal'
        };
        return descriptions[style] || 'equilibrado y variado';
    }

    // Renderizar sección de vuelos para incluir en resumen
    renderFlightsSection() {
        try {
            const flightSegmentHTML = (segment) => `
                <div class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl">
                    <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">flight</span>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-bold text-lg text-slate-900 dark:text-white">${segment.from}</p>
                                <p class="text-sm text-slate-500 dark:text-slate-400">${segment.fromDateTime}</p>
                            </div>
                            <div class="flex items-center gap-2 text-slate-400">
                                <div class="w-8 border-t border-dashed border-slate-300"></div>
                                <span class="material-symbols-outlined text-slate-400">flight_takeoff</span>
                                <div class="w-8 border-t border-dashed border-slate-300"></div>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-lg text-slate-900 dark:text-white">${segment.to}</p>
                                <p class="text-sm text-slate-500 dark:text-slate-400">${segment.toDateTime}</p>
                            </div>
                        </div>
                    </div>
                </div>`;

            const flightCardHTML = (flight) => `
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-200">
                    <div class="flex items-center gap-3 mb-6">
                        <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">flight</span>
                        <div>
                            <h3 class="font-bold text-lg text-slate-900 dark:text-white">${flight.title}</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">${flight.airline}</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        ${flight.segments.map((segment, index) => `
                            ${index > 0 && flight.segments[index-1].layover ? 
                                `<div class="text-center py-2">
                                    <div class="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-200 dark:border-orange-800">
                                        <span class="material-symbols-outlined text-sm">schedule</span>
                                        ${flight.segments[index-1].layover}
                                    </div>
                                </div>` : ''}
                            ${flightSegmentHTML(segment)}
                        `).join('')}
                    </div>
                </div>`;

            const internationalFlights = tripConfig.flightsData.filter(f => f.type === 'Internacional');
            const regionalFlights = tripConfig.flightsData.filter(f => f.type === 'Regional');

            return `
                <div class="flex items-center gap-3 mb-8">
                    <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">flight</span>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Información de Vuelos</h2>
                </div>
                <div class="space-y-8">
                    ${flightCardHTML(internationalFlights[0])}
                    <div class="grid md:grid-cols-2 gap-6">
                        ${regionalFlights.map(flightCardHTML).join('')}
                    </div>
                    ${flightCardHTML(internationalFlights[1])}
                </div>`;

        } catch (error) {
            console.error('❌ Error al renderizar sección de vuelos:', error);
            return `
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                    <h3 class="font-semibold">Error al cargar los vuelos</h3>
                    <p class="text-sm">${error.message}</p>
                </div>`;
        }
    }

    // Renderizar información de vuelos (mantenido para compatibilidad)
    renderFlights() {
        console.log('✈️ Renderizando información de vuelos');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('❌ Contenedor main-content no encontrado');
            return;
        }

        try {
            const flightSegmentHTML = (segment) => `
                <div class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl">
                    <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">flight</span>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-bold text-lg text-slate-900 dark:text-white">${segment.from}</p>
                                <p class="text-sm text-slate-500 dark:text-slate-400">${segment.fromDateTime}</p>
                            </div>
                            <div class="flex items-center gap-2 text-slate-400">
                                <div class="w-8 border-t border-dashed border-slate-300"></div>
                                <span class="material-symbols-outlined text-slate-400">flight_takeoff</span>
                                <div class="w-8 border-t border-dashed border-slate-300"></div>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-lg text-slate-900 dark:text-white">${segment.to}</p>
                                <p class="text-sm text-slate-500 dark:text-slate-400">${segment.toDateTime}</p>
                            </div>
                        </div>
                    </div>
                </div>`;

            const flightCardHTML = (flight) => `
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-200">
                    <div class="flex items-center gap-3 mb-6">
                        <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">flight</span>
                        <div>
                            <h3 class="font-bold text-lg text-slate-900 dark:text-white">${flight.title}</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">${flight.airline}</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        ${flight.segments.map((segment, index) => `
                            ${index > 0 && flight.segments[index-1].layover ? 
                                `<div class="text-center py-2">
                                    <div class="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-200 dark:border-orange-800">
                                        <span class="material-symbols-outlined text-sm">schedule</span>
                                        ${flight.segments[index-1].layover}
                                    </div>
                                </div>` : ''}
                            ${flightSegmentHTML(segment)}
                        `).join('')}
                    </div>
                </div>`;

            const internationalFlights = tripConfig.flightsData.filter(f => f.type === 'Internacional');
            const regionalFlights = tripConfig.flightsData.filter(f => f.type === 'Regional');

            mainContent.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                    <div class="flex items-center gap-3 mb-8">
                        <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">flight</span>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Información de Vuelos</h2>
                    </div>
                    <div class="space-y-8">
                        ${flightCardHTML(internationalFlights[0])}
                        <div class="grid md:grid-cols-2 gap-6">
                            ${regionalFlights.map(flightCardHTML).join('')}
                        </div>
                        ${flightCardHTML(internationalFlights[1])}
                    </div>
                </div>`;

            console.log('✅ Información de vuelos renderizada correctamente');

        } catch (error) {
            console.error('❌ Error al renderizar vuelos:', error);
            mainContent.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                        <h3 class="font-semibold">Error al cargar los vuelos</h3>
                        <p class="text-sm">${error.message}</p>
                    </div>
                </div>`;
        }
    }

    // Cambiar vista
    changeView(view) {
        console.log(`🔄 Cambiando vista de '${this.currentView}' a '${view}'`);
        this.currentView = view;
        
        // Log específico para herramientas
        if (view === 'herramientas') {
            console.log('🛠️ Vista de herramientas detectada, llamando renderMainContent...');
        }
        
        this.renderMainContent();
    }
}
