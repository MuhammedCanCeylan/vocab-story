import { icon } from './icons.js?v=4.2.0';
import { speak } from '../services/speech.js?v=4.2.0';
import { ensureVocab, normalizeKey, setWordStatus } from '../services/srs.js?v=4.2.0';
import { getState } from '../services/storage.js?v=4.2.0';
import { toast } from './toast.js?v=4.2.0';

let activeEntry = null;

export function isSaved(word) {
  return getState().vocabulary.some(v => normalizeKey(v.word) === normalizeKey(word));
}

function savedItem(word){return getState().vocabulary.find(v=>normalizeKey(v.word)===normalizeKey(word))||null;}

export function openWordModal(entry) {
  activeEntry = entry;
  const modal = document.getElementById('wordModal');
  const title = document.getElementById('wordModalTitle');
  const meta = document.getElementById('wordModalMeta');
  const body = document.getElementById('wordModalBody');
  if (!modal || !title || !body) return;
  title.textContent = entry.word;
  meta.textContent = [entry.level, entry.type].filter(Boolean).join(' · ') || 'Vocabulary';
  const saved = savedItem(entry.word);
  const status=saved?.status||'unsaved';
  body.innerHTML = `
    <div class="word-ipa">${escapeHtml(entry.ipa || 'IPA not available')}</div>
    <div class="word-definition">
      <strong>Explain in English</strong>
      <p>${escapeHtml(entry.definitionEn || 'No English definition is available yet.')}</p>
    </div>
    <div class="word-definition" style="margin-top:10px">
      <strong>Türkçe bağlam anlamı</strong>
      <p>${escapeHtml(entry.meaningTr || 'Henüz Türkçe anlam eklenmemiş.')}</p>
    </div>
    ${entry.contextSentence ? `<div class="reader-context-card"><strong>Hikâyedeki cümle</strong><p class="context-en">${escapeHtml(entry.contextSentence)}</p><p class="context-tr">${escapeHtml(entry.contextSentenceTr || 'Cümle çevirisi yok.')}</p></div>` : ''}
    ${entry.example && entry.example !== entry.contextSentence ? `<div class="word-example"><p>${escapeHtml(entry.example)}</p></div>` : ''}
    <div class="word-status-actions" id="modalStatusActions">
      <button class="word-status-btn learning ${status==='learning'?'active':''}" data-status="learning" type="button">${icon('plus')} Öğrenilecek</button>
      <button class="word-status-btn review ${status==='review'?'active':''}" data-status="review" type="button">${icon('rotate')} Tekrar</button>
      <button class="word-status-btn mastered ${status==='mastered'?'active':''}" data-status="mastered" type="button">${icon('check')} Biliyorum</button>
    </div>
    <div class="word-modal-actions">
      <button class="secondary-button" id="wordListenButton" type="button">${icon('volume')} Dinle</button>
      <button class="ghost-button" id="wordCloseButton" type="button">Kapat</button>
    </div>`;
  document.getElementById('wordListenButton')?.addEventListener('click', () => speak(entry.word,.8));
  document.getElementById('wordCloseButton')?.addEventListener('click',closeWordModal);
  document.getElementById('modalStatusActions')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-status]');if(!btn)return;
    const item=ensureVocab({...entry,source:entry.source||'reader'});if(!item)return;
    setWordStatus(item.id,btn.dataset.status);
    document.querySelectorAll('#modalStatusActions [data-status]').forEach(x=>x.classList.toggle('active',x===btn));
    const encoded=encodeURIComponent(normalizeKey(entry.word));
    document.querySelectorAll(`[data-word-key="${encoded}"]`).forEach(el=>{el.classList.remove('status-unsaved','status-learning','status-review','status-mastered');el.classList.add(`status-${btn.dataset.status}`);if(el.classList.contains('reader-word')||el.classList.contains('chapter-word-row'))el.classList.add('in-vocabulary');const small=el.querySelector('small');if(small&&el.classList.contains('chapter-vocab-pill'))small.textContent=btn.dataset.status==='mastered'?'Öğrenildi':btn.dataset.status==='review'?'Tekrar':'Öğreniliyor';});
    toast(btn.dataset.status==='mastered'?`“${entry.word}” öğrenildi olarak işaretlendi.`:btn.dataset.status==='review'?`“${entry.word}” tekrar listesine alındı.`:`“${entry.word}” öğrenme listesine eklendi.`);
  });
  modal.classList.add('visible');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

export function closeWordModal() {
  const modal=document.getElementById('wordModal');
  modal?.classList.remove('visible');
  modal?.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  activeEntry=null;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
