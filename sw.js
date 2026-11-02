/* CinemaPG — service worker simples
   - Habilita "Instalar app" / "Adicionar à tela inicial".
   - Rede primeiro: sempre busca a versão nova do site; só usa o cache se estiver sem internet.
   - Nunca guarda vídeos (arquivos grandes e com "range"). */
const CACHE = "cinemapg-v1";
const SHELL = ["./", "index.html", "style.css", "script.js", "manifest.json",
               "assets/icones/icon-192.png", "assets/icones/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                                   // ex.: o HEAD do relógio da estreia
  if (req.headers.has("range")) return;                               // vídeo em partes
  if (req.destination === "video" || req.destination === "audio") return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")))
  );
});