/* Incremented by the build script when source/content changes. */
const VERSION = 'citea-guide-__BUILD_ID__';
const ROOT = new URL('./', self.location.href);
const FILES = ['schedule-tracks.js','schedule-tracks.css','explore-categories.js','explore-categories.css','shopping-guide.js','shopping-guide.css','filmed-here.js','filmed-here.css','data/shopping.json','data/filming.json','','index.html','app.js','styles.css','assets/fonts/fonts.css','assets/fonts/Poppins-400-latin.woff2','assets/fonts/Poppins-500-latin.woff2','assets/fonts/Poppins-600-latin.woff2','assets/fonts/Poppins-700-latin.woff2','assets/icons/citea-walk.ico','assets/icons/citea-walk-16.png','assets/icons/citea-walk-32.png','assets/icons/citea-walk-48.png','assets/icons/citea-walk-180.png','assets/icons/citea-walk-192.png','assets/icons/citea-walk-512.png','assets/apps/tashu.png','assets/apps/naver-map.png','assets/citea-walk-logo.png','assets/supplied/local-wellness.webp','assets/supplied/wine-expo.webp','assets/supplied/temi-literature.webp','assets/supplied/bomunsan.webp','assets/supplied/bomunsan-sunset.webp','assets/supplied/yuseong-footbath.webp','assets/supplied/temi-park.webp','assets/supplied/temiorae.webp','assets/supplied/baking-yoga.webp','assets/supplied/naraegwan.webp','assets/supplied/ministry-interior-safety.png','assets/supplied/junggu.png','assets/supplied/bomunsanseong-hero.jpg','assets/uam.webp','assets/temiorae.webp','assets/yuseong.webp','manifest.webmanifest','data/locale.json','data/event.json','data/places.json','data/site.json'];
self.addEventListener('install', event => {event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(FILES.map(p=>new Request(new URL(p,ROOT).href,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('citea-guide-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const u=new URL(event.request.url);
  if(event.request.method!=='GET'||u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    try{const res=await fetch(event.request,{cache:'no-cache'});if(res.ok){const copy=res.clone();event.waitUntil(cache.put(event.request,copy));}return res;}
    catch{const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;if(event.request.mode==='navigate')return cache.match(new URL('index.html',ROOT));return Response.error();}
  })());
});
