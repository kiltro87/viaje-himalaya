/**
 * Service Worker - PWA Viaje Himalaya
 * 
 * Proporciona funcionalidad offline completa, cache inteligente,
 * y gestión de recursos para la aplicación de viaje.
 * 
 * @author David Ferrer Figueroa
 * @version 5.0.0
 * @since 2024
 */

const CACHE_NAME = 'viaje-himalaya-v5.0.0-smart-cache';
const DATA_CACHE = 'viaje-data-v5.0.0';
const RUNTIME_CACHE = 'runtime-v5.0.0';

// Base path dinámico según entorno
const isLocalhost = self.location.hostname === 'localhost' || 
                   self.location.hostname === '127.0.0.1' || 
                   self.location.protocol === 'file:';

const BASE_PATH = isLocalhost ? '' : '/viaje-himalaya';

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
  `${BASE_PATH}/js/config/weatherConfig.js`,
  `${BASE_PATH}/js/config/DesignTokens.js`,
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
  `${BASE_PATH}/js/utils/StateManager.js`,
  `${BASE_PATH}/js/utils/DaySimulator.js`,
  `${BASE_PATH}/js/utils/DateUtils.js`,
  `${BASE_PATH}/js/utils/CategoryUtils.js`,
  `${BASE_PATH}/js/utils/PackingListManager.js`,
  `${BASE_PATH}/js/components/renderers/TodayRenderer.js`,
  `${BASE_PATH}/js/components/renderers/PlanningRenderer.js`,
  `${BASE_PATH}/js/components/renderers/TrackingRenderer.js`,
  `${BASE_PATH}/js/components/renderers/ItineraryRenderer.js`,
  `${BASE_PATH}/js/components/renderers/SummaryRenderer.js`,
  `${BASE_PATH}/js/components/renderers/MapRenderer.js`,
  `${BASE_PATH}/js/components/renderers/WeatherRenderer.js`,
  `${BASE_PATH}/js/components/renderers/HeaderRenderer.js`,
  `${BASE_PATH}/assets/icon-192x192.png`,
  `${BASE_PATH}/assets/icon-512x512.png`,
  `${BASE_PATH}/assets/icon-152x152.png`,
  `${BASE_PATH}/assets/icon-144x144.png`,
  `${BASE_PATH}/assets/icon-96x96.png`,
  `${BASE_PATH}/assets/icon-72x72.png`,
  `${BASE_PATH}/assets/icon-32x32.png`
];

// Recursos que se cargan bajo demanda
const LAZY_RESOURCES = [
  `${BASE_PATH}/js/utils/WeatherManager.js`,
  `${BASE_PATH}/js/utils/UIHelpers.js`,
  `${BASE_PATH}/js/utils/RealtimeSync.js`,
  `${BASE_PATH}/js/utils/OptimisticUI.js`,
  `${BASE_PATH}/js/utils/BatchManager.js`,
  `${BASE_PATH}/js/utils/ExpenseOrchestrator.js`,
  `${BASE_PATH}/js/core/DependencyContainer.js`,
  `${BASE_PATH}/js/core/ModuleManager.js`
];

// Estrategias de cache por tipo de recurso
const CACHE_STRATEGIES = {
  // Cache first - recursos estáticos que no cambian
  CACHE_FIRST: [
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
    /\.(woff|woff2|ttf|eot)$/,
    /\/assets\//
  ],
  
  // Network first - datos dinámicos
  NETWORK_FIRST: [
    /\/api\//,
    /firestore/,
    /firebase/
  ],
  
  // Stale while revalidate - recursos que pueden cambiar
  STALE_WHILE_REVALIDATE: [
    /\.js$/,
    /\.css$/,
    /\.html$/
  ]
};

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
  console.log('🔧 Service Worker: Instalando v5.0.0 - Smart Cache...');
  
  event.waitUntil(
    installServiceWorker()
  );
});

