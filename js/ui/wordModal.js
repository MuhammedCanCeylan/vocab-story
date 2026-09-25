import { icon } from './icons.js';
import { speak } from '../services/speech.js';
import { ensureVocab, normalizeKey } from '../services/srs.js';
import { getState } from '../services/storage.js';
import { toast } from './toast.js';

let activeEntry = null;

export function isSaved(word) {
  return getState().vocabulary.some(v => normalizeKey(v.word) === normalizeKey(word));
}

export function openWordModal(entry) {
  activeEntry = entry;
  const modal = document.getElementById('wordModal');
  const title = document.getElementById('wordModalTitle');
  const meta = document.getElementById('wordModalMeta');
  const body = document.getElementById('wordModalBody');
  if (!modal || !title || !body) return;
  title.textContent = entry.word;
  meta.textContent = [entry.level, entry.type].filter(Boolean).join(' · ') || 'Vocabulary';
  const saved = isSaved(entry.word);
  body.innerHTML = `
    <div class="word-ipa">${escapeHtml(entry.ipa || 'IPA not available')}</div>
    <div class="word-definition">
      <strong>Explain in English</strong>
      <p>${escapeHtml(entry.definitionEn || 'No English definition is available yet.')}</p>
    </div>
    <button class="ghost-button" id="toggleTurkishMeaning" type="button" style="width:100%;margin-top:10px">Türkçe anlamı göster</button>
    <div class="word-definition" id="turkishMeaningBlock" style="margin-top:10px;display:none">
      <strong>Türkçe bağlam anlamı</strong>
      <p>${escapeHtml(entry.meaningTr || 'Henüz Türkçe anlam eklenmemiş.')}</p>
    </div>
    ${entry.example ? `<div class="word-example"><p>${escapeHtml(entry.example)}</p></div>` : ''}
    <div class="word-modal-actions">
      <button class="secondary-button" id="wordListenButton" type="button">${icon('volume')} Dinle</button>
      <button class="primary-button" id="wordSaveButton" type="button" ${saved ? 'disabled' : ''}>${icon(saved ? 'check':'plus')} ${saved ? 'Kelime havuzunda':'Kelime havuzuna ekle'}</button>
    </div>`;
  document.getElementById('wordListenButton')?.addEventListener('click', () => speak(entry.word,.8));
  document.getElementById('toggleTurkishMeaning')?.addEventListener('click', e => { const block=document.getElementById('turkishMeaningBlock'); const show=block.style.display==='none'; block.style.display=show?'block':'none'; e.currentTarget.textContent=show?'Türkçe anlamı gizle':'Türkçe anlamı göster'; });
  document.getElementById('wordSaveButton')?.addEventListener('click', () => {
    ensureVocab({...entry, source:entry.source || 'reader'});
    toast(`“${entry.word}” tekrar sistemine eklendi.`);
    closeWordModal();
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
