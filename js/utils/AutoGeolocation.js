/**
 * 🌍 AUTO GEOLOCATION - GEOLOCALIZACIÓN AUTOMÁTICA PARA MAPAS OFFLINE
 * 
 * Sistema que detecta automáticamente la ubicación del usuario y la integra
 * con mapas offline, proporcionando navegación inteligente y contextual.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { stateManager } from './StateManager.js';

export class AutoGeolocation {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
        this.isTracking = false;
        this.locationHistory = [];
        this.offlineMap = null;
        this.userMarker = null;
        this.accuracyCircle = null;
        
        // Configuración de geolocalización
        this.config = {
            // Opciones de geolocalización
            options: {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000 // 1 minuto
            },
            
            // Configuración de tracking
            tracking: {
                minDistance: 10,        // Mínimo 10m para actualizar
                maxAge: 30000,          // 30 segundos máximo
                desiredAccuracy: 50,    // 50m de precisión deseada
                updateInterval: 5000    // 5 segundos entre updates
            },
            
            // Zonas de interés (Nepal y Bután)
            regions: {
                nepal: {
                    bounds: [[26.3, 80.0], [30.5, 88.3]],
                    center: [28.3949, 84.1240],
                    zoom: 8
                },
                bhutan: {
                    bounds: [[26.7, 88.7], [28.4, 92.2]],
                    center: [27.5142, 90.4336],
                    zoom: 9
                }
            }
        };
        
        this.init();
    }
    
    init() {
        this.checkGeolocationSupport();
        this.loadLocationHistory();
        this.setupLocationPermissions();
        
        Logger.success('AutoGeolocation initialized');
    }
    
    checkGeolocationSupport() {
        if (!navigator.geolocation) {
            Logger.error('Geolocation not supported');
            this.showLocationError('Tu dispositivo no soporta geolocalización');
            return false;
        }
        return true;
    }
    
    async setupLocationPermissions() {
        if ('permissions' in navigator) {
            try {
                const permission = await navigator.permissions.query({name: 'geolocation'});
                
                permission.addEventListener('change', () => {
                    this.handlePermissionChange(permission.state);
                });
                
                this.handlePermissionChange(permission.state);
                
            } catch (error) {
                Logger.warn('Permissions API not available', error);
            }
        }
    }
    
    handlePermissionChange(state) {
        Logger.info(`Geolocation permission: ${state}`);
        
        switch (state) {
            case 'granted':
                this.startLocationTracking();
                break;
            case 'denied':
                this.showLocationError('Permisos de ubicación denegados');
                break;
            case 'prompt':
                this.requestLocationPermission();
                break;
        }
        
        stateManager.updateState('location.permission', state);
    }
    
    async requestLocationPermission() {
        try {
            const position = await this.getCurrentPosition();
            Logger.success('Location permission granted');
            this.handleLocationSuccess(position);
        } catch (error) {
            Logger.warn('Location permission denied', error);
            this.handleLocationError(error);
        }
    }
    
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                this.config.options
            );
        });
    }
    
    async startLocationTracking() {
        if (this.isTracking) {
            Logger.debug('Location tracking already active');
            return;
        }
        
        try {
            // Obtener posición inicial
            const position = await this.getCurrentPosition();
            this.handleLocationSuccess(position);
            
            // Iniciar tracking continuo
            this.watchId = navigator.geolocation.watchPosition(
                (position) => this.handleLocationUpdate(position),
                (error) => this.handleLocationError(error),
                this.config.options
            );
            
            this.isTracking = true;
            Logger.success('Location tracking started');
            
        } catch (error) {
            Logger.error('Failed to start location tracking', error);
            this.handleLocationError(error);
        }
    }
    
    stopLocationTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.isTracking = false;
        Logger.info('Location tracking stopped');
    }
    
    handleLocationSuccess(position) {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed
        };
        
        this.currentPosition = location;
        this.addToLocationHistory(location);
        this.updateMapLocation(location);
        this.checkLocationContext(location);
        
        Logger.debug('Location updated', location);
        stateManager.updateState('location.current', location);
    }
    
    handleLocationUpdate(position) {
        const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
        };
        
        // Verificar si el movimiento es significativo
        if (this.isSignificantMovement(newLocation)) {
            this.handleLocationSuccess(position);
        }
    }
    
    isSignificantMovement(newLocation) {
        if (!this.currentPosition) return true;
        
        const distance = this.calculateDistance(
            this.currentPosition.latitude,
            this.currentPosition.longitude,
            newLocation.latitude,
            newLocation.longitude
        );
        
        return distance >= this.config.tracking.minDistance;
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Radio de la Tierra en metros
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    addToLocationHistory(location) {
        this.locationHistory.push({
            ...location,
            id: `loc_${Date.now()}`
        });
        
        // Mantener solo las últimas 100 ubicaciones
        if (this.locationHistory.length > 100) {
            this.locationHistory = this.locationHistory.slice(-100);
        }
        
        this.saveLocationHistory();
    }
    
    updateMapLocation(location) {
        if (!this.offlineMap) {
            this.initializeOfflineMap(location);
            return;
        }
        
        // Actualizar marcador del usuario
        this.updateUserMarker(location);
        
        // Actualizar círculo de precisión
        this.updateAccuracyCircle(location);
        
        // Centrar mapa si es necesario
        this.centerMapIfNeeded(location);
    }
    
    initializeOfflineMap(location) {
        const mapContainer = document.getElementById('offline-map');
        if (!mapContainer) {
            Logger.warn('Map container not found');
            return;
        }
        
        // Inicializar mapa Leaflet
        this.offlineMap = L.map('offline-map').setView(
            [location.latitude, location.longitude],
            15
        );
        
        // Añadir tiles offline (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.offlineMap);
        
        // Añadir marcador del usuario
        this.addUserMarker(location);
        
        // Añadir controles personalizados
        this.addMapControls();
        
        Logger.success('Offline map initialized');
    }
    
    addUserMarker(location) {
        // Icono personalizado para el usuario
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
                <div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg">
                    <div class="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
                </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        
        this.userMarker = L.marker([location.latitude, location.longitude], {
            icon: userIcon
        }).addTo(this.offlineMap);
        
        // Círculo de precisión
        this.accuracyCircle = L.circle([location.latitude, location.longitude], {
            radius: location.accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1
        }).addTo(this.offlineMap);
    }
    
    updateUserMarker(location) {
        if (this.userMarker) {
            this.userMarker.setLatLng([location.latitude, location.longitude]);
        }
    }
    
    updateAccuracyCircle(location) {
        if (this.accuracyCircle) {
            this.accuracyCircle.setLatLng([location.latitude, location.longitude]);
            this.accuracyCircle.setRadius(location.accuracy);
        }
    }
    
    centerMapIfNeeded(location) {
        if (!this.offlineMap) return;
        
        const mapCenter = this.offlineMap.getCenter();
        const distance = this.calculateDistance(
            mapCenter.lat, mapCenter.lng,
            location.latitude, location.longitude
        );
        
        // Recentrar si el usuario se ha movido más de 500m del centro
        if (distance > 500) {
            this.offlineMap.panTo([location.latitude, location.longitude]);
        }
    }
    
    addMapControls() {
        // Control para centrar en ubicación actual
        const centerControl = L.control({position: 'topright'});
        centerControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            div.innerHTML = `
                <a href="#" class="center-location-btn" title="Centrar en mi ubicación">
                    <span class="material-symbols-outlined">my_location</span>
                </a>
            `;
            
            div.onclick = (e) => {
                e.preventDefault();
                this.centerOnCurrentLocation();
            };
            
            return div;
        };
        centerControl.addTo(this.offlineMap);
        
        // Control de información de ubicación
        this.addLocationInfoControl();
    }
    
    addLocationInfoControl() {
        const infoControl = L.control({position: 'bottomleft'});
        infoControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'location-info-control');
            div.innerHTML = `
                <div class="bg-white dark:bg-gray-800 p-2 rounded shadow text-xs">
                    <div id="location-coords">Obteniendo ubicación...</div>
                    <div id="location-accuracy" class="text-gray-500"></div>
                </div>
            `;
            return div;
        };
        infoControl.addTo(this.offlineMap);
        
        this.updateLocationInfo();
    }
    
    updateLocationInfo() {
        if (!this.currentPosition) return;
        
        const coordsEl = document.getElementById('location-coords');
        const accuracyEl = document.getElementById('location-accuracy');
        
        if (coordsEl && accuracyEl) {
            coordsEl.textContent = `${this.currentPosition.latitude.toFixed(6)}, ${this.currentPosition.longitude.toFixed(6)}`;
            accuracyEl.textContent = `Precisión: ±${Math.round(this.currentPosition.accuracy)}m`;
        }
    }
    
    centerOnCurrentLocation() {
        if (this.currentPosition && this.offlineMap) {
            this.offlineMap.setView(
                [this.currentPosition.latitude, this.currentPosition.longitude],
                16
            );
            
            // Mostrar notificación
            this.showLocationNotification('📍 Centrado en tu ubicación');
        }
    }
    
    checkLocationContext(location) {
        // Verificar si está en Nepal o Bután
        const region = this.detectRegion(location);
        
        if (region) {
            this.handleRegionEntry(region, location);
        }
        
        // Verificar proximidad a puntos de interés del itinerario
        this.checkNearbyPOIs(location);
    }
    
    detectRegion(location) {
        const { latitude, longitude } = location;
        
        // Verificar Nepal
        const nepalBounds = this.config.regions.nepal.bounds;
        if (latitude >= nepalBounds[0][0] && latitude <= nepalBounds[1][0] &&
            longitude >= nepalBounds[0][1] && longitude <= nepalBounds[1][1]) {
            return 'nepal';
        }
        
        // Verificar Bután
        const bhutanBounds = this.config.regions.bhutan.bounds;
        if (latitude >= bhutanBounds[0][0] && latitude <= bhutanBounds[1][0] &&
            longitude >= bhutanBounds[0][1] && longitude <= bhutanBounds[1][1]) {
            return 'bhutan';
        }
        
        return null;
    }
    
    handleRegionEntry(region, location) {
        const currentRegion = stateManager.getState('location.currentRegion');
        
        if (currentRegion !== region) {
            stateManager.updateState('location.currentRegion', region);
            
            const regionName = region === 'nepal' ? 'Nepal' : 'Bután';
            this.showLocationNotification(`🏔️ ¡Bienvenido a ${regionName}!`);
            
            Logger.info(`Entered region: ${region}`, location);
        }
    }
    
    checkNearbyPOIs(location) {
        // Aquí implementarías la lógica para verificar POIs del itinerario
        // Por ahora, solo un ejemplo básico
        const pois = this.getNearbyPOIs(location);
        
        pois.forEach(poi => {
            if (poi.distance < 100) { // Menos de 100m
                this.showLocationNotification(`📍 Cerca de: ${poi.name}`);
            }
        });
    }
    
    getNearbyPOIs(location) {
        // Ejemplo de POIs - en una implementación real, estos vendrían del itinerario
        const samplePOIs = [
            { name: 'Kathmandu Durbar Square', lat: 27.7045, lng: 85.3077 },
            { name: 'Swayambhunath Temple', lat: 27.7149, lng: 85.2906 },
            { name: 'Paro Airport', lat: 27.4026, lng: 89.4242 }
        ];
        
        return samplePOIs.map(poi => ({
            ...poi,
            distance: this.calculateDistance(
                location.latitude, location.longitude,
                poi.lat, poi.lng
            )
        })).filter(poi => poi.distance < 1000); // Menos de 1km
    }
    
    handleLocationError(error) {
        let message = 'Error de ubicación';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Permisos de ubicación denegados';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Ubicación no disponible';
                break;
            case error.TIMEOUT:
                message = 'Tiempo de espera agotado';
                break;
        }
        
        Logger.warn('Geolocation error', { code: error.code, message: error.message });
        this.showLocationError(message);
        
        stateManager.updateState('location.error', { code: error.code, message });
    }
    
    showLocationNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
    
    showLocationError(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    saveLocationHistory() {
        try {
            localStorage.setItem('location_history', JSON.stringify(this.locationHistory));
        } catch (error) {
            Logger.warn('Failed to save location history', error);
        }
    }
    
    loadLocationHistory() {
        try {
            const stored = localStorage.getItem('location_history');
            if (stored) {
                this.locationHistory = JSON.parse(stored);
                Logger.info(`Loaded ${this.locationHistory.length} location history entries`);
            }
        } catch (error) {
            Logger.warn('Failed to load location history', error);
        }
    }
    
    // API pública
    
    /**
     * Obtener ubicación actual
     */
    getCurrentLocation() {
        return this.currentPosition;
    }
    
    /**
     * Obtener historial de ubicaciones
     */
    getLocationHistory() {
        return this.locationHistory;
    }
    
    /**
     * Inicializar mapa en contenedor específico
     */
    initMapInContainer(containerId) {
        const container = document.getElementById(containerId);
        if (container && this.currentPosition) {
            container.id = 'offline-map';
            this.initializeOfflineMap(this.currentPosition);
        }
    }
    
    /**
     * Obtener estado de geolocalización
     */
    getLocationStatus() {
        return {
            isTracking: this.isTracking,
            hasPermission: stateManager.getState('location.permission') === 'granted',
            currentPosition: this.currentPosition,
            accuracy: this.currentPosition?.accuracy,
            lastUpdate: this.currentPosition?.timestamp
        };
    }
}

// Exportar instancia singleton
export const autoGeolocation = new AutoGeolocation();
export default autoGeolocation;
