import { getState, updateState, registerActivity } from '../services/storage.js?v=4.1.1';
import { speak, evaluateSpeechAttempt, speechMode } from '../services/speech.js?v=4.1.1';
import { generateJson, extractGeminiJson } from '../services/gemini.js?v=4.1.1';
import { icon } from '../ui/icons.js?v=4.1.1';
import { toast } from '../ui/toast.js?v=4.1.1';

const SCENARIOS = [
  {id:'airport',title:'Airport',icon:'plane',desc:'Check-in, baggage, gate ve yön sorma.',phrases:['Where can I check in for this flight?','Is my carry-on bag too heavy?','Which gate should I go to?','How long does the security check usually take?']},
  {id:'cafe',title:'Café',icon:'coffee',desc:'Sipariş verme, değişiklik isteme ve ödeme.',phrases:['Could I have a latte, please?','Can I get that without sugar?','Could we have the bill, please?','Is there a table near the window?']},
  {id:'hotel',title:'Hotel',icon:'hotel',desc:'Check-in, oda sorunu ve yardım isteme.',phrases:['I have a reservation under my name.','What time is breakfast served?','The air conditioner in my room is not working.','Could I check out a little later?']},
  {id:'work',title:'Work',icon:'briefcase',desc:'Toplantı, açıklama isteme ve fikir belirtme.',phrases:['Could you explain that part again?','I agree with the main idea, but I have one concern.','When do we need to finish this task?','Would it be okay if I joined the meeting?']}
];

let activeScenario='airport';
let activeSentence=SCENARIOS[0].phrases[0];

export function renderSpeak(container) {
  const state=getState();
  container.innerHTML=`<section class="page">
    <header class="page-header"><div><span class="eyebrow">Real-world practice</span><h1>Speak</h1><p>Hazır günlük senaryolarla konuş. Cümleyi dinle, sesli tekrar et ve yaklaşık eşleşme skorunu gör.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><span class="badge">${speechMode()==='native'?'Native speech':speechMode()==='gemini-audio'?'Firefox · Gemini audio':'Mic unavailable'}</span><span class="badge">Best ${Math.round((state.speaking.bestScore||0)*100)}%</span></div></header>
    <div class="speak-layout">
      <div class="card">
        <div class="card-title"><h2>Bir durum seç</h2><span class="pill">${state.settings.level}</span></div>
        <div class="scenario-grid">${SCENARIOS.map(s=>`<button class="scenario-card ${s.id===activeScenario?'active':''}" data-scenario="${s.id}" type="button"><div class="scenario-icon">${icon(s.icon)}</div><h3>${s.title}</h3><p>${s.desc}</p></button>`).join('')}</div>
        <div id="scenarioPractice"></div>
      </div>
      <aside class="card accent">
        <span class="eyebrow">AI roleplay</span><h2 style="margin:0">Yeni konuşma üret</h2><p class="muted" style="line-height:1.6">Seçtiğin senaryoya ve seviyene göre Gemini kısa bir roleplay hazırlasın. API ayarlı değilse hazır pratikler çalışmaya devam eder.</p>
        <button class="primary-button" id="generateRoleplayButton" type="button" style="width:100%;margin-top:14px">${icon('spark')} Roleplay oluştur</button>
        <div id="aiRoleplay" style="margin-top:15px"></div>
      </aside>
    </div>
  </section>`;
  renderScenarioPractice(container);
  container.querySelector('.scenario-grid')?.addEventListener('click',e=>{const card=e.target.closest('[data-scenario]');if(!card)return;activeScenario=card.dataset.scenario;activeSentence=SCENARIOS.find(s=>s.id===activeScenario).phrases[0];container.querySelectorAll('.scenario-card').forEach(x=>x.classList.toggle('active',x===card));renderScenarioPractice(container);});
  container.querySelector('#generateRoleplayButton')?.addEventListener('click',()=>generateRoleplay(container));
}

