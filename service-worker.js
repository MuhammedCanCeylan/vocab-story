const CACHE='vocabstory-v4-1-2-shell-v1';
const SHELL=[
  './','./index.html','./favicon.svg','./manifest.webmanifest',
  './css/tokens.css','./css/app.css','./css/reader.css','./css/responsive.css',
  './js/app.js','./js/config.js','./js/router.js','./js/data/books.js',
  './js/services/storage.js','./js/services/srs.js','./js/services/speech.js','./js/services/gemini.js','./js/services/dictionary.js',
  './js/ui/icons.js','./js/ui/toast.js','./js/ui/wordModal.js',
  './js/modules/home.js','./js/modules/read.js','./js/modules/speak.js','./js/modules/vocabulary.js','./js/modules/vocabImport.js','./js/modules/progress.js'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith(
    fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(async()=>{
      const hit=await caches.match(event.request);
      if(hit)return hit;
      // Never return HTML as a missing JS/CSS/module resource; that creates misleading parser errors.
      const dest=event.request.destination;
      if(['script','style','manifest'].includes(dest))return Response.error();
      return caches.match('./index.html');
    })
  );
});
