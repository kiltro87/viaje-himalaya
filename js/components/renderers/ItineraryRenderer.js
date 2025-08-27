/**
 * ItineraryRenderer - Renderizador de Itinerario
 * 
 * Módulo especializado para renderizar toda la información del itinerario
 * incluyendo timeline, modales, y navegación por días.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import { tripConfig } from '../../config/tripConfig.js';
import { HeaderRenderer } from './HeaderRenderer.js';
import { UIHelpers } from '../../utils/UIHelpers.js';

export class ItineraryRenderer {
    
    /**
     * Renderiza la sección completa del itinerario
     * 
     * @param {HTMLElement} container - Contenedor principal
     */
    static renderItinerarySection(container) {
        if (!container) {
            console.error('❌ ItineraryRenderer: Contenedor no encontrado');
            return;
        }

        const headerHTML = HeaderRenderer.renderPresetHeader('itinerary');
        const timelineHTML = this.generateTimelineHTML();

        const content = `
            ${headerHTML}
            <!-- Timeline del itinerario -->
            <div class="relative">
                ${timelineHTML}
            </div>
        `;

        container.innerHTML = UIHelpers.createMainContainer(content);
        
        // Configurar event listeners
        this.setupEventListeners();
        this.setupIntersectionObserver();

        console.log('✅ ItineraryRenderer: Itinerario renderizado');
    }

    /**
     * Genera el HTML del timeline del itinerario
     */
    static generateTimelineHTML() {
        // Lógica extraída del UIRenderer original
        const phaseColors = {
            'preparation': 'from-blue-500 to-cyan-500',
            'nepal': 'from-green-500 to-emerald-500', 
            'bhutan': 'from-orange-500 to-red-500',
            'return': 'from-purple-500 to-pink-500'
        };

        return tripConfig.itineraryData.map((day, index) => {
            const phaseColor = phaseColors[day.phase] || 'from-gray-500 to-gray-600';
            
            return `
                <div class="timeline-item flex gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12">
                    ${this.renderTimelineConnector(index)}
                    ${this.renderDayCard(day, phaseColor)}
                </div>
            `;
        }).join('');
    }

    /**
     * Renderiza el conector del timeline
     */
    static renderTimelineConnector(index) {
        const isLast = index === tripConfig.itineraryData.length - 1;
        
        return `
            <div class="relative flex flex-col items-center">
                <div class="w-4 h-4 md:w-6 md:h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full z-10 flex items-center justify-center shadow-lg">
                    <div class="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"></div>
                </div>
                ${!isLast ? '<div class="w-0.5 h-20 md:h-24 lg:h-28 bg-gradient-to-b from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 mt-2"></div>' : ''}
            </div>
        `;
    }

    /**
     * Renderiza una tarjeta de día del itinerario
     */
    static renderDayCard(day, phaseColor) {
        const cardContent = `
            <div class="itinerary-card group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl lg:rounded-3xl shadow-lg hover:shadow-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 lg:p-8 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1" 
                 data-day-id="${day.id}">
                
                ${this.renderDayHeader(day, phaseColor)}
                ${this.renderDayContent(day)}
                ${this.renderDayFooter(day)}
            </div>
        `;

        return `<div class="flex-1 min-w-0">${cardContent}</div>`;
    }

    /**
     * Renderiza el header de un día
     */
    static renderDayHeader(day, phaseColor) {
        return `
            <div class="flex items-center justify-between mb-4 md:mb-6">
                <div class="flex items-center gap-3 md:gap-4">
                    <div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${phaseColor} rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">
                        ${day.day}
                    </div>
                    <div>
                        <h3 class="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            ${day.title}
                        </h3>
                        <p class="text-sm md:text-base text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">location_on</span>
                            ${day.country}
                        </p>
                    </div>
                </div>
                <span class="text-2xl md:text-3xl lg:text-4xl group-hover:scale-110 transition-transform">${day.icon}</span>
            </div>
        `;
    }

    /**
     * Renderiza el contenido principal de un día
     */
    static renderDayContent(day) {
        return `
            <div class="space-y-4 md:space-y-6">
                <div class="aspect-video rounded-xl lg:rounded-2xl overflow-hidden shadow-md">
                    <img src="${day.image}" 
                         alt="${day.title}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
                </div>
                
                <p class="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    ${day.description}
                </p>
                
                ${day.accommodation ? `
                    <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 md:p-4">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="material-symbols-outlined text-green-600 dark:text-green-400">hotel</span>
                            <span class="font-semibold text-slate-900 dark:text-white text-sm md:text-base">Alojamiento</span>
                        </div>
                        <p class="text-slate-600 dark:text-slate-400 text-xs md:text-sm">${day.accommodation}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Renderiza el footer de un día
     */
    static renderDayFooter(day) {
        return `
            <div class="flex items-center justify-between mt-4 md:mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div class="flex items-center gap-3 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    <span class="material-symbols-outlined text-sm">schedule</span>
                    <span>Día ${day.day}</span>
                </div>
                
                <button class="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs md:text-sm transition-colors">
                    <span>Ver detalles</span>
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            </div>
        `;
    }

    /**
     * Configura los event listeners para el itinerario
     */
    static setupEventListeners() {
        document.querySelectorAll('.itinerary-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const dayId = e.currentTarget.dataset.dayId;
                this.showItineraryModal(dayId);
            });
        });
    }

    /**
     * Configura el Intersection Observer para animaciones
     */
    static setupIntersectionObserver() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.querySelector(':scope > div:last-child').classList.add('animate-enter');
                }
            });
        }, { threshold: 0.6 });
        
        document.querySelectorAll('.timeline-item').forEach(item => observer.observe(item));
    }

    /**
     * Muestra el modal de detalles de un día
     */
    static showItineraryModal(dayId) {
        // Esta funcionalidad se mantendría en UIRenderer por ahora
        // o se movería a un ModalManager separado
        console.log(`🔍 Mostrando modal para día: ${dayId}`);
    }
}
