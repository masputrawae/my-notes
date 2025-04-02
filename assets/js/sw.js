// ============================ SERVICE WORKER ============================
importScripts('https://cdn.bootcdn.net/ajax/libs/workbox-sw/7.3.0/workbox-sw.js');

// Function to generate cache version based on current date
function generateCacheVersion() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `-${year}${month}${day}`;
}

// Cache version number - dynamically generated
let cacheVersion = generateCacheVersion();
// Maximum number of entries
const maxEntries = 300;

if (workbox) {
    console.log(`Yay! Workbox is loaded 🎉`);
    // Comment cache
    workbox.routing.registerRoute(
        new RegExp('^https://comment\.cuterwrite\.top'),
        new workbox.strategies.NetworkFirst({
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: maxEntries,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );
    // Do not cache rss and sitemap
    workbox.routing.registerRoute(
        new RegExp('^https://cuterwrite\.top/(index|sitemap)\.xml'),
        new workbox.strategies.NetworkOnly()
    );
    // Cache HTML
    workbox.routing.registerRoute(
        new RegExp('.*\.html'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'html-cache' + cacheVersion,
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: maxEntries,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );
    // Cache Google Fonts
    workbox.routing.registerRoute(
        new RegExp('.*\.(?:woff|woff2|ttf|otf|eot)'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'google-fonts' + cacheVersion,
            plugins: [
                // Use expiration plugin to control cache entry number and time
                new workbox.expiration.ExpirationPlugin({
                    // Maximum number of cache entries
                    maxEntries: maxEntries,
                    // Maximum cache time 30 days
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
                // Use cacheableResponse plugin to cache requests with status code 0
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );
    // Cache public libraries like bootcdn, unpkg, jsdelivr using regex
    workbox.routing.registerRoute(
        new RegExp('^https://(?:cdn\.bootcdn\.net|unpkg\.com|cdn\.jsdelivr\.net)'),
        new workbox.strategies.CacheFirst({
            cacheName: 'cdn' + cacheVersion,
            fetchOptions: {
                mode: 'cors',
                credentials: 'omit',
            },
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: maxEntries,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
            ],
        })
    );
    // Self-built UMA statistics script: https://analytics.cuterwrite.top/uma
    workbox.routing.registerRoute(
        new RegExp('^https://analytics\.cuterwrite\.top/uma'),
        new workbox.strategies.NetworkOnly({
            plugins: [
                // Use background sync plugin for background synchronization
                new workbox.backgroundSync.BackgroundSyncPlugin('Optical_Collect', {
                    maxRetentionTime: 12 * 60,
                }),
            ],
        })
    );
    // Cache bucket images https://cloud.cuterwrite.fun/
    workbox.routing.registerRoute(
        new RegExp('^(https://cuterwrite-1302252842\.file\.myqcloud\.com|https://s2\.loli\.net)'),
        new workbox.strategies.CacheFirst({
            cacheName: 'image-cache' + cacheVersion,
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: maxEntries,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );

    // Suffix matching for other static files not matched by domain
    workbox.routing.registerRoute(
        new RegExp('.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)'),
        new workbox.strategies.StaleWhileRevalidate()
    );
    workbox.routing.registerRoute(
        new RegExp('.*\.(css|js)'),
        new workbox.strategies.StaleWhileRevalidate()
    );

    // Default match for remaining requests
    workbox.routing.setDefaultHandler(
        // Prefer cache, if cache is not available, use network request
        new workbox.strategies.NetworkFirst({
            networkTimeoutSeconds: 3,
        })
    );

} else {
    console.log(`Boo! Workbox didn't load 😬`);
}