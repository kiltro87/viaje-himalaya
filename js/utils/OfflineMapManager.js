/**
 * OfflineMapManager - Gestor de Mapas Offline
 * 
 * Maneja la descarga, almacenamiento y visualización de mapas offline
 * para uso sin conexión durante el viaje.
 * 
 * Funcionalidades principales:
 * - Descarga inteligente de tiles de mapas por regiones
 * - Cache persistente de tiles con gestión de espacio
 * - Visualización de mapas offline con Leaflet
 * - Gestión de POIs (puntos de interés) offline
 * - Indicador de ubicación actual sin GPS
 * - Estimación de tamaño de descarga
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { tripConfig } from '../config/tripConfig.js';

export class OfflineMapManager {
    constructor() {
        this.cacheName = 'offline-maps-v1.0.0';
        this.isDownloading = false;
        this.downloadProgress = 0;
        this.downloadedRegions = new Set();
        this.maxZoomLevel = 16;
        this.minZoomLevel = 6;
        
        // Regiones predefinidas del viaje
        this.travelRegions = {
            nepal: {
                name: 'Nepal',
                bounds: {
                    north: 30.4,
                    south: 26.3,
                    east: 88.2,
                    west: 80.0
                },
                priority: 1,
                estimatedSize: '45 MB'
            },
            bhutan: {
                name: 'Bután',
                bounds: {
                    north: 28.4,
                    south: 26.7,
                    east: 92.1,
                    west: 88.7
                },
                priority: 2,
                estimatedSize: '25 MB'
            },
            kathmandu: {
                name: 'Katmandú (detalle)',
                bounds: {
                    north: 27.8,
                    south: 27.6,
                    east: 85.4,
                    west: 85.2
                },
                priority: 3,
                estimatedSize: '8 MB',
                maxZoom: 18
            },
            pokhara: {
                name: 'Pokhara (detalle)',
                bounds: {
                    north: 28.3,
                    south: 28.1,
                    east: 84.1,
                    west: 83.9
                },
                priority: 4,
                estimatedSize: '6 MB',
                maxZoom: 18
            }
        };
        
        // Proveedores de tiles
        this.tileProviders = {
            osm: {
                name: 'OpenStreetMap',
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors',
                subdomains: ['a', 'b', 'c']
            },
            carto: {
                name: 'CartoDB Voyager',
                url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                attribution: '© CARTO © OpenStreetMap contributors',
                subdomains: ['a', 'b', 'c', 'd']
            }
        };
        
        this.currentProvider = 'carto';
        this.onProgressUpdate = null;
        this.onDownloadComplete = null;
        this.onError = null;
        
        Logger.init('OfflineMapManager initialized');
        this.loadDownloadedRegions();
    }

    /**
     * Estima el tamaño de descarga para una región
     */
    estimateDownloadSize(regionKey, maxZoom = null) {
        const region = this.travelRegions[regionKey];
        if (!region) return null;

        const bounds = region.bounds;
        const maxZ = maxZoom || region.maxZoom || this.maxZoomLevel;
        let totalTiles = 0;

        for (let z = this.minZoomLevel; z <= maxZ; z++) {
            const tiles = this.calculateTilesInBounds(bounds, z);
            totalTiles += tiles.length;
        }

        // Estimación: ~15KB promedio por tile
        const estimatedBytes = totalTiles * 15 * 1024;
        return {
            tiles: totalTiles,
            bytes: estimatedBytes,
            readable: this.formatBytes(estimatedBytes)
        };
    }

    /**
     * Calcula tiles necesarios para una región y zoom
     */
    calculateTilesInBounds(bounds, zoom) {
        const tiles = [];
        
        const minTileX = Math.floor(this.lon2tile(bounds.west, zoom));
        const maxTileX = Math.floor(this.lon2tile(bounds.east, zoom));
        const minTileY = Math.floor(this.lat2tile(bounds.north, zoom));
        const maxTileY = Math.floor(this.lat2tile(bounds.south, zoom));

        for (let x = minTileX; x <= maxTileX; x++) {
            for (let y = minTileY; y <= maxTileY; y++) {
                tiles.push({ x, y, z: zoom });
            }
        }

        return tiles;
    }

    /**
     * Convierte longitud a número de tile
     */
    lon2tile(lon, zoom) {
        return ((lon + 180) / 360) * Math.pow(2, zoom);
    }

    /**
     * Convierte latitud a número de tile
     */
    lat2tile(lat, zoom) {
        return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
    }

    /**
     * Descarga mapas para una región específica
     */
    async downloadRegion(regionKey, options = {}) {
        if (this.isDownloading) {
            throw new Error('Ya hay una descarga en progreso');
        }

        const region = this.travelRegions[regionKey];
        if (!region) {
            throw new Error(`Región ${regionKey} no encontrada`);
        }

        this.isDownloading = true;
        this.downloadProgress = 0;

        try {
            Logger.init(`Iniciando descarga de mapas para ${region.name}`);
            
            const maxZoom = options.maxZoom || region.maxZoom || this.maxZoomLevel;
            const provider = this.tileProviders[this.currentProvider];
            const cache = await caches.open(this.cacheName);
            
            let totalTiles = 0;
            let downloadedTiles = 0;
            
            // Calcular total de tiles
            for (let z = this.minZoomLevel; z <= maxZoom; z++) {
                const tiles = this.calculateTilesInBounds(region.bounds, z);
                totalTiles += tiles.length;
            }

            Logger.data(`Total tiles a descargar: ${totalTiles}`);

            // Descargar por niveles de zoom
            for (let z = this.minZoomLevel; z <= maxZoom; z++) {
                const tiles = this.calculateTilesInBounds(region.bounds, z);
                
                Logger.data(`Descargando zoom ${z}: ${tiles.length} tiles`);

                // Descargar en lotes para no saturar la red
                const batchSize = 10;
                for (let i = 0; i < tiles.length; i += batchSize) {
                    const batch = tiles.slice(i, i + batchSize);
                    
                    await Promise.allSettled(
                        batch.map(async (tile) => {
                            try {
                                const url = this.buildTileUrl(provider, tile);
                                const response = await fetch(url);
                                
                                if (response.ok) {
                                    await cache.put(url, response.clone());
                                    downloadedTiles++;
                                    
                                    this.downloadProgress = (downloadedTiles / totalTiles) * 100;
                                    
                                    if (this.onProgressUpdate) {
                                        this.onProgressUpdate({
                                            region: regionKey,
                                            progress: this.downloadProgress,
                                            downloaded: downloadedTiles,
                                            total: totalTiles,
                                            zoom: z
                                        });
                                    }
                                } else {
                                    Logger.warning(`Failed to download tile: ${url}`);
                                }
                            } catch (error) {
                                Logger.error(`Error downloading tile:`, error);
                            }
                        })
                    );

                    // Pequeña pausa entre lotes
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Marcar región como descargada
            this.downloadedRegions.add(regionKey);
            this.saveDownloadedRegions();

            Logger.success(`Descarga completada para ${region.name}: ${downloadedTiles}/${totalTiles} tiles`);

            if (this.onDownloadComplete) {
                this.onDownloadComplete({
                    region: regionKey,
                    downloaded: downloadedTiles,
                    total: totalTiles,
                    success: true
                });
            }

        } catch (error) {
            Logger.error(`Error descargando región ${regionKey}:`, error);
            
            if (this.onError) {
                this.onError(error);
            }
            
            throw error;
        } finally {
            this.isDownloading = false;
            this.downloadProgress = 0;
        }
    }

    /**
     * Construye URL de tile
     */
    buildTileUrl(provider, tile) {
        const subdomain = provider.subdomains[Math.floor(Math.random() * provider.subdomains.length)];
        return provider.url
            .replace('{s}', subdomain)
            .replace('{z}', tile.z)
            .replace('{x}', tile.x)
            .replace('{y}', tile.y)
            .replace('{r}', ''); // Para retina displays
    }

    /**
     * Descarga todas las regiones del viaje
     */
    async downloadAllRegions(options = {}) {
        const regions = Object.keys(this.travelRegions)
            .sort((a, b) => this.travelRegions[a].priority - this.travelRegions[b].priority);

        for (const regionKey of regions) {
            if (!this.downloadedRegions.has(regionKey)) {
                try {
                    await this.downloadRegion(regionKey, options);
                } catch (error) {
                    Logger.error(`Error descargando región ${regionKey}, continuando...`);
                }
            }
        }
    }

    /**
     * Verifica si una región está descargada
     */
    isRegionDownloaded(regionKey) {
        return this.downloadedRegions.has(regionKey);
    }

    /**
     * Obtiene el estado de descarga de todas las regiones
     */
    getDownloadStatus() {
        const status = {};
        
        for (const [key, region] of Object.entries(this.travelRegions)) {
            status[key] = {
                name: region.name,
                downloaded: this.downloadedRegions.has(key),
                estimatedSize: region.estimatedSize,
                priority: region.priority
            };
        }
        
        return status;
    }

    /**
     * Elimina mapas de una región
     */
    async deleteRegion(regionKey) {
        try {
            const region = this.travelRegions[regionKey];
            if (!region) return;

            const cache = await caches.open(this.cacheName);
            const provider = this.tileProviders[this.currentProvider];
            
            let deletedCount = 0;

            for (let z = this.minZoomLevel; z <= (region.maxZoom || this.maxZoomLevel); z++) {
                const tiles = this.calculateTilesInBounds(region.bounds, z);
                
                for (const tile of tiles) {
                    const url = this.buildTileUrl(provider, tile);
                    const deleted = await cache.delete(url);
                    if (deleted) deletedCount++;
                }
            }

            this.downloadedRegions.delete(regionKey);
            this.saveDownloadedRegions();

            Logger.success(`Región ${region.name} eliminada: ${deletedCount} tiles`);
            return deletedCount;

        } catch (error) {
            Logger.error(`Error eliminando región ${regionKey}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene el tamaño total del cache de mapas
     */
    async getCacheSize() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage,
                    available: estimate.quota,
                    readable: {
                        used: this.formatBytes(estimate.usage),
                        available: this.formatBytes(estimate.quota)
                    }
                };
            }
        } catch (error) {
            Logger.error('Error getting cache size:', error);
        }
        return null;
    }

    /**
     * Limpia todo el cache de mapas
     */
    async clearAllMaps() {
        try {
            await caches.delete(this.cacheName);
            this.downloadedRegions.clear();
            this.saveDownloadedRegions();
            
            Logger.success('Cache de mapas limpiado completamente');
        } catch (error) {
            Logger.error('Error clearing maps cache:', error);
            throw error;
        }
    }

    /**
     * Crea un mapa offline con Leaflet
     */
    createOfflineMap(containerId, options = {}) {
        if (!window.L) {
            throw new Error('Leaflet no está cargado');
        }

        const defaultCenter = options.center || [27.7172, 85.3240]; // Katmandú
        const defaultZoom = options.zoom || 10;

        const map = L.map(containerId, {
            center: defaultCenter,
            zoom: defaultZoom,
            zoomControl: true,
            attributionControl: true
        });

        // Crear capa de tiles offline
        const offlineTileLayer = L.tileLayer(
            this.tileProviders[this.currentProvider].url,
            {
                attribution: this.tileProviders[this.currentProvider].attribution,
                maxZoom: this.maxZoomLevel,
                subdomains: this.tileProviders[this.currentProvider].subdomains
            }
        );

        offlineTileLayer.addTo(map);

        // Añadir marcadores de lugares del viaje
        this.addTravelMarkers(map);

        // Añadir control de capas si se solicita
        if (options.showLayerControl) {
            this.addLayerControl(map);
        }

        Logger.success(`Mapa offline creado en ${containerId}`);
        return map;
    }

    /**
     * Añade marcadores de lugares del viaje
     */
    addTravelMarkers(map) {
        if (!tripConfig.itineraryData) return;

        const markers = [];

        tripConfig.itineraryData.forEach(day => {
            if (day.coordinates) {
                const marker = L.marker([day.coordinates.lat, day.coordinates.lng])
                    .bindPopup(`
                        <div class="font-semibold">${day.location}</div>
                        <div class="text-sm text-gray-600">Día ${day.day}</div>
                        <div class="text-xs">${day.description || ''}</div>
                    `);
                
                markers.push(marker);
                marker.addTo(map);
            }

            // Añadir marcadores de lugares específicos
            if (day.places) {
                day.places.forEach(place => {
                    if (place.coords && place.coords.length === 2) {
                        const placeMarker = L.circleMarker([place.coords[0], place.coords[1]], {
                            radius: 6,
                            fillColor: '#3b82f6',
                            color: '#1e40af',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.8
                        }).bindPopup(`
                            <div class="font-medium">${place.name}</div>
                            <div class="text-xs text-gray-500">Día ${day.day}</div>
                        `);
                        
                        markers.push(placeMarker);
                        placeMarker.addTo(map);
                    }
                });
            }
        });

        return markers;
    }

    /**
     * Añade control de ubicación actual
     */
    addLocationControl(map, geolocationManager) {
        const locationControl = L.control({ position: 'topright' });
        
        locationControl.onAdd = function() {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            
            div.innerHTML = `
                <a href="#" title="Mi ubicación" style="background-color: white; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                    <span class="material-symbols-outlined" style="font-size: 18px;">my_location</span>
                </a>
            `;
            
            div.onclick = async () => {
                try {
                    const position = await geolocationManager.getCurrentPosition();
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    map.setView([lat, lng], 15);
                    
                    // Añadir marcador de ubicación actual
                    if (map.currentLocationMarker) {
                        map.removeLayer(map.currentLocationMarker);
                    }
                    
                    map.currentLocationMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'current-location-marker',
                            html: '<div style="background: #3b82f6; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })
                    }).addTo(map);
                    
                } catch (error) {
                    Logger.error('Error getting current location:', error);
                    alert('No se pudo obtener la ubicación actual');
                }
            };
            
            return div;
        };
        
        locationControl.addTo(map);
        return locationControl;
    }

    /**
     * Guarda regiones descargadas en localStorage
     */
    saveDownloadedRegions() {
        try {
            const regions = Array.from(this.downloadedRegions);
            localStorage.setItem('downloadedMapRegions', JSON.stringify(regions));
        } catch (error) {
            Logger.error('Error saving downloaded regions:', error);
        }
    }

    /**
     * Carga regiones descargadas desde localStorage
     */
    loadDownloadedRegions() {
        try {
            const regions = JSON.parse(localStorage.getItem('downloadedMapRegions') || '[]');
            this.downloadedRegions = new Set(regions);
            Logger.data(`Loaded ${regions.length} downloaded regions`);
        } catch (error) {
            Logger.error('Error loading downloaded regions:', error);
        }
    }

    /**
     * Formatea bytes en formato legible
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Obtiene información del estado actual
     */
    getStatus() {
        return {
            isDownloading: this.isDownloading,
            downloadProgress: this.downloadProgress,
            downloadedRegions: Array.from(this.downloadedRegions),
            totalRegions: Object.keys(this.travelRegions).length,
            currentProvider: this.currentProvider,
            cacheName: this.cacheName
        };
    }
}
