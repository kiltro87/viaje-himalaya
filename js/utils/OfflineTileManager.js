/**
 * 🗺️ OFFLINE TILE MANAGER - DESCARGA AUTOMÁTICA DE MAPAS
 * 
 * Gestiona la descarga automática de tiles de mapas para las regiones del itinerario
 * Permite navegación offline completa con mapas precargados
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { tripConfig } from '../config/tripConfig.js';

export class OfflineTileManager {
    constructor() {
        this.dbName = 'ViajeHimalayaTiles';
        this.dbVersion = 1;
        this.db = null;
        this.downloadQueue = [];
        this.isDownloading = false;
        this.downloadProgress = 0;
        
        // Configuración de tiles
        this.tileConfig = {
            baseUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains: ['a', 'b', 'c'],
            maxZoom: 16,
            minZoom: 8,
            attribution: '© OpenStreetMap contributors'
        };
        
        this.init();
    }
    
    async init() {
        try {
            await this.initDB();
            await this.loadItineraryRegions();
            Logger.success('OfflineTileManager initialized');
        } catch (error) {
            Logger.error('Failed to initialize OfflineTileManager', error);
        }
    }
    
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store para tiles
                if (!db.objectStoreNames.contains('tiles')) {
                    const tileStore = db.createObjectStore('tiles', { keyPath: 'key' });
                    tileStore.createIndex('region', 'region', { unique: false });
                    tileStore.createIndex('zoom', 'zoom', { unique: false });
                }
                
                // Store para metadatos de regiones
                if (!db.objectStoreNames.contains('regions')) {
                    db.createObjectStore('regions', { keyPath: 'name' });
                }
            };
        });
    }
    
    async loadItineraryRegions() {
        const regions = this.extractRegionsFromItinerary();
        
        for (const region of regions) {
            await this.saveRegionMetadata(region);
            this.queueRegionDownload(region);
        }
        
        // Iniciar descarga automática si hay conexión
        if (navigator.onLine) {
            this.startDownloadQueue();
        }
    }
    
    extractRegionsFromItinerary() {
        const regions = [];
        const processedLocations = new Set();
        
        tripConfig.itineraryData.forEach(day => {
            if (day.coords && !processedLocations.has(day.location)) {
                const region = {
                    name: day.location,
                    country: day.country,
                    center: day.coords,
                    bounds: this.calculateRegionBounds(day.coords),
                    places: day.places || []
                };
                
                regions.push(region);
                processedLocations.add(day.location);
            }
        });
        
        return regions;
    }
    
    calculateRegionBounds(center, radiusKm = 10) {
        const [lat, lng] = center;
        const latDelta = radiusKm / 111; // Aproximadamente 111km por grado
        const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
        
        return {
            north: lat + latDelta,
            south: lat - latDelta,
            east: lng + lngDelta,
            west: lng - lngDelta
        };
    }
    
    async saveRegionMetadata(region) {
        const transaction = this.db.transaction(['regions'], 'readwrite');
        const store = transaction.objectStore('regions');
        
        const metadata = {
            ...region,
            downloadedAt: null,
            tileCount: 0,
            downloadProgress: 0
        };
        
        await store.put(metadata);
    }
    
    queueRegionDownload(region) {
        const tiles = this.generateTileList(region);
        
        tiles.forEach(tile => {
            this.downloadQueue.push({
                ...tile,
                region: region.name,
                priority: this.calculateTilePriority(tile, region)
            });
        });
        
        // Ordenar por prioridad
        this.downloadQueue.sort((a, b) => b.priority - a.priority);
    }
    
    generateTileList(region) {
        const tiles = [];
        const bounds = region.bounds;
        
        for (let zoom = this.tileConfig.minZoom; zoom <= this.tileConfig.maxZoom; zoom++) {
            const tileCoords = this.getBoundingTiles(bounds, zoom);
            
            for (let x = tileCoords.minX; x <= tileCoords.maxX; x++) {
                for (let y = tileCoords.minY; y <= tileCoords.maxY; y++) {
                    tiles.push({
                        x, y, zoom,
                        key: `${zoom}/${x}/${y}`,
                        url: this.getTileUrl(x, y, zoom)
                    });
                }
            }
        }
        
        return tiles;
    }
    
    getBoundingTiles(bounds, zoom) {
        const scale = Math.pow(2, zoom);
        
        return {
            minX: Math.floor((bounds.west + 180) / 360 * scale),
            maxX: Math.floor((bounds.east + 180) / 360 * scale),
            minY: Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * scale),
            maxY: Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * scale)
        };
    }
    
    getTileUrl(x, y, zoom) {
        const subdomain = this.tileConfig.subdomains[Math.abs(x + y) % this.tileConfig.subdomains.length];
        return this.tileConfig.baseUrl
            .replace('{s}', subdomain)
            .replace('{z}', zoom)
            .replace('{x}', x)
            .replace('{y}', y);
    }
    
    calculateTilePriority(tile, region) {
        let priority = 1;
        
        // Mayor prioridad para zooms medios (más útiles)
        if (tile.zoom >= 12 && tile.zoom <= 14) priority += 2;
        
        // Mayor prioridad para tiles cerca del centro
        const centerTile = this.latLngToTile(region.center[0], region.center[1], tile.zoom);
        const distance = Math.abs(tile.x - centerTile.x) + Math.abs(tile.y - centerTile.y);
        priority += Math.max(0, 5 - distance);
        
        return priority;
    }
    
    latLngToTile(lat, lng, zoom) {
        const scale = Math.pow(2, zoom);
        return {
            x: Math.floor((lng + 180) / 360 * scale),
            y: Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale)
        };
    }
    
    async startDownloadQueue() {
        if (this.isDownloading || this.downloadQueue.length === 0) return;
        
        this.isDownloading = true;
        const totalTiles = this.downloadQueue.length;
        let downloadedCount = 0;
        
        Logger.info(`Starting tile download: ${totalTiles} tiles queued`);
        
        while (this.downloadQueue.length > 0 && navigator.onLine) {
            const tile = this.downloadQueue.shift();
            
            try {
                await this.downloadTile(tile);
                downloadedCount++;
                this.downloadProgress = (downloadedCount / totalTiles) * 100;
                
                // Notificar progreso cada 10%
                if (downloadedCount % Math.ceil(totalTiles / 10) === 0) {
                    Logger.info(`Tile download progress: ${Math.round(this.downloadProgress)}%`);
                }
                
                // Pausa pequeña para no saturar la red
                await this.sleep(50);
                
            } catch (error) {
                Logger.warn(`Failed to download tile ${tile.key}`, error);
                // Reintentarlo más tarde con menor prioridad
                tile.priority -= 1;
                if (tile.priority > 0) {
                    this.downloadQueue.push(tile);
                }
            }
        }
        
        this.isDownloading = false;
        Logger.success(`Tile download completed: ${downloadedCount}/${totalTiles} tiles`);
    }
    
    async downloadTile(tile) {
        // Verificar si ya existe
        const existing = await this.getTileFromDB(tile.key);
        if (existing) return;
        
        const response = await fetch(tile.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        await this.saveTileToDB({
            key: tile.key,
            x: tile.x,
            y: tile.y,
            zoom: tile.zoom,
            region: tile.region,
            data: arrayBuffer,
            downloadedAt: Date.now()
        });
    }
    
    async getTileFromDB(key) {
        const transaction = this.db.transaction(['tiles'], 'readonly');
        const store = transaction.objectStore('tiles');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveTileToDB(tile) {
        const transaction = this.db.transaction(['tiles'], 'readwrite');
        const store = transaction.objectStore('tiles');
        
        return new Promise((resolve, reject) => {
            const request = store.put(tile);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // API pública
    
    /**
     * Obtiene un tile desde la base de datos local
     */
    async getOfflineTile(z, x, y) {
        const key = `${z}/${x}/${y}`;
        const tile = await this.getTileFromDB(key);
        
        if (tile) {
            const blob = new Blob([tile.data], { type: 'image/png' });
            return URL.createObjectURL(blob);
        }
        
        return null;
    }
    
    /**
     * Verifica si una región está disponible offline
     */
    async isRegionAvailable(regionName) {
        const transaction = this.db.transaction(['regions'], 'readonly');
        const store = transaction.objectStore('regions');
        
        return new Promise((resolve) => {
            const request = store.get(regionName);
            request.onsuccess = () => {
                const region = request.result;
                resolve(region && region.downloadProgress > 80);
            };
            request.onerror = () => resolve(false);
        });
    }
    
    /**
     * Obtiene estadísticas de descarga
     */
    getDownloadStats() {
        return {
            isDownloading: this.isDownloading,
            progress: this.downloadProgress,
            queueLength: this.downloadQueue.length
        };
    }
    
    /**
     * Pausa/reanuda la descarga
     */
    toggleDownload() {
        if (this.isDownloading) {
            this.isDownloading = false;
            Logger.info('Tile download paused');
        } else {
            this.startDownloadQueue();
        }
    }
}

// Exportar instancia singleton
export const offlineTileManager = new OfflineTileManager();
export default offlineTileManager;
