import { renderHome } from './modules/home.js';
import { renderRead } from './modules/read.js';
import { renderSpeak } from './modules/speak.js';
import { renderVocabulary } from './modules/vocabulary.js';
import { renderProgress } from './modules/progress.js';
import { hydrateIcons } from './ui/icons.js';

export function getRoute() {
  const raw=(location.hash||'#/home').replace(/^#\/?/,'');
  const parts=raw.split('/').filter(Boolean);
  return {name:parts[0]||'home',parts:parts.slice(1)};
}

export function renderRoute() {
  const app=document.getElementById('app'); if(!app)return;
  const route=getRoute();
  if(route.name==='read')renderRead(app,route.parts);
  else if(route.name==='speak')renderSpeak(app,route.parts);
  else if(route.name==='vocabulary')renderVocabulary(app,route.parts);
  else if(route.name==='progress')renderProgress(app,route.parts);
  else renderHome(app,route.parts);
  document.querySelectorAll('[data-route-link]').forEach(link=>link.classList.toggle('active',link.dataset.routeLink===route.name));
  hydrateIcons(document);
  requestAnimationFrame(()=>app.focus({preventScroll:true}));
  window.scrollTo({top:0,behavior:'instant'});
}

export function initRouter() {
  window.addEventListener('hashchange',renderRoute);
  if(!location.hash)location.hash='#/home';
  else renderRoute();
}
