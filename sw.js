const CACHE_NAME = 'gestao-master-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
  'https://cdn-icons-png.flaticon.com/512/3079/3079645.png'
];

// Instalação: Cacheia os arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Tenta cachear, mas não falha se um arquivo externo der erro (ex: CORS)
        return Promise.all(
          ASSETS_TO_CACHE.map((url) => {
            return cache.add(url).catch((err) => {
              console.log('Falha ao cachear: ' + url);
            });
          })
        );
      })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação: Serve do cache, se não tiver, busca na rede
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET ou sejam do Firestore (que tem cache próprio)
  if (event.request.method !== 'GET' || event.request.url.includes('firestore')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrar
        if (response) {
          return response;
        }
        // Se não, busca na rede
        return fetch(event.request).then(
          (response) => {
            // Verifica se a resposta é válida
            if(!response || response.status !== 200 || response.type !== 'basic' && !event.request.url.includes('cdn') && !event.request.url.includes('unpkg') && !event.request.url.includes('gstatic')) {
              return response;
            }

            // Clona a resposta para salvar no cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});