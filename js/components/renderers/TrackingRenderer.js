/**
 * TrackingRenderer - Renderizador Especializado de Vista TRACKING
 * 
 * Módulo extraído de UIRenderer.js para manejar toda la funcionalidad
 * relacionada con la vista de seguimiento del viaje.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0  
 * @since 2024
 * @extracted_from UIRenderer.js
 */

import Logger from '../../utils/Logger.js';
import { SummaryRenderer } from './SummaryRenderer.js';
import { mapRenderer } from './MapRenderer.js';

export class TrackingRenderer {
    
    constructor() {
        this.summaryRenderer = new SummaryRenderer();
        Logger.ui('TrackingRenderer initialized');
    }

    /**
     * 🎯 RENDERIZAR VISTA TRACKING COMPLETA
     */
    renderTracking() {
        Logger.ui('📊 Rendering TRACKING view (map + analytics)');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            Logger.error('❌ Main content container not found');
            return;
        }

        mainContent.innerHTML = `
            <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                <div class="mb-12">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-6xl text-green-600 dark:text-green-400">analytics</span>
                        <div>
                            <h1 class="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Seguimiento</h1>
                            <p class="text-lg text-slate-600 dark:text-slate-400">Analiza tu aventura en tiempo real</p>
                        </div>
                    </div>
                </div>


                <div id="summary-stats" class="mb-8">
                </div>

                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-2 relative z-10">
                    <div class="flex items-center gap-3 mb-4 p-4">
                        <span class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">map</span>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Mapa del Viaje</h2>
                    </div>
                    <div id="map-container" class="w-full h-[80vh] min-h-[600px] rounded-xl overflow-hidden relative">
                    </div>
                </div>
            </div>
        `;

        this.loadTrackingContent();
    }

    loadTrackingContent() {
        this.loadSummaryStats();
        this.loadMap();
    }

    loadSummaryStats() {
        Logger.ui('📊 Loading summary stats for tracking view');
        
        try {
            const summaryStats = document.getElementById('summary-stats');
            if (!summaryStats) {
                Logger.warning('⚠️ Summary stats container not found');
                return;
            }

            // Renderizar el resumen completo en el main-content temporalmente
            this.summaryRenderer.renderSummary();
            
            // Extraer las secciones generadas (excluyendo "Qué hacemos hoy")
            const allSections = document.querySelectorAll('#main-content section');
            const filteredSections = Array.from(allSections).filter(section => {
                const h2 = section.querySelector('h2');
                return h2 && !h2.textContent.includes('¿Qué hacemos hoy?');
            });
            
            // Restaurar el contenido original del main-content
            this.renderTracking();
            
            // Insertar las secciones filtradas en summary-stats
            const summaryStatsContainer = document.getElementById('summary-stats');
            if (summaryStatsContainer && filteredSections.length > 0) {
                // Crear wrapper con clases de espaciado
                const wrapper = document.createElement('div');
                wrapper.className = 'space-y-6 md:space-y-8';
                
                filteredSections.forEach(section => {
                    wrapper.appendChild(section.cloneNode(true));
                });
                
                summaryStatsContainer.appendChild(wrapper);
            }
            
            Logger.success('✅ Summary stats loaded in tracking view');
        } catch (error) {
            Logger.error('❌ Error loading summary stats:', error);
        }
    }

    loadMap() {
        Logger.ui('🗺️ Loading map for tracking view');
        
        try {
            const mapContainer = document.getElementById('map-container');
            if (!mapContainer) {
                Logger.warning('⚠️ Map container not found');
                return;
            }

            // Añadir indicador de carga
            mapContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p class="text-slate-600 dark:text-slate-400">Cargando mapa...</p>
                    </div>
                </div>
            `;

            // Renderizar el mapa con un pequeño delay para asegurar que el DOM esté listo
            setTimeout(() => {
                if (mapRenderer && typeof mapRenderer.renderMap === 'function') {
                    mapRenderer.renderMap();
                    Logger.success('✅ Map loaded in tracking view');
                } else {
                    Logger.error('❌ MapRenderer not available in tracking view');
                    mapContainer.innerHTML = `
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center text-slate-500 dark:text-slate-400">
                                <span class="material-symbols-outlined text-4xl mb-4 block">map_off</span>
                                <p>Mapa no disponible</p>
                            </div>
                        </div>
                    `;
                }
            }, 500);
            
        } catch (error) {
            Logger.error('❌ Error loading map:', error);
        }
    }
}

export const trackingRenderer = new TrackingRenderer();
