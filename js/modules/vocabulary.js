import { getState } from '../services/storage.js';
import { ensureVocab, getDueWords, reviewWord, setWordStatus } from '../services/srs.js';
import { parseVocabulary } from './vocabImport.js';
import { speak } from '../services/speech.js';
import { icon } from '../ui/icons.js';
import { openWordModal } from '../ui/wordModal.js';
import { toast } from '../ui/toast.js';

let filter='all';
let search='';

export function renderVocabulary(container) {
  const state=getState(); const due=getDueWords(); const savedSentences=(state.savedSentences||[]).slice(0,5);
  container.innerHTML=`<section class="page">
    <header class="page-header"><div><span class="eyebrow">Spaced repetition</span><h1>Vocabulary</h1><p>Okurken kaydettiğin kelimeler burada birikir. Tekrar zamanı geldiğinde SRS kuyruğu onları yeniden önüne getirir.</p></div><span class="badge">${due.length} due</span></header>
    ${due.length?`<section class="card accent" id="reviewZone"><div class="card-title"><div><span class="eyebrow">Review now</span><h2>Bugünkü tekrarlar</h2></div><span class="pill">${due.length} kelime</span></div><div id="reviewCard"></div></section>`:''}
    <div class="grid grid-2" style="margin-top:18px">
      <section class="card">
        <div class="card-title"><h3>Kelime havuzu</h3><span class="pill">${state.vocabulary.length}</span></div>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-bottom:12px"><input id="vocabSearch" class="search-input" placeholder="Kelime ara…" value="${escapeAttr(search)}"/><div class="segmented" id="vocabFilter"><button data-filter="all" class="${filter==='all'?'active':''}">All</button><button data-filter="learning" class="${filter==='learning'?'active':''}">Learning</button><button data-filter="mastered" class="${filter==='mastered'?'active':''}">Mastered</button></div></div>
        <div class="list" id="vocabList"></div>
      </section>
      <aside class="card">
        <span class="eyebrow">Smart import</span><h2 style="margin:0 0 8px">Toplu kelime ekle</h2><p class="muted" style="line-height:1.6">Quizlet kopyaları, <b>word - anlam</b>, sekmeli liste ve alt alta kelime/anlam biçimlerini otomatik ayıklar. <i>star filled, sound, edit</i> gibi arayüz metinlerini yok sayar.</p>
        <label class="field"><span>Kelimeleri yapıştır</span><textarea id="vocabImportInput" placeholder="EXPECT\nBeklemek Ummak\n\nstar filled\nsound\nedit\n\nfigure out - çözmek"></textarea></label>
        <div class="info-banner" id="importPreview"><span>${icon('library')}</span><p>Yapıştırdığın içerik burada analiz edilecek.</p></div>
        <button class="primary-button" id="importVocabButton" type="button" style="width:100%">${icon('plus')} Havuza ekle</button>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)"><div class="card-title"><h3>Kaydedilen cümleler</h3><span class="pill">${state.savedSentences?.length||0}</span></div>${savedSentences.length?`<div class="list">${savedSentences.map(s=>`<div class="list-row"><button class="row-icon" type="button" data-saved-sentence="${encodeURIComponent(s.text)}">${icon('volume')}</button><div class="row-copy"><strong title="${escapeAttr(s.text)}">${escapeHtml(s.text)}</strong><span title="${escapeAttr(s.tr||'')}">${escapeHtml(s.tr||'')}</span></div></div>`).join('')}</div>`:`<p class="muted">Reader’da cümle yanındaki + düğmesiyle kaydedebilirsin.</p>`}</div>
      </aside>
    </div>
  </section>`;
  if(due.length) renderReview(container,due,0);
  renderList(container);
  container.querySelector('#vocabSearch')?.addEventListener('input',e=>{search=e.target.value;renderList(container);});
  container.querySelector('#vocabFilter')?.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;container.querySelectorAll('#vocabFilter button').forEach(x=>x.classList.toggle('active',x===b));renderList(container);});
  container.querySelector('#vocabImportInput')?.addEventListener('input',e=>previewImport(container,e.target.value));
  container.querySelector('#importVocabButton')?.addEventListener('click',()=>importWords(container));
  container.querySelectorAll('[data-saved-sentence]').forEach(btn=>btn.addEventListener('click',()=>speak(decodeURIComponent(btn.dataset.savedSentence),.84)));
}

