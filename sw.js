/* CDC FUTURO-PRO · Service Worker (caché para carga rápida)
   Subir a GitHub en la MISMA carpeta que index.html (ej: /cripto-pro/sw.js) */
const STATIC = 'cdc-static-v1';
const HTML_ACTUAL = '__cdc_html_actual';
const HTML_NUEVA = '__cdc_html_nueva';
const HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];
const SCOPE = new URL(self.registration.scope);
const k = (n) => new Request(new URL(n, SCOPE).href);
const hashDe = (t) => { const m = /_HASH_ESPERADO = "([0-9a-f]{64})"/.exec(t); return m ? m[1] : null; };

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    try {
      const c = await caches.open(STATIC);
      const r = await fetch(SCOPE.href, { cache: 'no-store' });
      if (r.ok) await c.put(k(HTML_ACTUAL), r);
    } catch (err) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const n of await caches.keys()) if (n !== STATIC) await caches.delete(n);
    await self.clients.claim();
  })());
});

async function revisarActualizacion() {
  try {
    const c = await caches.open(STATIC);
    const r = await fetch(SCOPE.href, { cache: 'no-store' });
    if (!r.ok) return;
    const nuevo = hashDe(await r.clone().text());
    const act = await c.match(k(HTML_ACTUAL));
    const actual = act ? hashDe(await act.text()) : null;
    if (nuevo && nuevo !== actual) await c.put(k(HTML_NUEVA), r); // se estrena en la próxima apertura
  } catch (err) {}
}

async function pagina(e, esNavegacion) {
  const c = await caches.open(STATIC);
  if (esNavegacion) {
    const pend = await c.match(k(HTML_NUEVA));
    if (pend) { await c.put(k(HTML_ACTUAL), pend); await c.delete(k(HTML_NUEVA)); }
  }
  const cur = await c.match(k(HTML_ACTUAL));
  if (cur) { if (esNavegacion) e.waitUntil(revisarActualizacion()); return cur; }
  const r = await fetch(e.request);
  if (esNavegacion && r.ok) c.put(k(HTML_ACTUAL), r.clone());
  return r;
}

async function estatico(e) {
  const c = await caches.open(STATIC);
  const hit = await c.match(e.request);
  const red = fetch(e.request).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => hit);
  if (hit) { e.waitUntil(red); return hit; }
  return red;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const esPagina = u.origin === SCOPE.origin && (u.pathname === SCOPE.pathname || u.pathname === SCOPE.pathname + 'index.html');
  if (esPagina) { e.respondWith(pagina(e, req.mode === 'navigate')); return; }
  if (HOSTS.includes(u.hostname)) e.respondWith(estatico(e));
});
