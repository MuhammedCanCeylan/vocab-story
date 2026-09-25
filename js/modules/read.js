import { BOOKS } from '../data/books.js';
import { getState, updateState, registerActivity } from '../services/storage.js';
import { normalizeKey, ensureVocab } from '../services/srs.js';
import { speak, stopSpeaking } from '../services/speech.js';
import { icon } from '../ui/icons.js';
import { openWordModal } from '../ui/wordModal.js';
import { toast } from '../ui/toast.js';
import { generateJson, extractGeminiJson } from '../services/gemini.js';

export function renderRead(container, routeParts=[]) {
  const bookId=routeParts[0];
  if (!bookId) return renderLibrary(container);
  const chapterIndex=Number(routeParts[1]||0);
  return renderReader(container,bookId,chapterIndex);
}

function renderLibrary(container) {
  const state=getState();
  const books=[...(state.generatedLessons||[]),...BOOKS];
  container.innerHTML=`<section class="page">
    <header class="page-header"><div><span class="eyebrow">Graded library</span><h1>Read</h1><p>Hikâyeleri seviyene göre oku. Her cümlede çeviri, her önemli kelimede IPA, bağlam açıklaması ve ses var.</p></div><span class="badge">${books.length} kitap · ${books.reduce((a,b)=>a+b.chapters.length,0)} bölüm</span></header>
    <section class="card accent" style="margin-bottom:18px"><div class="card-title"><div><span class="eyebrow">AI graded reader</span><h2>Kelime havuzundan yeni hikâye üret</h2></div><span class="pill">Gemini</span></div><div class="grid grid-3"><label class="field"><span>Seviye</span><select id="aiStoryLevel">${['A1','A2','B1','B2','C1','C2'].map(l=>`<option ${state.settings.level===l?'selected':''}>${l}</option>`).join('')}</select></label><label class="field"><span>Format</span><select id="aiStoryFormat"><option value="story">Story</option><option value="dialogue">Dialogue</option><option value="scenario">Daily scenario</option></select></label><label class="field"><span>Uzunluk</span><select id="aiStoryLength"><option value="short">Kısa</option><option value="medium" selected>Orta</option><option value="long">Uzun</option></select></label></div><button class="primary-button" id="generateStoryButton" type="button">${icon('spark')} Yeni öğretici hikâye oluştur</button></section>
    <div class="segmented" id="levelFilter" style="max-width:520px;margin-bottom:20px"><button class="active" data-level="all">Tümü</button><button data-level="A1">A1</button><button data-level="A2">A2</button><button data-level="B1">B1</button><button data-level="B2">B2+</button></div>
    <div class="book-grid" id="bookGrid">${books.map(book=>bookCard(book,state)).join('')}</div>
  </section>`;
  container.querySelector('#levelFilter')?.addEventListener('click',e=>{
    const btn=e.target.closest('button[data-level]'); if(!btn)return;
    container.querySelectorAll('#levelFilter button').forEach(b=>b.classList.toggle('active',b===btn));
    const level=btn.dataset.level;
    container.querySelectorAll('[data-book-level]').forEach(card=>{card.style.display=(level==='all'||card.dataset.bookLevel===level||(level==='B2'&&['B2','C1','C2'].includes(card.dataset.bookLevel)))?'':'none';});
  });
  container.querySelector('#generateStoryButton')?.addEventListener('click',()=>generateAiStory(container));
}


function resolveChapter(bookId,chapterIndex=0){
  const state=getState();
  const book=BOOKS.find(b=>b.id===bookId)||(state.generatedLessons||[]).find(b=>b.id===bookId)||BOOKS[0];
  const safeIndex=Math.max(0,Math.min(Number(chapterIndex)||0,book.chapters.length-1));
  return {book,chapter:book.chapters[safeIndex],chapterIndex:safeIndex};
}

