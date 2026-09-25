import { getState, updateState } from '../services/storage.js?v=4.2.0';
import { ensureVocab, getDueWords, reviewWord, setWordStatus } from '../services/srs.js?v=4.2.0';
import { parseVocabulary } from './vocabImport.js?v=4.2.0';
import { speak } from '../services/speech.js?v=4.2.0';
import { icon } from '../ui/icons.js?v=4.2.0';
import { openWordModal } from '../ui/wordModal.js?v=4.2.0';
import { toast } from '../ui/toast.js?v=4.2.0';

let filter='all';
let search='';
let selectedIds=new Set();
let studyWords=[];
let studyIndex=0;

export function renderVocabulary(container) {
  const state=getState(); const due=getDueWords(); const savedSentences=(state.savedSentences||[]).slice(0,8);
  const counts=countStatuses(state.vocabulary);
  container.innerHTML=`<section class="page">
    <header class="page-header"><div><span class="eyebrow">Spaced repetition</span><h1>Vocabulary</h1><p>Öğrenilecek, tekrar edilecek ve öğrendiğin bütün kelimelere tek yerden eriş. Listeyi filtrele, topluca çalış veya seçtiğin kelimelerden hikâye üret.</p></div><span class="badge">${due.length} due now</span></header>
    <div class="vocab-stats">
      ${statusStat('all','Tüm kelimeler',counts.all,'library')}
      ${statusStat('learning','Öğreniliyor',counts.learning,'plus')}
      ${statusStat('review','Tekrar',counts.review,'rotate')}
      ${statusStat('mastered','Öğrenildi',counts.mastered,'check')}
    </div>
    ${due.length?`<section class="card accent" id="reviewZone"><div class="card-title"><div><span class="eyebrow">Review now</span><h2>Bugünkü SRS tekrarları</h2></div><span class="pill">${due.length} kelime</span></div><div id="reviewCard"></div></section>`:''}
    <section class="card study-zone" id="studyZone" hidden></section>
    <div class="grid grid-2 vocab-main-grid" style="margin-top:18px">
      <section class="card vocab-pool-card">
        <div class="card-title"><div><span class="eyebrow">Word library</span><h3 style="margin:3px 0 0">Kelime havuzu</h3></div><span class="pill" id="visibleWordCount">${state.vocabulary.length}</span></div>
        <div class="vocab-toolbar"><input id="vocabSearch" class="search-input" placeholder="Kelime, anlam veya açıklama ara…" value="${escapeAttr(search)}"/><div class="segmented vocab-filter" id="vocabFilter"><button data-filter="all" class="${filter==='all'?'active':''}">All</button><button data-filter="learning" class="${filter==='learning'?'active':''}">Learning</button><button data-filter="review" class="${filter==='review'?'active':''}">Review</button><button data-filter="mastered" class="${filter==='mastered'?'active':''}">Mastered</button></div></div>
        <div class="bulk-bar" id="bulkBar"><label class="bulk-select"><input type="checkbox" id="selectVisibleWords"/> Görünenleri seç</label><span id="selectedCount">0 seçili</span><div class="bulk-actions"><button class="ghost-button" id="studyWordsButton" type="button">${icon('brain')} Çalış</button><button class="ghost-button" id="storyWordsButton" type="button">${icon('book-open')} Hikâye</button><button class="ghost-button" id="copyWordsButton" type="button">${icon('download')} Listeyi kopyala</button></div></div>
        <div class="list vocab-list" id="vocabList"></div>
      </section>
      <aside class="card">
        <span class="eyebrow">Smart import</span><h2 style="margin:0 0 8px">Toplu kelime ekle</h2><p class="muted" style="line-height:1.6">Quizlet kopyaları, <b>word - anlam</b>, sekmeli liste ve alt alta kelime/anlam biçimlerini otomatik ayıklar. <i>star filled, sound, edit</i> gibi arayüz metinlerini yok sayar.</p>
        <label class="field"><span>Kelimeleri yapıştır</span><textarea id="vocabImportInput" placeholder="EXPECT\nBeklemek Ummak\n\nstar filled\nsound\nedit\n\nfigure out - çözmek"></textarea></label>
        <div class="info-banner" id="importPreview"><span>${icon('library')}</span><p>Yapıştırdığın içerik burada analiz edilecek.</p></div>
        <button class="primary-button" id="importVocabButton" type="button" style="width:100%">${icon('plus')} Havuza ekle</button>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)"><div class="card-title"><h3>Kaydedilen cümleler</h3><span class="pill">${state.savedSentences?.length||0}</span></div>${savedSentences.length?`<div class="list saved-sentence-list">${savedSentences.map(s=>`<div class="list-row"><button class="row-icon" type="button" data-saved-sentence="${encodeURIComponent(s.text)}">${icon('volume')}</button><div class="row-copy"><strong title="${escapeAttr(s.text)}">${escapeHtml(s.text)}</strong><span title="${escapeAttr(s.tr||'')}">${escapeHtml(s.tr||'')}</span></div></div>`).join('')}</div>`:`<p class="muted">Reader’da cümle yanındaki + düğmesiyle kaydedebilirsin.</p>`}</div>
      </aside>
    </div>
  </section>`;
  if(due.length) renderReview(container);
  renderList(container);
  bindVocabularyEvents(container);
}

