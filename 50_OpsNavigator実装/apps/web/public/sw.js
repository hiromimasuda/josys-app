/* Emergency Pack用Service Worker(§13)。
 * 同一originのみを扱い、外部への通信・書き込みは一切行わない。
 * 方式: network-first + キャッシュ退避。オフライン時はキャッシュから返し、
 * ナビゲーションのフォールバックは /emergency。
 */
const CACHE_NAME = "opsnav-emergency-v1";
const PRECACHE = ["/emergency", "/home", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 外部originは扱わない(存在もしない想定)

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await caches.match("/emergency");
          if (fallback) return fallback;
        }
        return new Response("offline", { status: 503, statusText: "offline" });
      }),
  );
});
