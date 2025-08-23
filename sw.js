/**
 * Service Worker - PWA Viaje Himalaya
 * 
 * Proporciona funcionalidad offline completa, cache inteligente,
 * y gestión de recursos para la aplicación de viaje.
 * 
 * @author David Ferrer Figueroa
 * @version 2.2.1
 * @since 2024
 */

const CACHE_NAME = 'viaje-himalaya-v2.2.1';
const DATA_CACHE = 'viaje-data-v2.2.1';

// Recursos críticos para el funcionamiento offline
const CORE_RESOURCES = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css', 
  './css/dark-mode.css',
  './css/mobile-responsive.css',
  './js/main.js',
  './js/config/tripConfig.js',
  './js/config/AppConstants.js',
  './js/config/firebaseConfig.js',
  './js/components/UIRenderer.js',
  './js/components/BudgetManager.js',
  './js/components/SyncStatusIndicator.js',
  './js/utils/Logger.js',
  './js/utils/DOMUtils.js',
  './js/utils/FormatUtils.js',
  './js/utils/ResponsiveUtils.js',
  './js/utils/FirebaseManager.js',
  './js/utils/GeolocationManager.js',
  './js/utils/ShareManager.js',
  './js/utils/ServiceWorkerUtils.js',
  './assets/icon-192x192.png',
  './assets/icon-512x512.png',
  './assets/icon-152x152.png',
  './assets/icon-144x144.png',
  './assets/icon-96x96.png',
  './assets/icon-72x72.png'
];

// Recursos externos (CDN)
const EXTERNAL_RESOURCES = [
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// ============================================================================
// EVENTOS DEL SERVICE WORKER
// ============================================================================

self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando v2.2.1...');
  
  event.waitUntil(
    Promise.all([
      // Cache recursos críticos
      caches.open(CACHE_NAME).then(cache => {
        console.log('📦 Cacheando recursos críticos...');
        return Promise.allSettled(
          CORE_RESOURCES.map(url => {
            return cache.add(new Request(url, { cache: 'reload' }))
              .catch(error => {
                console.warn('⚠️ No se pudo cachear:', url, error.message);
                return Promise.resolve();
              });
          })
        );
      }),
      
      // Cache recursos externos
      caches.open(CACHE_NAME).then(cache => {
        console.log('🌐 Cacheando recursos externos...');
        return Promise.allSettled(
          EXTERNAL_RESOURCES.map(url => {
            return cache.add(new Request(url, { mode: 'cors' }))
              .catch(error => {
                console.warn('⚠️ No se pudo cachear recurso externo:', url);
                return Promise.resolve();
              });
          })
        );
      }),
      
      // Inicializar cache de datos
      caches.open(DATA_CACHE).then(cache => {
        console.log('💾 Inicializando cache de datos...');
        return cache.put('./api/offline-status', new Response(JSON.stringify({
          offline: true,
          timestamp: Date.now(),
          version: CACHE_NAME,
          installable: true
        })));
      })
      
    ]).then(() => {
      console.log('✅ Service Worker: Instalación completada v2.2.1');
      return self.skipWaiting();
    }).catch(error => {
      console.error('❌ Error en instalación SW:', error);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando v2.2.1...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE) {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar control inmediato
      self.clients.claim()
      
    ]).then(() => {
      console.log('✅ Service Worker: Activado y listo v2.2.1');
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar requests del mismo origen o recursos conocidos
  if (url.origin === location.origin || EXTERNAL_RESOURCES.some(res => request.url.startsWith(res))) {
    
    if (request.method === 'GET') {
      event.respondWith(
        caches.match(request).then(response => {
          if (response) {
            // Servir desde cache
            return response;
          }
          
          // Intentar fetch de red
          return fetch(request).then(networkResponse => {
            // Cachear respuesta exitosa
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          }).catch(error => {
            console.warn('⚠️ Fetch failed para:', request.url);
            
            // Fallback para navegación
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            throw error;
          });
        })
      );
    }
  }
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificaciones push (futuro)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nueva actualización disponible',
      icon: './assets/icon-192x192.png',
      badge: './assets/icon-72x72.png',
      tag: data.tag || 'general',
      requireInteraction: false,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Viaje Himalaya', options)
    );
  }
});

// Sincronización en background (futuro)
self.addEventListener('sync', event => {
  if (event.tag === 'firebase-sync') {
    event.waitUntil(
      // Aquí se podría implementar sincronización con Firebase
      console.log('🔄 Background sync triggered')
    );
  }
});

console.log('📱 Service Worker v2.2.1 cargado y listo');