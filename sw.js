// Service worker: la app abre sin conexión. Datos: los guarda Firestore en el propio dispositivo.
const V = "inv-v4";
const SHELL = ["./", "index.html", "style.css", "app.js", "store.js", "firebase-config.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Solo cacheamos la propia app y el SDK de Firebase (módulos estáticos); no las llamadas a la API de datos.
  const own = u.origin === location.origin, sdk = u.hostname === "www.gstatic.com" && u.pathname.startsWith("/firebasejs/");
  if (!own && !sdk) return;
  e.respondWith(
    caches.open(V).then(async (c) => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
