/* Incremented by the build script when source/content changes. */
const VERSION = 'citea-guide-__BUILD_ID__';
const AUDIO = 'citea-audio-v1';
const ROOT = new URL('./', self.location.href);
const FILES = ['','index.html','app.js','styles.css','assets/fonts/fonts.css','assets/fonts/Poppins-400-latin.woff2','assets/fonts/Poppins-500-latin.woff2','assets/fonts/Poppins-600-latin.woff2','assets/fonts/Poppins-700-latin.woff2','assets/icon.svg','assets/apps/tashu.png','assets/apps/naver-map.png','assets/citea-walk-logo.png','assets/supplied/local-wellness.webp','assets/supplied/wine-expo.webp','assets/supplied/temi-literature.webp','assets/supplied/bomunsan.webp','assets/supplied/bomunsan-sunset.webp','assets/supplied/yuseong-footbath.webp','assets/supplied/temi-park.webp','assets/supplied/temiorae.webp','assets/supplied/baking-yoga.webp','assets/supplied/naraegwan.webp','assets/supplied/ministry-interior-safety.png','assets/supplied/junggu.png','assets/uam-hero.webp','assets/uam.webp','assets/temiorae.webp','assets/yuseong.webp','manifest.webmanifest','data/locale.json','data/event.json','data/places.json','data/site.json'];
self.addEventListener('install', event => {event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(FILES.map(p=>new Request(new URL(p,ROOT).href,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('citea-guide-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function audioResponse(request){
  const cache=await caches.open(AUDIO), full=await cache.match(request.url);
  if(!full)return fetch(request);
  const range=request.headers.get('range');
  if(!range)return full;
  const bytes=await full.arrayBuffer(), size=bytes.byteLength;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  let end=match[1]?(match[2]?Number(match[2]):size-1):size-1;
  end=Math.min(end,size-1);
  if(!Number.isFinite(start)||!Number.isFinite(end)||start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':full.headers.get('Content-Type')||'audio/mpeg','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',event=>{
  const u=new URL(event.request.url);
  if(event.request.method!=='GET'||u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return;
  if(/\.(mp3|m4a|wav|ogg)$/i.test(u.pathname)){event.respondWith(audioResponse(event.request));return;}
  event.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    try{const res=await fetch(event.request,{cache:'no-cache'});if(res.ok){const copy=res.clone();event.waitUntil(cache.put(event.request,copy));}return res;}
    catch{const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;if(event.request.mode==='navigate')return cache.match(new URL('index.html',ROOT));return Response.error();}
  })());
});