async function generateAiStory(container){
  const state=getState();
  if(!state.settings.apiKey && !state.settings.proxyEndpoint){toast('Hikâye üretmek için Ayarlar → AI bölümünden API anahtarı veya proxy ekle.');window.dispatchEvent(new CustomEvent('vocabstory:open-settings',{detail:'ai'}));return;}
  const level=container.querySelector('#aiStoryLevel')?.value||state.settings.level;
  const format=container.querySelector('#aiStoryFormat')?.value||'story';
  const length=container.querySelector('#aiStoryLength')?.value||'medium';
  const ranges={short:'90-120',medium:'150-190',long:'220-280'};
  const targets=state.vocabulary.filter(v=>v.status!=='mastered').slice().sort((a,b)=>(a.dueAt||0)-(b.dueAt||0)).slice(0,7);
  const targetText=targets.length?targets.map(v=>`${v.word}${v.meaningTr?` (${v.meaningTr})`:''}`).join(', '):'No required target words; choose useful everyday vocabulary.';
  const button=container.querySelector('#generateStoryButton'); button.disabled=true;
  const prompt=`You are an expert CEFR graded-reader editor. Create one educational English reading chapter at ${level} level. Format: ${format}. Length: ${ranges[length]} words. Target vocabulary: ${targetText}. Make it feel like a real story/conversation, not a textbook. Return ONLY valid JSON with this exact shape: {"title":"book title","chapterTitle":"chapter title","summary":"one sentence summary in Turkish","sentences":[{"text":"English sentence","tr":"natural Turkish translation"}],"vocabulary":[{"word":"word or multiword phrase","ipa":"/American IPA/","definitionEn":"simple English definition appropriate for ${level}","meaningTr":"Turkish meaning in this context","example":"new English example sentence","type":"noun|verb|adjective|adverb|phrase|phrasal verb","level":"${level}"}],"quiz":[{"q":"English comprehension question","options":["...","...","..."],"answer":0,"explanation":"short Turkish explanation"},{"q":"...","options":["...","...","..."],"answer":1,"explanation":"..."}]}. Include the target words naturally when possible. Split the reading into 6-12 sentence objects. Vocabulary should contain 5-8 useful items including multiword expressions when relevant.`;
  try{
    const {data,model}=await generateJson(prompt,{onAttempt:({model,attempt})=>{button.textContent=attempt>1?`${model} tekrar deneniyor…`:`${model} ile hazırlanıyor…`;}});
    const result=extractGeminiJson(data);
    if(!Array.isArray(result.sentences)||!result.sentences.length)throw new Error('Generated story has no sentences');
    const id=`ai-${Date.now()}`;
    const generated={id,title:result.title||'AI Story',subtitle:'Kelime havuzuna göre oluşturuldu.',level,genre:'AI graded story',minutes:Math.max(6,Math.ceil(result.sentences.length*1.3)),cover:['#675cf0','#00a2be'],generated:true,model,chapters:[{title:result.chapterTitle||'New Chapter',summary:result.summary||'AI tarafından oluşturulan öğretici bölüm.',sentences:result.sentences.map(s=>({text:String(s.text||''),tr:String(s.tr||'')})).filter(s=>s.text),vocabulary:Array.isArray(result.vocabulary)?result.vocabulary:[],quiz:Array.isArray(result.quiz)?result.quiz:[]}]};
    updateState(s=>{s.generatedLessons.unshift(generated);s.generatedLessons=s.generatedLessons.slice(0,20);});
    toast(`${model} ile yeni graded story oluşturuldu.`);
    location.hash=`#/read/${id}/0`;
  }catch(err){console.error(err);toast(err.status===503?'Gemini şu anda yoğun; fallback modeller de denendi. Biraz sonra tekrar deneyebilirsin.':'Hikâye üretilemedi. AI ayarlarını ve bağlantıyı kontrol et.');}
  finally{button.disabled=false;button.innerHTML=`${icon('spark')} Yeni öğretici hikâye oluştur`;}
}

function bookCard(book,state) {
  const completed=book.chapters.filter((_,i)=>state.reading.completedChapters[`${book.id}:${i}`]).length;
  const pct=Math.round(completed/book.chapters.length*100);
  return `<a class="card book-card" data-book-level="${book.level}" href="#/read/${book.id}/${Math.min(completed,book.chapters.length-1)}">
    <div class="book-cover" style="--cover-a:${book.cover[0]};--cover-b:${book.cover[1]}"><span class="level-badge">${book.level}</span><h3>${escapeHtml(book.title)}</h3><p>${escapeHtml(book.genre)}</p></div>
    <div class="book-meta"><div><strong>${completed}/${book.chapters.length} bölüm</strong><span style="display:block;margin-top:4px">${book.minutes} dk · ${pct}% tamamlandı</span></div>${icon('arrow')}</div>
  </a>`;
}

