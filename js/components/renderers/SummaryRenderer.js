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
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
                <!-- Header con imagen de fondo restaurado -->
                <header class="relative h-96 radius-card overflow-hidden shadow-card border border-slate-200 dark:border-slate-700">
                    <div class="absolute inset-0 bg-cover bg-center transition-standard" style="background-image: url('https://www.lasociedadgeografica.com/blog/uploads/2019/10/bhutan-peaceful-tours-nido-del-tigre.jpg'); transform: scale(1.1);"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
                    
                    <!-- Floating elements -->
                    <div class="absolute top-6 right-6 flex gap-3">
                        <div class="bg-white/20 backdrop-blur-sm rounded-full p-3 shadow-card">
                            <span class="material-symbols-outlined text-white text-lg">flight_takeoff</span>
                        </div>
                        <div class="bg-white/20 backdrop-blur-sm rounded-full p-3 shadow-card">
                            <span class="material-symbols-outlined text-white text-lg">landscape</span>
                        </div>
                    </div>
                    
                    <div class="relative h-full flex flex-col justify-end p-4 sm:p-6 md:p-8 lg:p-12 text-white">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-card">
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
                <section class="bg-white dark:bg-slate-800 radius-card p-4 sm:p-6 md:p-8 shadow-card border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center gap-3 mb-6">
                        <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">today</span>
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">¿Qué hacemos hoy?</h2>
                            <p class="text-slate-600 dark:text-slate-400" id="today-date">Calculando fecha actual...</p>
                        </div>
                    </div>
                    <div id="today-summary-content" class="space-y-4">
                        <!-- Contenido se genera dinámicamente -->
                    </div>
                </section>

                <!-- Grid de Estadísticas (formato 2 filas: icono+número arriba, texto abajo) -->
                <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    <div class="bg-white dark:bg-slate-800 radius-card p-4 sm:p-6 shadow-card border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center justify-center gap-3 mb-2">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">calendar_month</span>
                            <p class="text-2xl font-bold text-slate-800 dark:text-slate-200">${totalDays}</p>
                        </div>
                        <p class="text-slate-600 dark:text-slate-400 text-sm text-center">días de aventura</p>
                    </div>
                    <div class="bg-white dark:bg-slate-800 radius-card p-4 sm:p-6 shadow-card border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center justify-center gap-3 mb-2">
                            <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">public</span>
                            <p class="text-2xl font-bold text-slate-800 dark:text-slate-200">${totalCountries}</p>
                        </div>
                        <p class="text-slate-600 dark:text-slate-400 text-sm text-center">países visitados</p>
                    </div>
                    <div class="bg-white dark:bg-slate-800 radius-card p-4 sm:p-6 shadow-card border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center justify-center gap-3 mb-2">
                            <span class="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">account_balance_wallet</span>
                            <p class="text-2xl font-bold text-slate-800 dark:text-slate-200">€${grandTotal.toFixed(0)}</p>
                        </div>
                        <p class="text-slate-600 dark:text-slate-400 text-sm text-center">presupuesto total</p>
                    </div>
                    <div class="bg-white dark:bg-slate-800 radius-card p-4 sm:p-6 shadow-card border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center justify-center gap-3 mb-2">
                            <span class="material-symbols-outlined text-orange-600 dark:text-orange-400 text-2xl">trending_up</span>
                            <p class="text-2xl font-bold text-slate-800 dark:text-slate-200">€${costPerDay.toFixed(0)}</p>
                        </div>
                        <p class="text-slate-600 dark:text-slate-400 text-sm text-center">coste por día</p>
                    </div>
                </section>

                <!-- Análisis de Estilo de Viaje -->
                <section class="bg-white dark:bg-slate-800 radius-card p-6 md:p-8 shadow-card border border-slate-200 dark:border-slate-700">
                    ${this.renderTripStyleAnalysis()}
                </section>

                <!-- Información del Viaje y Progreso -->
                <section class="grid md:grid-cols-2 gap-6 lg:gap-8">
                    <div class="bg-white dark:bg-slate-800 radius-card p-6 shadow-card border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">info</span>
                            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200">Información del Viaje</h3>
                        </div>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Fechas del viaje</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200" id="summary-dates">Calculando fechas...</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Duración total</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200">${totalDays} días</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Países visitados</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200">Nepal, Bután</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-600 dark:text-slate-400">Estilo de viaje</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200">Aventura cultural</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 radius-card p-6 shadow-card border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">trending_up</span>
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
                                <div class="bg-green-500 h-2 rounded-full transition-normal" 
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

                <!-- Información de Vuelos -->
                <section>
                    ${this.renderFlightsSection()}
                </section>

            </div>
        `;

        // Actualizar fechas dinámicamente después del render
        this.updateDynamicContent();
        
        // Actualizar contenido dinámico "Hoy" 
        setTimeout(() => {
            this.updateTodaySummaryContent();
        }, 150);
        
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
            
            Logger.data(`💰 Total budget calculated: €${total}`);
            return total;
            
        } catch (error) {
            Logger.error('Error calculating total budget:', error);
            return 0; // Fallback si hay error
        }
    }

    /**
     * 📊 CALCULAR TOTAL GASTADO
     * 
     * Suma todos los gastos reales registrados
     * @returns {number} Total gastado
     */
    calculateTotalSpent() {
        try {
            const expenses = stateManager.getState('expenses') || [];
            const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
            
            Logger.data(`📊 Total spent calculated: €${total}`);
            return total;

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
        try {
            const activityCategories = {
                cultural: { icon: 'temple_buddhist', color: 'text-purple-600', name: 'Cultural' },
                adventure: { icon: 'hiking', color: 'text-green-600', name: 'Aventura' },
                nature: { icon: 'landscape', color: 'text-blue-600', name: 'Naturaleza' },
                relaxation: { icon: 'spa', color: 'text-orange-600', name: 'Relax' }
            };

            const activityCounts = {
                cultural: 0,
                adventure: 0,
                nature: 0,
                relaxation: 0
            };

            // Contar actividades por categoría basándose en palabras clave
            tripConfig.itineraryData.forEach(day => {
                const text = (day.title + ' ' + day.description).toLowerCase();
                
                if (text.includes('templo') || text.includes('monasterio') || text.includes('cultura') || text.includes('tradición')) {
                    activityCounts.cultural++;
                }
                if (text.includes('trekking') || text.includes('senderismo') || text.includes('aventura') || text.includes('montaña')) {
                    activityCounts.adventure++;
                }
                if (text.includes('naturaleza') || text.includes('paisaje') || text.includes('valle') || text.includes('bosque')) {
                    activityCounts.nature++;
                }
                if (text.includes('relajación') || text.includes('descanso') || text.includes('spa') || text.includes('relax')) {
                    activityCounts.relaxation++;
                }
            });

            const totalActivities = Object.values(activityCounts).reduce((sum, count) => sum + count, 0);
            
            // Convertir conteos a porcentajes y generar estilos
            const styles = Object.entries(activityCounts).map(([category, count]) => {
                const percentage = totalActivities > 0 ? (count / totalActivities) * 100 : 0;
                return {
                    title: activityCategories[category].name,
                    percentage: Math.min(percentage, 100), // Cap at 100%
                    icon: activityCategories[category].icon,
                    color: activityCategories[category].color
                };
            });
            
            // Ordenar por porcentaje descendente y tomar solo los top 4
            return styles.sort((a, b) => b.percentage - a.percentage).slice(0, 4);
        } catch (error) {
            Logger.error('Error calculating trip styles:', error);
            return [];
        }
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
     * 📅 OBTENER FECHA DE INICIO DEL VIAJE (CALCULADO DESDE VUELOS)
     * 
     * @returns {Date} Fecha de inicio del viaje basada en datos reales de vuelos
     */
    getTripStartDate() {
        try {
            // 1. Intentar obtener desde datos de vuelos (fuente más confiable)
            if (tripConfig.flightsData && tripConfig.flightsData.length > 0) {
                const firstFlight = tripConfig.flightsData.find(f => f.type === 'Internacional' && f.title.includes('Ida'));
                if (firstFlight && firstFlight.segments && firstFlight.segments.length > 0) {
                    const departureDate = firstFlight.segments[0].fromDateTime;
                    // Parsear "9 de Octubre 22:45" para obtener año actual
                    const currentYear = new Date().getFullYear();
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
                            return new Date(currentYear, month, day);
                        }
                    }
                }
            }
            
            // 2. Intentar desde calendarData
            const calendarData = tripConfig.calendarData;
            if (calendarData && calendarData.tripStartDate) {
                return new Date(calendarData.tripStartDate);
            }
            
            // 3. Intentar desde primer día del itinerario
            if (tripConfig.itineraryData && tripConfig.itineraryData[0]) {
                const firstDay = tripConfig.itineraryData[0];
                if (firstDay.date) {
                    return new Date(firstDay.date);
                }
            }
            
            // 4. Fallback: Calculado desde datos de vuelos (octubre)
            Logger.warning('Using fallback date calculated from flight data');
            return new Date(2024, 9, 9); // 9 de octubre 2024 (mes 9 = octubre)
            
        } catch (error) {
            Logger.error('Error getting trip start date:', error);
            return new Date(2024, 9, 9); // Fallback consistente con datos de vuelos
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
     * 🌅 ACTUALIZAR CONTENIDO DINÁMICO DE "HOY"
     * 
     * Actualiza el panel "Hoy" basado en la fecha actual o simulada
     */
    updateTodaySummaryContent() {
        const container = document.getElementById('today-summary-content');
        const todayDateElement = document.getElementById('today-date');
        
        if (!container) return;

        try {
            // Usar fecha simulada si el Day Simulator está activo
            const today = stateManager.getCurrentDate();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            // Actualizar fecha mostrada
            if (todayDateElement) {
                const todayFormatted = DateUtils.formatMediumDate(today);
                todayDateElement.textContent = todayFormatted;
            }
            
            Logger.data(`📅 Today summary update`, { dayDiff, tripLength: tripConfig.itineraryData.length });

            if (dayDiff < 0) {
                // ANTES DEL VIAJE
                this.renderPreTripSummary(container, Math.abs(dayDiff));
            } else if (dayDiff >= 0 && dayDiff < tripConfig.itineraryData.length) {
                // DURANTE EL VIAJE
                this.renderDuringTripSummary(container, dayDiff);
            } else {
                // DESPUÉS DEL VIAJE
                this.renderPostTripSummary(container);
            }
            
        } catch (error) {
            Logger.error('Error updating today summary content:', error);
            container.innerHTML = '<p class="text-slate-600 dark:text-slate-400">Error al cargar información del día</p>';
        }
    }

    /**
     * 🚀 RENDERIZAR RESUMEN PRE-VIAJE
     */
    renderPreTripSummary(container, daysUntil) {
        container.innerHTML = `
            <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <div class="flex items-center gap-3 mb-3">
                    <span class="material-symbols-outlined text-orange-600 dark:text-orange-400">schedule</span>
                    <h3 class="font-semibold text-orange-800 dark:text-orange-200">¡El viaje está por comenzar!</h3>
                </div>
                <p class="text-orange-700 dark:text-orange-300">
                    Faltan <strong>${daysUntil} días</strong> para partir hacia el Himalaya. 
                    Es momento de finalizar los preparativos y revisar el equipaje.
                </p>
                <div class="mt-3 flex gap-2">
                    <span class="px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded text-sm">
                        ✈️ Vuelo confirmado
                    </span>
                    <span class="px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded text-sm">
                        🎒 Revisar equipaje
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * 🏔️ RENDERIZAR RESUMEN DURANTE EL VIAJE
     */
    renderDuringTripSummary(container, dayIndex) {
        const currentDay = tripConfig.itineraryData[dayIndex];
        if (!currentDay) return;

        const dayNumber = dayIndex + 1;
        const totalDays = tripConfig.itineraryData.length;
        const progressPercentage = ((dayNumber - 1) / totalDays) * 100;

        container.innerHTML = `
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div class="flex items-center gap-3 mb-3">
                    <span class="material-symbols-outlined text-green-600 dark:text-green-400">${currentDay.icon || 'hiking'}</span>
                    <div>
                        <h3 class="font-semibold text-green-800 dark:text-green-200">Día ${dayNumber} de ${totalDays}</h3>
                        <p class="text-sm text-green-600 dark:text-green-400">${currentDay.title}</p>
                    </div>
                </div>
                
                <p class="text-green-700 dark:text-green-300 mb-3">
                    ${currentDay.description}
                </p>
                
                <!-- Barra de progreso -->
                <div class="mb-3">
                    <div class="flex justify-between text-xs text-green-600 dark:text-green-400 mb-1">
                        <span>Progreso del viaje</span>
                        <span>${Math.round(progressPercentage)}%</span>
                    </div>
                    <div class="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full transition-normal" 
                             style="width: ${progressPercentage}%"></div>
                    </div>
                </div>

                <div class="flex gap-2">
                    <span class="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-sm">
                        📍 ${currentDay.location || 'En ruta'}
                    </span>
                    ${currentDay.country ? 
                        `<span class="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-sm">
                            🏳️ ${currentDay.country}
                        </span>` : ''
                    }
                </div>
            </div>
        `;
    }

    /**
     * 🏁 RENDERIZAR RESUMEN POST-VIAJE
     */
    renderPostTripSummary(container) {
        container.innerHTML = `
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div class="flex items-center gap-3 mb-3">
                    <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">celebration</span>
                    <h3 class="font-semibold text-purple-800 dark:text-purple-200">¡Viaje completado!</h3>
                </div>
                <p class="text-purple-700 dark:text-purple-300 mb-3">
                    Has completado tu increíble aventura por el Himalaya. 
                    ¡Seguro que tienes miles de recuerdos y experiencias únicas!
                </p>
                <div class="flex gap-2">
                    <span class="px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-sm">
                        ✅ ${tripConfig.itineraryData.length} días completados
                    </span>
                    <span class="px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-sm">
                        🏔️ Himalaya conquistado
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar sección de vuelos (estilo original restaurado)
     */
    renderFlightsSection() {
        try {
            if (!tripConfig.flightsData || tripConfig.flightsData.length === 0) {
                return '';
            }

            const flightSegmentHTML = (segment) => `
                <div class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 radius-card">
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
                <div class="bg-white dark:bg-slate-800 p-6 radius-card shadow-card border border-slate-200 dark:border-slate-700 shadow-card-hover transition-standard">
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

            // Separar vuelos internacionales y regionales como en el original
            const internationalFlights = tripConfig.flightsData.filter(f => f.type === 'Internacional');
            const regionalFlights = tripConfig.flightsData.filter(f => f.type === 'Regional');

            // Retornar solo el contenido sin el section wrapper extra
            return `
                <div class="flex items-center gap-3 mb-8">
                    <span class="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">flight_takeoff</span>
                    <h3 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Información de Vuelos</h3>
                </div>
                
                <div class="space-y-8">
                    ${internationalFlights.length > 0 ? flightCardHTML(internationalFlights[0]) : ''}
                    ${regionalFlights.length > 0 ? `
                        <div class="grid md:grid-cols-2 gap-6">
                            ${regionalFlights.map(flightCardHTML).join('')}
                        </div>
                    ` : ''}
                    ${internationalFlights.length > 1 ? flightCardHTML(internationalFlights[1]) : ''}
                </div>
            `;
            
        } catch (error) {
            Logger.error('Error rendering flights section:', error);
            return '';
        }
    }
}