async function installServiceWorker() {
  try {
    // Paso 1: Cache recursos críticos
    await cacheEssentialResources();
    
    // Paso 2: Cache recursos externos
    await cacheExternalResources();
    
    // Paso 3: Inicializar IndexedDB y cache de datos
    await initializeDataStorage();
    
    // Paso 4: Precarga inteligente de recursos lazy
    await preloadLazyResources();
    
    console.log('✅ Service Worker: Instalación completada v5.0.0');
    return self.skipWaiting();
    
  } catch (error) {
    console.error('❌ Error en instalación SW:', error);
    throw error;
  }
}

async function cacheEssentialResources() {
  console.log('📦 Cacheando recursos críticos...');
  const cache = await caches.open(CACHE_NAME);
  
  const results = await Promise.allSettled(
    CORE_RESOURCES.map(async (url) => {
      try {
        const request = new Request(url, { cache: 'reload' });
        await cache.add(request);
        console.log('✅ Cached:', url);
      } catch (error) {
        console.warn('⚠️ Failed to cache:', url, error.message);
        throw error;
      }
    })
  );
  
  const failed = results.filter(r => r.status === 'rejected').length;
  const success = results.length - failed;
  
  console.log(`📦 Recursos críticos: ${success}/${results.length} cacheados`);
  
  if (failed > results.length * 0.5) {
    throw new Error(`Demasiados recursos críticos fallaron: ${failed}/${results.length}`);
  }
}

async function cacheExternalResources() {
  console.log('🌐 Cacheando recursos externos...');
  const cache = await caches.open(CACHE_NAME);
  
  await Promise.allSettled(
    EXTERNAL_RESOURCES.map(async (url) => {
      try {
        const request = new Request(url, { mode: 'cors' });
        await cache.add(request);
        console.log('✅ External cached:', url);
      } catch (error) {
        console.warn('⚠️ External cache failed:', url, error.message);
        // No lanzar error para recursos externos
      }
    })
  );
}

async function initializeDataStorage() {
  console.log('💾 Inicializando almacenamiento de datos...');
  
  // Cache de datos
  const dataCache = await caches.open(DATA_CACHE);
  await dataCache.put('./api/offline-status', new Response(JSON.stringify({
    offline: true,
    timestamp: Date.now(),
    version: CACHE_NAME,
    installable: true,
    features: ['smart-cache', 'background-sync', 'offline-storage']
  })));
  
  // Inicializar IndexedDB
  await initializeIndexedDB();
}

async function preloadLazyResources() {
  console.log('🚀 Precargando recursos lazy...');
  
  // Precargar solo algunos recursos lazy críticos
  const criticalLazy = LAZY_RESOURCES.slice(0, 3);
  const cache = await caches.open(RUNTIME_CACHE);
  
  await Promise.allSettled(
    criticalLazy.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('🚀 Preloaded:', url);
        }
      } catch (error) {
        console.warn('⚠️ Preload failed:', url);
      }
    })
  );
}

async function initializeIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ViajeHimalayaDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log('💾 IndexedDB inicializado');
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store para gastos pendientes
      if (!db.objectStoreNames.contains('pendingExpenses')) {
        const expenseStore = db.createObjectStore('pendingExpenses', { keyPath: 'id' });
        expenseStore.createIndex('timestamp', 'timestamp');
        expenseStore.createIndex('category', 'category');
      }
      
      // Store para acciones offline
      if (!db.objectStoreNames.contains('offlineActions')) {
        const actionStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
        actionStore.createIndex('type', 'type');
        actionStore.createIndex('timestamp', 'timestamp');
      }
      
      // Store para cache de datos
      if (!db.objectStoreNames.contains('dataCache')) {
        const cacheStore = db.createObjectStore('dataCache', { keyPath: 'key' });
        cacheStore.createIndex('expiry', 'expiry');
      }
      
      console.log('💾 IndexedDB schema actualizado');
    };
  });
}

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando v5.0.0...');
  
  event.waitUntil(
    activateServiceWorker()
  );
});

