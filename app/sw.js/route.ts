// Service worker de Puntos, servido en /sw.js.
// - Archivos de la app (JS, CSS, fuentes, iconos): primero caché.
// - Pantallas: primero red; si no hay conexión, la última copia guardada;
//   si no hay copia, la página /offline, que pinta los datos guardados en IndexedDB.
// - /api: siempre red (la cola de acciones se gestiona en la página).

export const dynamic = "force-static";

const VERSION =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_BUILD_ID ?? "dev";

const source = `
const VERSION = ${JSON.stringify(VERSION)};
const STATIC = "puntos-static";
const PAGES = "puntos-pages";
const SHELL = ["/offline", "/manifest.webmanifest", "/pwa-icon/192", "/pwa-icon/512", "/pwa-icon/maskable-512"];

async function cacheWithAssets(url) {
  const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
  if (!res.ok || res.redirected) return;
  const html = await res.clone().text();
  const cache = await caches.open(url === "/offline" ? STATIC : PAGES);
  await cache.put(url, res);
  const assets = [...new Set(html.match(/\\/_next\\/static\\/[^"'\\s)\\\\]+/g) || [])];
  const stat = await caches.open(STATIC);
  await Promise.all(assets.map((a) => stat.add(a).catch(() => undefined)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC);
      await Promise.all(SHELL.map((u) => cache.add(u).catch(() => undefined)));
      await cacheWithAssets("/offline").catch(() => undefined);
      await cacheWithAssets("/").catch(() => undefined);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pwa-icon/") ||
    url.pathname.startsWith("/pwa-splash/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname.startsWith("/apple-icon") ||
    url.pathname === "/manifest.webmanifest"
  );
}

function cacheable(res) {
  return res && res.ok && !res.redirected && res.type === "basic";
}

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (cacheable(res)) (await caches.open(STATIC)).put(req, res.clone());
  return res;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function networkFirst(req, { navigate }) {
  const cache = await caches.open(PAGES);
  try {
    const res = await withTimeout(fetch(req), navigate ? 6000 : 8000);
    if (cacheable(res)) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreVary: true });
    if (hit) return hit;
    if (navigate) {
      const url = new URL(req.url);
      return Response.redirect("/offline?from=" + encodeURIComponent(url.pathname + url.search), 302);
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;

  if (isStatic(url)) {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (req.mode === "navigate") {
    if (url.pathname === "/offline") {
      event.respondWith(fetch(req).catch(async () => (await caches.match("/offline")) || Response.error()));
      return;
    }
    event.respondWith(networkFirst(req, { navigate: true }));
    return;
  }
  // Datos de navegación de Next (RSC): solo red. Si falla, Next carga la página
  // completa y entonces se sirve la copia guardada.
  if (req.headers.get("rsc") || url.searchParams.has("_rsc")) return;
  event.respondWith(networkFirst(req, { navigate: false }));
});

// La app puede pedir que se guarden pantallas por adelantado (para abrirlas sin conexión).
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "warm" && Array.isArray(data.urls)) {
    event.waitUntil(Promise.all(data.urls.slice(0, 40).map((u) => cacheWithAssets(u).catch(() => undefined))));
  }
});
`;

export function GET() {
  return new Response(source, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-cache, no-store, must-revalidate",
      "service-worker-allowed": "/",
    },
  });
}
