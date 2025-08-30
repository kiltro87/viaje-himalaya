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
            const totalDays = tripConfig.itineraryData.length;
            
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
            
            if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                const currentDayData = tripConfig.itineraryData[dayDiff];
                const location = currentDayData.location;
                const weatherData = tripConfig.weatherLocations && tripConfig.weatherLocations[location];
                
                if (weatherData) {
                    weatherContainer.innerHTML = `
                        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">${weatherData.temp_avg}°C</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Temperatura promedio</div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div class="text-center">
                                <div class="text-lg font-semibold text-slate-900 dark:text-white">${weatherData.temp_min}°C</div>
                                <div class="text-xs text-slate-600 dark:text-slate-400">Mínima</div>
                            </div>
                            <div class="text-center">
                                <div class="text-lg font-semibold text-slate-900 dark:text-white">${weatherData.temp_max}°C</div>
                                <div class="text-xs text-slate-600 dark:text-slate-400">Máxima</div>
                            </div>
                        </div>
                        
                        <div class="text-center">
                            <div class="text-sm text-slate-600 dark:text-slate-400 mb-1">📍 ${location}</div>
                            <div class="text-xs text-slate-500 dark:text-slate-500">${weatherData.description || 'Condiciones generales'}</div>
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
            
            if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                const currentDayData = tripConfig.itineraryData[dayDiff];
                
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
                                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${tripConfig.itineraryData.length}</div>
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
            if (tripConfig.calendarData && tripConfig.calendarData.startDate) {
                return new Date(tripConfig.calendarData.startDate);
            }
            
            // Fallback: usar la fecha del primer día del itinerario
            if (tripConfig.itineraryData && tripConfig.itineraryData.length > 0) {
                const firstDay = tripConfig.itineraryData[0];
                if (firstDay.date) {
                    return new Date(firstDay.date);
                }
            }
            
            // Último fallback: fecha hardcodeada
            Logger.warning('⚠️ Using hardcoded trip start date');
            return new Date('2025-03-15');
        } catch (error) {
            Logger.error('❌ Error getting trip start date:', error);
            return new Date('2025-03-15');
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