async function activateServiceWorker() {
  try {
    // Paso 1: Limpiar caches antiguos
    await cleanupOldCaches();
    
    // Paso 2: Migrar datos si es necesario
    await migrateStorageIfNeeded();
    
    // Paso 3: Tomar control inmediato
    await self.clients.claim();
    
    // Paso 4: Notificar a clientes sobre la activación
    await notifyClientsOfActivation();
    
    console.log('✅ Service Worker: Activado y listo v5.0.0');
    
  } catch (error) {
    console.error('❌ Error en activación SW:', error);
  }
}

async function cleanupOldCaches() {
  console.log('🗑️ Limpiando caches antiguos...');
  
  const cacheNames = await caches.keys();
  const validCaches = [CACHE_NAME, DATA_CACHE, RUNTIME_CACHE];
  
  const deletionPromises = cacheNames
    .filter(cacheName => !validCaches.includes(cacheName))
    .map(async (cacheName) => {
      console.log('🗑️ Eliminando cache antiguo:', cacheName);
      return caches.delete(cacheName);
    });
  
  await Promise.all(deletionPromises);
  console.log(`🗑️ ${deletionPromises.length} caches antiguos eliminados`);
}

async function migrateStorageIfNeeded() {
  console.log('🔄 Verificando migración de datos...');
  
  try {
    const db = await openIndexedDB();
    const version = db.version;
    
    if (version < 2) {
      console.log('🔄 Migración de datos necesaria...');
      // Aquí se implementarían migraciones específicas
    }
    
    db.close();
  } catch (error) {
    console.warn('⚠️ Error en migración:', error);
  }
}

async function notifyClientsOfActivation() {
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    client.postMessage({
      type: 'SW_ACTIVATED',
      version: '5.0.0',
      features: ['smart-cache', 'background-sync', 'offline-storage'],
      timestamp: Date.now()
    });
  });
  
  console.log(`📡 Notificados ${clients.length} clientes de la activación`);
}

async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ViajeHimalayaDB', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar requests GET del mismo origen o recursos conocidos
  if (request.method !== 'GET' || 
      (url.origin !== location.origin && !EXTERNAL_RESOURCES.some(res => request.url.startsWith(res)))) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Manejador principal de requests con estrategias inteligentes
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Determinar estrategia de cache
    const strategy = getCacheStrategy(request.url);
    
    switch (strategy) {
      case 'CACHE_FIRST':
        return await cacheFirst(request);
      case 'NETWORK_FIRST':
        return await networkFirst(request);
      case 'STALE_WHILE_REVALIDATE':
        return await staleWhileRevalidate(request);
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.warn('⚠️ Request failed:', request.url, error.message);
    return await handleFallback(request);
  }
}

// Determinar estrategia de cache basada en la URL
function getCacheStrategy(url) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pattern.test(url))) {
      return strategy;
    }
  }
  return 'STALE_WHILE_REVALIDATE'; // Default
}

// Estrategia Cache First - para recursos estáticos
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Estrategia Network First - para datos dinámicos
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📱 Serving from cache (offline):', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// Estrategia Stale While Revalidate - para recursos que pueden cambiar
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // Fetch en background para actualizar cache
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.status === 200) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(error => {
    console.warn('Background fetch failed:', request.url);
  });
  
  // Devolver cache inmediatamente si existe, sino esperar network
  return cachedResponse || fetchPromise;
}

// Fallback para requests fallidos
async function handleFallback(request) {
  // Para navegación, devolver index.html
  if (request.mode === 'navigate') {
    const fallback = await caches.match(`${BASE_PATH}/index.html`);
    if (fallback) {
      return fallback;
    }
  }
  
  // Para imágenes, devolver placeholder si existe
  if (request.destination === 'image') {
    const placeholder = await caches.match(`${BASE_PATH}/assets/icon-192x192.png`);
    if (placeholder) {
      return placeholder;
    }
  }
  
  // Respuesta offline genérica
  return new Response('Offline - Resource not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

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

console.log('🚀 Service Worker v5.0.0 cargado - SMART CACHE: Estrategias inteligentes + IndexedDB + Precarga optimizada');