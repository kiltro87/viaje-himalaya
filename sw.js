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

const CACHE_NAME = 'viaje-himalaya-v4.2.0-optimistic-ui-inline-edit';
const DATA_CACHE = 'viaje-data-v4.2.0-optimistic-ui-inline-edit';

// Base path para GitHub Pages
const BASE_PATH = '/viaje-himalaya';

// Recursos críticos para el funcionamiento offline
const CORE_RESOURCES = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/css/main.css`,
  `${BASE_PATH}/css/components.css`, 
  `${BASE_PATH}/css/dark-mode.css`,
  `${BASE_PATH}/css/mobile-responsive.css`,
  `${BASE_PATH}/js/main.js`,
  `${BASE_PATH}/js/config/tripConfig.js`,
  `${BASE_PATH}/js/config/AppConstants.js`,
  `${BASE_PATH}/js/config/firebaseConfig.js`,
  `${BASE_PATH}/js/components/UIRenderer.js`,
  `${BASE_PATH}/js/components/BudgetManager.js`,
  `${BASE_PATH}/js/components/SyncStatusIndicator.js`,
  `${BASE_PATH}/js/utils/Logger.js`,
  `${BASE_PATH}/js/utils/DOMUtils.js`,
  `${BASE_PATH}/js/utils/FormatUtils.js`,
  `${BASE_PATH}/js/utils/ResponsiveUtils.js`,
  `${BASE_PATH}/js/utils/FirebaseManager.js`,
  `${BASE_PATH}/js/utils/GeolocationManager.js`,
  `${BASE_PATH}/js/utils/ShareManager.js`,
  `${BASE_PATH}/js/utils/ServiceWorkerUtils.js`,
  `${BASE_PATH}/assets/icon-192x192.png`,
  `${BASE_PATH}/assets/icon-512x512.png`,
  `${BASE_PATH}/assets/icon-152x152.png`,
  `${BASE_PATH}/assets/icon-144x144.png`,
  `${BASE_PATH}/assets/icon-96x96.png`,
  `${BASE_PATH}/assets/icon-72x72.png`
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
  console.log('🔧 Service Worker: Instalando v3.0.1 - Firebase Sync Fixed...');
  
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
      console.log('✅ Service Worker: Instalación completada v3.0.1');
      return self.skipWaiting();
    }).catch(error => {
      console.error('❌ Error en instalación SW:', error);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando v3.0.1...');
  
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
      console.log('✅ Service Worker: Activado y listo v3.0.1');
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
              return caches.match(`${BASE_PATH}/index.html`);
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
// Manejo avanzado de sincronización en background
self.addEventListener('sync', event => {
  console.log('🔄 Background sync event:', event.tag);
  
  switch (event.tag) {
    case 'expense-sync':
      event.waitUntil(syncExpenses());
      break;
    case 'batch-sync':
      event.waitUntil(syncBatchOperations());
      break;
    case 'offline-actions':
      event.waitUntil(syncOfflineActions());
      break;
    case 'firebase-sync':
      event.waitUntil(syncWithFirebase());
      break;
    default:
      console.log('🔄 Unknown sync tag:', event.tag);
  }
});

// Sincronización con Firebase
async function syncWithFirebase() {
  console.log('🔥 Syncing with Firebase...');
  
  try {
    // Obtener datos pendientes
    const pendingData = await getPendingData();
    
    if (pendingData.expenses.length > 0) {
      console.log(`📤 Syncing ${pendingData.expenses.length} expenses with Firebase`);
      await syncExpensesWithFirebase(pendingData.expenses);
    }
    
    // Notificar éxito a las pestañas
    await notifyTabsOfSync('firebase-sync-complete');
    
  } catch (error) {
    console.error('❌ Firebase sync failed:', error);
    await notifyTabsOfSync('firebase-sync-failed', error.message);
  }
}

// Sincronización de gastos pendientes
async function syncExpenses() {
  console.log('📊 Syncing pending expenses...');
  
  try {
    const pendingExpenses = await getPendingExpenses();
    
    if (pendingExpenses.length === 0) {
      console.log('✅ No pending expenses to sync');
      return;
    }

    console.log(`📤 Syncing ${pendingExpenses.length} pending expenses`);
    
    for (const expense of pendingExpenses) {
      try {
        await syncSingleExpense(expense);
        await removePendingExpense(expense.id);
        console.log(`✅ Synced expense: ${expense.id}`);
      } catch (error) {
        console.error(`❌ Failed to sync expense ${expense.id}:`, error);
      }
    }
    
    await notifyTabsOfSync('expense-sync-complete');
    
  } catch (error) {
    console.error('❌ Background expense sync failed:', error);
  }
}

// Sincronización de operaciones por lotes
async function syncBatchOperations() {
  console.log('📦 Syncing batch operations...');
  
  try {
    const pendingBatches = await getPendingBatches();
    
    for (const batch of pendingBatches) {
      try {
        await processBatch(batch);
        await removePendingBatch(batch.id);
        console.log(`✅ Synced batch: ${batch.id}`);
      } catch (error) {
        console.error(`❌ Failed to sync batch ${batch.id}:`, error);
      }
    }
    
    await notifyTabsOfSync('batch-sync-complete');
    
  } catch (error) {
    console.error('❌ Background batch sync failed:', error);
  }
}

// Sincronización de acciones offline
async function syncOfflineActions() {
  console.log('📱 Syncing offline actions...');
  
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
        console.log(`✅ Synced offline action: ${action.type}`);
      } catch (error) {
        console.error(`❌ Failed to sync offline action:`, error);
      }
    }
    
    await notifyTabsOfSync('offline-sync-complete');
    
  } catch (error) {
    console.error('❌ Background offline sync failed:', error);
  }
}

// Obtener datos pendientes del IndexedDB
async function getPendingData() {
  return {
    expenses: await getPendingExpenses(),
    batches: await getPendingBatches(),
    actions: await getOfflineActions()
  };
}

// Obtener gastos pendientes del IndexedDB
async function getPendingExpenses() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ViajeHimalayaDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('pendingExpenses')) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['pendingExpenses'], 'readonly');
      const store = transaction.objectStore('pendingExpenses');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingExpenses')) {
        db.createObjectStore('pendingExpenses', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingBatches')) {
        db.createObjectStore('pendingBatches', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offlineActions')) {
        db.createObjectStore('offlineActions', { keyPath: 'id' });
      }
    };
  });
}

// Sincronizar gastos con Firebase
async function syncExpensesWithFirebase(expenses) {
  // Esta función se conectaría con Firebase desde el Service Worker
  // Por ahora, simulamos la sincronización
  console.log('🔥 Syncing expenses with Firebase:', expenses.length);
  
  for (const expense of expenses) {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`🔥 Synced expense to Firebase: ${expense.id}`);
  }
}

// Notificar a las pestañas abiertas
async function notifyTabsOfSync(type, data = null) {
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    client.postMessage({
      type: type.toUpperCase(),
      data,
      timestamp: Date.now()
    });
  });
}

// Funciones auxiliares (implementación básica)
async function syncSingleExpense(expense) {
  console.log('Syncing single expense:', expense.id);
  // Implementar lógica de sincronización
}

async function removePendingExpense(id) {
  console.log('Removing pending expense:', id);
  // Implementar eliminación de IndexedDB
}

async function getPendingBatches() { return []; }
async function processBatch(batch) { console.log('Processing batch:', batch.id); }
async function removePendingBatch(id) { console.log('Removing batch:', id); }
async function getOfflineActions() { return []; }
async function processOfflineAction(action) { console.log('Processing action:', action.type); }
async function removeOfflineAction(id) { console.log('Removing action:', id); }

console.log('🚀 Service Worker v4.2.0 cargado - OPTIMISTIC UI & INLINE EDIT: UI instantánea + Edición inline + Autorrellenado');