function renderReview(container,due,index) {
  const card=container.querySelector('#reviewCard'); if(!card)return;
  const fresh=getDueWords();
  if(!fresh.length){card.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon('check')}</div><h3>Bugünkü tekrarlar bitti</h3><p>Yeni kelimeler okuma sırasında tekrar kuyruğuna eklenir.</p></div>`;return;}
  const item=fresh[Math.min(index,fresh.length-1)];
  card.innerHTML=`<div class="review-card"><span class="eyebrow">${item.level||'Vocabulary'} · ${fresh.length} remaining</span><div class="review-word">${escapeHtml(item.word)}</div><div class="word-ipa">${escapeHtml(item.ipa||'')}</div><div class="review-meaning" id="reviewMeaning">Cevabı zihninden söyle ve sonra aç.</div><div class="hero-actions" style="justify-content:center"><button class="secondary-button" id="reviewListen" type="button">${icon('volume')} Dinle</button><button class="primary-button" id="revealReview" type="button">Cevabı göster</button></div><div class="review-actions" id="reviewActions" hidden><button data-rating="again">Again<br><small>10 dk</small></button><button data-rating="hard">Hard<br><small>1 gün</small></button><button data-rating="good">Good<br><small>3+ gün</small></button><button data-rating="easy">Easy<br><small>7+ gün</small></button></div></div>`;
  card.querySelector('#reviewListen')?.addEventListener('click',()=>speak(item.word,.8));
  card.querySelector('#revealReview')?.addEventListener('click',()=>{card.querySelector('#reviewMeaning').innerHTML=`<strong>${escapeHtml(item.meaningTr||item.definitionEn||'Anlam eklenmemiş')}</strong>${item.example?`<div style="margin-top:7px;font-family:var(--font-reading)">${escapeHtml(item.example)}</div>`:''}`;card.querySelector('#reviewActions').hidden=false;card.querySelector('#revealReview').hidden=true;});
  card.querySelector('#reviewActions')?.addEventListener('click',e=>{const b=e.target.closest('[data-rating]');if(!b)return;reviewWord(item.id,b.dataset.rating);renderReview(container,getDueWords(),0);renderList(container);});
}

function renderList(container) {
  const list=container.querySelector('#vocabList');if(!list)return;
  const q=search.trim().toLowerCase();
  const words=getState().vocabulary.filter(v=>(filter==='all'||v.status===filter)&&(!q||`${v.word} ${v.meaningTr||''} ${v.definitionEn||''}`.toLowerCase().includes(q))).sort((a,b)=>String(a.word).localeCompare(String(b.word)));
  if(!words.length){list.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon('library')}</div><h3>Sonuç yok</h3><p>Okurken kelime ekleyebilir veya sağdaki import alanını kullanabilirsin.</p></div>`;return;}
  list.innerHTML=words.map(v=>`<div class="list-row" data-word-id="${v.id}"><button class="row-icon" type="button" data-action="listen" aria-label="Dinle">${icon('volume')}</button><button class="row-copy" type="button" data-action="details" style="border:0;background:none;text-align:left;padding:0"><strong title="${escapeAttr(v.word)}">${escapeHtml(v.word)}</strong><span title="${escapeAttr(v.meaningTr||v.definitionEn||'')}">${escapeHtml(v.meaningTr||v.definitionEn||'Anlam eklenmemiş')}</span></button><span class="badge">${v.status||'learning'}</span><div class="row-actions"><button class="mini-button" type="button" data-action="master" title="Biliyorum">${icon('check')}</button><button class="mini-button" type="button" data-action="review" title="Tekrar">${icon('rotate')}</button></div></div>`).join('');
  list.onclick=e=>{const row=e.target.closest('[data-word-id]');if(!row)return;const v=getState().vocabulary.find(x=>x.id===row.dataset.wordId);if(!v)return;const action=e.target.closest('[data-action]')?.dataset.action;if(action==='listen')speak(v.word,.8);else if(action==='details')openWordModal(v);else if(action==='master'){setWordStatus(v.id,'mastered');renderList(container);}else if(action==='review'){setWordStatus(v.id,'review');renderList(container);toast(`“${v.word}” tekrar kuyruğuna alındı.`);}};
}

function previewImport(container,raw){const parsed=parseVocabulary(raw);const phrases=parsed.filter(x=>x.word.includes(' ')).length;const preview=container.querySelector('#importPreview p');if(preview)preview.textContent=`${parsed.length} kayıt algılandı · ${phrases} çok kelimeli kalıp · ${parsed.filter(x=>x.meaningTr).length} anlamlı kayıt`;}
function importWords(container){const input=container.querySelector('#vocabImportInput');const parsed=parseVocabulary(input.value);if(!parsed.length){toast('İçe aktarılabilecek kelime bulunamadı.');return;}let added=0;for(const e of parsed){const before=getState().vocabulary.length;ensureVocab({...e,source:'import'});if(getState().vocabulary.length>before)added++;}input.value='';previewImport(container,'');toast(`${added} yeni kelime eklendi.`);renderList(container);}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function escapeAttr(v){return escapeHtml(v).replace(/`/g,'&#96;');}
