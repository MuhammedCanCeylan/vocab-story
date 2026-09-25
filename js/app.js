import { APP_CONFIG } from './config.js';
import { getState, updateState, exportState, importState, resetState } from './services/storage.js';
import { initSpeech } from './services/speech.js';
import { hydrateIcons, icon } from './ui/icons.js';
import { closeWordModal } from './ui/wordModal.js';
import { toast } from './ui/toast.js';
import { initRouter, renderRoute } from './router.js';

function migrateLegacyData() {
  if(localStorage.getItem('vocabstory_v4_legacy_migrated')==='1') return;
  const state=getState();
  let changed=false;
  const legacyKey=localStorage.getItem('gemini_api_key');
  const legacyModel=localStorage.getItem('gemini_model');
  if(!state.settings.apiKey && legacyKey){state.settings.apiKey=legacyKey;changed=true;}
  if(legacyModel && (!state.settings.model || /gemini-(?:1\.5|2\.0|2\.5)-/i.test(state.settings.model))){state.settings.model=/gemini-(?:1\.5|2\.0|2\.5)-/i.test(legacyModel)?APP_CONFIG.preferredModel:legacyModel;changed=true;}
  try {
    const oldActivity=JSON.parse(localStorage.getItem('vocabstory_activity')||'null');
    if(oldActivity && !state.activity.lastActiveDate){
      state.activity.streak=Number(oldActivity.streak)||0;
      state.activity.lastActiveDate=String(oldActivity.lastDate||'');
      state.activity.lessonsToday=Number(oldActivity.lessonsToday)||0;
      changed=true;
    }
  } catch {}
  if(!state.vocabulary.length){
    try{
      const old=JSON.parse(localStorage.getItem('vocab_pool')||'[]');
      if(Array.isArray(old)&&old.length){
        state.vocabulary=old.filter(x=>x&&x.word).map((x,i)=>({
          id:`legacy_${Date.now()}_${i}`,
          word:String(x.word), meaningTr:String(x.meaning||x.meaningTr||''), definitionEn:String(x.definitionEn||''), ipa:String(x.ipa||''), example:String(x.example||''), type:String(x.type||''), level:String(x.level||''), source:'legacy', status:x.status==='mastered'?'mastered':x.status==='review'?'review':'learning', createdAt:Date.now()-i, dueAt:x.status==='mastered'?Date.now()+30*86400000:Date.now(), intervalDays:x.status==='mastered'?30:0, repetitions:x.status==='mastered'?4:0, ease:2.5, lastReviewedAt:null
        }));
        changed=true;
      }
    }catch{}
  }
  if(changed)updateState(s=>Object.assign(s,state));
  localStorage.setItem('vocabstory_v4_legacy_migrated','1');
}

function setTheme(theme) {
  document.documentElement.dataset.theme=theme;
  localStorage.setItem('vocabstory_theme',theme);
  const btn=document.getElementById('themeButton');
  if(btn){btn.dataset.icon=theme==='dark'?'sun':'moon';btn.innerHTML=icon(btn.dataset.icon);}
  const meta=document.querySelector('meta[name="theme-color"]'); if(meta)meta.content=theme==='dark'?'#090a0d':'#f5f5f7';
}

function initTheme() {
  const saved=localStorage.getItem('vocabstory_theme');
  setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
  document.getElementById('themeButton')?.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
}

function openSettings(tab='general') {
  const state=getState();
  document.getElementById('defaultLevelInput').value=state.settings.level;
  document.getElementById('dailyGoalInput').value=state.settings.dailyGoal;
  document.getElementById('readerModeInput').value=state.settings.readerMode;
  document.getElementById('apiKeyInput').value=state.settings.apiKey||'';
  document.getElementById('modelInput').value=state.settings.model||APP_CONFIG.preferredModel;
  document.getElementById('proxyInput').value=state.settings.proxyEndpoint||'';
  switchSettingsTab(tab);
  const modal=document.getElementById('settingsModal'); modal.classList.add('visible');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function closeSettings(){const modal=document.getElementById('settingsModal');modal.classList.remove('visible');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
function switchSettingsTab(tab){document.querySelectorAll('[data-settings-tab]').forEach(b=>b.classList.toggle('active',b.dataset.settingsTab===tab));document.querySelectorAll('[data-settings-panel]').forEach(p=>p.classList.toggle('active',p.dataset.settingsPanel===tab));}

function initSettings() {
  document.getElementById('settingsButton')?.addEventListener('click',()=>openSettings('general'));
  document.getElementById('closeSettingsButton')?.addEventListener('click',closeSettings);
  document.getElementById('closeWordModalButton')?.addEventListener('click',closeWordModal);
  document.getElementById('settingsModal')?.addEventListener('click',e=>{if(e.target.id==='settingsModal')closeSettings();});
  document.getElementById('wordModal')?.addEventListener('click',e=>{if(e.target.id==='wordModal')closeWordModal();});
  document.querySelector('.settings-tabs')?.addEventListener('click',e=>{const b=e.target.closest('[data-settings-tab]');if(b)switchSettingsTab(b.dataset.settingsTab);});
  window.addEventListener('vocabstory:open-settings',e=>openSettings(e.detail||'ai'));
  document.getElementById('saveSettingsButton')?.addEventListener('click',()=>{
    updateState(s=>{
      s.settings.level=document.getElementById('defaultLevelInput').value;
      s.settings.dailyGoal=Math.min(20,Math.max(1,Number(document.getElementById('dailyGoalInput').value)||3));
      s.settings.readerMode=document.getElementById('readerModeInput').value;
      s.settings.apiKey=document.getElementById('apiKeyInput').value.trim();
      s.settings.model=document.getElementById('modelInput').value.trim()||APP_CONFIG.preferredModel;
      s.settings.proxyEndpoint=document.getElementById('proxyInput').value.trim();
    });
    closeSettings();toast('Ayarlar kaydedildi.');renderRoute();
  });
  document.getElementById('exportDataButton')?.addEventListener('click',()=>{
    const blob=new Blob([exportState()],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`vocabstory-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast('Yedek indirildi.');
  });
  document.getElementById('importDataInput')?.addEventListener('change',e=>{
    const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{importState(reader.result);toast('Yedek başarıyla yüklendi.');closeSettings();renderRoute();}catch{toast('Geçerli bir VocabStory yedeği değil.');}};reader.readAsText(file);e.target.value='';
  });
  let resetArmed=false,resetTimer;
  document.getElementById('resetDataButton')?.addEventListener('click',e=>{
    const b=e.currentTarget;
    if(!resetArmed){resetArmed=true;b.textContent='Tekrar tıkla: tüm verileri sıfırla';clearTimeout(resetTimer);resetTimer=setTimeout(()=>{resetArmed=false;b.innerHTML=`${icon('trash')} Verileri sıfırla`;},3500);return;}
    resetState();resetArmed=false;b.innerHTML=`${icon('trash')} Verileri sıfırla`;closeSettings();toast('VocabStory verileri sıfırlandı.');renderRoute();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSettings();closeWordModal();}});
}

async function initPwa() {
  if('serviceWorker' in navigator && location.protocol!=='file:'){
    try{await navigator.serviceWorker.register('./service-worker.js');}catch(e){console.warn('Service worker registration failed',e);}
  }
}

migrateLegacyData();
hydrateIcons(document);
initTheme();
initSettings();
initSpeech();
initRouter();
initPwa();
console.info(`[VocabStory] v${APP_CONFIG.version} loaded`);
