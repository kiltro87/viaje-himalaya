/**
 * SummaryRenderer - Renderizador Especializado de Resumen
 * 
 * Módulo extraído de UIRenderer.js para manejar toda la funcionalidad
 * relacionada con la vista de resumen del viaje.
 * 
 * Funcionalidades:
 * - Renderizado del header principal con imagen
 * - Panel "Hoy" dinámico
 * - Estadísticas de viaje (días, países, presupuesto)
 * - Análisis de estilo de viaje con gráficos
 * - Cards de información esencial
 * 
 * EXTRACCIÓN REALIZADA: 
 * - ✅ ~514 líneas extraídas de UIRenderer.js  
 * - ✅ Responsabilidad única: solo vista resumen
 * - ✅ Métodos auxiliares incluidos
 * - ✅ Dependencias mínimas
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0  
 * @since 2024
 * @extracted_from UIRenderer.js
 */

import { tripConfig } from '../../config/tripConfig.js';
import { DateUtils } from '../../utils/DateUtils.js';
import { FormatUtils } from '../../utils/FormatUtils.js';
import Logger from '../../utils/Logger.js';
import stateManager from '../../utils/StateManager.js';

export class SummaryRenderer {
    
    /**
     * Constructor del SummaryRenderer
     */
    constructor() {
        Logger.ui('SummaryRenderer initialized');
    }

    /**
     * 📊 RENDERIZAR VISTA RESUMEN
     * 
     * Renderiza la vista completa de resumen del viaje incluyendo:
     * - Header con imagen de fondo
     * - Panel "Hoy" dinámico  
     * - Estadísticas de viaje
     * - Análisis de estilo
     * - Cards informativas
     */
    renderSummary() {
        Logger.ui('📊 Rendering summary view');
        
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

                <!-- Panel "Hoy" Dinámico (exacto del original) -->
                <section class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                            <span class="material-symbols-outlined text-white text-xl">today</span>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">¿Qué hacemos hoy?</h2>
                            <p class="text-slate-600 dark:text-slate-400" id="today-date">Calculando fecha actual...</p>
                        </div>
                    </div>
                    <div id="today-summary-content" class="space-y-4">
                        <!-- Contenido se genera dinámicamente -->
                    </div>
                </section>

                <!-- Grid de Estadísticas (exacto del original) -->
                <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span class="material-symbols-outlined text-white text-xl">calendar_month</span>
                        </div>
                        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">${totalDays}</p>
                        <p class="text-slate-600 dark:text-slate-400 text-sm">días de aventura</p>
                    </div>
                    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span class="material-symbols-outlined text-white text-xl">public</span>
                        </div>
                        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">${totalCountries}</p>
                        <p class="text-slate-600 dark:text-slate-400 text-sm">países visitados</p>
                    </div>
                    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span class="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
                        </div>
                        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">€${grandTotal.toFixed(0)}</p>
                        <p class="text-slate-600 dark:text-slate-400 text-sm">presupuesto total</p>
                    </div>
                    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span class="material-symbols-outlined text-white text-xl">trending_up</span>
                        </div>
                        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">€${costPerDay.toFixed(0)}</p>
                        <p class="text-slate-600 dark:text-slate-400 text-sm">por día</p>
                    </div>
                </section>

                <!-- Sección de Estilo eliminada - se usa renderTripStyleAnalysis() con gráficos circulares -->
                <section class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                    ${this.renderTripStyleAnalysis()}
                </section>

                <!-- Cards de información (exacto del original) -->
                <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <span class="material-symbols-outlined text-white text-xl">info</span>
                            </div>
                            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200">Información del Viaje</h3>
                        </div>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Fechas</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200" id="summary-dates">Calculando...</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Duración</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200">${totalDays} días</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Países</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200">Nepal, Bután</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Tipo de viaje</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200">Aventura y cultura</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                                <span class="material-symbols-outlined text-white text-xl">insights</span>
                            </div>
                            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200">Progreso del Viaje</h3>
                        </div>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Días completados</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200" id="days-completed">Calculando...</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Presupuesto usado</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200" id="budget-used">€${totalSpent.toFixed(0)} de €${grandTotal.toFixed(0)}</span>
                            </div>
                            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                                <div class="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500" 
                                     style="width: ${Math.min((totalSpent / grandTotal) * 100, 100)}%">
                                </div>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Estado</span>
                                <span class="font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm" id="trip-status">Calculando...</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;

        // Actualizar fechas dinámicamente después del render
        this.updateDynamicContent();
        
        Logger.success('📊 Summary view rendered successfully');
    }

    /**
     * 💰 CALCULAR PRESUPUESTO TOTAL
     * 
     * Suma todas las categorías del presupuesto planificado
     * @returns {number} Total presupuestado
     */
    calculateTotalBudget() {
        try {
            // Acceder a la estructura correcta: budgetData.budgetData
            const budgetDataSource = stateManager.getState('config.tripConfig')?.budgetData?.budgetData || tripConfig?.budgetData?.budgetData || {};
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
            Logger.error('Error calculating total budget:', error);
            return 4500; // Fallback solo si hay error
        }
    }

    /**
     * 💸 CALCULAR TOTAL GASTADO
     * 
     * Suma todos los gastos reales del AppState
     * @returns {number} Total gastado
     */
    calculateTotalSpent() {
        try {
            let totalSpent = 0;
            
            // Obtener gastos del localStorage si existe AppState
            totalSpent = stateManager.getTotalSpent();
            return totalSpent;
        } catch (error) {
            Logger.error('Error calculating total spent:', error);
            return 0; // Fallback si hay error
        }
    }

