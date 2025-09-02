/**
 * TodayRenderer - Renderizador Especializado de Vista HOY
 * 
 * Módulo extraído de UIRenderer.js para manejar toda la funcionalidad
 * relacionada con la vista "HOY" del viaje.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0  
 * @since 2024
 * @extracted_from UIRenderer.js
 */

import { tripConfig } from '../../config/tripConfig.js';
import { DateUtils } from '../../utils/DateUtils.js';
import Logger from '../../utils/Logger.js';
import stateManager from '../../utils/StateManager.js';

export class TodayRenderer {
    
    constructor() {
        Logger.ui('TodayRenderer initialized');
    }

    /**
     * 🎯 RENDERIZAR VISTA HOY COMPLETA
     */
    renderTodayLanding() {
        Logger.ui('🏠 Rendering TODAY landing view');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            Logger.error('❌ Main content container not found');
            return;
        }

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
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

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <div id="today-main-content" class="min-h-[200px]">
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">trending_up</span>
                            <div class="flex-1">
                                <h3 class="text-2xl font-bold text-slate-900 dark:text-white">Progreso del Viaje</h3>
                                <p class="text-lg text-slate-600 dark:text-slate-400">Seguimiento de tu aventura</p>
                            </div>
                        </div>
                    
                        <div class="space-y-4">
                            <!-- Tarjeta de progreso principal -->
                            <div class="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-600/50">
                                <div class="flex items-center gap-3 mb-3">
                                    <span class="material-symbols-outlined text-blue-500 dark:text-blue-400 text-3xl">timeline</span>
                                    <div class="flex-1">
                                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Días completados</p>
                                        <p class="text-2xl font-bold text-slate-900 dark:text-white" id="trip-progress-percentage">0%</p>
                                    </div>
                                </div>
                                <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                                    <div id="progress-bar" class="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-standard" style="width: 0%"></div>
                                </div>
                            </div>
                            
                            <!-- Tarjetas de métricas -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-600/50">
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-green-500 dark:text-green-400 text-3xl">calendar_month</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Días totales</p>
                                            <p class="text-2xl font-bold text-slate-900 dark:text-white" id="total-days">${tripConfig.itinerary.length}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-600/50">
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-orange-500 dark:text-orange-400 text-3xl">event_available</span>
                                        <div>
                                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Días transcurridos</p>
                                            <p class="text-2xl font-bold text-slate-900 dark:text-white" id="days-elapsed">0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="material-symbols-outlined text-2xl text-orange-600 dark:text-orange-400">wb_sunny</span>
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Clima de Hoy</h3>
                        </div>
                        
