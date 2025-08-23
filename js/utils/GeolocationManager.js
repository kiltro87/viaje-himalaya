/**
 * GeolocationManager - Gestor de Geolocalización
 * 
 * Maneja toda la funcionalidad relacionada con geolocalización,
 * incluyendo seguimiento de ubicación, cálculo de distancias,
 * y integración con el mapa del viaje.
 * 
 * Funcionalidades principales:
 * - Obtención de ubicación actual del usuario
 * - Seguimiento de ubicación en tiempo real
 * - Cálculo de distancias a destinos del viaje
 * - Detección de llegada a ubicaciones planificadas
 * - Integración con notificaciones de proximidad
 * - Gestión de permisos de geolocalización
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { tripConfig } from '../config/tripConfig.js';

export class GeolocationManager {
    /**
     * Constructor del GeolocationManager
     * 
     * Inicializa el sistema de geolocalización con configuración
     * por defecto y prepara los listeners de eventos.
     * 
     * @constructor
     */
    constructor() {
        this.watchId = null;
        this.currentPosition = null;
        this.isTracking = false;
        this.lastKnownPosition = null;
        
        // Configuración de geolocalización
        this.options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // 1 minuto
        };
        
        // Callbacks para eventos
        this.onLocationUpdate = null;
        this.onLocationError = null;
        this.onDestinationReached = null;
        
        // Distancia mínima para considerar "llegada" (en metros)
        this.arrivalThreshold = 500;
        
        Logger.init('GeolocationManager initialized');
    }

    /**
     * Verifica si la geolocalización está disponible
     * 
     * @returns {boolean} True si la geolocalización está soportada
     */
    isGeolocationSupported() {
        return 'geolocation' in navigator;
    }

    /**
     * Solicita permisos de geolocalización
     * 
     * @returns {Promise<string>} Estado del permiso ('granted', 'denied', 'prompt')
     */
    async requestPermission() {
        if (!this.isGeolocationSupported()) {
            Logger.error('Geolocation not supported by this browser');
            throw new Error('Geolocalización no soportada por este navegador');
        }

        try {
            if ('permissions' in navigator) {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                Logger.data('Geolocation permission status:', permission.state);
                return permission.state;
            }
            
            // Fallback: intentar obtener ubicación para verificar permisos
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        Logger.success('Geolocation permission granted');
                        resolve('granted');
                    },
                    (error) => {
                        if (error.code === error.PERMISSION_DENIED) {
                            Logger.warning('Geolocation permission denied');
                            resolve('denied');
                        } else {
                            Logger.error('Error checking geolocation permission:', error);
                            reject(error);
                        }
                    },
                    { timeout: 5000 }
                );
            });
            
        } catch (error) {
            Logger.error('Error requesting geolocation permission:', error);
            throw error;
        }
    }

    /**
     * Obtiene la ubicación actual del usuario
     * 
     * @returns {Promise<GeolocationPosition>} Posición actual
     */
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!this.isGeolocationSupported()) {
                const error = new Error('Geolocalización no soportada');
                Logger.error('Geolocation not supported');
                reject(error);
                return;
            }

            Logger.data('Requesting current position...');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentPosition = position;
                    this.lastKnownPosition = position;
                    
                    Logger.success('Current position obtained:', {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    
                    resolve(position);
                },
                (error) => {
                    Logger.error('Error getting current position:', {
                        code: error.code,
                        message: error.message
                    });
                    
                    if (this.onLocationError) {
                        this.onLocationError(error);
                    }
                    
                    reject(error);
                },
                this.options
            );
        });
    }

    /**
     * Inicia el seguimiento de ubicación en tiempo real
     * 
     * @param {Object} callbacks - Callbacks para eventos de ubicación
     * @param {Function} callbacks.onUpdate - Callback para actualizaciones de ubicación
     * @param {Function} callbacks.onError - Callback para errores
     * @param {Function} callbacks.onDestinationReached - Callback para llegada a destino
     */
    startTracking(callbacks = {}) {
        if (!this.isGeolocationSupported()) {
            Logger.error('Cannot start tracking: Geolocation not supported');
            throw new Error('Geolocalización no soportada');
        }

        if (this.isTracking) {
            Logger.warning('Tracking already active');
            return;
        }

        // Configurar callbacks
        this.onLocationUpdate = callbacks.onUpdate || null;
        this.onLocationError = callbacks.onError || null;
        this.onDestinationReached = callbacks.onDestinationReached || null;

        Logger.data('Starting location tracking...');

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handleLocationUpdate(position);
            },
            (error) => {
                this.handleLocationError(error);
            },
            this.options
        );

        this.isTracking = true;
        Logger.success('Location tracking started');
    }

    /**
     * Detiene el seguimiento de ubicación
     */
    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.isTracking = false;
            
            Logger.data('Location tracking stopped');
        }
    }

    /**
     * Maneja actualizaciones de ubicación
     * 
     * @private
     * @param {GeolocationPosition} position - Nueva posición
     */
    handleLocationUpdate(position) {
        const previousPosition = this.currentPosition;
        this.currentPosition = position;
        this.lastKnownPosition = position;

        const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
        };

        Logger.data('Location updated:', locationData);

        // Verificar proximidad a destinos del viaje
        this.checkDestinationProximity(position);

        // Llamar callback de actualización
        if (this.onLocationUpdate) {
            this.onLocationUpdate(position, previousPosition);
        }

        // Guardar en localStorage para persistencia
        this.saveLocationToStorage(position);
    }

    /**
     * Maneja errores de geolocalización
     * 
     * @private
     * @param {GeolocationPositionError} error - Error de geolocalización
     */
    handleLocationError(error) {
        let errorMessage = 'Error de geolocalización desconocido';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Permisos de geolocalización denegados';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Ubicación no disponible';
                break;
            case error.TIMEOUT:
                errorMessage = 'Tiempo de espera agotado para obtener ubicación';
                break;
        }

        Logger.error('Geolocation error:', {
            code: error.code,
            message: errorMessage
        });

        if (this.onLocationError) {
            this.onLocationError(error);
        }
    }

    /**
     * Verifica proximidad a destinos del viaje
     * 
     * @private
     * @param {GeolocationPosition} position - Posición actual
     */
    checkDestinationProximity(position) {
        if (!tripConfig.itineraryData || !Array.isArray(tripConfig.itineraryData)) {
            return;
        }

        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;

        // Verificar cada día del itinerario
        tripConfig.itineraryData.forEach(day => {
            if (day.coordinates) {
                const distance = this.calculateDistance(
                    currentLat, currentLng,
                    day.coordinates.lat, day.coordinates.lng
                );

                if (distance <= this.arrivalThreshold) {
                    Logger.success(`Arrived at destination: ${day.location}`, {
                        distance: Math.round(distance),
                        day: day.day
                    });

                    this.handleDestinationReached(day, distance);
                }
            }
        });

        // Verificar lugares específicos por día
        if (tripConfig.placesByDay) {
            Object.entries(tripConfig.placesByDay).forEach(([dayId, places]) => {
                places.forEach(place => {
                    if (place.coordinates) {
                        const distance = this.calculateDistance(
                            currentLat, currentLng,
                            place.coordinates.lat, place.coordinates.lng
                        );

                        if (distance <= this.arrivalThreshold) {
                            Logger.success(`Arrived at place: ${place.name}`, {
                                distance: Math.round(distance),
                                dayId
                            });

                            this.handlePlaceReached(place, dayId, distance);
                        }
                    }
                });
            });
        }
    }

    /**
     * Maneja llegada a un destino del itinerario
     * 
     * @private
     * @param {Object} day - Día del itinerario
     * @param {number} distance - Distancia al destino
     */
    handleDestinationReached(day, distance) {
        // Mostrar notificación
        if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('¡Has llegado!', {
                    body: `Bienvenido a ${day.location}. Día ${day.day} de tu viaje.`,
                    icon: '/assets/icon-192x192.png',
                    tag: `arrival-${day.id}`,
                    data: {
                        dayId: day.id,
                        location: day.location,
                        distance: Math.round(distance)
                    },
                    actions: [
                        { action: 'view-day', title: 'Ver Itinerario' },
                        { action: 'dismiss', title: 'Cerrar' }
                    ]
                });
            });
        }

        // Llamar callback personalizado
        if (this.onDestinationReached) {
            this.onDestinationReached(day, distance);
        }

        // Guardar llegada en localStorage
        this.saveArrivalToStorage(day, distance);
    }

    /**
     * Maneja llegada a un lugar específico
     * 
     * @private
     * @param {Object} place - Lugar visitado
     * @param {string} dayId - ID del día
     * @param {number} distance - Distancia al lugar
     */
    handlePlaceReached(place, dayId, distance) {
        Logger.data(`Reached place: ${place.name} on day ${dayId}`);
        
        // Mostrar notificación discreta
        if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Lugar de interés cercano', {
                    body: `Estás cerca de ${place.name}`,
                    icon: '/assets/icon-192x192.png',
                    tag: `place-${place.name.replace(/\s+/g, '-')}`,
                    silent: true,
                    data: {
                        placeName: place.name,
                        dayId,
                        distance: Math.round(distance)
                    }
                });
            });
        }
    }

    /**
     * Calcula la distancia entre dos puntos geográficos
     * 
     * @param {number} lat1 - Latitud del primer punto
     * @param {number} lng1 - Longitud del primer punto
     * @param {number} lat2 - Latitud del segundo punto
     * @param {number} lng2 - Longitud del segundo punto
     * @returns {number} Distancia en metros
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // Radio de la Tierra en metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Obtiene la distancia a un destino específico
     * 
     * @param {number} destLat - Latitud del destino
     * @param {number} destLng - Longitud del destino
     * @returns {number|null} Distancia en metros o null si no hay ubicación actual
     */
    getDistanceToDestination(destLat, destLng) {
        if (!this.currentPosition && !this.lastKnownPosition) {
            return null;
        }

        const position = this.currentPosition || this.lastKnownPosition;
        return this.calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            destLat,
            destLng
        );
    }

    /**
     * Obtiene todas las distancias a los destinos del itinerario
     * 
     * @returns {Array} Array de objetos con destino y distancia
     */
    getDistancesToAllDestinations() {
        if (!this.currentPosition && !this.lastKnownPosition) {
            return [];
        }

        if (!tripConfig.itineraryData) {
            return [];
        }

        const position = this.currentPosition || this.lastKnownPosition;
        const distances = [];

        tripConfig.itineraryData.forEach(day => {
            if (day.coordinates) {
                const distance = this.calculateDistance(
                    position.coords.latitude,
                    position.coords.longitude,
                    day.coordinates.lat,
                    day.coordinates.lng
                );

                distances.push({
                    day: day.day,
                    location: day.location,
                    distance: Math.round(distance),
                    coordinates: day.coordinates
                });
            }
        });

        // Ordenar por distancia
        return distances.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Guarda la ubicación actual en localStorage
     * 
     * @private
     * @param {GeolocationPosition} position - Posición a guardar
     */
    saveLocationToStorage(position) {
        try {
            const locationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
                savedAt: Date.now()
            };

            localStorage.setItem('lastKnownLocation', JSON.stringify(locationData));
            
            // Mantener historial de ubicaciones (últimas 10)
            const locationHistory = JSON.parse(localStorage.getItem('locationHistory') || '[]');
            locationHistory.unshift(locationData);
            
            if (locationHistory.length > 10) {
                locationHistory.splice(10);
            }
            
            localStorage.setItem('locationHistory', JSON.stringify(locationHistory));
            
        } catch (error) {
            Logger.error('Error saving location to storage:', error);
        }
    }

    /**
     * Guarda información de llegada a destino
     * 
     * @private
     * @param {Object} day - Día del itinerario
     * @param {number} distance - Distancia al llegar
     */
    saveArrivalToStorage(day, distance) {
        try {
            const arrivalData = {
                dayId: day.id,
                location: day.location,
                arrivedAt: Date.now(),
                distance: Math.round(distance)
            };

            const arrivals = JSON.parse(localStorage.getItem('destinationArrivals') || '[]');
            
            // Evitar duplicados (mismo destino en las últimas 2 horas)
            const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
            const existingArrival = arrivals.find(arrival => 
                arrival.dayId === day.id && arrival.arrivedAt > twoHoursAgo
            );

            if (!existingArrival) {
                arrivals.unshift(arrivalData);
                
                // Mantener solo las últimas 20 llegadas
                if (arrivals.length > 20) {
                    arrivals.splice(20);
                }
                
                localStorage.setItem('destinationArrivals', JSON.stringify(arrivals));
                Logger.data('Arrival saved to storage:', arrivalData);
            }
            
        } catch (error) {
            Logger.error('Error saving arrival to storage:', error);
        }
    }

    /**
     * Carga la última ubicación conocida desde localStorage
     * 
     * @returns {Object|null} Datos de ubicación o null si no existe
     */
    loadLastKnownLocation() {
        try {
            const locationData = localStorage.getItem('lastKnownLocation');
            if (locationData) {
                const parsed = JSON.parse(locationData);
                Logger.data('Last known location loaded from storage:', parsed);
                return parsed;
            }
        } catch (error) {
            Logger.error('Error loading last known location:', error);
        }
        return null;
    }

    /**
     * Obtiene el historial de ubicaciones
     * 
     * @returns {Array} Array de ubicaciones históricas
     */
    getLocationHistory() {
        try {
            return JSON.parse(localStorage.getItem('locationHistory') || '[]');
        } catch (error) {
            Logger.error('Error loading location history:', error);
            return [];
        }
    }

    /**
     * Obtiene el historial de llegadas a destinos
     * 
     * @returns {Array} Array de llegadas a destinos
     */
    getArrivalHistory() {
        try {
            return JSON.parse(localStorage.getItem('destinationArrivals') || '[]');
        } catch (error) {
            Logger.error('Error loading arrival history:', error);
            return [];
        }
    }

    /**
     * Limpia todos los datos de geolocalización almacenados
     */
    clearStoredData() {
        try {
            localStorage.removeItem('lastKnownLocation');
            localStorage.removeItem('locationHistory');
            localStorage.removeItem('destinationArrivals');
            Logger.data('Geolocation stored data cleared');
        } catch (error) {
            Logger.error('Error clearing geolocation data:', error);
        }
    }

    /**
     * Obtiene información del estado actual de geolocalización
     * 
     * @returns {Object} Estado actual del sistema de geolocalización
     */
    getStatus() {
        return {
            supported: this.isGeolocationSupported(),
            tracking: this.isTracking,
            hasCurrentPosition: !!this.currentPosition,
            hasLastKnownPosition: !!this.lastKnownPosition,
            watchId: this.watchId,
            options: this.options,
            arrivalThreshold: this.arrivalThreshold
        };
    }

    /**
     * Limpieza de recursos al destruir la instancia
     */
    destroy() {
        this.stopTracking();
        this.currentPosition = null;
        this.lastKnownPosition = null;
        this.onLocationUpdate = null;
        this.onLocationError = null;
        this.onDestinationReached = null;
        
        Logger.data('GeolocationManager destroyed');
    }
}
