/**
 * MapRenderer - Renderizador Especializado de Mapas
 * 
 * Módulo extraído de UIRenderer.js para manejar toda la funcionalidad
 * relacionada con mapas Leaflet, tanto el mapa principal como los modales.
 * 
 * Funcionalidades:
 * - Renderizado del mapa principal del itinerario
 * - Creación de mapas en modales de detalles
 * - Gestión de marcadores y popups
 * - Configuración de Leaflet y tiles
 * - Iconos personalizados Material Design
 * 
 * EXTRACCIÓN REALIZADA: 
 * - ✅ 300+ líneas extraídas de UIRenderer.js  
 * - ✅ Responsabilidad única: solo mapas
 * - ✅ Funciones auxiliares incluidas
 * - ✅ Dependencias mínimas
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0  
 * @since 2024
 * @extracted_from UIRenderer.js
 */

import { tripConfig } from '../../config/tripConfig.js';
import { HeaderRenderer } from './HeaderRenderer.js';
import { DateUtils } from '../../utils/DateUtils.js';
import { FormatUtils } from '../../utils/FormatUtils.js';
import Logger from '../../utils/Logger.js';

export class MapRenderer {
    
    /**
     * Constructor del MapRenderer
     */
    constructor() {
        this.map = null;
        this.routeCoords = [];
        Logger.init('MapRenderer initialized');
    }

    /**
     * 🗺️ RENDERIZAR MAPA PRINCIPAL
     * 
     * Renderiza la vista principal del mapa con todos los días del itinerario,
     * marcadores personalizados, popups informativos y ruta completa.
     * 
     * @param {HTMLElement} container - Contenedor donde renderizar el mapa
     */
    renderMap(container) {
        Logger.map('Rendering main map view');
        
        if (!container) {
            Logger.error('MapRenderer.renderMap: No container provided');
            return;
        }

        try {
            container.innerHTML = `
                <div class="w-full max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 pb-32">
                    <!-- Header del mapa -->
                    ${HeaderRenderer.renderPresetHeader('map')}

                    <!-- Contenedor del mapa -->
                    <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden" style="height: 70vh; min-height: 500px;">
                        <div id="map" class="w-full h-full rounded-3xl"></div>
                    </div>
                </div>
            `;
            
            // Crear el mapa después de que el DOM esté listo
            setTimeout(() => {
                this.initializeMainMap();
            }, 100);
            
        } catch (error) {
            Logger.error('Error rendering map container:', error);
            this.renderMapError(container, error);
        }
    }