function renderReader(container,bookId,chapterIndex) {
  const {book,chapter,chapterIndex:safeIndex}=resolveChapter(bookId,chapterIndex);
  const state=getState();
  const focus=state.settings.readerMode==='focus';
  updateState(s=>{s.reading.currentBookId=book.id;s.reading.currentChapter=safeIndex;});
  const words=chapter.sentences.map(s=>s.text).join(' ').match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)?.length||0;
  const completed=!!getState().reading.completedChapters[`${book.id}:${safeIndex}`];
  const savedKeys=new Set(state.vocabulary.map(v=>normalizeKey(v.word)));
  const coverage=chapter.vocabulary.length?Math.round(chapter.vocabulary.filter(v=>savedKeys.has(normalizeKey(v.word))).length/chapter.vocabulary.length*100):0;

  container.innerHTML=`<section class="page ${focus?'reader-focus-mode':''}" id="readerPage">
    <div class="reader-toolbar">
      <div class="left"><a class="mini-button" href="#/read" aria-label="Kitaplığa dön">${icon('arrow-left')}</a><span class="badge">${book.level}</span><span class="pill">${safeIndex+1}/${book.chapters.length}</span></div>
      <div class="right"><button class="mini-button" id="playChapterButton" type="button" title="Bölümü dinle">${icon('volume')}</button><button class="mini-button" id="readerModeButton" type="button" title="Focus/Learning görünümü">${icon(focus?'brain':'book-open')}</button></div>
    </div>
    <div class="reader-shell">
      <article class="reader-page">
        <header class="reader-heading"><span class="book-kicker">${escapeHtml(book.title)} · Chapter ${safeIndex+1}</span><h1>${escapeHtml(chapter.title)}</h1><p>${escapeHtml(chapter.summary)}</p></header>
        <section class="chapter-vocab"><h3>Bu bölümde karşılaşacağın ${chapter.vocabulary.length} ifade</h3><div class="chapter-vocab-list">${chapter.vocabulary.map((v,i)=>`<button class="pill" type="button" data-vocab-index="${i}">${escapeHtml(v.word)}</button>`).join('')}</div></section>
        <div class="reading-content" id="readingContent">${chapter.sentences.map((s,i)=>sentenceHtml(s,i,chapter.vocabulary)).join('')}</div>
        <section class="quiz-block" id="chapterQuiz"><span class="eyebrow">Comprehension</span><h3>Bölümü anladın mı?</h3>${chapter.quiz.map((q,qi)=>quizHtml(q,qi)).join('')}</section>
        <section class="quiz-block" id="retellBlock"><span class="eyebrow">Active recall</span><h3>Bu bölümü kendi cümlelerinle anlat</h3><p class="muted">İngilizce 2–4 cümle yaz. AI, seviyene göre anlaşılabilirlik ve dil kullanımı hakkında kısa geri bildirim verebilir.</p><label class="field"><span>Your retelling</span><textarea id="retellInput" placeholder="In this chapter, Maya..."></textarea></label><button class="secondary-button" id="retellFeedbackButton" type="button">${icon('spark')} AI feedback</button><div id="retellFeedback" style="margin-top:12px"></div></section>
        <section class="chapter-complete"><h3>${completed?'Bu bölümü tamamladın.':'Bölümü bitirdin mi?'}</h3><p>${words} kelime okudun. Bitirdiğinde ilerlemen ve günlük serin güncellenir.</p><button class="primary-button" id="completeChapterButton" type="button">${icon('check')} ${completed?'Tamamlandı':'Bölümü tamamla'}</button></section>
        <nav class="reader-nav">${safeIndex>0?`<a class="secondary-button" href="#/read/${book.id}/${safeIndex-1}">${icon('arrow-left')} Önceki bölüm</a>`:'<span></span>'}${safeIndex<book.chapters.length-1?`<a class="primary-button" href="#/read/${book.id}/${safeIndex+1}">Sonraki bölüm ${icon('arrow')}</a>`:`<a class="primary-button" href="#/read">Kitaplığa dön ${icon('arrow')}</a>`}</nav>
      </article>
      <aside class="reader-side">
        <section class="card learning-panel" id="learningPanel"><span class="eyebrow">Learning panel</span><h3>Bir kelime seç</h3><p class="muted">Okurken bir kelime veya kalıba dokun. İngilizce açıklaması önce burada görünür; Türkçe anlam ve ayrıntılar ikinci adımda açılır.</p></section>
        <section class="card reader-progress"><div class="reader-progress-row"><span>Kitap ilerlemesi</span><strong>${book.chapters.filter((_,i)=>getState().reading.completedChapters[`${book.id}:${i}`]).length}/${book.chapters.length}</strong></div><div class="progress-track"><span style="width:${Math.round(book.chapters.filter((_,i)=>getState().reading.completedChapters[`${book.id}:${i}`]).length/book.chapters.length*100)}%"></span></div><div class="reader-progress-row" style="margin-top:15px"><span>Bu bölüm</span><strong>${words} kelime</strong></div><div class="reader-progress-row" style="margin-top:15px"><span>Hedef kelime coverage</span><strong>${coverage}%</strong></div><div class="progress-track"><span style="width:${coverage}%"></span></div></section>
        ${chapter.grammar?`<section class="card"><span class="eyebrow">Grammar discovery</span><h3 style="margin:0 0 8px">${escapeHtml(chapter.grammar.title)}</h3><p class="muted" style="line-height:1.6">${escapeHtml(chapter.grammar.note)}</p><div class="word-example"><p>${escapeHtml(chapter.grammar.example)}</p></div></section>`:''}
      </aside>
    </div>
  </section>`;

  const page=container.querySelector('#readerPage');
  container.querySelector('#playChapterButton')?.addEventListener('click',()=>speak(chapter.sentences.map(s=>s.text).join(' '),.84));
  container.querySelector('#readerModeButton')?.addEventListener('click',()=>{
    const nowFocus=!page.classList.contains('reader-focus-mode'); page.classList.toggle('reader-focus-mode',nowFocus);
    updateState(s=>{s.settings.readerMode=nowFocus?'focus':'learning';});
  });
  container.querySelectorAll('[data-vocab-index]').forEach(btn=>btn.addEventListener('click',()=>selectEntry({...chapter.vocabulary[Number(btn.dataset.vocabIndex)],source:`${book.title} — ${chapter.title}`},container,true)));
  container.querySelector('#readingContent')?.addEventListener('click',e=>handleReadingClick(e,chapter,container));
  container.querySelector('#chapterQuiz')?.addEventListener('click',e=>handleQuizClick(e,chapter));
  container.querySelector('#retellFeedbackButton')?.addEventListener('click',()=>evaluateRetelling(book,chapter,container));
  container.querySelector('#completeChapterButton')?.addEventListener('click',()=>completeChapter(book,safeIndex,words,container));
  window.addEventListener('hashchange',stopSpeaking,{once:true});
}

