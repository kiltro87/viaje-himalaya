/**
 * OfflineMapUI - Interfaz de Usuario para Mapas Offline
 * 
 * Proporciona una interfaz completa para gestionar la descarga
 * y visualización de mapas offline.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from '../utils/Logger.js';
import { OfflineMapManager } from '../utils/OfflineMapManager.js';
import { GeolocationManager } from '../utils/GeolocationManager.js';

export class OfflineMapUI {
    constructor() {
        this.mapManager = new OfflineMapManager();
        this.geoManager = new GeolocationManager();
        this.currentMap = null;
        
        // Configurar callbacks del map manager
        this.mapManager.onProgressUpdate = (progress) => this.updateDownloadProgress(progress);
        this.mapManager.onDownloadComplete = (result) => this.onDownloadComplete(result);
        this.mapManager.onError = (error) => this.onDownloadError(error);
        
        Logger.init('OfflineMapUI initialized');
    }

    /**
     * Renderiza la interfaz principal de mapas offline
     */
    renderOfflineMapInterface() {
        return `
            <div class="offline-maps-container">
                <!-- Header -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-2xl text-blue-600">map</span>
                            <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-200">Mapas Offline</h2>
                        </div>
                        <button id="refresh-map-status" class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-600">
                            <span class="material-symbols-outlined text-lg">refresh</span>
                            <span class="font-medium">Actualizar</span>
                        </button>
                    </div>
                    
                    <p class="text-slate-600 dark:text-slate-400 text-sm">
                        Descarga mapas para usar sin conexión durante tu viaje. Los mapas se almacenan localmente en tu dispositivo.
                    </p>
                </div>

                <!-- Estado del almacenamiento -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-6">
                    <h3 class="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Estado del Almacenamiento</h3>
                    <div id="storage-info" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600" id="storage-used">--</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Usado</div>
                        </div>
                        <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div class="text-2xl font-bold text-green-600" id="storage-available">--</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Disponible</div>
                        </div>
                        <div class="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div class="text-2xl font-bold text-purple-600" id="regions-downloaded">--</div>
                            <div class="text-sm text-slate-600 dark:text-slate-400">Regiones</div>
                        </div>
                    </div>
                </div>

                <!-- Regiones disponibles -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-slate-800 dark:text-slate-200">Regiones del Viaje</h3>
                        <button id="download-all-regions" class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm" ${this.mapManager.isDownloading ? 'disabled' : ''}>
                            <span class="material-symbols-outlined text-lg">download</span>
                            <span>Descargar Todo</span>
                        </button>
                    </div>
                    
                    <div id="regions-list" class="space-y-4">
                        ${this.renderRegionsList()}
                    </div>
                </div>

                <!-- Progreso de descarga -->
                <div id="download-progress-container" class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mb-6" style="display: none;">
                    <h3 class="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Descargando Mapas</h3>
                    
                    <div class="mb-4">
                        <div class="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <span id="download-region-name">--</span>
                            <span id="download-percentage">0%</span>
                        </div>
                        <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div id="download-progress-bar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div class="text-sm text-slate-600 dark:text-slate-400">
                        <span id="download-details">Preparando descarga...</span>
                    </div>
                </div>

                <!-- Mapa interactivo -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-slate-800 dark:text-slate-200">Mapa del Viaje</h3>
                        <div class="flex gap-2">
                            <button id="show-current-location" class="flex items-center gap-2 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors duration-200 border border-emerald-200 dark:border-emerald-700">
                                <span class="material-symbols-outlined text-lg">my_location</span>
                                <span class="font-medium">Mi Ubicación</span>
                            </button>
                            <button id="fit-to-route" class="flex items-center gap-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-lg transition-colors duration-200 border border-purple-200 dark:border-purple-700">
                                <span class="material-symbols-outlined text-lg">route</span>
                                <span class="font-medium">Ver Ruta</span>
                            </button>
                        </div>
                    </div>
                    
                    <div id="offline-map" class="w-full h-96 rounded-lg border border-slate-200 dark:border-slate-700"></div>
                </div>

                <!-- Acciones -->
                <div class="bg-white dark:bg-slate-800 radius-card shadow-card border border-slate-200 dark:border-slate-700 p-6 mt-6">
                    <h3 class="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Gestión de Mapas</h3>
                    
                    <div class="flex flex-wrap gap-3">
                        <button id="clear-all-maps" class="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors duration-200 border border-red-200 dark:border-red-700 font-medium">
                            <span class="material-symbols-outlined text-lg">delete_sweep</span>
                            <span>Limpiar Todo</span>
                        </button>
                        <button id="export-map-data" class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-600 font-medium">
                            <span class="material-symbols-outlined text-lg">file_download</span>
                            <span>Exportar Datos</span>
                        </button>
                        <button id="import-map-data" class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-600 font-medium">
                            <span class="material-symbols-outlined text-lg">file_upload</span>
                            <span>Importar Datos</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza la lista de regiones
     */
    renderRegionsList() {
        const status = this.mapManager.getDownloadStatus();
        
        return Object.entries(status).map(([key, region]) => {
            // Iconos específicos por región
            const regionIcons = {
                'nepal': 'landscape',
                'bhutan': 'temple_buddhist', 
                'kathmandu': 'location_city',
                'pokhara': 'water'
            };
            
            const regionIcon = regionIcons[key] || 'map';
            
            return `
            <div class="region-item flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl ${region.downloaded ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} flex items-center justify-center border ${region.downloaded ? 'border-green-200 dark:border-green-700' : 'border-blue-200 dark:border-blue-700'}">
                        <span class="material-symbols-outlined text-xl ${region.downloaded ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}">
                            ${region.downloaded ? 'check_circle' : regionIcon}
                        </span>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-slate-800 dark:text-slate-200">${region.name}</h4>
                        <div class="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">storage</span>
                                ${region.estimatedSize}
                            </span>
                            ${region.downloaded ? '<span class="flex items-center gap-1 text-green-600 dark:text-green-400"><span class="material-symbols-outlined text-xs">check</span>Descargado</span>' : ''}
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    ${region.downloaded ? `
                        <button class="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors duration-200 border border-red-200 dark:border-red-700 delete-region" data-region="${key}">
                            <span class="material-symbols-outlined text-sm">delete</span>
                            <span class="text-sm font-medium">Eliminar</span>
                        </button>
                    ` : `
                        <button class="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm download-region" data-region="${key}" ${this.mapManager.isDownloading ? 'disabled' : ''}>
                            <span class="material-symbols-outlined text-sm">download</span>
                            <span class="text-sm">Descargar</span>
                        </button>
                    `}
                </div>
            </div>
        `;
        }).join('');
    }

    /**
     * Inicializa la interfaz y eventos
     */
    async initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }

        container.innerHTML = this.renderOfflineMapInterface();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Actualizar información inicial
        await this.updateStorageInfo();
        await this.updateRegionsList();
        
        // Inicializar mapa
        await this.initializeMap();
        
        Logger.success('OfflineMapUI initialized successfully');
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Botón de actualizar
        document.getElementById('refresh-map-status')?.addEventListener('click', () => {
            this.updateStorageInfo();
            this.updateRegionsList();
        });

        // Descargar todas las regiones
        document.getElementById('download-all-regions')?.addEventListener('click', () => {
            this.downloadAllRegions();
        });

        // Botones de descarga individual
        document.addEventListener('click', (e) => {
            if (e.target.closest('.download-region')) {
                const regionKey = e.target.closest('.download-region').dataset.region;
                this.downloadRegion(regionKey);
            }
        });

        // Botones de eliminar región
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-region')) {
                const regionKey = e.target.closest('.delete-region').dataset.region;
                this.deleteRegion(regionKey);
            }
        });

        // Limpiar todos los mapas
        document.getElementById('clear-all-maps')?.addEventListener('click', () => {
            this.clearAllMaps();
        });

        // Mostrar ubicación actual
        document.getElementById('show-current-location')?.addEventListener('click', () => {
            this.showCurrentLocation();
        });

        // Ajustar a la ruta
        document.getElementById('fit-to-route')?.addEventListener('click', () => {
            this.fitToRoute();
        });
    }

    /**
     * Inicializa el mapa
     */
    async initializeMap() {
        try {
            // Verificar que Leaflet esté cargado
            if (!window.L) {
                Logger.warning('Leaflet not loaded, loading dynamically...');
                await this.loadLeaflet();
            }

            this.currentMap = this.mapManager.createOfflineMap('offline-map', {
                center: [27.7172, 85.3240], // Katmandú
                zoom: 8
            });

            // Añadir control de ubicación
            this.mapManager.addLocationControl(this.currentMap, this.geoManager);

            Logger.success('Offline map initialized');
        } catch (error) {
            Logger.error('Error initializing map:', error);
        }
    }

    /**
     * Carga Leaflet dinámicamente si no está disponible
     */
    async loadLeaflet() {
        return new Promise((resolve, reject) => {
            // Cargar CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(cssLink);

            // Cargar JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Actualiza información de almacenamiento
     */
    async updateStorageInfo() {
        try {
            const cacheSize = await this.mapManager.getCacheSize();
            const status = this.mapManager.getDownloadStatus();
            
            const downloadedCount = Object.values(status).filter(r => r.downloaded).length;
            const totalCount = Object.keys(status).length;

            document.getElementById('storage-used').textContent = 
                cacheSize ? cacheSize.readable.used : '--';
            document.getElementById('storage-available').textContent = 
                cacheSize ? cacheSize.readable.available : '--';
            document.getElementById('regions-downloaded').textContent = 
                `${downloadedCount}/${totalCount}`;

        } catch (error) {
            Logger.error('Error updating storage info:', error);
        }
    }

    /**
     * Actualiza la lista de regiones
     */
    async updateRegionsList() {
        const regionsList = document.getElementById('regions-list');
        if (regionsList) {
            regionsList.innerHTML = this.renderRegionsList();
        }
    }

    /**
     * Descarga una región específica
     */
    async downloadRegion(regionKey) {
        try {
            this.showDownloadProgress(true);
            await this.mapManager.downloadRegion(regionKey);
        } catch (error) {
            Logger.error(`Error downloading region ${regionKey}:`, error);
            alert(`Error descargando región: ${error.message}`);
        } finally {
            this.showDownloadProgress(false);
            await this.updateRegionsList();
            await this.updateStorageInfo();
        }
    }

    /**
     * Descarga todas las regiones
     */
    async downloadAllRegions() {
        try {
            this.showDownloadProgress(true);
            await this.mapManager.downloadAllRegions();
        } catch (error) {
            Logger.error('Error downloading all regions:', error);
            alert(`Error descargando regiones: ${error.message}`);
        } finally {
            this.showDownloadProgress(false);
            await this.updateRegionsList();
            await this.updateStorageInfo();
        }
    }

    /**
     * Elimina una región
     */
    async deleteRegion(regionKey) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta región?')) {
            return;
        }

        try {
            await this.mapManager.deleteRegion(regionKey);
            await this.updateRegionsList();
            await this.updateStorageInfo();
        } catch (error) {
            Logger.error(`Error deleting region ${regionKey}:`, error);
            alert(`Error eliminando región: ${error.message}`);
        }
    }

    /**
     * Limpia todos los mapas
     */
    async clearAllMaps() {
        if (!confirm('¿Estás seguro de que quieres eliminar todos los mapas offline?')) {
            return;
        }

        try {
            await this.mapManager.clearAllMaps();
            await this.updateRegionsList();
            await this.updateStorageInfo();
        } catch (error) {
            Logger.error('Error clearing all maps:', error);
            alert(`Error limpiando mapas: ${error.message}`);
        }
    }

    /**
     * Muestra/oculta el progreso de descarga
     */
    showDownloadProgress(show) {
        const container = document.getElementById('download-progress-container');
        if (container) {
            container.style.display = show ? 'block' : 'none';
        }

        // Deshabilitar botones durante descarga
        const downloadButtons = document.querySelectorAll('.download-region, #download-all-regions');
        downloadButtons.forEach(btn => {
            btn.disabled = show;
        });
    }

    /**
     * Actualiza el progreso de descarga
     */
    updateDownloadProgress(progress) {
        const regionName = document.getElementById('download-region-name');
        const percentage = document.getElementById('download-percentage');
        const progressBar = document.getElementById('download-progress-bar');
        const details = document.getElementById('download-details');

        if (regionName) regionName.textContent = this.mapManager.travelRegions[progress.region]?.name || progress.region;
        if (percentage) percentage.textContent = `${Math.round(progress.progress)}%`;
        if (progressBar) progressBar.style.width = `${progress.progress}%`;
        if (details) {
            details.textContent = `${progress.downloaded}/${progress.total} tiles (Zoom ${progress.zoom})`;
        }
    }

    /**
     * Maneja la finalización de descarga
     */
    onDownloadComplete(result) {
        Logger.success('Download completed:', result);
        
        // Mostrar notificación
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Descarga completada', {
                body: `Mapas de ${this.mapManager.travelRegions[result.region]?.name} descargados`,
                icon: '/assets/icon-192x192.png'
            });
        }
    }

    /**
     * Maneja errores de descarga
     */
    onDownloadError(error) {
        Logger.error('Download error:', error);
        alert(`Error en la descarga: ${error.message}`);
    }

    /**
     * Muestra la ubicación actual en el mapa
     */
    async showCurrentLocation() {
        if (!this.currentMap) return;

        try {
            const position = await this.geoManager.getCurrentPosition();
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            this.currentMap.setView([lat, lng], 15);

            // Añadir marcador de ubicación actual
            if (this.currentMap.currentLocationMarker) {
                this.currentMap.removeLayer(this.currentMap.currentLocationMarker);
            }

            this.currentMap.currentLocationMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'current-location-marker',
                    html: '<div style="background: #3b82f6; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(this.currentMap);

        } catch (error) {
            Logger.error('Error getting current location:', error);
            alert('No se pudo obtener la ubicación actual');
        }
    }

    /**
     * Ajusta el mapa para mostrar toda la ruta
     */
    fitToRoute() {
        if (!this.currentMap) return;

        // Crear bounds que incluyan todos los puntos del viaje
        const group = new L.featureGroup();
        
        // Añadir todos los marcadores al grupo
        this.currentMap.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                group.addLayer(layer);
            }
        });

        if (group.getLayers().length > 0) {
            this.currentMap.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
    }
}