    /**
     * 🏗️ INICIALIZAR MAPA PRINCIPAL
     * 
     * Crea el mapa Leaflet principal con todos los marcadores del itinerario.
     * 
     * @private
     */
    initializeMainMap() {
        try {
            // Verificar que Leaflet esté disponible
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }

            // Crear el mapa centrado en Nepal/Bután
            this.map = L.map('map', { closePopupOnClick: false }).setView([28.3949, 84.1240], 7);
            
            // Añadir capa de tiles
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
                attribution: '&copy; OpenStreetMap &copy; CARTO' 
            }).addTo(this.map);
            
            // Crear marcadores para cada día del itinerario
            const markers = this.createItineraryMarkers();
            
            // Crear ruta si hay coordenadas
            this.createRoute();
            
            // Ajustar vista para mostrar todos los marcadores
            if (markers.length > 0) {
                const group = new L.featureGroup(markers);
                this.map.fitBounds(group.getBounds().pad(0.1));
            }
            
            Logger.success('Main map initialized successfully');
            
        } catch (error) {
            Logger.error('Error initializing main map:', error);
            this.renderMapError(document.getElementById('map'), error);
        }
    }

    /**
     * 📍 CREAR MARCADORES DEL ITINERARIO
     * 
     * Crea marcadores personalizados para cada día del viaje.
     * 
     * @returns {Array} Array de marcadores creados
     * @private
     */
    createItineraryMarkers() {
        const markers = [];
        
        tripConfig.itineraryData.forEach(day => {
            if (day.coords) {
                const dayNumber = parseInt(day.id.replace('day-', ''));
                const tripDate = this.getTripDate(dayNumber - 1);
                
                // Crear contenido del popup
                const popupContent = this.createPopupContent(day, dayNumber, tripDate);
                
                // Crear icono personalizado
                const customIcon = this.createCustomIcon(day);
                
                // Crear marcador
                const marker = L.marker(day.coords, { icon: customIcon })
                    .addTo(this.map)
                    .bindPopup(popupContent, { 
                        offset: L.point(0, -20), 
                        autoClose: false, 
                        closeButton: true 
                    });
                
                // Configurar eventos del marcador
                this.setupMarkerEvents(marker, day);
                
                markers.push(marker);
                
                // Añadir coordenadas para la ruta
                this.routeCoords.push(day.coords);
            }
        });
        
        return markers;
    }

    /**
     * 🎨 CREAR ICONO PERSONALIZADO
     * 
     * Genera un icono Material Design personalizado para cada día.
     * 
     * @param {Object} day - Datos del día del itinerario
     * @returns {L.DivIcon} Icono personalizado de Leaflet
     * @private
     */
    createCustomIcon(day) {
        // Determinar icono Material Design
        const { materialIcon, iconColor } = this.getIconMapping(day.icon);
        
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-200 dark:border-slate-600">
                <span class="material-symbols-outlined text-lg ${iconColor}">${materialIcon}</span>
            </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
    }

    /**
     * 🎭 MAPEO DE ICONOS
     * 
     * Mapea emojis del itinerario a iconos Material Design.
     * 
     * @param {string} dayIcon - Emoji del día
     * @returns {Object} {materialIcon, iconColor}
     * @private
     */
    getIconMapping(dayIcon) {
        const iconMappings = {
            '✈️': { materialIcon: 'flight', iconColor: 'text-blue-600' },
            '🏛️': { materialIcon: 'temple_buddhist', iconColor: 'text-purple-600' },
            '🏔️': { materialIcon: 'hiking', iconColor: 'text-green-600' },
            '🚣': { materialIcon: 'kayaking', iconColor: 'text-orange-600' },
            '🛬': { materialIcon: 'flight_land', iconColor: 'text-blue-600' },
            '🐘': { materialIcon: 'pets', iconColor: 'text-amber-600' },
            '♨️': { materialIcon: 'hot_tub', iconColor: 'text-red-600' }
        };
        
        return iconMappings[dayIcon] || { materialIcon: 'location_on', iconColor: 'text-blue-600' };
    }

    /**
     * 💬 CREAR CONTENIDO DEL POPUP
     * 
     * Genera el contenido HTML para el popup de un marcador.
     * 
     * @param {Object} day - Datos del día
     * @param {number} dayNumber - Número del día
     * @param {Date} tripDate - Fecha del día
     * @returns {string} HTML del popup
     * @private
     */
    createPopupContent(day, dayNumber, tripDate) {
        return `
            <div class="w-48">
                <img src="${day.image || 'https://placehold.co/400x200/4f46e5/ffffff?text=Himalaya'}" 
                     class="w-full h-24 object-cover rounded-t-lg" alt="${day.title}">
                <div class="p-2">
                    <b class="text-blue-600">${day.title}</b>
                    <p class="text-xs">Día ${dayNumber} - ${this.formatShortDate(tripDate)}</p>
                    <p class="text-xs text-slate-600 mt-1">${day.description.substring(0, 80)}...</p>
                    <button onclick="window.uiRenderer.showItineraryModal('${day.id}')" 
                            class="text-blue-500 text-xs font-semibold mt-1 block hover:underline">
                        Ver detalles →
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 🎯 CONFIGURAR EVENTOS DEL MARCADOR
     * 
     * Configura los eventos de hover y click para un marcador.
     * 
     * @param {L.Marker} marker - Marcador de Leaflet
     * @param {Object} day - Datos del día
     * @private
     */
    setupMarkerEvents(marker, day) {
        let hoverTimeout;
        
        marker.on('mouseover', function () { 
            clearTimeout(hoverTimeout); 
            this.openPopup(); 
        });
        
        marker.on('mouseout', function () { 
            hoverTimeout = setTimeout(() => this.closePopup(), 2000); 
        });
        
        marker.on('click', () => {
            // Usar el callback global para abrir el modal
            if (window.uiRenderer && window.uiRenderer.showItineraryModal) {
                window.uiRenderer.showItineraryModal(day.id);
            }
        });
    }

    /**
     * 🛣️ CREAR RUTA
     * 
     * Dibuja la ruta completa conectando todos los días del itinerario.
     * 
     * @private
     */
    createRoute() {
        if (this.routeCoords && this.routeCoords.length > 1) {
            L.polyline(this.routeCoords, {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.7,
                smoothFactor: 1
            }).addTo(this.map);
            
            Logger.map(`Route created with ${this.routeCoords.length} waypoints`);
        }
    }

    /**
     * 🗺️ CREAR MAPA EN MODAL
     * 
     * Crea un mapa específico para mostrar en los modales de detalles de día.
     * 
     * @param {string} dayId - ID del día
     * @param {Array} coords - Coordenadas [lat, lng]
     * @param {string} title - Título del lugar
     */
    createModalMap(dayId, coords, title) {
        Logger.map(`Creating modal map for day: ${dayId}`);
        
        // Esperar a que el modal sea visible
        setTimeout(() => {
            const mapContainer = document.getElementById(`modal-map-${dayId}`);
            if (!mapContainer) {
                Logger.error(`Modal map container not found: modal-map-${dayId}`);
                return;
            }
            
            // Verificar que Leaflet esté disponible
            if (typeof L === 'undefined') {
                Logger.error('Leaflet not loaded for modal map');
                this.renderModalMapError(mapContainer, 'Leaflet not available');
                return;
            }
            
            try {
                this.initializeModalMap(mapContainer, dayId, coords, title);
            } catch (error) {
                Logger.error(`Error creating modal map for day ${dayId}:`, error);
                this.renderModalMapError(mapContainer, error, title, coords);
            }
        }, 200);
    }

    /**
     * 🏗️ INICIALIZAR MAPA DEL MODAL
     * 
     * Inicializa el mapa específico del modal con marcadores y lugares cercanos.
     * 
     * @param {HTMLElement} mapContainer - Contenedor del mapa
     * @param {string} dayId - ID del día
     * @param {Array} coords - Coordenadas principales
     * @param {string} title - Título del lugar
     * @private
     */
    initializeModalMap(mapContainer, dayId, coords, title) {
        // Limpiar y configurar contenedor
        mapContainer.innerHTML = '';
        mapContainer.style.height = '300px';
        mapContainer.style.width = '100%';
        
        // Crear el mapa
        const map = L.map(`modal-map-${dayId}`, { 
            closePopupOnClick: false,
            zoomControl: true,
            attributionControl: true,
            preferCanvas: true
        }).setView(coords, 12);
        
        // Añadir capa de tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        
        // Crear marcador principal
        this.createMainModalMarker(map, coords, title);
        
        // Añadir lugares cercanos
        const markers = this.createNearbyPlaceMarkers(map, dayId);
        
        // Ajustar vista
        this.adjustModalMapView(map, coords, markers);
        
        // Forzar redibujado múltiple para asegurar renderizado
        setTimeout(() => {
            map.invalidateSize();
            Logger.debug(`🗺️ Map invalidated for day: ${dayId}`);
        }, 100);
        
        // Segundo invalidate por si el modal aún no está completamente renderizado
        setTimeout(() => {
            map.invalidateSize();
            Logger.debug(`🗺️ Map second invalidation for day: ${dayId}`);
        }, 300);
        
        Logger.success(`Modal map created successfully for day: ${dayId}`);
    }

    /**
     * 📍 CREAR MARCADOR PRINCIPAL DEL MODAL
     * 
     * Crea el marcador principal para el mapa del modal.
     * 
     * @param {L.Map} map - Instancia del mapa
     * @param {Array} coords - Coordenadas
     * @param {string} title - Título
     * @private
     */
    createMainModalMarker(map, coords, title) {
        const mainIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                📍
            </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        
        L.marker(coords, { icon: mainIcon })
            .addTo(map)
            .bindPopup(`<b>${title}</b><br><small>Ubicación principal del día</small>`, { closeButton: false })
            .openPopup();
    }

    /**
     * 🏛️ CREAR MARCADORES DE LUGARES CERCANOS
     * 
     * Añade marcadores para lugares cercanos o de interés.
     * 
     * @param {L.Map} map - Instancia del mapa
     * @param {string} dayId - ID del día
     * @returns {Array} Array de marcadores creados
     * @private
     */
    createNearbyPlaceMarkers(map, dayId) {
        const nearbyPlaces = tripConfig.placesByDay[dayId] || [];
        const markers = [];
        
        nearbyPlaces.forEach(place => {
            const placeIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-200 dark:border-slate-600">
                    ${this.getActivityIconHTML(place.icon, 'text-sm')}
                </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });
            
            const marker = L.marker(place.coords, { icon: placeIcon })
                .addTo(map)
                .bindPopup(`<b>${place.name}</b><br><small>${place.description}</small>`, { closeButton: false });
            
            markers.push(marker);
        });
        
        return markers;
    }

    /**
     * 🔍 AJUSTAR VISTA DEL MAPA DEL MODAL
     * 
     * Ajusta la vista del mapa para mostrar todos los marcadores.
     * 
     * @param {L.Map} map - Instancia del mapa
     * @param {Array} coords - Coordenadas principales
     * @param {Array} markers - Marcadores de lugares cercanos
     * @private
     */
    adjustModalMapView(map, coords, markers) {
        const nearbyPlaces = tripConfig.placesByDay || {};
        const allCoords = [coords, ...Object.values(nearbyPlaces).flat().map(p => p.coords)].filter(Boolean);
        
        if (allCoords.length > 1) {
            // Si hay múltiples coordenadas, ajustar a todas
            const bounds = L.latLngBounds(allCoords);
            map.fitBounds(bounds, { padding: [20, 20] });
        } else {
            // Si solo hay una coordenada, centrar con zoom apropiado
            map.setView(coords, 14); // Zoom más cercano para una sola ubicación
        }
        
        Logger.debug(`Modal map view adjusted: ${allCoords.length} coordinates`);
    }

    /**
     * 🎨 OBTENER HTML DE ICONO DE ACTIVIDAD
     * 
     * Convierte emoji a HTML de Material Icons.
     * 
     * @param {string} emoji - Emoji de la actividad
     * @param {string} sizeClass - Clase CSS para el tamaño
     * @returns {string} HTML del icono
     */
    getActivityIconHTML(emoji, sizeClass = 'text-2xl') {
        const { materialIcon, iconColor } = this.getIconMapping(emoji);
        return `<span class="material-symbols-outlined ${sizeClass} ${iconColor}">${materialIcon}</span>`;
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
     * ❌ RENDERIZAR ERROR DE MAPA
     * 
     * Muestra un mensaje de error cuando el mapa no puede cargarse.
     * 
     * @param {HTMLElement} container - Contenedor del error
     * @param {Error} error - Error ocurrido
     * @private
     */
    renderMapError(container, error) {
        container.innerHTML = `
            <div class="fixed inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 z-10">
                <div class="text-center p-8">
                    <div class="text-red-500 text-6xl mb-4">🗺️</div>
                    <h3 class="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Error al cargar el mapa</h3>
                    <p class="text-red-600 dark:text-red-300">${error.message}</p>
                </div>
            </div>
        `;
    }

    /**
     * ❌ RENDERIZAR ERROR DE MAPA DEL MODAL
     * 
     * Muestra un mensaje de error en el mapa del modal.
     * 
     * @param {HTMLElement} mapContainer - Contenedor del mapa
     * @param {Error} error - Error ocurrido
     * @param {string} title - Título del lugar
     * @param {Array} coords - Coordenadas
     * @private
     */
    renderModalMapError(mapContainer, error, title = '', coords = [0, 0]) {
        mapContainer.innerHTML = `
            <div class="flex items-center justify-center h-full p-4 text-center">
                <div class="text-slate-600 dark:text-slate-400">
                    <span class="material-symbols-outlined text-4xl mb-2 opacity-50">error</span>
                    <p class="text-sm">Error al cargar el mapa</p>
                    ${title ? `<p class="text-xs mt-1">${title}</p>` : ''}
                    ${coords.length === 2 ? `<p class="text-xs text-slate-500">${coords[0]?.toFixed(4)}, ${coords[1]?.toFixed(4)}</p>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 🧹 LIMPIAR RECURSOS
     * 
     * Limpia mapas y libera recursos cuando sea necesario.
     */
    cleanup() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.routeCoords = [];
        Logger.map('MapRenderer resources cleaned up');
    }
}

// Exportar instancia singleton
export const mapRenderer = new MapRenderer();
export default mapRenderer;
