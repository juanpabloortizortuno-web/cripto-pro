/* CDC FUTURO-PRO · Service Worker v10 — SIEMPRE trae la versión nueva (red primero), caché solo si no hay internet.
   Al activarse borra cachés viejas y recarga las pestañas abiertas. NO toca localStorage (tu contraseña queda intacta). */
var V = "cdc-v10";
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    var habia = ks.length > 0;
    return Promise.all(ks.map(function (k) { return caches.delete(k); })).then(function () { return self.clients.claim(); }).then(function () {
      if (!habia) return;
      return self.clients.matchAll({ type: "window" }).then(function (cs) { cs.forEach(function (c) { try { c.navigate(c.url); } catch (x) {} }); });
    });
  }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;               // Binance y demás APIs: directo, sin tocar
  e.respondWith(fetch(r, { cache: "no-store" }).then(function (res) {
    if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }).catch(function () {}); }
    return res;
  }).catch(function () { return caches.match(r); }));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then(function (cs) { if (cs.length) return cs[0].focus(); return self.clients.openWindow("./"); }));
});
