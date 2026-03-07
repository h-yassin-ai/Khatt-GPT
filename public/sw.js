self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Simple check for images to cache them for offline viewing
    if (event.request.destination === 'image' && event.request.url.includes('supabase.co')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then((networkResponse) => {
                    return caches.open('waraka-images').then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(() => {
                    // You could return a placeholder image here
                    return new Response('');
                });
            })
        );
    }
});