function statusStat(status,label,count,iconName){return `<button class="vocab-stat status-${status}" data-stat-filter="${status}" type="button"><span class="vocab-stat-icon">${icon(iconName)}</span><span><strong>${count}</strong><small>${label}</small></span></button>`;}
function countStatuses(words){return {all:words.length,learning:words.filter(v=>v.status==='learning').length,review:words.filter(v=>v.status==='review').length,mastered:words.filter(v=>v.status==='mastered').length};}

function bindVocabularyEvents(container){
  container.querySelector('#vocabSearch')?.addEventListener('input',e=>{search=e.target.value;selectedIds.clear();renderList(container);});
  container.querySelector('#vocabFilter')?.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;setFilter(container,b.dataset.filter);});
  container.querySelectorAll('[data-stat-filter]').forEach(btn=>btn.addEventListener('click',()=>setFilter(container,btn.dataset.statFilter)));
  container.querySelector('#vocabImportInput')?.addEventListener('input',e=>previewImport(container,e.target.value));
  container.querySelector('#importVocabButton')?.addEventListener('click',()=>importWords(container));
  container.querySelectorAll('[data-saved-sentence]').forEach(btn=>btn.addEventListener('click',()=>speak(decodeURIComponent(btn.dataset.savedSentence),.84)));
  container.querySelector('#selectVisibleWords')?.addEventListener('change',e=>{const words=getFilteredWords();if(e.target.checked)words.forEach(v=>selectedIds.add(v.id));else words.forEach(v=>selectedIds.delete(v.id));renderList(container);});
  container.querySelector('#studyWordsButton')?.addEventListener('click',()=>startStudy(container));
  container.querySelector('#storyWordsButton')?.addEventListener('click',()=>sendWordsToStory(container));
  container.querySelector('#copyWordsButton')?.addEventListener('click',()=>copyVisibleWords());
}

function setFilter(container,next){filter=next;selectedIds.clear();container.querySelectorAll('#vocabFilter button').forEach(x=>x.classList.toggle('active',x.dataset.filter===filter));renderList(container);}

function getFilteredWords(){
  const q=search.trim().toLowerCase();
  return getState().vocabulary.filter(v=>(filter==='all'||v.status===filter)&&(!q||`${v.word} ${v.meaningTr||''} ${v.definitionEn||''} ${v.source||''}`.toLowerCase().includes(q))).sort((a,b)=>String(a.word).localeCompare(String(b.word)));
}

