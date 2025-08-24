/**
 * 🎯 DAY SIMULATOR
 * 
 * Utilidad para simular cualquier día del viaje y probar funcionalidades contextuales.
 * Permite cambiar la fecha actual simulada para ver cómo se comporta la aplicación
 * en diferentes días del itinerario.
 * 
 * Funcionalidades:
 * - Simular cualquier día del viaje (1-15)
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
            if (window.uiRenderer && typeof window.uiRenderer.getTripStartDate === 'function') {
                this.tripStartDate = window.uiRenderer.getTripStartDate();
                Logger.info('🎯 Trip start date from UIRenderer:', this.tripStartDate);
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
     * 🎯 SIMULAR DÍA: Cambiar al día específico del viaje
     */
    simulateDay(dayNumber) {
        try {
            if (dayNumber < 1 || dayNumber > 15) {
                throw new Error('Day number must be between 1 and 15');
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
                    <!-- Selector de día -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Simular día del viaje:
                        </label>
                        <select id="day-selector" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                            <option value="">Seleccionar día...</option>
                            ${Array.from({length: 15}, (_, i) => {
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

        // Cerrar
        closeBtn?.addEventListener('click', () => {
            this.hideSimulatorUI();
        });
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
            // Refrescar sección "Hoy en tu viaje"
            if (window.uiRenderer && typeof window.uiRenderer.updateTodayInfo === 'function') {
                window.uiRenderer.updateTodayInfo();
            }

            // Refrescar clima si existe WeatherManager
            if (window.WeatherManager && typeof window.WeatherManager.renderEnhancedWeather === 'function') {
                window.WeatherManager.renderEnhancedWeather();
            }

            // Refrescar cualquier otro componente contextual
            this.triggerContextualUpdate();

            Logger.info('🔄 Contextual components refreshed');

        } catch (error) {
            Logger.error('🔄 Error refreshing components:', error);
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
