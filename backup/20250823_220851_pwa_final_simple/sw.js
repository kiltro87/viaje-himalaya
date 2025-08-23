/**
 * Service Worker - PWA Viaje Himalaya
 * 
 * Proporciona funcionalidad offline completa, cache inteligente,
 * notificaciones push, sincronización en background y gestión
 * de mapas offline para la aplicación de viaje.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

const CACHE_NAME = 'viaje-himalaya-v2.0.0';
const OFFLINE_CACHE = 'viaje-offline-v2.0.0';
const MAPS_CACHE = 'viaje-maps-v2.0.0';
const DATA_CACHE = 'viaje-data-v2.0.0';

// Recursos críticos para el funcionamiento offline
const CORE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/components.css', 
  '/css/dark-mode.css',
  '/js/main.js',
  '/js/config/tripConfig.js',
  '/js/config/AppConstants.js',
  '/js/components/UIRenderer.js',
  '/js/components/BudgetManager.js',
  '/js/utils/Logger.js',
  '/js/utils/DOMUtils.js',
  '/js/utils/FormatUtils.js',
  '/js/utils/ResponsiveUtils.js',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// URLs de mapas para cache offline
const MAP_TILE_PATTERNS = [
  /^https:\/\/.*\.basemaps\.cartocdn\.com\/rastertiles\/voyager\/.*$/,
  /^https:\/\/.*\.openstreetmap\.org\/.*$/,
  /^https:\/\/.*\.tile\.openstreetmap\.org\/.*$/
];

/**
 * Evento de instalación del Service Worker
 */
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('📦 Cacheando recursos críticos...');
        return cache.addAll(CORE_RESOURCES.map(url => new Request(url, {
          cache: 'reload'
        })));
      }),
      
      caches.open(DATA_CACHE).then(cache => {
        console.log('💾 Inicializando cache de datos...');
        return cache.put('/api/offline-status', new Response(JSON.stringify({
          offline: true,
          timestamp: Date.now(),
          version: CACHE_NAME
        })));
      })
    ]).then(() => {
      console.log('✅ Service Worker: Instalación completada');
      return self.skipWaiting();
    })
  );
});

/**
 * Evento de activación del Service Worker
 */
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== OFFLINE_CACHE && 
                cacheName !== MAPS_CACHE && 
                cacheName !== DATA_CACHE) {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      self.clients.claim(),
      scheduleFlightNotifications(),
      initializeBudgetAlerts()
    ]).then(() => {
      console.log('✅ Service Worker: Activación completada');
    })
  );
});

/**
 * Interceptor de requests - Estrategia de cache inteligente
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method === 'GET') {
    if (isMapTileRequest(url)) {
      event.respondWith(handleMapTileRequest(request));
    } else if (isCoreResource(url)) {
      event.respondWith(handleCoreResourceRequest(request));
    } else if (isDataRequest(url)) {
      event.respondWith(handleDataRequest(request));
    } else if (isExternalResource(url)) {
      event.respondWith(handleExternalResourceRequest(request));
    }
  }
});

console.log('🚀 Service Worker cargado - Viaje Himalaya v2.0.0');