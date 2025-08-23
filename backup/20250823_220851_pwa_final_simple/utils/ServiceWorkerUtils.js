/**
 * ServiceWorkerUtils - Utilidades para Service Worker
 * 
 * Funciones auxiliares para el Service Worker, incluyendo manejo de cache,
 * notificaciones, geolocalización y mapas offline.
 * 
 * @author David Ferrer Figueroa
 * @version 2.0.0
 * @since 2024
 */

// ============================================================================
// FUNCIONES DE VERIFICACIÓN
// ============================================================================

/**
 * Verifica si una URL es un tile de mapa
 */
function isMapTileRequest(url) {
  const MAP_TILE_PATTERNS = [
    /^https:\/\/.*\.basemaps\.cartocdn\.com\/rastertiles\/voyager\/.*$/,
    /^https:\/\/.*\.openstreetmap\.org\/.*$/,
    /^https:\/\/.*\.tile\.openstreetmap\.org\/.*$/
  ];
  return MAP_TILE_PATTERNS.some(pattern => pattern.test(url.href));
}

/**
 * Verifica si es un recurso crítico
 */
function isCoreResource(url) {
  const CORE_RESOURCES = [
    '/', '/index.html', '/manifest.json',
    '/css/main.css', '/css/components.css', '/css/dark-mode.css',
    '/js/main.js', '/js/config/tripConfig.js', '/js/config/AppConstants.js',
    '/js/components/UIRenderer.js', '/js/components/BudgetManager.js',
    '/js/utils/Logger.js', '/js/utils/DOMUtils.js', 
    '/js/utils/FormatUtils.js', '/js/utils/ResponsiveUtils.js'
  ];
  return CORE_RESOURCES.some(resource => 
    url.pathname === resource || url.href === resource
  );
}

/**
 * Verifica si es una request de datos
 */
function isDataRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.pathname.includes('tripConfig') ||
         url.searchParams.has('data');
}

/**
 * Verifica si es un recurso externo
 */
function isExternalResource(url) {
  return url.origin !== self.location.origin;
}

// ============================================================================
// MANEJADORES DE REQUESTS
// ============================================================================

/**
 * Maneja requests de tiles de mapas
 */
async function handleMapTileRequest(request) {
  try {
    const cache = await caches.open('viaje-maps-v2.0.0');
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🗺️ Tile de mapa desde cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('🗺️ Tile de mapa descargado:', request.url);
      return networkResponse;
    }
    
    return generateOfflineTile();
    
  } catch (error) {
    console.log('🗺️ Error en tile, usando offline:', error);
    return generateOfflineTile();
  }
}

/**
 * Maneja requests de recursos críticos
 */
async function handleCoreResourceRequest(request) {
  try {
    const cache = await caches.open('viaje-himalaya-v2.0.0');
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Recurso crítico desde cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('📦 Error en recurso crítico:', error);
    return generateOfflineResponse(request);
  }
}

/**
 * Maneja requests de datos
 */
async function handleDataRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open('viaje-data-v2.0.0');
      cache.put(request, networkResponse.clone());
      console.log('💾 Datos actualizados desde red:', request.url);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    const cache = await caches.open('viaje-data-v2.0.0');
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('💾 Datos desde cache:', request.url);
      return cachedResponse;
    }
    
    console.log('💾 Generando respuesta offline para datos');
    return generateOfflineDataResponse(request);
  }
}

/**
 * Maneja requests de recursos externos
 */
async function handleExternalResourceRequest(request) {
  try {
    const cache = await caches.open('viaje-offline-v2.0.0');
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🌐 Recurso externo desde cache:', request.url);
      
      fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      }).catch(() => {});
      
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('🌐 Error en recurso externo:', error);
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ============================================================================
// GENERADORES DE RESPUESTAS OFFLINE
// ============================================================================

/**
 * Genera tile offline genérico
 */