function sentenceHtml(sentence,index,vocab) {
  return `<div class="sentence-row" data-sentence="${index}"><p class="sentence-text">${interactiveText(sentence.text,vocab)}</p><div class="sentence-actions"><button type="button" data-action="speak" title="Cümleyi dinle">${icon('volume')}</button><button type="button" data-action="translate" title="Türkçe çeviri">${icon('translate')}</button><button type="button" data-action="save-sentence" title="Cümleyi kaydet">${icon('plus')}</button></div><div class="sentence-translation">${escapeHtml(sentence.tr)}</div></div>`;
}

function interactiveText(text,vocab) {
  const map=new Map(vocab.map((v,i)=>[normalizeKey(v.word),i]));
  const phrases=[...map.keys()].filter(k=>k.includes(' ')).sort((a,b)=>b.length-a.length).map(escapeRegExp);
  const wordPattern="[A-Za-z]+(?:['’][A-Za-z]+)?";
  const pattern=phrases.length?`${phrases.join('|')}|${wordPattern}`:wordPattern;
  const re=new RegExp(`\\b(?:${pattern})\\b`,'gi');
  let out='',cursor=0,m;
  while((m=re.exec(text))){
    out+=escapeHtml(text.slice(cursor,m.index));
    const visible=m[0],key=normalizeKey(visible),idx=map.get(key);
    out+=`<span class="reader-word ${idx!==undefined?'target':''}" data-reader-word="${encodeURIComponent(visible)}" ${idx!==undefined?`data-vocab-index="${idx}"`:''}>${escapeHtml(visible)}</span>`;
    cursor=m.index+visible.length;
  }
  return out+escapeHtml(text.slice(cursor));
}

