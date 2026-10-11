const C='cc-v5-stadium3d',F=['./','index.html','style.css','app.js','core.js','match.js','ui.js','extra.js','manifest.webmanifest','icon-192.png','icon-512.png','favicon.png','stadium/stadium.css','stadium/model.js','stadium/ui.js','stadium/render3d.js','stadium/vendor/three.module.min.js','stadium/vendor/OrbitControls.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))});
