import { BOOKS } from '../data/books.js?v=4.1.1';
import { getState, dayKey } from '../services/storage.js?v=4.1.1';
import { getDueWords } from '../services/srs.js?v=4.1.1';
import { icon } from '../ui/icons.js?v=4.1.1';

function week() {
  const days=[];
  for(let i=6;i>=0;i--){const d=new Date(Date.now()-i*86400000);days.push({key:dayKey(d),label:d.toLocaleDateString('tr-TR',{weekday:'short'}).slice(0,3)});}return days;
}

export function renderProgress(container) {
  const s=getState();
  const mastered=s.vocabulary.filter(v=>v.status==='mastered').length;
  const learning=s.vocabulary.filter(v=>v.status!=='mastered').length;
  const due=getDueWords().length;
  const accuracy=s.quiz.total?Math.round(s.quiz.correct/s.quiz.total*100):0;
  const speakingAvg=s.speaking.attempts?Math.round(s.speaking.totalScore/s.speaking.attempts*100):0;
  const days=week(); const vals=days.map(d=>(s.activity.days[d.key]?.words||0)+(s.activity.days[d.key]?.reviews||0)*3+(s.activity.days[d.key]?.speaking||0)*10); const max=Math.max(1,...vals);
  const allBooks=[...(s.generatedLessons||[]),...BOOKS];
  container.innerHTML=`<section class="page">
    <header class="page-header"><div><span class="eyebrow">Learning analytics</span><h1>Progress</h1><p>Sadece yüzde değil: ne kadar okuduğunu, hangi kelimelerin gerçekten kalıcılaştığını ve konuşma pratiğinin nasıl ilerlediğini gör.</p></div><span class="badge">${s.activity.streak||0} day streak</span></header>
    <div class="stat-grid">
      <div class="stat-card"><span>Words read</span><strong>${s.reading.totalWordsRead||0}</strong></div>
      <div class="stat-card"><span>Mastered</span><strong>${mastered}</strong></div>
      <div class="stat-card"><span>Quiz accuracy</span><strong>${accuracy}%</strong></div>
      <div class="stat-card"><span>Speaking avg.</span><strong>${speakingAvg}%</strong></div>
    </div>
    <div class="grid grid-2" style="margin-top:18px">
      <article class="card"><div class="card-title"><div><span class="eyebrow">Last 7 days</span><h2>Haftalık aktivite</h2></div></div><div class="week-chart">${days.map((d,i)=>`<div class="week-bar"><span style="height:${Math.max(4,Math.round(vals[i]/max*120))}px" title="${vals[i]} activity points"></span><small>${d.label}</small></div>`).join('')}</div></article>
      <article class="card"><div class="card-title"><div><span class="eyebrow">Vocabulary health</span><h2>Kelime durumu</h2></div></div><div class="list"><div class="list-row"><div class="row-icon">${icon('check')}</div><div class="row-copy"><strong>${mastered} mastered</strong><span>Uzun aralıklı tekrar aşamasında</span></div></div><div class="list-row"><div class="row-icon">${icon('brain')}</div><div class="row-copy"><strong>${learning} learning</strong><span>Aktif öğrenme havuzunda</span></div></div><div class="list-row"><div class="row-icon">${icon('clock')}</div><div class="row-copy"><strong>${due} due now</strong><span>Bugün tekrar edilmesi gerekiyor</span></div></div></div></article>
    </div>
    <div class="grid grid-2" style="margin-top:18px">
      <article class="card"><div class="card-title"><h2>Kitap ilerlemesi</h2></div><div class="list">${allBooks.map(book=>{const done=book.chapters.filter((_,i)=>s.reading.completedChapters[`${book.id}:${i}`]).length;const pct=Math.round(done/book.chapters.length*100);return `<a class="list-row" href="#/read/${book.id}/${Math.min(done,book.chapters.length-1)}"><div class="row-icon">${icon('book-open')}</div><div class="row-copy"><strong>${book.title}</strong><span>${done}/${book.chapters.length} bölüm · ${pct}%</span><div class="progress-track" style="margin-top:7px"><span style="width:${pct}%"></span></div></div>${icon('arrow')}</a>`}).join('')}</div></article>
      <article class="card accent"><span class="eyebrow">Milestones</span><h2 style="margin:0 0 16px">Bir sonraki hedefler</h2><div class="list">${milestone('1.000 kelime oku',s.reading.totalWordsRead||0,1000)}${milestone('50 kelime öğren',mastered,50)}${milestone('20 konuşma denemesi',s.speaking.attempts||0,20)}${milestone('7 günlük seri',s.activity.streak||0,7)}</div></article>
    </div>
  </section>`;
}

function milestone(label,current,target){const pct=Math.min(100,Math.round(current/target*100));return `<div class="list-row"><div class="row-copy"><strong>${label}</strong><span>${current} / ${target}</span><div class="progress-track" style="margin-top:7px"><span style="width:${pct}%"></span></div></div><span class="badge">${pct}%</span></div>`;}