function renderScenarioPractice(container) {
  const scenario=SCENARIOS.find(s=>s.id===activeScenario) || SCENARIOS[0];
  const area=container.querySelector('#scenarioPractice'); if(!area)return;
  area.innerHTML=`<div style="margin-top:22px"><span class="eyebrow">Useful phrases</span><div class="list">${scenario.phrases.map((p,i)=>`<button class="list-row" type="button" data-phrase-index="${i}" style="text-align:left"><div class="row-icon">${icon('volume')}</div><div class="row-copy"><strong>${escapeHtml(p)}</strong><span>Dinlemek ve shadowing için seç</span></div></button>`).join('')}</div><div class="practice-sentence" id="practiceSentence">${escapeHtml(activeSentence)}</div><div class="hero-actions"><button class="secondary-button" id="listenSentenceButton" type="button">${icon('volume')} Dinle</button><button class="primary-button" id="recordSentenceButton" type="button">${icon('mic')} Ben söyleyeyim</button></div><div class="speech-score" id="speechScore"></div></div>`;
  area.querySelectorAll('[data-phrase-index]').forEach(btn=>btn.addEventListener('click',()=>{activeSentence=scenario.phrases[Number(btn.dataset.phraseIndex)];area.querySelector('#practiceSentence').textContent=activeSentence;speak(activeSentence,.82);}));
  area.querySelector('#listenSentenceButton')?.addEventListener('click',()=>speak(activeSentence,.82));
  area.querySelector('#recordSentenceButton')?.addEventListener('click',async()=>{
    const button=area.querySelector('#recordSentenceButton'); const scoreNode=area.querySelector('#speechScore');
    button.disabled=true;
    try{
      const result=await evaluateSpeechAttempt(activeSentence,{level:getState().settings.level,onStatus:label=>{button.textContent=label;}});
      const score=result.score;
      scoreNode.className=`speech-score ${score>=.72?'success':'warn'}`;
      scoreNode.innerHTML=`<strong>%${Math.round(score*100)} eşleşme</strong>${result.transcript?` · “${escapeHtml(result.transcript)}”`:''}${result.feedbackTr?`<small style="display:block;margin-top:6px">${escapeHtml(result.feedbackTr)}</small>`:''}${result.mode==='gemini-audio'?`<small style="display:block;margin-top:4px">Firefox fallback · ${escapeHtml(result.model||'Gemini audio')}</small>`:''}`;
      updateState(s=>{s.speaking.attempts++;s.speaking.totalScore+=score;s.speaking.bestScore=Math.max(s.speaking.bestScore||0,score);});registerActivity('speaking',1);
    }catch(err){console.error(err);toast(err.status===401?'Firefox ses değerlendirmesi için AI ayarlarında Gemini API anahtarı veya proxy gerekli.':(err.message||'Mikrofon kullanılamadı.'));}
    finally{button.disabled=false;button.innerHTML=`${icon('mic')} Ben söyleyeyim`;}
  });
}

async function generateRoleplay(container) {
  const state=getState();
  if(!state.settings.apiKey && !state.settings.proxyEndpoint){toast('AI roleplay için Ayarlar → AI bölümünden API anahtarı veya proxy ekle.');window.dispatchEvent(new CustomEvent('vocabstory:open-settings',{detail:'ai'}));return;}
  const scenario=SCENARIOS.find(s=>s.id===activeScenario)||SCENARIOS[0];
  const button=container.querySelector('#generateRoleplayButton'); const output=container.querySelector('#aiRoleplay');
  button.disabled=true;
  const prompt=`You are an English speaking coach. Create a short realistic ${state.settings.level} roleplay for the situation "${scenario.title}". Return ONLY JSON: {"title":"...","context":"one short sentence","lines":[{"speaker":"Staff","text":"..."},{"speaker":"You","text":"..."},{"speaker":"Staff","text":"..."},{"speaker":"You","text":"..."}],"practiceSentence":"one useful sentence from the You lines"}. Keep it practical and natural.`;
  try{
    const {data,model}=await generateJson(prompt,{onAttempt:({model,attempt})=>{button.textContent=attempt>1?`${model} tekrar deneniyor…`:`${model} hazırlanıyor…`;}});
    const role=extractGeminiJson(data); activeSentence=role.practiceSentence||role.lines?.find(l=>l.speaker==='You')?.text||activeSentence;
    output.innerHTML=`<div class="word-definition"><strong>${escapeHtml(role.title||'Roleplay')}</strong><p>${escapeHtml(role.context||'')}</p></div><div class="list" style="margin-top:10px">${(role.lines||[]).map(l=>`<div class="list-row"><div class="row-copy"><strong>${escapeHtml(l.speaker)}</strong><span style="white-space:normal">${escapeHtml(l.text)}</span></div></div>`).join('')}</div><button class="secondary-button" id="practiceAiSentence" type="button" style="width:100%;margin-top:10px">${icon('mic')} “${escapeHtml(activeSentence)}” çalış</button><small class="muted" style="display:block;margin-top:8px">${model} ile üretildi.</small>`;
    output.querySelector('#practiceAiSentence')?.addEventListener('click',()=>{speak(activeSentence,.82);toast('Cümle ana shadowing alanına seçildi.');container.querySelector('#practiceSentence').textContent=activeSentence;});
  }catch(err){console.error(err);if(err.status===503)toast('Gemini şu an yoğun; tüm fallback modeller denendi. Hazır pratikler çalışmaya devam ediyor.');else toast('AI roleplay üretilemedi. API ayarlarını kontrol et.');}
  finally{button.disabled=false;button.innerHTML=`${icon('spark')} Roleplay oluştur`;}
}

function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
