// Keeps a staff member's own card usable offline (conference floors with no signal).
// Registered only from the owner's phone card (/my-card or /<slug>?me=1).
// Network first, so details stay current; the cache is only a fallback.
// Never touches Supabase requests: sign-in and data always go to the network.
const CACHE = "staff-card-v4";
const SHELL = [
  "/404.html", "/styles.css?v=20261027d", "/config.js?v=20261027d", "/shared.js?v=20261027d",
  "/assets/aia-canada-logo.png", "/assets/icar-canada-logo.png",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"
];
const STATIC_HOSTS = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("staff-card-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isPhoto = url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/v1/object/public/photos/");
  if (!sameOrigin && !STATIC_HOSTS.includes(url.hostname) && !isPhoto) return;
  // Leave the editor and admin pages alone.
  // Exact matches only: a card address like /edith-smith must still be cached.
  if (sameOrigin && ["/", "/index.html", "/edit.html", "/admin.html"].includes(url.pathname)) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // Card addresses are served by GitHub Pages as 404.html with a 404 status; cache them anyway.
        if (res.ok || res.type === "opaque" || (req.mode === "navigate" && res.status === 404)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === "navigate") return caches.match("/404.html");
        return Response.error();
      })
  );
});