function handleReadingClick(event,chapter,container) {
  const row=event.target.closest('.sentence-row'); if(!row)return;
  const index=Number(row.dataset.sentence); const sentence=chapter.sentences[index];
  const action=event.target.closest('button[data-action]');
  if(action){ if(action.dataset.action==='speak')speak(sentence.text,.84); else if(action.dataset.action==='translate')row.classList.toggle('translation-visible'); else if(action.dataset.action==='save-sentence')saveSentence(sentence); return; }
  const word=event.target.closest('[data-reader-word]'); if(!word)return;
  const visible=decodeURIComponent(word.dataset.readerWord);
  const entryIndex=word.dataset.vocabIndex;
  const entry=entryIndex!==undefined?chapter.vocabulary[Number(entryIndex)]:{word:visible,ipa:'',definitionEn:'This word is not one of the chapter targets yet. You can still save it and add a meaning later.',meaningTr:'',example:sentence.text,type:'word',level:'',source:'reader'};
  selectEntry({...entry,source:'reader'},container,window.innerWidth<900);
}

function selectEntry(entry,container,openModal=false) {
  const panel=container.querySelector('#learningPanel');
  if(panel){panel.innerHTML=`<span class="eyebrow">${escapeHtml([entry.level,entry.type].filter(Boolean).join(' · ')||'Vocabulary')}</span><div class="selected-word">${escapeHtml(entry.word)}</div><div class="selected-ipa">${escapeHtml(entry.ipa||'IPA not available')}</div><div class="selected-definition">${escapeHtml(entry.definitionEn||'No English definition yet.')}</div>${entry.example?`<div class="word-example"><p>${escapeHtml(entry.example)}</p></div>`:''}<div class="word-modal-actions"><button class="secondary-button" type="button" id="panelListen">${icon('volume')} Dinle</button><button class="primary-button" type="button" id="panelDetails">Ayrıntılar</button></div>`;
    panel.querySelector('#panelListen')?.addEventListener('click',()=>speak(entry.word,.8));
    panel.querySelector('#panelDetails')?.addEventListener('click',()=>openWordModal(entry));
  }
  if(openModal)openWordModal(entry);
}


function saveSentence(sentence){
  let exists=false;
  updateState(s=>{
    exists=(s.savedSentences||[]).some(x=>x.text===sentence.text);
    if(!exists){s.savedSentences.unshift({id:`s_${Date.now()}`,text:sentence.text,tr:sentence.tr,createdAt:Date.now()});s.savedSentences=s.savedSentences.slice(0,100);}
  });
  toast(exists?'Bu cümle zaten kayıtlı.':'Cümle çalışma listene kaydedildi.');
}