function renderReview(container) {
  const card=container.querySelector('#reviewCard'); if(!card)return;
  const fresh=getDueWords();
  if(!fresh.length){card.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon('check')}</div><h3>Bugünkü tekrarlar bitti</h3><p>Yeni kelimeler okuma sırasında tekrar kuyruğuna eklenir.</p></div>`;return;}
  const item=fresh[0];
  card.innerHTML=`<div class="review-card"><span class="eyebrow">${item.level||'Vocabulary'} · ${fresh.length} remaining</span><div class="review-word">${escapeHtml(item.word)}</div><div class="word-ipa">${escapeHtml(item.ipa||'')}</div><div class="review-meaning" id="reviewMeaning">Cevabı zihninden söyle ve sonra aç.</div><div class="hero-actions" style="justify-content:center"><button class="secondary-button" id="reviewListen" type="button">${icon('volume')} Dinle</button><button class="primary-button" id="revealReview" type="button">Cevabı göster</button></div><div class="review-actions" id="reviewActions" hidden><button data-rating="again">Again<br><small>10 dk</small></button><button data-rating="hard">Hard<br><small>1 gün</small></button><button data-rating="good">Good<br><small>3+ gün</small></button><button data-rating="easy">Easy<br><small>7+ gün</small></button></div></div>`;
  card.querySelector('#reviewListen')?.addEventListener('click',()=>speak(item.word,.8));
  card.querySelector('#revealReview')?.addEventListener('click',()=>{card.querySelector('#reviewMeaning').innerHTML=`<strong>${escapeHtml(item.meaningTr||item.definitionEn||'Anlam eklenmemiş')}</strong>${item.example?`<div style="margin-top:7px;font-family:var(--font-reading)">${escapeHtml(item.example)}</div>`:''}`;card.querySelector('#reviewActions').hidden=false;card.querySelector('#revealReview').hidden=true;});
  card.querySelector('#reviewActions')?.addEventListener('click',e=>{const b=e.target.closest('[data-rating]');if(!b)return;reviewWord(item.id,b.dataset.rating);renderReview(container);renderList(container);});
}

function renderList(container) {
  const list=container.querySelector('#vocabList');if(!list)return;
  const words=getFilteredWords();
  const count=container.querySelector('#visibleWordCount');if(count)count.textContent=words.length;
  if(!words.length){list.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon('library')}</div><h3>Sonuç yok</h3><p>Başka bir filtre seçebilir, Reader’dan kelime ekleyebilir veya sağdaki import alanını kullanabilirsin.</p></div>`;updateBulkBar(container,words);return;}
  list.innerHTML=words.map(v=>`<div class="list-row vocab-row status-${v.status||'learning'} ${selectedIds.has(v.id)?'selected':''}" data-word-id="${v.id}"><label class="word-checkbox" title="Kelimeyi seç"><input type="checkbox" data-action="select" ${selectedIds.has(v.id)?'checked':''}/><span></span></label><button class="row-icon" type="button" data-action="listen" aria-label="Dinle">${icon('volume')}</button><button class="row-copy" type="button" data-action="details"><strong title="${escapeAttr(v.word)}">${escapeHtml(v.word)}</strong><span title="${escapeAttr(v.meaningTr||v.definitionEn||'')}">${escapeHtml(v.meaningTr||v.definitionEn||'Anlam eklenmemiş')}</span><small>${escapeHtml(v.ipa||'')} ${v.source?`· ${escapeHtml(v.source)}`:''}</small></button><span class="status-badge status-${v.status||'learning'}">${statusLabel(v.status)}</span><div class="row-actions"><button class="mini-button master-action ${v.status==='mastered'?'active':''}" type="button" data-action="master" title="Biliyorum">${icon('check')}</button><button class="mini-button review-action ${v.status==='review'?'active':''}" type="button" data-action="review" title="Tekrar">${icon('rotate')}</button></div></div>`).join('');
  list.onclick=e=>{const row=e.target.closest('[data-word-id]');if(!row)return;const v=getState().vocabulary.find(x=>x.id===row.dataset.wordId);if(!v)return;const action=e.target.closest('[data-action]')?.dataset.action;if(action==='select'){if(e.target.checked)selectedIds.add(v.id);else selectedIds.delete(v.id);row.classList.toggle('selected',selectedIds.has(v.id));updateBulkBar(container,words);}else if(action==='listen')speak(v.word,.8);else if(action==='details')openWordModal(v);else if(action==='master'){setWordStatus(v.id,'mastered');renderList(container);refreshStats(container);}else if(action==='review'){setWordStatus(v.id,'review');renderList(container);refreshStats(container);toast(`“${v.word}” tekrar kuyruğuna alındı.`);}};
  updateBulkBar(container,words);
}

function statusLabel(status){return status==='mastered'?'Öğrenildi':status==='review'?'Tekrar':status==='learning'?'Öğreniliyor':'Yeni';}
function refreshStats(container){const c=countStatuses(getState().vocabulary);container.querySelectorAll('[data-stat-filter]').forEach(btn=>{const strong=btn.querySelector('strong');if(strong)strong.textContent=c[btn.dataset.statFilter]??0;});}
function updateBulkBar(container,visible){const count=container.querySelector('#selectedCount');if(count)count.textContent=`${selectedIds.size} seçili`;const check=container.querySelector('#selectVisibleWords');if(check){check.checked=visible.length>0&&visible.every(v=>selectedIds.has(v.id));check.indeterminate=visible.some(v=>selectedIds.has(v.id))&&!check.checked;}for(const id of ['studyWordsButton','storyWordsButton']){const btn=container.querySelector(`#${id}`);if(btn)btn.disabled=!selectedIds.size&&!visible.length;}}