function generateOfflineTile() {
  const svg = `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#f1f5f9"/>
      <text x="128" y="128" text-anchor="middle" dy="0.3em" 
            font-family="Arial" font-size="14" fill="#64748b">
        Sin conexión
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

/**
 * Genera respuesta offline para recursos
 */
function generateOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    return caches.match('/index.html');
  }
  
  if (url.pathname.endsWith('.css')) {
    return new Response('/* Offline */', {
      headers: { 'Content-Type': 'text/css' }
    });
  }
  
  if (url.pathname.endsWith('.js')) {
    return new Response('console.log("Offline mode");', {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
  
  return new Response('Offline', { status: 503 });
}

/**
 * Genera respuesta offline para datos
 */
function generateOfflineDataResponse(request) {
  return new Response(JSON.stringify({
    offline: true,
    message: 'Datos no disponibles sin conexión',
    timestamp: Date.now()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// ============================================================================
// NOTIFICACIONES Y ALERTAS
// ============================================================================

/**
 * Programa notificaciones de vuelos
 */
async function scheduleFlightNotifications() {
  console.log('✈️ Programando notificaciones de vuelos...');
  
  const now = new Date();
  const flightDate = new Date('2025-10-09T10:00:00');
  const timeDiff = flightDate.getTime() - now.getTime();
  
  if (timeDiff > 0) {
    const dayBefore = timeDiff - (24 * 60 * 60 * 1000);
    if (dayBefore > 0) {
      setTimeout(() => {
        self.registration.showNotification('Recordatorio de Vuelo', {
          body: 'Tu vuelo sale mañana a las 10:00. ¡Prepara tu equipaje!',
          icon: '/assets/icon-192x192.png',
          tag: 'flight-reminder-24h',
          data: { url: '/?view=hoy' },
          actions: [
            { action: 'view', title: 'Ver Detalles' },
            { action: 'dismiss', title: 'Descartar' }
          ]
        });
      }, dayBefore);
    }
    
    const twoHoursBefore = timeDiff - (2 * 60 * 60 * 1000);
    if (twoHoursBefore > 0) {
      setTimeout(() => {
        self.registration.showNotification('¡Hora de ir al aeropuerto!', {
          body: 'Tu vuelo sale en 2 horas. Es momento de dirigirte al aeropuerto.',
          icon: '/assets/icon-192x192.png',
          tag: 'flight-reminder-2h',
          requireInteraction: true,
          data: { url: '/?view=hoy' }
        });
      }, twoHoursBefore);
    }
  }
}

/**
 * Inicializa sistema de alertas de presupuesto
 */
async function initializeBudgetAlerts() {
  console.log('💰 Inicializando alertas de presupuesto...');
  setInterval(checkBudgetAlerts, 60 * 60 * 1000);
}

/**
 * Verifica alertas de presupuesto
 */
async function checkBudgetAlerts() {
  try {
    const expenses = JSON.parse(localStorage.getItem('tripExpensesV1') || '[]');
    const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalBudget = 5000;
    const spentPercentage = (totalSpent / totalBudget) * 100;
    
    if (spentPercentage >= 90 && !hasShownAlert('budget-90')) {
      await showBudgetAlert('¡Presupuesto casi agotado!', 
        `Has gastado el ${Math.round(spentPercentage)}% de tu presupuesto (${totalSpent}€ de ${totalBudget}€)`, 
        'budget-90');
    } else if (spentPercentage >= 75 && !hasShownAlert('budget-75')) {
      await showBudgetAlert('Alerta de presupuesto', 
        `Has gastado el ${Math.round(spentPercentage)}% de tu presupuesto`, 
        'budget-75');
    } else if (spentPercentage >= 50 && !hasShownAlert('budget-50')) {
      await showBudgetAlert('Mitad del presupuesto', 
        `Has gastado la mitad de tu presupuesto (${Math.round(spentPercentage)}%)`, 
        'budget-50');
    }
    
  } catch (error) {
    console.error('❌ Error verificando alertas de presupuesto:', error);
  }
}

/**
 * Muestra alerta de presupuesto
 */
async function showBudgetAlert(title, body, tag) {
  await self.registration.showNotification(title, {
    body,
    icon: '/assets/icon-192x192.png',
    badge: '/assets/badge-72x72.png',
    tag,
    data: { url: '/?view=gastos' },
    actions: [
      { action: 'view-budget', title: 'Ver Gastos' },
      { action: 'dismiss', title: 'Entendido' }
    ],
    requireInteraction: true
  });
  
  markAlertAsShown(tag);
}

/**
 * Verifica si una alerta ya fue mostrada
 */
function hasShownAlert(tag) {
  const shownAlerts = JSON.parse(localStorage.getItem('shownBudgetAlerts') || '[]');
  return shownAlerts.includes(tag);
}

/**
 * Marca alerta como mostrada
 */
function markAlertAsShown(tag) {
  const shownAlerts = JSON.parse(localStorage.getItem('shownBudgetAlerts') || '[]');
  if (!shownAlerts.includes(tag)) {
    shownAlerts.push(tag);
    localStorage.setItem('shownBudgetAlerts', JSON.stringify(shownAlerts));
  }
}

// ============================================================================
// MAPAS OFFLINE
// ============================================================================

/**
 * Descarga mapas offline para área específica
 */
async function downloadOfflineMaps(bounds) {
  console.log('🗺️ Descargando mapas offline...', bounds);
  
  if (!bounds) {
    bounds = {
      north: 30.0,
      south: 26.0, 
      east: 92.0,
      west: 80.0
    };
  }
  
  const cache = await caches.open('viaje-maps-v2.0.0');
  const promises = [];
  
  for (let zoom = 6; zoom <= 15; zoom++) {
    const tiles = generateTileUrls(bounds, zoom);
    
    for (const tileUrl of tiles) {
      promises.push(
        fetch(tileUrl)
          .then(response => {
            if (response.ok) {
              return cache.put(tileUrl, response.clone());
            }
          })
          .catch(error => {
            console.log('Error descargando tile:', tileUrl, error);
          })
      );
      
      if (promises.length >= 10) {
        await Promise.allSettled(promises.splice(0, 10));
      }
    }
  }
  
  await Promise.allSettled(promises);
  console.log('✅ Descarga de mapas offline completada');
}

/**
 * Genera URLs de tiles para un área y zoom específicos
 */
function generateTileUrls(bounds, zoom) {
  const urls = [];
  
  const minTileX = Math.floor(((bounds.west + 180) / 360) * Math.pow(2, zoom));
  const maxTileX = Math.floor(((bounds.east + 180) / 360) * Math.pow(2, zoom));
  const minTileY = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  const maxTileY = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  
  for (let x = minTileX; x <= maxTileX; x++) {
    for (let y = minTileY; y <= maxTileY; y++) {
      urls.push(`https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`);
    }
  }
  
  return urls;
}