async function evaluateRetelling(book,chapter,container){
  const input=container.querySelector('#retellInput'); const output=container.querySelector('#retellFeedback'); const button=container.querySelector('#retellFeedbackButton');
  const answer=input?.value.trim(); if(!answer){toast('Önce bölümü 2–4 İngilizce cümleyle anlat.');return;}
  const state=getState(); if(!state.settings.apiKey&&!state.settings.proxyEndpoint){toast('AI feedback için Ayarlar → AI bölümünden API anahtarı veya proxy ekle.');window.dispatchEvent(new CustomEvent('vocabstory:open-settings',{detail:'ai'}));return;}
  button.disabled=true;
  const source=chapter.sentences.map(s=>s.text).join(' ');
  const prompt=`You are a supportive English teacher. Student CEFR level: ${book.level}. Source chapter: ${source}. Student retelling: ${answer}. Evaluate meaning first, then language. Return ONLY JSON: {"score":0,"feedbackTr":"2-3 short Turkish sentences","strengths":["..."],"corrections":[{"original":"...","better":"...","reasonTr":"..."}],"improvedVersion":"a natural corrected version at ${book.level} level"}. Score is 0-100. Do not penalize the student for not repeating every detail.`;
  try{
    const {data,model}=await generateJson(prompt,{onAttempt:({model,attempt})=>{button.textContent=attempt>1?`${model} tekrar…`:`${model} değerlendiriyor…`;}});
    const result=extractGeminiJson(data);
    output.innerHTML=`<div class="word-definition"><strong>Score · ${Number(result.score)||0}/100</strong><p>${escapeHtml(result.feedbackTr||'')}</p></div>${Array.isArray(result.corrections)&&result.corrections.length?`<div class="list" style="margin-top:10px">${result.corrections.slice(0,3).map(c=>`<div class="list-row"><div class="row-copy"><strong>${escapeHtml(c.original||'')}</strong><span style="white-space:normal">→ ${escapeHtml(c.better||'')} · ${escapeHtml(c.reasonTr||'')}</span></div></div>`).join('')}</div>`:''}${result.improvedVersion?`<div class="word-example"><p>${escapeHtml(result.improvedVersion)}</p></div>`:''}<small class="muted" style="display:block;margin-top:8px">${escapeHtml(model)} ile değerlendirildi.</small>`;
  }catch(err){console.error(err);toast(err.status===503?'Gemini şu anda yoğun. Retelling metnin kaybolmadı; daha sonra tekrar deneyebilirsin.':'AI feedback alınamadı.');}
  finally{button.disabled=false;button.innerHTML=`${icon('spark')} AI feedback`;}
}

function quizHtml(q,qi){return `<div class="quiz-question" data-question="${qi}"><p>${escapeHtml(q.q)}</p><div class="quiz-options">${q.options.map((opt,oi)=>`<button class="quiz-option" type="button" data-option="${oi}">${escapeHtml(opt)}</button>`).join('')}</div><small class="muted quiz-explanation"></small></div>`;}
function handleQuizClick(event,chapter){
  const btn=event.target.closest('.quiz-option'); if(!btn)return;
  const wrap=btn.closest('.quiz-question'); if(wrap.dataset.answered==='1')return;
  const qi=Number(wrap.dataset.question),oi=Number(btn.dataset.option),q=chapter.quiz[qi];
  wrap.dataset.answered='1';
  wrap.querySelectorAll('.quiz-option').forEach((b,i)=>{if(i===q.answer)b.classList.add('correct'); else if(i===oi)b.classList.add('wrong');});
  wrap.querySelector('.quiz-explanation').textContent=q.explanation;
  updateState(s=>{s.quiz.total++;if(oi===q.answer)s.quiz.correct++;});
}

function completeChapter(book,index,words,container){
  const key=`${book.id}:${index}`; let already=false;
  updateState(s=>{
    already=!!s.reading.completedChapters[key];
    s.reading.completedChapters[key]=true;
    s.reading.bookProgress[book.id]=Math.max(s.reading.bookProgress[book.id]||0,index+1);
    if(!already){const minutes=Math.max(1,Math.round(words/180));s.reading.totalWordsRead+=words;s.reading.totalMinutesRead=(s.reading.totalMinutesRead||0)+minutes;s.reading.sessions.push({at:Date.now(),bookId:book.id,chapter:index,words,minutes});}
    if(index<book.chapters.length-1)s.reading.currentChapter=index+1;
  });
  if(!already){const minutes=Math.max(1,Math.round(words/180));registerActivity('lesson',1);registerActivity('words',words);registerActivity('minutes',minutes);toast(`Bölüm tamamlandı · ${words} kelime okudun.`);} else toast('Bu bölüm zaten tamamlanmış.');
  const button=container.querySelector('#completeChapterButton'); if(button)button.innerHTML=`${icon('check')} Tamamlandı`;
}

function escapeRegExp(v){return String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