                        <div id="today-weather-info" class="space-y-4">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadTodayContent();
    }

    loadTodayContent() {
        this.updateTodayDateHeader();
        this.updateTodayMainContent();
        this.updateTodayWeather();
        this.updateTripProgress();
    }

    updateTodayDateHeader() {
        const dateElement = document.getElementById('today-date');
        if (!dateElement) {
            Logger.warning('⚠️ Element #today-date not found');
            return;
        }

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
            Logger.debug('📅 Today date header updated:', dateText);
        } catch (error) {
            Logger.error('❌ Error updating today date header:', error);
        }
    }

    updateTripProgress() {
        try {
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            const totalDays = tripConfig.itinerary.length;
            
            // Debug adicional para DaySimulator
            const isSimulating = window.DaySimulator && window.DaySimulator.isSimulating;
            const simulatedDate = isSimulating ? window.DaySimulator.getSimulatedDate() : null;
            
            Logger.debug('📊 Progress Debug:', { 
                today, 
                tripStartDate, 
                dayDiff, 
                totalDays,
                isSimulating,
                simulatedDate,
                realDate: new Date()
            });
            
            let currentDay = 0;
            let progressPercentage = 0;
            let progressColor = 'text-blue-600';
            
            if (dayDiff >= 0 && dayDiff < totalDays) {
                currentDay = dayDiff + 1;
                progressPercentage = Math.round((currentDay / totalDays) * 100);
                
                if (progressPercentage < 30) {
                    progressColor = 'text-red-600';
                } else if (progressPercentage < 70) {
                    progressColor = 'text-orange-600';
                } else {
                    progressColor = 'text-green-600';
                }
            } else if (dayDiff >= totalDays) {
                currentDay = totalDays;
                progressPercentage = 100;
                progressColor = 'text-green-600';
            }
            
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('trip-progress-percentage');
            const daysElapsed = document.getElementById('days-elapsed');
            
            if (progressBar) {
                progressBar.style.width = `${progressPercentage}%`;
            }
            
            if (progressText) {
                progressText.textContent = `${progressPercentage}%`;
                progressText.className = `text-xs ${progressColor} dark:${progressColor.replace('600', '400')}`;
            }
            
            if (daysElapsed) {
                daysElapsed.textContent = currentDay;
            }
            
            Logger.debug('📊 Trip progress updated:', { currentDay, progressPercentage, totalDays });
        } catch (error) {
            Logger.error('❌ Error updating trip progress:', error);
        }
    }

    updateTodayWeather() {
        const weatherContainer = document.getElementById('today-weather-info');
        if (!weatherContainer) {
            Logger.warning('⚠️ Weather container not found');
            return;
        }

        try {
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            // Debug adicional para DaySimulator
            const isSimulating = window.DaySimulator && window.DaySimulator.isSimulating;
            const simulatedDate = isSimulating ? window.DaySimulator.getSimulatedDate() : null;
            
            Logger.debug('🌤️ Weather Debug:', { 
                today, 
                tripStartDate, 
                dayDiff, 
                totalDays: tripConfig.itinerary.length,
                isSimulating,
                simulatedDate,
                realDate: new Date()
            });
            
            if (dayDiff >= 0 && dayDiff < tripConfig.itinerary.length) {
                const currentDayData = tripConfig.itinerary[dayDiff];
                const location = currentDayData.location;
                
                // Debug para clima
                Logger.debug('🌤️ Climate Debug:', { 
                    dayDiff, 
                    currentDayData, 
                    location,
                    availableWeatherLocations: tripConfig.weather.locations ? tripConfig.weather.locations.map(w => w.location) : []
                });
                
                const weatherData = tripConfig.weather.locations && tripConfig.weather.locations.find(w => w.location === location);
                
                if (weatherData) {
                    weatherContainer.innerHTML = `
                        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">${weatherData.dayTemp}</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Temperatura diurna</div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div class="text-center">
                                <div class="text-lg font-semibold text-slate-900 dark:text-white">${weatherData.nightTemp}</div>
                                <div class="text-xs text-slate-600 dark:text-slate-400">Nocturna</div>
                            </div>
                            <div class="text-center">
                                <span class="material-symbols-outlined ${weatherData.color} text-2xl">${weatherData.icon}</span>
                                <div class="text-xs text-slate-600 dark:text-slate-400">Condiciones</div>
                            </div>
                        </div>
                        
                        <div class="text-center">
                            <div class="text-sm text-slate-600 dark:text-slate-400 mb-1">📍 ${location}</div>
                            <div class="text-xs text-slate-500 dark:text-slate-500">Clima típico de la región</div>
                        </div>
                    `;
                } else {
                    weatherContainer.innerHTML = `
                        <div class="text-center text-slate-500 dark:text-slate-400">
                            <span class="material-symbols-outlined text-2xl mb-2 block">cloud_off</span>
                            <p>Información climática no disponible para ${location}</p>
                        </div>
                    `;
                }
            } else {
                weatherContainer.innerHTML = `
                    <div class="text-center text-slate-500 dark:text-slate-400">
                        <span class="material-symbols-outlined text-2xl mb-2 block">home</span>
                        <p>Disfruta del clima local</p>
                    </div>
                `;
            }
            
            Logger.debug('🌤️ Today weather updated');
        } catch (error) {
            Logger.error('❌ Error updating today weather:', error);
        }
    }

    updateTodayMainContent() {
        try {
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            const mainContentContainer = document.querySelector('#today-main-content');
            if (!mainContentContainer) {
                Logger.warning('⚠️ Contenedor #today-main-content no encontrado');
                return;
            }
            
            if (dayDiff >= 0 && dayDiff < tripConfig.itinerary.length) {
                const currentDayData = tripConfig.itinerary[dayDiff];
                
                let activityIcon = 'hiking';
                let activityType = 'Actividades del día';
                
                if (currentDayData.title.toLowerCase().includes('vuelo')) {
                    activityIcon = 'flight';
                    activityType = 'Vuelo';
                } else if (currentDayData.title.toLowerCase().includes('trekking')) {
                    activityIcon = 'hiking';
                    activityType = 'Trekking';
                } else if (currentDayData.title.toLowerCase().includes('safari')) {
                    activityIcon = 'pets';
                    activityType = 'Safari';
                }
                
                const dayNumber = dayDiff + 1;
                
                let contentHTML = `
                    <div class="flex items-center gap-4 mb-6">
                        <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">${activityIcon}</span>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">DÍA ${dayNumber}</span>
                                <span class="text-slate-600 dark:text-slate-400 text-sm">${currentDayData.location || 'En ruta'}</span>
                            </div>
                            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">${activityType}</h2>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 radius-card p-6 border border-slate-200 dark:border-slate-700 mb-6">
                        <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">${currentDayData.title}</h3>
                        <p class="text-slate-600 dark:text-slate-400 mb-6 text-lg leading-relaxed">${currentDayData.description}</p>`;
                        
                if (currentDayData.planA) {
                    contentHTML += `
                        <div class="space-y-3 mb-6">
                            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                <h5 class="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm text-green-600 dark:text-green-400">schedule</span>
                                    Plan Principal
                                </h5>
                                <p class="text-slate-600 dark:text-slate-400 leading-relaxed">${currentDayData.planA}</p>
                            </div>`;
                    
                    if (currentDayData.planB) {
                        contentHTML += `
                            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                <h5 class="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm text-orange-600 dark:text-orange-400">alt_route</span>
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
                const statusTitle = dayDiff < 0 ? 'Preparando el viaje' : 'Viaje completado';
                const statusMessage = dayDiff < 0 ? 
                    `Faltan ${Math.abs(dayDiff)} días para comenzar la aventura` : 
                    'El viaje ha terminado. ¡Esperamos que hayas disfrutado!';
                    
                mainContentContainer.innerHTML = `
                    <div class="flex items-center gap-4 mb-6">
                        <span class="material-symbols-outlined text-3xl text-slate-600 dark:text-slate-400">event</span>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Información del Viaje</h2>
                    </div>
                    
                    <div class="bg-slate-50 dark:bg-slate-800 radius-card p-8 text-center border border-slate-200 dark:border-slate-700">
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-4">${statusTitle}</h3>
                        <p class="text-slate-600 dark:text-slate-400 mb-6">${statusMessage}</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div class="bg-white dark:bg-slate-700 rounded-xl p-4">
                                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${tripConfig.itinerary.length}</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">días totales</div>
                            </div>
                            <div class="bg-white dark:bg-slate-700 rounded-xl p-4">
                                <div class="text-2xl font-bold text-green-600 dark:text-green-400">2</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">países</div>
                            </div>
                            <div class="bg-white dark:bg-slate-700 rounded-xl p-4">
                                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">∞</div>
                                <div class="text-sm text-slate-600 dark:text-slate-400">aventuras</div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            Logger.debug('📝 Today main content updated');
        } catch (error) {
            Logger.error('❌ Error updating today main content:', error);
        }
    }

    getTripStartDate() {
        try {
            // Primero intentar obtener la fecha desde calendarData
            if (tripConfig.trip && tripConfig.trip.startDate) {
                Logger.debug('📅 Using startDate from trip:', tripConfig.trip.startDate);
                return new Date(tripConfig.trip.startDate);
            }
            
            // Fallback: calcular desde getFormattedStartDate si está disponible
            if (tripConfig.trip && typeof tripConfig.trip.getFormattedStartDate === 'function') {
                const startDateString = tripConfig.trip.getFormattedStartDate();
                Logger.debug('📅 Using getFormattedStartDate:', startDateString);
                return new Date(startDateString);
            }
            
            // Fallback: usar primera fecha del itinerario si está disponible
            if (tripConfig.itinerary && tripConfig.itinerary.length > 0) {
                const firstDay = tripConfig.itinerary[0];
                if (firstDay.date) {
                    Logger.debug('📅 Using first day date from itinerary:', firstDay.date);
                    return new Date(firstDay.date);
                }
            }
            
            // Buscar la fecha del primer vuelo internacional (misma lógica que SummaryRenderer)
            const firstInternationalFlight = tripConfig.flights.find(f => f.type === 'Internacional');
            if (firstInternationalFlight && firstInternationalFlight.segments && firstInternationalFlight.segments.length > 0) {
                const firstSegment = firstInternationalFlight.segments[0];
                // Extraer la fecha del string "9 de Octubre 22:45"
                const departureDate = firstSegment.fromDateTime;
                const year = tripConfig.trip.year; // Usar el año del tripConfig
                
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
                        Logger.debug('📅 Trip start date parsed from flight data:', parsedDate);
                        return parsedDate;
                    }
                }
            }
            
            // Fallback final: fecha del vuelo basada en tripConfig
            Logger.warning('⚠️ Could not determine trip start date from flights or itinerary, using default.');
            return new Date('2025-10-09T22:45:00Z'); // Fecha por defecto si no se encuentra
            
        } catch (error) {
            Logger.error('❌ Error getting trip start date:', error);
            return new Date('2025-10-09T22:45:00Z');
        }
    }

    updateTodayDynamicContent() {
        Logger.ui('📅 Updating today dynamic content');
        
        try {
            this.updateTodayMainContent();
            this.updateTodayDateHeader();
            this.updateTripProgress();
            this.updateTodayWeather();
            
            Logger.success('✅ Today dynamic content updated successfully');
        } catch (error) {
            Logger.error('❌ Error updating today dynamic content:', error);
        }
    }
}

export const todayRenderer = new TodayRenderer();
