/**
 * 🗺️ CUSTOM MAP MARKERS - MARCADORES PERSONALIZADOS
 * 
 * Sistema de marcadores personalizados para hoteles, restaurantes y POIs
 * Integración con Leaflet para mapas offline
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { tripConfig } from '../config/tripConfig.js';

export class CustomMapMarkers {
    constructor(map) {
        this.map = map;
        this.markers = new Map();
        this.markerGroups = new Map();
        this.customIcons = {};
        
        this.init();
    }
    
    init() {
        this.createCustomIcons();
        this.loadItineraryMarkers();
        Logger.success('CustomMapMarkers initialized');
    }
    
    createCustomIcons() {
        // Iconos personalizados para diferentes tipos
        this.customIcons = {
            hotel: L.divIcon({
                className: 'custom-marker hotel-marker',
                html: '<div class="marker-icon">🏨</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            }),
            
            restaurant: L.divIcon({
                className: 'custom-marker restaurant-marker',
                html: '<div class="marker-icon">🍽️</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            }),
            
            attraction: L.divIcon({
                className: 'custom-marker attraction-marker',
                html: '<div class="marker-icon">🏛️</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            }),
            
            temple: L.divIcon({
                className: 'custom-marker temple-marker',
                html: '<div class="marker-icon">🏯</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            }),
            
            nature: L.divIcon({
                className: 'custom-marker nature-marker',
                html: '<div class="marker-icon">🏞️</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            }),
            
            shopping: L.divIcon({
                className: 'custom-marker shopping-marker',
                html: '<div class="marker-icon">🛍️</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            }),
            
            transport: L.divIcon({
                className: 'custom-marker transport-marker',
                html: '<div class="marker-icon">✈️</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            }),
            
            current: L.divIcon({
                className: 'custom-marker current-marker',
                html: '<div class="marker-icon current">📍</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            })
        };
        
        // Crear grupos de capas para control
        this.markerGroups.set('hotels', L.layerGroup());
        this.markerGroups.set('restaurants', L.layerGroup());
        this.markerGroups.set('attractions', L.layerGroup());
        this.markerGroups.set('transport', L.layerGroup());
        this.markerGroups.set('current', L.layerGroup());
        
        // Añadir grupos al mapa
        this.markerGroups.forEach(group => group.addTo(this.map));
    }
    
    loadItineraryMarkers() {
        tripConfig.itinerary.forEach(day => {
            if (day.places && day.places.length > 0) {
                day.places.forEach(place => {
                    this.addMarker(place, day);
                });
            }
            
            // Marcador para alojamiento si está especificado
            if (day.accommodation && day.coords) {
                this.addAccommodationMarker(day);
            }
        });
    }
    
    addMarker(place, dayInfo) {
        const { coords, name, icon, description } = place;
        if (!coords || coords.length !== 2) return;
        
        const markerType = this.determineMarkerType(place, dayInfo);
        const customIcon = this.customIcons[markerType] || this.customIcons.attraction;
        
        const marker = L.marker(coords, { icon: customIcon })
            .bindPopup(this.createPopupContent(place, dayInfo))
            .bindTooltip(name, { 
                permanent: false, 
                direction: 'top',
                offset: [0, -30]
            });
        
        // Añadir al grupo correspondiente
        const groupName = this.getGroupName(markerType);
        const group = this.markerGroups.get(groupName);
        if (group) {
            group.addLayer(marker);
        }
        
        // Guardar referencia
        const markerId = `${dayInfo.id}_${name.replace(/\s+/g, '_')}`;
        this.markers.set(markerId, {
            marker,
            type: markerType,
            place,
            day: dayInfo
        });
    }
    
    addAccommodationMarker(day) {
        const marker = L.marker(day.coords, { icon: this.customIcons.hotel })
            .bindPopup(this.createAccommodationPopup(day))
            .bindTooltip(day.accommodation, {
                permanent: false,
                direction: 'top',
                offset: [0, -30]
            });
        
        this.markerGroups.get('hotels').addLayer(marker);
        
        const markerId = `${day.id}_accommodation`;
        this.markers.set(markerId, {
            marker,
            type: 'hotel',
            day
        });
    }
    
    determineMarkerType(place, dayInfo) {
        const name = place.name.toLowerCase();
        const icon = place.icon || '';
        const description = (place.description || '').toLowerCase();
        
        // Hoteles y alojamiento
        if (name.includes('hotel') || name.includes('lodge') || name.includes('guesthouse')) {
            return 'hotel';
        }
        
        // Restaurantes y comida
        if (name.includes('restaurant') || name.includes('cafe') || name.includes('food') || 
            description.includes('comida') || description.includes('restaurante')) {
            return 'restaurant';
        }
        
        // Templos y lugares espirituales
        if (name.includes('temple') || name.includes('monastery') || name.includes('stupa') || 
            name.includes('dzong') || icon.includes('🏯') || icon.includes('🙏')) {
            return 'temple';
        }
        
        // Naturaleza y paisajes
        if (name.includes('lake') || name.includes('mountain') || name.includes('park') || 
            name.includes('sunrise') || icon.includes('🏞️') || icon.includes('⛰️')) {
            return 'nature';
        }
        
        // Compras y mercados
        if (name.includes('market') || name.includes('bazaar') || name.includes('shopping') || 
            icon.includes('🛍️') || icon.includes('🌶️')) {
            return 'shopping';
        }
        
        // Transporte
        if (name.includes('airport') || name.includes('aeropuerto') || icon.includes('✈️')) {
            return 'transport';
        }
        
        return 'attraction';
    }
    
    getGroupName(markerType) {
        const groupMap = {
            'hotel': 'hotels',
            'restaurant': 'restaurants',
            'temple': 'attractions',
            'nature': 'attractions',
            'shopping': 'attractions',
            'transport': 'transport',
            'attraction': 'attractions'
        };
        
        return groupMap[markerType] || 'attractions';
    }
    
    createPopupContent(place, dayInfo) {
        return `
            <div class="custom-popup">
                <div class="popup-header">
                    <span class="popup-icon">${place.icon || '📍'}</span>
                    <h3 class="popup-title">${place.name}</h3>
                </div>
                <div class="popup-content">
                    <p class="popup-description">${place.description || ''}</p>
                    <div class="popup-details">
                        <span class="popup-day">Día ${dayInfo.id.replace('day-', '')}: ${dayInfo.title}</span>
                        <span class="popup-location">${dayInfo.location}, ${dayInfo.country}</span>
                    </div>
                </div>
                <div class="popup-actions">
                    <button onclick="window.mapMarkers.showDirections('${place.coords[0]}', '${place.coords[1]}')" 
                            class="popup-btn directions-btn">
                        🧭 Direcciones
                    </button>
                    <button onclick="window.mapMarkers.addToFavorites('${place.name}')" 
                            class="popup-btn favorite-btn">
                        ⭐ Favorito
                    </button>
                </div>
            </div>
        `;
    }
    
    createAccommodationPopup(day) {
        return `
            <div class="custom-popup accommodation-popup">
                <div class="popup-header">
                    <span class="popup-icon">🏨</span>
                    <h3 class="popup-title">${day.accommodation}</h3>
                </div>
                <div class="popup-content">
                    <p class="popup-description">Alojamiento para la noche</p>
                    <div class="popup-details">
                        <span class="popup-day">Día ${day.id.replace('day-', '')}: ${day.title}</span>
                        <span class="popup-location">${day.location}, ${day.country}</span>
                    </div>
                </div>
                <div class="popup-actions">
                    <button onclick="window.mapMarkers.showDirections('${day.coords[0]}', '${day.coords[1]}')" 
                            class="popup-btn directions-btn">
                        🧭 Direcciones
                    </button>
                </div>
            </div>
        `;
    }
    
    // API pública
    
    /**
     * Añade marcador de ubicación actual
     */
    addCurrentLocationMarker(lat, lng, accuracy = null) {
        // Remover marcador anterior
        this.removeCurrentLocationMarker();
        
        const marker = L.marker([lat, lng], { icon: this.customIcons.current })
            .bindPopup('Tu ubicación actual')
            .bindTooltip('Estás aquí', { permanent: true, direction: 'top' });
        
        this.markerGroups.get('current').addLayer(marker);
        
        // Añadir círculo de precisión si está disponible
        if (accuracy) {
            const circle = L.circle([lat, lng], {
                radius: accuracy,
                fillColor: '#3388ff',
                fillOpacity: 0.2,
                color: '#3388ff',
                weight: 2
            });
            
            this.markerGroups.get('current').addLayer(circle);
        }
        
        this.markers.set('current_location', { marker, type: 'current' });
    }
    
    /**
     * Remueve marcador de ubicación actual
     */
    removeCurrentLocationMarker() {
        const currentGroup = this.markerGroups.get('current');
        currentGroup.clearLayers();
        this.markers.delete('current_location');
    }
    
    /**
     * Muestra/oculta grupo de marcadores
     */
    toggleMarkerGroup(groupName, visible) {
        const group = this.markerGroups.get(groupName);
        if (!group) return;
        
        if (visible) {
            if (!this.map.hasLayer(group)) {
                this.map.addLayer(group);
            }
        } else {
            if (this.map.hasLayer(group)) {
                this.map.removeLayer(group);
            }
        }
    }
    
    /**
     * Obtiene marcadores por tipo
     */
    getMarkersByType(type) {
        return Array.from(this.markers.values()).filter(item => item.type === type);
    }
    
    /**
     * Centra el mapa en un marcador específico
     */
    focusOnMarker(markerId) {
        const markerData = this.markers.get(markerId);
        if (markerData) {
            const latLng = markerData.marker.getLatLng();
            this.map.setView(latLng, 15);
            markerData.marker.openPopup();
        }
    }
    
    /**
     * Funciones para botones de popup
     */
    showDirections(lat, lng) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Abrir en Google Maps o aplicación de mapas del sistema
                const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${lat},${lng}`;
                window.open(url, '_blank');
            });
        } else {
            // Fallback: solo mostrar destino
            const url = `https://www.google.com/maps/search/${lat},${lng}`;
            window.open(url, '_blank');
        }
    }
    
    addToFavorites(placeName) {
        const favorites = JSON.parse(localStorage.getItem('viaje_favorites') || '[]');
        if (!favorites.includes(placeName)) {
            favorites.push(placeName);
            localStorage.setItem('viaje_favorites', JSON.stringify(favorites));
            Logger.info(`Added ${placeName} to favorites`);
        }
    }
    
    /**
     * Obtiene estadísticas de marcadores
     */
    getStats() {
        const stats = {};
        this.markerGroups.forEach((group, name) => {
            stats[name] = group.getLayers().length;
        });
        return stats;
    }
}

// Exportar para uso global
export default CustomMapMarkers;