    /**
     * 📊 RENDERIZAR ANÁLISIS DE ESTILO DE VIAJE
     * 
     * Genera gráficos circulares que muestran el tipo de actividades del viaje
     * @returns {string} HTML del análisis de estilo
     */
    renderTripStyleAnalysis() {
        try {
            const tripStyles = this.calculateTripStyles();
            
            return `
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
            `;
        } catch (error) {
            Logger.error('Error rendering travel style analysis:', error);
            return '';
        }
    }

    /**
     * 🎯 CALCULAR ESTILOS DE VIAJE
     * 
     * Analiza las actividades del itinerario y calcula porcentajes por categoría
     * @returns {Array} Array de objetos con estilos de viaje y porcentajes
     */
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
        
        // Contar actividades en todo el itinerario
        tripConfig.itineraryData.forEach(day => {
            const dayText = `${day.title} ${day.activities} ${day.descripcion}`.toLowerCase();
            
            Object.keys(activityCategories).forEach(category => {
                const keywords = activityCategories[category].keywords;
                keywords.forEach(keyword => {
                    if (dayText.includes(keyword.toLowerCase())) {
                        categoryCounts[category]++;
                    }
                });
            });
        });
        
        // Convertir a porcentajes y crear objetos para renderizado
        const styles = Object.keys(activityCategories).map(category => {
            const count = categoryCounts[category];
            const percentage = Math.round((count / totalDays) * 100);
            
            return {
                title: category.charAt(0).toUpperCase() + category.slice(1),
                percentage: Math.min(percentage, 100), // Cap at 100%
                icon: activityCategories[category].icon,
                color: activityCategories[category].color
            };
        });
        
        // Ordenar por porcentaje descendente y tomar solo los top 4
        return styles.sort((a, b) => b.percentage - a.percentage).slice(0, 4);
    }

    /**
     * 🔄 ACTUALIZAR CONTENIDO DINÁMICO
     * 
     * Actualiza elementos que dependen de fechas y datos dinámicos
     */
    updateDynamicContent() {
        Logger.ui('🔄 Updating dynamic content in summary');
        
        try {
            // Actualizar fechas del viaje
            const tripStartDate = this.getTripStartDate();
            const tripEndDate = new Date(tripStartDate);
            tripEndDate.setDate(tripStartDate.getDate() + tripConfig.itineraryData.length - 1);
            
            const startDateFormatted = DateUtils.formatMediumDate(tripStartDate);
            const endDateFormatted = DateUtils.formatMediumDate(tripEndDate);
            
            // Actualizar elementos del DOM
            const tripDatesElement = document.getElementById('trip-dates');
            const summaryDatesElement = document.getElementById('summary-dates');
            
            if (tripDatesElement) {
                tripDatesElement.textContent = `${startDateFormatted} - ${endDateFormatted}`;
            }
            
            if (summaryDatesElement) {
                summaryDatesElement.textContent = `${startDateFormatted} - ${endDateFormatted}`;
            }
            
            // Actualizar progreso del viaje
            this.updateTripProgress();
            
            Logger.success('🔄 Dynamic content updated successfully');
            
        } catch (error) {
            Logger.error('Error updating dynamic content:', error);
        }
    }

    /**
     * 📅 OBTENER FECHA DE INICIO DEL VIAJE
     * 
     * @returns {Date} Fecha de inicio del viaje
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
     * 📈 ACTUALIZAR PROGRESO DEL VIAJE
     * 
     * Calcula y muestra el progreso actual del viaje
     */
    updateTripProgress() {
        try {
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            const totalDays = tripConfig.itineraryData.length;
            
            const daysCompletedElement = document.getElementById('days-completed');
            const tripStatusElement = document.getElementById('trip-status');
            
            if (daysCompletedElement) {
                const completedDays = Math.max(0, Math.min(dayDiff + 1, totalDays));
                daysCompletedElement.textContent = `${completedDays} de ${totalDays}`;
            }
            
            if (tripStatusElement) {
                let status = '';
                if (dayDiff < 0) {
                    status = 'Próximamente';
                } else if (dayDiff >= totalDays) {
                    status = 'Completado';
                } else {
                    status = 'En curso';
                }
                tripStatusElement.textContent = status;
            }
            
        } catch (error) {
            Logger.error('Error updating trip progress:', error);
        }
    }

    /**
     * Renderizar sección de vuelos
     */
    renderFlightsSection() {
        try {
            if (!tripConfig.flightsData || tripConfig.flightsData.length === 0) {
                return '';
            }

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
                        ${flight.segments.map(segment => flightSegmentHTML(segment)).join('')}
                    </div>
                </div>`;

            return `
                <section class="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                    <div class="flex items-center gap-3 mb-8">
                        <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">flight_takeoff</span>
                        <h3 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Información de Vuelos</h3>
                    </div>
                    
                    <div class="grid gap-6 lg:grid-cols-2">
                        ${tripConfig.flightsData.map(flight => flightCardHTML(flight)).join('')}
                    </div>
                </section>
            `;
            
        } catch (error) {
            Logger.error('Error rendering flights section:', error);
            return '';
        }
    }
}
