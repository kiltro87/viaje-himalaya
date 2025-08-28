/**
 * ItineraryRenderer - Renderizador Especializado de Itinerario
 * 
 * Módulo extraído de UIRenderer.js para manejar toda la funcionalidad
 * del timeline del itinerario con fases, tarjetas de días y modales.
 * 
 * Funcionalidades:
 * - Renderizado del timeline completo con fases
 * - Generación dinámica de fases (Nepal, Bután, Despedida)
 * - Tarjetas interactivas de días con animaciones
 * - Iconos Material Design contextuales
 * - Event listeners para modales
 * - Scroll automático al día actual
 * - Intersection Observer para animaciones
 * 
 * EXTRACCIÓN REALIZADA: 
 * - ✅ 400+ líneas extraídas de UIRenderer.js  
 * - ✅ Responsabilidad única: solo itinerario
 * - ✅ Modularización completa
 * - ✅ Logging migrado a Logger patterns
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

export class ItineraryRenderer {
    
    /**
     * Constructor del ItineraryRenderer
     */
    constructor() {
        Logger.ui('ItineraryRenderer initialized');
        this.animationObserver = null;
    }

    /**
     * 📅 RENDERIZAR ITINERARIO COMPLETO
     * 
     * Renderiza la vista completa del itinerario con timeline y fases.
     * 
     * @param {HTMLElement} container - Contenedor donde renderizar
     */
    renderItinerary(container) {
        Logger.ui('📅 Rendering complete itinerary timeline');
        
        if (!container) {
            Logger.error('ItineraryRenderer.renderItinerary: No container provided');
            return;
        }

        try {
            // Generar fases dinámicamente basadas en los datos reales del itinerario
            const phases = this.generateItineraryPhases();
            Logger.data(`🎨 Generated ${phases.length} phases for rendering`);
            
            const timelineHTML = this.buildTimelineHTML(phases);
            
            container.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
                    <!-- Header del itinerario -->
                    <div class="mb-12 ">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="material-symbols-outlined text-6xl text-blue-600 dark:text-blue-400">list_alt</span>
                            <div>
                                <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Itinerario del Viaje</h1>
                                <p class="text-lg text-slate-600 dark:text-slate-400">Descubre día a día la aventura que te espera en Nepal y Bután</p>
                            </div>
                        </div>
                    </div>

                    <!-- Timeline del itinerario -->
                    <div class="relative">
                        ${timelineHTML}
                    </div>
                </div>
            `;

            // Configurar event listeners y animaciones
            this.setupEventListeners();
            this.setupAnimations();
            
            Logger.success('✅ Itinerary rendered successfully');
            
        } catch (error) {
            Logger.error('Error rendering itinerary:', error);
            this.renderError(container, error);
        }
    }

    /**
     * 🏗️ CONSTRUIR HTML DEL TIMELINE
     * 
     * Construye el HTML completo del timeline con todas las fases.
     * 
     * @param {Array} phases - Array de fases del itinerario
     * @returns {string} HTML del timeline
     * @private
     */
    buildTimelineHTML(phases) {
        return phases.map(phase => {
            Logger.data(`🔄 Processing phase: ${phase.title} with ${phase.days ? phase.days.length : 0} days`);
            
            const phaseDays = tripConfig.itineraryData.filter(day => day.phase === phase.phase);
            Logger.data(`📋 Filtered ${phaseDays.length} days for phase ${phase.phase}`);
            
            return `
            <div class="mb-16">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${phase.gradient} rounded-2xl flex items-center justify-center">
                        <span class="material-symbols-outlined text-white text-lg sm:text-xl">${phase.icon}</span>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-200">${phase.title}</h3>
                </div>
                ${this.buildPhaseDaysHTML(phaseDays)}
            </div>
        `}).join('');
    }

    /**
     * 📋 CONSTRUIR HTML DE DÍAS DE UNA FASE
     * 
     * Construye el HTML de los días de una fase específica.
     * 
     * @param {Array} phaseDays - Días de la fase
     * @returns {string} HTML de los días
     * @private
     */
    buildPhaseDaysHTML(phaseDays) {
        return phaseDays.map((day, index) => {
            const activityIcon = this.getActivityIcon(day);
            const dayNumber = parseInt(day.id.replace('day-', ''));
            const tripDate = this.getTripDate(dayNumber - 1);
            
            return `
            <div class="timeline-item grid grid-cols-[auto,1fr] gap-x-6" id="${day.id}" data-coords="${day.coords ? day.coords.join(',') : ''}">
                <div class="flex flex-col items-center">
                    <span class="material-symbols-outlined text-4xl text-purple-600 dark:text-purple-400 z-10">${activityIcon}</span>
                    ${index < phaseDays.length - 1 ? '<div class="w-0.5 h-full bg-gradient-to-b from-purple-300 to-violet-300 dark:from-purple-600 dark:to-violet-600"></div>' : ''}
                </div>
                <div class="pb-12 opacity-0 -translate-y-4" style="animation-delay: ${index * 100}ms;">
                    ${this.buildDayCardHTML(day, dayNumber, tripDate, activityIcon)}
                </div>
            </div>`;
        }).join('');
    }

    /**
     * 🎴 CONSTRUIR HTML DE TARJETA DE DÍA
     * 
     * Construye el HTML de una tarjeta de día individual.
     * 
     * @param {Object} day - Datos del día
     * @param {number} dayNumber - Número del día
     * @param {Date} tripDate - Fecha del día
     * @param {string} activityIcon - Icono de la actividad
     * @returns {string} HTML de la tarjeta
     * @private
     */
    buildDayCardHTML(day, dayNumber, tripDate, activityIcon) {
        // Determinar el color de la fase del viaje usando el esquema de la app
        const phaseColors = {
            'nepal': { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20' },
            'bhutan': { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-900/20' },
            'vuelos': { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-900/20' }
        };
        const colors = phaseColors[day.phase] || phaseColors['nepal'];
        
        // Determinar el tipo de actividad para badge usando colores del esquema
        const getActivityBadge = (icon) => {
            const badges = {
                '✈️': { text: 'Vuelo', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
                '🏛️': { text: 'Cultural', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
                '🏔️': { text: 'Trekking', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
                '🚣': { text: 'Aventura', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' },
                '🎯': { text: 'Safari', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
                '🏞️': { text: 'Naturaleza', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' }
            };
            return badges[icon] || { text: 'Experiencia', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300' };
        };
        
        const activityBadge = getActivityBadge(day.icon);
        
        if (day.image) {
            return `
                <div data-day-id="${day.id}" class="itinerary-card bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ease-out overflow-hidden">
                    <div class="relative h-56 md:h-64 lg:h-72 overflow-hidden">
                        <img loading="lazy" src="${day.image}" alt="${day.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" onerror="this.onerror=null;this.src='https://placehold.co/1920x1080/4f46e5/ffffff?text=Imagen';">
                        
                        <!-- Overlay gradiente en hover -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <!-- Badges superiores -->
                        <div class="absolute top-4 left-4 flex gap-2">
                            <div class="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
                                <p class="text-white text-sm font-semibold">Día ${dayNumber}</p>
                            </div>
                            <div class="${activityBadge.color} backdrop-blur-sm rounded-full px-3 py-1">
                                <p class="text-xs font-semibold">${activityBadge.text}</p>
                            </div>
                        </div>
                        
                        <!-- Badge de país -->
                        <div class="absolute top-4 right-4">
                            <div class="${colors.light} backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                                <p class="${colors.text} text-xs font-semibold">${day.country}</p>
                            </div>
                        </div>
                        
                        <!-- Icono grande en hover -->
                        <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <div class="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                                <span class="text-2xl">${day.icon}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6 space-y-4">
                        <!-- Header con fecha -->
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2 ${colors.text}">
                                <span class="material-symbols-outlined text-sm">schedule</span>
                                <span class="text-xs font-medium">${this.formatShortDate(tripDate)}</span>
                            </div>
                            <div class="flex items-center gap-1 text-slate-400">
                                <span class="material-symbols-outlined text-xs">schedule</span>
                                <span class="text-xs">Todo el día</span>
                            </div>
                        </div>
                        
                        <!-- Título principal -->
                        <div>
                            <h4 class="font-bold text-xl text-slate-900 dark:text-white mb-2 leading-tight group-hover:${colors.text} transition-colors duration-300">${day.title}</h4>
                            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">${day.description}</p>
                        </div>
                        

                        
                        <!-- Footer con acción -->
                        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:${colors.text} transition-colors duration-300">
                                <span class="material-symbols-outlined text-sm">touch_app</span>
                                <span class="text-xs font-medium">Ver detalles</span>
                            </div>
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span class="material-symbols-outlined text-sm ${colors.text}">arrow_forward</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div data-day-id="${day.id}" class="itinerary-card bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ease-out overflow-hidden">
                    <div class="p-6 space-y-4">
                        <!-- Header con badges -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex gap-2">
                                <div class="bg-black/10 dark:bg-white/10 rounded-full px-3 py-1">
                                    <p class="text-slate-900 dark:text-white text-sm font-semibold">Día ${dayNumber}</p>
                                </div>
                                <div class="${activityBadge.color} rounded-full px-3 py-1">
                                    <p class="text-xs font-semibold">${activityBadge.text}</p>
                                </div>
                            </div>
                            <div class="${colors.light} rounded-full px-3 py-1">
                                <p class="${colors.text} text-xs font-semibold">${day.country}</p>
                            </div>
                        </div>
                        
                        <!-- Icono central grande -->
                        <div class="flex items-center justify-center mb-6">
                            <div class="relative">
                                <div class="w-16 h-16 ${colors.light} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span class="text-3xl">${day.icon}</span>
                                </div>
                                <div class="absolute inset-0 ${colors.bg} rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            </div>
                        </div>
                        
                        <!-- Información principal -->
                        <div class="text-center space-y-2">
                            <div class="flex items-center justify-center gap-2 ${colors.text} mb-2">
                                <span class="material-symbols-outlined text-sm">schedule</span>
                                <span class="text-xs font-medium">${this.formatShortDate(tripDate)}</span>
                            </div>
                            <h4 class="font-bold text-xl text-slate-900 dark:text-white mb-3 leading-tight group-hover:${colors.text} transition-colors duration-300">${day.title}</h4>
                            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${day.description}</p>
                        </div>
                        

                        
                        <!-- Footer con acción -->
                        <div class="flex items-center justify-center pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:${colors.text} transition-colors duration-300">
                                <span class="material-symbols-outlined text-sm">touch_app</span>
                                <span class="text-xs font-medium">Ver detalles</span>
                                <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1">
                                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 🎭 OBTENER ICONO DE ACTIVIDAD
     * 
     * Determina el icono Material Design apropiado para una actividad.
     * 
     * @param {Object} day - Datos del día
     * @returns {string} Nombre del icono Material Design
     * @private
     */
    getActivityIcon(day) {
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
    }

    /**
     * 🏗️ GENERAR FASES DEL ITINERARIO
     * 
     * Genera dinámicamente las fases del itinerario basándose en los datos.
     * 
     * @returns {Array} Array de fases con metadatos
     */
    generateItineraryPhases() {
        Logger.data('🔍 Generating itinerary phases...');
        Logger.data(`📊 Total days in itineraryData: ${tripConfig.itineraryData.length}`);
        
        const phases = [];
        const nepalDays = tripConfig.itineraryData.filter(day => day.phase === 'nepal');
        const butanDays = tripConfig.itineraryData.filter(day => day.phase === 'butan');
        const farewellDays = tripConfig.itineraryData.filter(day => day.phase === 'farewell');
        
        Logger.data(`🇳🇵 Nepal days found: ${nepalDays.length}`);
        Logger.data(`🇧🇹 Bhutan days found: ${butanDays.length}`);
        Logger.data(`👋 Farewell days found: ${farewellDays.length}`);

        if (nepalDays.length > 0) {
            phases.push({
                title: 'Nepal - Aventura en el Himalaya',
                emoji: '🇳🇵',
                icon: 'location_on',
                gradient: 'from-purple-500 to-violet-600',
                phase: 'nepal',
                days: nepalDays
            });
            Logger.data(`✅ Nepal phase added with ${nepalDays.length} days`);
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
            Logger.data(`✅ Bhutan phase added with ${butanDays.length} days`);
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
            Logger.data(`✅ Farewell phase added with ${farewellDays.length} days`);
        }

        Logger.data(`📋 Total phases generated: ${phases.length}`);
        return phases;
    }

    /**
     * 🎯 CONFIGURAR EVENT LISTENERS
     * 
     * Configura los event listeners para las tarjetas del itinerario.
     * 
     * @private
     */
    setupEventListeners() {
        // Event listeners para los modales
        document.querySelectorAll('.itinerary-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const dayId = e.currentTarget.dataset.dayId;
                const uiRenderer = stateManager.getState('instances.uiRenderer');
                if (uiRenderer && uiRenderer.showItineraryModal) {
                    uiRenderer.showItineraryModal(dayId);
                } else {
                    Logger.warning(`showItineraryModal not available for day: ${dayId}`);
                }
            });
        });

        Logger.ui('Event listeners configured for itinerary cards');
    }

    /**
     * 🎬 CONFIGURAR ANIMACIONES
     * 
     * Configura el Intersection Observer para animaciones de entrada.
     * 
     * @private
     */
    setupAnimations() {
        // Configurar Intersection Observer para animaciones
        this.animationObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target.querySelector(':scope > div:last-child');
                    if (target) {
                        target.classList.add('animate-enter');
                    }
                }
            });
        }, { threshold: 0.6 });
        
        document.querySelectorAll('.timeline-item').forEach(item => {
            this.animationObserver.observe(item);
        });

        Logger.ui('Animation observers configured for timeline items');
    }

    /**
     * 🎯 SCROLL AL DÍA ACTUAL
     * 
     * Hace scroll automático al día actual del viaje.
     */
    scrollToCurrentDay() {
        try {
            // Calcular día actual (usando Day Simulator si está activo)
            const daySimulator = stateManager.getState('instances.daySimulator');
            const today = daySimulator && daySimulator.isSimulating 
                ? daySimulator.getSimulatedDate() 
                : new Date();
            const tripStartDate = this.getTripStartDate();
            const dayDiff = Math.floor((today - tripStartDate) / (1000 * 60 * 60 * 24));
            
            Logger.ui(`🎯 Scroll to current day: dayDiff=${dayDiff}`);
            
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
                        
                        Logger.success(`🎯 Scrolled to current day: ${currentDayId}`);
                    }, 500); // Delay para asegurar que el DOM esté renderizado
                }
            }
        } catch (error) {
            Logger.error('Error scrolling to current day:', error);
        }
    }

    /**
     * 📅 OBTENER FECHA DEL VIAJE
     * 
     * Calcula la fecha de un día específico del viaje.
     * 
     * @param {number} dayNumber - Número del día (0-based)
     * @returns {Date} Fecha del día
     */
    getTripDate(dayNumber) {
        return DateUtils.getTripDate(dayNumber);
    }

    /**
     * 📅 OBTENER FECHA DE INICIO DEL VIAJE
     * 
     * Obtiene la fecha de inicio del viaje.
     * 
     * @returns {Date} Fecha de inicio
     */
    getTripStartDate() {
        return DateUtils.getTripDate(0);
    }

    /**
     * 📝 FORMATEAR FECHA CORTA
     * 
     * Formatea una fecha en formato corto español.
     * 
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatShortDate(date) {
        return FormatUtils.formatShortDate(date);
    }

    /**
     * ❌ RENDERIZAR ERROR
     * 
     * Muestra un mensaje de error cuando el itinerario no puede renderizarse.
     * 
     * @param {HTMLElement} container - Contenedor del error
     * @param {Error} error - Error ocurrido
     * @private
     */
    renderError(container, error) {
        container.innerHTML = `
            <div class="flex items-center justify-center min-h-[400px] bg-red-50 dark:bg-red-900/20 rounded-3xl">
                <div class="text-center p-8">
                    <div class="text-red-500 text-6xl mb-4">📅</div>
                    <h3 class="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Error al cargar el itinerario</h3>
                    <p class="text-red-600 dark:text-red-300">${error.message}</p>
                </div>
            </div>
        `;
    }

    /**
     * 🧹 LIMPIAR RECURSOS
     * 
     * Limpia observers y libera recursos.
     */
    cleanup() {
        if (this.animationObserver) {
            this.animationObserver.disconnect();
            this.animationObserver = null;
        }
        Logger.ui('ItineraryRenderer resources cleaned up');
    }
}

// Exportar instancia singleton
export const itineraryRenderer = new ItineraryRenderer();
export default itineraryRenderer;