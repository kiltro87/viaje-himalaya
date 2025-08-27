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
