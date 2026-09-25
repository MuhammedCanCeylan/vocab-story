import { BOOKS, getBook } from '../data/books.js?v=4.2.1';
import { getState, dayKey } from '../services/storage.js?v=4.2.1';
import { getDueWords } from '../services/srs.js?v=4.2.1';
import { icon } from '../ui/icons.js?v=4.2.1';

function weekDays() {
  const result=[];
  for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400000); result.push({key:dayKey(d),label:d.toLocaleDateString('tr-TR',{weekday:'short'}).slice(0,3)}); }
  return result;
}

export function renderHome(container) {
  const state=getState();
  const due=getDueWords();
  const currentBook=(state.generatedLessons||[]).find(b=>b.id===state.reading.currentBookId) || getBook(state.reading.currentBookId);
  const chapterIndex=Math.min(state.reading.currentChapter||0,currentBook.chapters.length-1);
  const chapter=currentBook.chapters[chapterIndex];
  const goal=Number(state.settings.dailyGoal)||3;
  const todayLessons=state.activity.lastActiveDate===dayKey()?state.activity.lessonsToday:0;
  const goalPct=Math.min(100,Math.round(todayLessons/goal*100));
  const mastered=state.vocabulary.filter(v=>v.status==='mastered').length;
  const week=weekDays();
  const max=Math.max(1,...week.map(d=>(state.activity.days[d.key]?.words||0)+(state.activity.days[d.key]?.reviews||0)*3));
  const recent=[...state.vocabulary].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,5);

  container.innerHTML=`<section class="page">
    <div class="hero">
      <div class="hero-card hero-copy">
        <span class="eyebrow">Your English, in context</span>
        <h1>Oku. Konuş. <span>Gerçekten hatırla.</span></h1>
        <p>VocabStory artık yalnızca hikâye üretmiyor. Okuduğun kitapları, keşfettiğin kelimeleri, konuşma pratiğini ve tekrar zamanını tek öğrenme döngüsünde birleştiriyor.</p>
        <div class="hero-actions">
          <a class="primary-button" href="#/read/${currentBook.id}/${chapterIndex}">${icon('book-open')} Okumaya devam et</a>
          <a class="secondary-button" href="#/vocabulary">${icon('brain')} ${due.length} tekrar bekliyor</a>
        </div>
      </div>
      <aside class="hero-card hero-side">
        <div class="metric-large"><span>Günlük seri</span><strong>${state.activity.streak||0} gün</strong><div class="goal-row"><span>Bugünkü hedef</span><b>${Math.min(todayLessons,goal)} / ${goal}</b></div><div class="progress-track"><span style="width:${goalPct}%"></span></div></div>
        <div class="stat-grid" style="grid-template-columns:repeat(2,1fr)">
          <div class="stat-card"><span>Kelime</span><strong>${state.vocabulary.length}</strong></div>
          <div class="stat-card"><span>Öğrenilen</span><strong>${mastered}</strong></div>
          <div class="stat-card"><span>Okunan</span><strong>${state.reading.totalWordsRead||0}</strong></div>
          <div class="stat-card"><span>Konuşma</span><strong>${state.speaking.attempts||0}</strong></div>
        </div>
      </aside>
    </div>

    <div class="grid grid-2">
      <article class="card accent">
        <div class="card-title"><div><span class="eyebrow">Continue reading</span><h2>${currentBook.title}</h2></div><span class="level-badge">${currentBook.level}</span></div>
        <p class="muted">Bölüm ${chapterIndex+1}/${currentBook.chapters.length} · ${chapter.title}</p>
        <div class="progress-track" style="margin:18px 0"><span style="width:${Math.round((chapterIndex/currentBook.chapters.length)*100)}%"></span></div>
        <a class="primary-button" href="#/read/${currentBook.id}/${chapterIndex}">Bölümü aç ${icon('arrow')}</a>
      </article>
      <article class="card">
        <div class="card-title"><div><span class="eyebrow">Last 7 days</span><h2>Öğrenme ritmi</h2></div></div>
        <div class="week-chart">${week.map(d=>{const val=(state.activity.days[d.key]?.words||0)+(state.activity.days[d.key]?.reviews||0)*3;return `<div class="week-bar"><span title="${val} puan" style="height:${Math.max(4,Math.round(val/max*120))}px"></span><small>${d.label}</small></div>`}).join('')}</div>
      </article>
    </div>

    <div class="grid grid-2" style="margin-top:18px">
      <article class="card">
        <div class="card-title"><h3>Son eklenen kelimeler</h3><a class="pill" href="#/vocabulary">Tümünü gör</a></div>
        ${recent.length?`<div class="list">${recent.map(v=>`<div class="list-row"><div class="row-icon">${icon('library')}</div><div class="row-copy"><strong>${escapeHtml(v.word)}</strong><span>${escapeHtml(v.meaningTr||v.definitionEn||'Anlam eklenmemiş')}</span></div><span class="badge">${v.status||'learning'}</span></div>`).join('')}</div>`:`<div class="empty-state"><div class="empty-icon">${icon('library')}</div><h3>Henüz kelime yok</h3><p>Okurken bir kelimeye dokunup çalışma havuzuna ekle.</p></div>`}
      </article>
      <article class="card">
        <div class="card-title"><h3>Sana uygun kitaplar</h3><a class="pill" href="#/read">Library</a></div>
        <div class="list">${BOOKS.slice(0,3).map(b=>`<a class="list-row" href="#/read/${b.id}/0"><div class="row-icon">${icon('book-open')}</div><div class="row-copy"><strong>${b.title}</strong><span>${b.level} · ${b.genre}</span></div>${icon('arrow')}</a>`).join('')}</div>
      </article>
    </div>
  </section>`;
}

function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
