/**
 * Service Worker - LabGrandisol
 * PWA com suporte offline, cache inteligente e sincronização
 */

const CACHE_VERSION = 'v2.1.0';
const CACHE_NAME = `labgrandisol-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `labgrandisol-dynamic-${CACHE_VERSION}`;

// Arquivos para cache estático (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Padrões de URLs para cache dinâmico
const CACHE_PATTERNS = {
  api: /\/api\/(library|museum|search|social)/,
  images: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
  fonts: /\.(woff|woff2|ttf|eot)$/,
  styles: /\.css$/,
  scripts: /\.js$/
};

// Estratégias de cache
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'networkFirst',
  CACHE_FIRST: 'cacheFirst',
  STALE_WHILE_REVALIDATE: 'staleWhileRevalidate',
  NETWORK_ONLY: 'networkOnly',
  CACHE_ONLY: 'cacheOnly'
};

// Configuração por tipo de recurso
const CACHE_CONFIG = {
  [CACHE_STRATEGIES.NETWORK_FIRST]: {
    patterns: [CACHE_PATTERNS.api],
    maxAge: 5 * 60 * 1000, // 5 minutos
    maxEntries: 100
  },
  [CACHE_STRATEGIES.CACHE_FIRST]: {
    patterns: [CACHE_PATTERNS.images, CACHE_PATTERNS.fonts],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    maxEntries: 200
  },
  [CACHE_STRATEGIES.STALE_WHILE_REVALIDATE]: {
    patterns: [CACHE_PATTERNS.styles, CACHE_PATTERNS.scripts],
    maxAge: 24 * 60 * 60 * 1000, // 1 dia
    maxEntries: 100
  }
};

// Instalação
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// Ativação
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('labgrandisol-') && name !== CACHE_NAME && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de autenticação e admin
  if (url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/api/admin')) {
    return;
  }

  // Ignorar WebSocket
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Determinar estratégia de cache
  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
  );
});

// Determina a estratégia de cache para uma requisição
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  for (const [strategy, config] of Object.entries(CACHE_CONFIG)) {
    for (const pattern of config.patterns) {
      if (pattern.test(url.pathname) || pattern.test(request.url)) {
        return { strategy, ...config };
      }
    }
  }
  
  // Padrão: stale-while-revalidate
  return { 
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, 
    maxAge: 60 * 60 * 1000, 
    maxEntries: 50 
  };
}

// Manipula a requisição de acordo com a estratégia
async function handleRequest(request, config) {
  switch (config.strategy) {
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, config);
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, config);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, config);
    default:
      return fetch(request);
  }
}

// Network First - Tenta a rede primeiro, fallback para cache
async function networkFirst(request, config) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retorna página offline para navegação
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Não foi possível conectar ao servidor' }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Cache First - Tenta o cache primeiro, fallback para rede
async function cacheFirst(request, config) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, config.maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate - Retorna cache imediatamente, atualiza em background
async function staleWhileRevalidate(request, config) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      }
      return networkResponse;
    })
    .catch(() => null);

  // Retorna cache se existir, senão aguarda a rede
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return fetchPromise || new Response('Offline', { status: 503 });
}

// Verifica se o cache expirou
function isExpired(response, maxAge) {
  if (!maxAge) return false;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const cachedTime = new Date(dateHeader).getTime();
  return Date.now() - cachedTime > maxAge;
}

// Limpa cache antigo periodicamente
setInterval(async () => {
  const cache = await caches.open(DYNAMIC_CACHE);
  const keys = await cache.keys();
  
  // Limita quantidade de entradas
  if (keys.length > 300) {
    const toDelete = keys.slice(0, keys.length - 200);
    for (const request of toDelete) {
      await cache.delete(request);
    }
    console.log(`[SW] Cleaned ${toDelete.length} cache entries`);
  }
}, 60 * 60 * 1000); // 1 hora

// ==================== PUSH NOTIFICATIONS ====================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'LabGrandisol',
    body: 'Nova atualização disponível',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: data.actions || [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ],
    tag: data.tag || 'default',
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Verificar se já existe uma janela aberta
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// ==================== BACKGROUND SYNC ====================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Sincronização de dados offline
async function syncData() {
  try {
    // Buscar dados pendentes do IndexedDB
    const pendingData = await getPendingData();
    
    for (const data of pendingData) {
      try {
        const response = await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: JSON.stringify(data.body)
        });
        
        if (response.ok) {
          await removePendingData(data.id);
        }
      } catch (error) {
        console.error('[SW] Sync failed for:', data.id);
      }
    }
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Funções mock para IndexedDB (implementar conforme necessário)
async function getPendingData() {
  return [];
}

async function removePendingData(id) {
  return true;
}

// ==================== MESSAGE HANDLING ====================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

console.log('[SW] Service Worker loaded - LabGrandisol', CACHE_VERSION);