function selectedOrVisible(){const state=getState();const selected=state.vocabulary.filter(v=>selectedIds.has(v.id));return selected.length?selected:getFilteredWords();}

function startStudy(container){studyWords=selectedOrVisible();if(!studyWords.length){toast('Çalışmak için listede kelime yok.');return;}studyIndex=0;const zone=container.querySelector('#studyZone');zone.hidden=false;renderStudyCard(container,false);zone.scrollIntoView({behavior:'smooth',block:'center'});}
function renderStudyCard(container,revealed){const zone=container.querySelector('#studyZone');if(!zone||!studyWords.length)return;const item=studyWords[studyIndex%studyWords.length];zone.innerHTML=`<div class="card-title"><div><span class="eyebrow">Study list</span><h2>${studyIndex+1} / ${studyWords.length}</h2></div><button class="icon-button" id="closeStudy" type="button">${icon('x')}</button></div><div class="study-word">${escapeHtml(item.word)}</div><div class="word-ipa">${escapeHtml(item.ipa||'')}</div>${revealed?`<div class="study-answer"><strong>${escapeHtml(item.meaningTr||'Anlam eklenmemiş')}</strong><p>${escapeHtml(item.definitionEn||'')}</p>${item.example?`<div class="word-example"><p>${escapeHtml(item.example)}</p></div>`:''}</div>`:`<p class="muted" style="text-align:center">Anlamını zihninden söyle. Sonra cevabı aç.</p>`}<div class="hero-actions" style="justify-content:center"><button class="secondary-button" id="studyListen" type="button">${icon('volume')} Dinle</button>${revealed?`<button class="secondary-button" data-study-rating="review" type="button">${icon('rotate')} Tekrar</button><button class="primary-button" data-study-rating="mastered" type="button">${icon('check')} Biliyorum</button>`:`<button class="primary-button" id="studyReveal" type="button">Cevabı göster</button>`}</div>`;zone.querySelector('#closeStudy')?.addEventListener('click',()=>{zone.hidden=true;});zone.querySelector('#studyListen')?.addEventListener('click',()=>speak(item.word,.8));zone.querySelector('#studyReveal')?.addEventListener('click',()=>renderStudyCard(container,true));zone.querySelectorAll('[data-study-rating]').forEach(btn=>btn.addEventListener('click',()=>{setWordStatus(item.id,btn.dataset.studyRating);studyIndex++;if(studyIndex>=studyWords.length){zone.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon('check')}</div><h3>Liste tamamlandı</h3><p>${studyWords.length} kelimeyi gözden geçirdin.</p></div>`;renderList(container);refreshStats(container);}else renderStudyCard(container,false);}));}

function sendWordsToStory(container){const words=selectedOrVisible();if(!words.length){toast('Hikâye için kelime seç.');return;}updateState(s=>{s.storyBuilderWordIds=words.map(v=>v.id);});toast(`${words.length} kelime hikâye oluşturucuya gönderildi.`);location.hash='#/read';}
async function copyVisibleWords(){const words=selectedOrVisible();if(!words.length){toast('Kopyalanacak kelime yok.');return;}const text=words.map(v=>`${v.word}\t${v.meaningTr||v.definitionEn||''}\t${statusLabel(v.status)}`).join('\n');try{await navigator.clipboard.writeText(text);toast(`${words.length} kelimelik liste panoya kopyalandı.`);}catch{toast('Tarayıcı panoya yazmaya izin vermedi.');}}

function previewImport(container,raw){const parsed=parseVocabulary(raw);const phrases=parsed.filter(x=>x.word.includes(' ')).length;const preview=container.querySelector('#importPreview p');if(preview)preview.textContent=`${parsed.length} kayıt algılandı · ${phrases} çok kelimeli kalıp · ${parsed.filter(x=>x.meaningTr).length} anlamlı kayıt`;}
function importWords(container){const input=container.querySelector('#vocabImportInput');const parsed=parseVocabulary(input.value);if(!parsed.length){toast('İçe aktarılabilecek kelime bulunamadı.');return;}let added=0;for(const e of parsed){const before=getState().vocabulary.length;ensureVocab({...e,source:'import'});if(getState().vocabulary.length>before)added++;}input.value='';previewImport(container,'');toast(`${added} yeni kelime eklendi.`);renderList(container);refreshStats(container);}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function escapeAttr(v){return escapeHtml(v).replace(/`/g,'&#96;');}
