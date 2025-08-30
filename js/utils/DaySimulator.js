/**
 * 🎯 DAY SIMULATOR
 * 
 * Utilidad para simular cualquier día del viaje y probar funcionalidades contextuales.
 * Permite cambiar la fecha actual simulada para ver cómo se comporta la aplicación
 * en diferentes días del itinerario.
 * 
 * Funcionalidades:
 * - Simular cualquier día del viaje (1-18)
 * - Ver información contextual del día
 * - Probar recomendaciones climáticas
 * - Verificar análisis de estilo de viaje
 * - Panel de control visual para desarrolladores
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import stateManager from './StateManager.js';

export class DaySimulator {
    constructor() {
        this.originalDate = new Date();
        this.simulatedDay = null;
        this.isSimulating = false;
        this.tripStartDate = null; // Se calculará dinámicamente
        
        if (Logger && Logger.info) Logger.info('🎯 DaySimulator initialized');
    }

    /**
     * 📅 OBTENER FECHA DE INICIO: Calcular fecha real del primer vuelo
     */
    getTripStartDate() {
        if (this.tripStartDate) return this.tripStartDate;

        try {
            // Usar la función existente del UIRenderer si está disponible
            const uiRenderer = stateManager.getState('instances.uiRenderer');
            if (uiRenderer && typeof uiRenderer.getTripStartDate === 'function') {
                this.tripStartDate = uiRenderer.getTripStartDate();
                Logger.ui('🎯 Trip start date from UIRenderer:', this.tripStartDate);
                return this.tripStartDate;
            }

            // Calcular desde los datos de vuelos directamente
            if (window.tripConfig?.flightsData && window.tripConfig.flightsData.length > 0) {
                const firstFlight = window.tripConfig.flightsData[0];
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
                            // Usar el año actual o siguiente según la fecha
                            const currentYear = new Date().getFullYear();
                            const currentMonth = new Date().getMonth();
                            const year = (month < currentMonth) ? currentYear + 1 : currentYear;
                            
                            this.tripStartDate = new Date(year, month, day);
                            Logger.info('🎯 Trip start date calculated from flight data:', {
                                original: dateStr,
                                parsed: this.tripStartDate
                            });
                            return this.tripStartDate;
                        }
                    }
                }
            }

            // Fallback: usar fecha por defecto
            Logger.warn('🎯 Could not parse trip start date, using fallback');
            this.tripStartDate = new Date(2025, 9, 9); // 9 de octubre 2025
            return this.tripStartDate;

        } catch (error) {
            Logger.error('🎯 Error calculating trip start date:', error);
            this.tripStartDate = new Date(2025, 9, 9);
            return this.tripStartDate;
        }
    }

    /**
     * 📅 OBTENER FECHA SIMULADA: Retorna la fecha actual simulada
     */
    getSimulatedDate() {
        if (!this.isSimulating || !this.simulatedDay) {
            return new Date();
        }

        const tripStart = this.getTripStartDate();
        const simulatedDate = new Date(tripStart);
        simulatedDate.setDate(simulatedDate.getDate() + (this.simulatedDay - 1));
        return simulatedDate;
    }

    /**
     * 🎯 SIMULAR DÍA: Cambiar al día específico del viaje
     */
    simulateDay(dayNumber) {
        try {
            if (dayNumber < 1 || dayNumber > 18) {
                throw new Error('Day number must be between 1 and 18');
            }

            this.simulatedDay = dayNumber;
            this.isSimulating = true;

            // Calcular fecha simulada basada en la fecha real del vuelo
            const tripStart = this.getTripStartDate();
            const simulatedDate = new Date(tripStart);
            simulatedDate.setDate(simulatedDate.getDate() + (dayNumber - 1));

            // Sobrescribir Date.now() temporalmente
            this.mockDateNow(simulatedDate);

            // Obtener información del día
            const dayInfo = this.getDayInfo(dayNumber);

            // Actualizar UI si es necesible
            this.updateSimulatorUI(dayNumber, dayInfo);

            // Refrescar componentes que dependen de la fecha
            this.refreshContextualComponents();

            Logger.success(`🎯 Simulating day ${dayNumber}: ${dayInfo.title}`);
            
            return {
                success: true,
                day: dayNumber,
                date: simulatedDate,
                info: dayInfo
            };

        } catch (error) {
            Logger.error('🎯 Error simulating day:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🔄 RESETEAR: Volver a la fecha real
     */
    resetToRealDate() {
        this.isSimulating = false;
        this.simulatedDay = null;
        
        // Restaurar Date.now() original
        this.restoreDateNow();
        
        // Refrescar componentes
        this.refreshContextualComponents();
        
        // Ocultar UI del simulador
        this.hideSimulatorUI();
        
        Logger.info('🎯 Simulation reset to real date');
        
        return { success: true, message: 'Returned to real date' };
    }

    /**
     * 📊 OBTENER INFO DEL DÍA: Información detallada del día simulado
     */
    getDayInfo(dayNumber) {
        const itinerary = window.tripConfig?.itineraryData || [];
        const dayData = itinerary[dayNumber - 1];
        
        if (!dayData) {
            return {
                day: dayNumber,
                title: `Día ${dayNumber}`,
                description: 'No hay información disponible',
                location: 'Desconocido',
                activities: [],
                phase: 'unknown'
            };
        }

        return {
            day: dayNumber,
            title: dayData.title,
            description: dayData.description,
            location: dayData.location || this.extractLocation(dayData.title),
            activities: this.extractActivities(dayData),
            phase: dayData.phase || 'main',
            planA: dayData.planA,
            planB: dayData.planB
        };
    }

    /**
     * 🎨 CREAR UI DEL SIMULADOR: Panel de control visual
     */
    createSimulatorUI() {
        // Verificar si ya existe
        if (document.getElementById('day-simulator')) return;

        const uiRenderer = stateManager.getState('instances.uiRenderer');
        const currentView = uiRenderer?.currentView || 'resumen';
        const simulatorHTML = `
            <div id="day-simulator" class="fixed top-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 max-w-sm">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-purple-600">science</span>
                        <h3 class="font-bold text-slate-900 dark:text-white">Day Simulator</h3>
                    </div>
                    <button id="close-simulator" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <!-- Vista actual -->
                    <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div class="text-xs text-blue-600 dark:text-blue-400">Vista actual:</div>
                        <div class="font-semibold text-blue-800 dark:text-blue-200 capitalize">${currentView}</div>
                    </div>
                    
                    <!-- Selector de día -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Simular día del viaje:
                        </label>
                        <select id="day-selector" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                            <option value="">Seleccionar día...</option>
                            ${Array.from({length: 18}, (_, i) => {
                                const dayNum = i + 1;
                                const dayInfo = this.getDayInfo(dayNum);
                                return `<option value="${dayNum}">Día ${dayNum}: ${dayInfo.title}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    
                    <!-- Información del día actual -->
                    <div id="current-day-info" class="hidden p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div class="text-sm">
                            <div class="font-semibold text-purple-800 dark:text-purple-200" id="day-title"></div>
                            <div class="text-purple-600 dark:text-purple-300" id="day-location"></div>
                            <div class="text-xs text-purple-500 dark:text-purple-400 mt-1" id="day-activities"></div>
                        </div>
                    </div>
                    
                    <!-- Accesos rápidos a vistas -->
                    <div class="border-t border-slate-200 dark:border-slate-600 pt-3">
                        <div class="text-xs text-slate-600 dark:text-slate-400 mb-2">Probar en otras vistas:</div>
                        <div class="grid grid-cols-3 gap-1">
                            <button class="quick-view-btn px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" data-view="resumen">📊 Resumen</button>
                            <button class="quick-view-btn px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" data-view="itinerario">📅 Itinerario</button>
                            <button class="quick-view-btn px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" data-view="hoy">⏰ Hoy</button>
                            <button class="quick-view-btn px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" data-view="mapa">🗺️ Mapa</button>
                            <button class="quick-view-btn px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" data-view="gastos">💰 Gastos</button>
                            <button class="quick-view-btn px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" data-view="extras">🎒 Extras</button>
                        </div>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div class="flex gap-2">
                        <button id="reset-simulation" class="flex-1 px-3 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                            <span class="material-symbols-outlined text-sm mr-1">refresh</span>
                            Reset
                        </button>
                        <button id="refresh-components" class="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors">
                            <span class="material-symbols-outlined text-sm mr-1">update</span>
                            Refresh
                        </button>
                    </div>
                    
                    <!-- Estado actual -->
                    <div class="text-xs text-slate-500 dark:text-slate-400 text-center">
                        <span id="simulation-status">Modo real</span>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', simulatorHTML);
        this.setupSimulatorEvents();
    }

    /**
     * 🎮 CONFIGURAR EVENTOS: Event listeners del simulador
     */
    setupSimulatorEvents() {
        const daySelector = document.getElementById('day-selector');
        const resetBtn = document.getElementById('reset-simulation');
        const refreshBtn = document.getElementById('refresh-components');
        const closeBtn = document.getElementById('close-simulator');
        const quickViewBtns = document.querySelectorAll('.quick-view-btn');

        // Selector de día
        daySelector?.addEventListener('change', (e) => {
            const dayNumber = parseInt(e.target.value);
            if (dayNumber) {
                this.simulateDay(dayNumber);
            }
        });

        // Reset
        resetBtn?.addEventListener('click', () => {
            this.resetToRealDate();
            daySelector.value = '';
        });

        // Refresh
        refreshBtn?.addEventListener('click', () => {
            this.refreshContextualComponents();
        });

        // Botones de navegación rápida
        quickViewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetView = btn.dataset.view;
                if (window.changeView && targetView) {
                    window.changeView(targetView);
                    // Actualizar la vista mostrada en el panel
                    this.updateCurrentViewDisplay(targetView);
                    if (Logger && Logger.info) Logger.info(`🎮 Quick navigation to: ${targetView}`);
                }
            });
        });

        // Cerrar
        closeBtn?.addEventListener('click', () => {
            this.hideSimulatorUI();
        });
    }

    /**
     * 📱 ACTUALIZAR VISTA ACTUAL EN PANEL: Mostrar qué vista está activa
     */
    updateCurrentViewDisplay(viewName) {
        const viewDisplay = document.querySelector('#day-simulator .bg-blue-50 .font-semibold');
        if (viewDisplay) {
            viewDisplay.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        }
    }

    /**
     * 🔄 ACTUALIZAR UI DEL SIMULADOR: Mostrar información del día actual
     */
    updateSimulatorUI(dayNumber, dayInfo) {
        const currentDayInfo = document.getElementById('current-day-info');
        const dayTitle = document.getElementById('day-title');
        const dayLocation = document.getElementById('day-location');
        const dayActivities = document.getElementById('day-activities');
        const simulationStatus = document.getElementById('simulation-status');

        if (currentDayInfo) currentDayInfo.classList.remove('hidden');
        if (dayTitle) dayTitle.textContent = dayInfo.title;
        if (dayLocation) dayLocation.textContent = `📍 ${dayInfo.location}`;
        if (dayActivities) dayActivities.textContent = `Actividades: ${dayInfo.activities.join(', ')}`;
        if (simulationStatus) simulationStatus.textContent = `Simulando día ${dayNumber}`;
    }

    /**
     * 👁️ OCULTAR UI DEL SIMULADOR
     */
    hideSimulatorUI() {
        const simulator = document.getElementById('day-simulator');
        if (simulator) {
            simulator.remove();
        }
    }

    /**
     * 🔄 REFRESCAR COMPONENTES: Actualizar componentes que dependen de la fecha
     */
    refreshContextualComponents() {
        try {
            const uiRenderer = stateManager.getState('instances.uiRenderer');
            if (!uiRenderer) {
                if (Logger && Logger.warning) Logger.warning('🔄 UIRenderer not available for refresh');
                return;
            }

            const currentView = uiRenderer.currentView;
            if (Logger && Logger.info) Logger.info(`🔄 Refreshing components for view: ${currentView}`);

            // Refrescar según la vista actual
            switch (currentView) {
                case 'resumen':
                    this.refreshSummaryView();
                    break;
                case 'itinerario':
                    this.refreshItineraryView();
                    break;
                case 'hoy':
                    this.refreshTodayView();
                    break;
                case 'mapa':
                    this.refreshMapView();
                    break;
                case 'gastos':
                    this.refreshGastosView();
                    break;
                case 'extras':
                    this.refreshExtrasView();
                    break;
                default:
                    if (Logger && Logger.warning) Logger.warning(`🔄 Unknown view: ${currentView}`);
            }

            // Refrescar componentes globales que siempre deben actualizarse
            this.refreshGlobalComponents();

            // Disparar evento personalizado
            this.triggerContextualUpdate();

            if (Logger && Logger.success) Logger.success(`🔄 All components refreshed for view: ${currentView}`);

        } catch (error) {
            if (Logger && Logger.error) Logger.error('🔄 Error refreshing components:', error);
        }
    }

    /**
     * 📊 REFRESCAR VISTA RESUMEN: Actualizar dashboard principal
     */
    refreshSummaryView() {
        try {
            const uiRenderer = stateManager.getState('instances.uiRenderer');
            if (uiRenderer && typeof uiRenderer.renderSummary === 'function') {
                uiRenderer.renderSummary();
                if (Logger && Logger.info) Logger.info('📊 Summary view refreshed');
            }
        } catch (error) {
            if (Logger && Logger.error) Logger.error('📊 Error refreshing summary view:', error);
        }
    }

    /**
     * 📅 REFRESCAR VISTA HOY: Actualizar información del día actual
     */
    refreshTodayView() {
        try {
            const uiRenderer = stateManager.getState('instances.uiRenderer');
            if (uiRenderer) {
                // En lugar de re-renderizar toda la vista, actualizar solo las partes dinámicas
                if (typeof uiRenderer.updateTodayDynamicContent === 'function') {
                    uiRenderer.updateTodayDynamicContent();
                    if (Logger && Logger.info) Logger.info('📅 Today dynamic content updated');
                }
                
                // Actualizar el contenido principal de Hoy también
                if (typeof uiRenderer.updateTodayMainContent === 'function') {
                    uiRenderer.updateTodayMainContent();
                    if (Logger && Logger.info) Logger.info('📅 Today main content updated');
                }
                
                // Actualizar progreso del viaje si está en SummaryRenderer
                const summaryRenderer = uiRenderer.summaryRenderer;
                if (summaryRenderer && typeof summaryRenderer.updateTripProgress === 'function') {
                    summaryRenderer.updateTripProgress();
                    if (Logger && Logger.info) Logger.info('📅 Trip progress updated');
                }
                
                // Actualizar contenido summary de hoy
                if (summaryRenderer && typeof summaryRenderer.updateTodaySummaryContent === 'function') {
                    summaryRenderer.updateTodaySummaryContent();
                    if (Logger && Logger.info) Logger.info('📅 Today summary content updated');
                }
            }
        } catch (error) {
            if (Logger && Logger.error) Logger.error('📅 Error refreshing today view:', error);
        }
    }

    /**
     * 🗓️ REFRESCAR VISTA ITINERARIO: Actualizar timeline y actividades
     */
    refreshItineraryView() {
        try {
            const uiRenderer = stateManager.getState('instances.uiRenderer');
            // Re-renderizar el itinerario completo para destacar el día actual
            if (uiRenderer && typeof uiRenderer.renderItinerary === 'function') {
                uiRenderer.renderItinerary();
            }

            if (Logger && Logger.info) Logger.info('🗓️ Itinerary view refreshed');
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🗓️ Error refreshing itinerary view:', error);
        }
    }

    /**
     * 🗺️ REFRESCAR VISTA MAPA: Actualizar marcadores y ubicación actual
     */
    refreshMapView() {
        try {
            const uiRenderer = stateManager.getState('instances.uiRenderer');
            // Re-renderizar el mapa para actualizar la posición actual
            if (uiRenderer && typeof uiRenderer.renderMap === 'function') {
                uiRenderer.renderMap();
            }

            if (Logger && Logger.info) Logger.info('🗺️ Map view refreshed');
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🗺️ Error refreshing map view:', error);
        }
    }

    /**
     * 💰 REFRESCAR VISTA GASTOS: Actualizar presupuesto y gastos
     */
    refreshGastosView() {
        try {
            const uiRenderer = stateManager.getState('instances.uiRenderer');
            // Re-renderizar la sección de gastos
            if (uiRenderer && typeof uiRenderer.renderGastos === 'function') {
                uiRenderer.renderGastos();
            }

            if (Logger && Logger.info) Logger.info('💰 Gastos view refreshed');
        } catch (error) {
            if (Logger && Logger.error) Logger.error('💰 Error refreshing gastos view:', error);
        }
    }

    /**
     * 🎯 REFRESCAR VISTA PLANIFICACIÓN: Actualizar contenido de planificación
     */
    refreshPlanningView() {
        try {
            const uiRenderer = stateManager.getState('instances.uiRenderer');
            
            // La vista "extras" ahora es parte de "planificacion"
            if (uiRenderer && uiRenderer.currentView === 'planificacion') {
                uiRenderer.renderPlanning();
            }

            if (Logger && Logger.info) Logger.info('🎯 Planning view refreshed');
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🎯 Error refreshing planning view:', error);
        }
    }

    /**
     * 🌐 REFRESCAR COMPONENTES GLOBALES: Actualizar elementos que aparecen en todas las vistas
     */
    refreshGlobalComponents() {
        try {
            // Actualizar clima si existe WeatherManager
            if (window.WeatherManager && typeof window.WeatherManager.renderEnhancedWeather === 'function') {
                window.WeatherManager.renderEnhancedWeather();
            }

            // Actualizar información de fecha en la navegación si existe
            this.updateNavigationDateInfo();

            if (Logger && Logger.info) Logger.info('🌐 Global components refreshed');
        } catch (error) {
            if (Logger && Logger.error) Logger.error('🌐 Error refreshing global components:', error);
        }
    }

    /**
     * 📱 ACTUALIZAR INFO DE FECHA EN NAVEGACIÓN: Mostrar día simulado en la UI
     */
    updateNavigationDateInfo() {
        try {
            const indicator = document.getElementById('day-simulation-indicator');
            
            if (this.isSimulating && indicator) {
                const dayInfo = this.getDayInfo(this.simulatedDay);
                indicator.textContent = `📅 Simulando: ${dayInfo.title}`;
                indicator.classList.remove('hidden');
                indicator.classList.add('animate-pulse');
                
                if (Logger && Logger.info) Logger.info(`📱 Simulation indicator shown: ${dayInfo.title}`);
            } else if (indicator) {
                indicator.classList.add('hidden');
                indicator.classList.remove('animate-pulse');
                
                if (Logger && Logger.info) Logger.info('📱 Simulation indicator hidden');
            }
        } catch (error) {
            if (Logger && Logger.error) Logger.error('📱 Error updating navigation date info:', error);
        }
    }

    /**
     * 📡 TRIGGER UPDATE: Disparar evento personalizado para componentes
     */
    triggerContextualUpdate() {
        const event = new CustomEvent('daySimulationChanged', {
            detail: {
                isSimulating: this.isSimulating,
                simulatedDay: this.simulatedDay,
                dayInfo: this.isSimulating ? this.getDayInfo(this.simulatedDay) : null
            }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * 🕒 MOCK DATE: Sobrescribir Date.now() temporalmente
     */
    mockDateNow(simulatedDate) {
        this.originalDateNow = Date.now;
        Date.now = () => simulatedDate.getTime();
    }

    /**
     * 🔄 RESTORE DATE: Restaurar Date.now() original
     */
    restoreDateNow() {
        if (this.originalDateNow) {
            Date.now = this.originalDateNow;
            this.originalDateNow = null;
        }
    }

    /**
     * 🔍 EXTRACT ACTIVITIES: Extraer actividades del día
     */
    extractActivities(dayData) {
        const activities = [];
        
        if (dayData.title) activities.push(dayData.title);
        if (dayData.planA) activities.push(dayData.planA);
        if (dayData.planB) activities.push(dayData.planB);
        
        return activities.filter(activity => activity && activity.length > 0);
    }

    /**
     * 📍 EXTRACT LOCATION: Extraer ubicación principal
     */
    extractLocation(text) {
        const locations = ['Katmandú', 'Pokhara', 'Chitwan', 'Thimphu', 'Paro', 'Punakha'];
        const found = locations.find(loc => text.toLowerCase().includes(loc.toLowerCase()));
        return found || 'En ruta';
    }

    /**
     * 📊 GET CURRENT STATUS: Estado actual del simulador
     */
    getCurrentStatus() {
        return {
            isSimulating: this.isSimulating,
            simulatedDay: this.simulatedDay,
            currentDayInfo: this.isSimulating ? this.getDayInfo(this.simulatedDay) : null,
            realDate: this.originalDate
        };
    }
}

// Singleton instance
let daySimulatorInstance = null;

export function getDaySimulator() {
    if (!daySimulatorInstance) {
        daySimulatorInstance = new DaySimulator();
        // Exponer globalmente para que UIRenderer pueda acceder
        window.DaySimulator = daySimulatorInstance;
    }
    return daySimulatorInstance;
}

// Funciones globales para fácil acceso desde consola
window.simulateDay = (dayNumber) => {
    const simulator = getDaySimulator();
    return simulator.simulateDay(dayNumber);
};

window.resetSimulation = () => {
    const simulator = getDaySimulator();
    return simulator.resetToRealDate();
};

window.showDaySimulator = () => {
    const simulator = getDaySimulator();
    simulator.createSimulatorUI();
};

window.getSimulationStatus = () => {
    const simulator = getDaySimulator();
    return simulator.getCurrentStatus();
};

console.log(`
🎯 DAY SIMULATOR LOADED

Funciones disponibles en consola:
• simulateDay(5)     - Simular día 5 del viaje
• resetSimulation()  - Volver a fecha real  
• showDaySimulator() - Mostrar panel de control
• getSimulationStatus() - Ver estado actual

Ejemplo:
simulateDay(8)  // Simula el día 8 (Thimphu)
`);
