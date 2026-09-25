import { BOOKS } from '../data/books.js?v=4.2.0';
import { getState, updateState, registerActivity } from '../services/storage.js?v=4.2.0';
import { normalizeKey, ensureVocab, setWordStatus } from '../services/srs.js?v=4.2.0';
import { speak, stopSpeaking } from '../services/speech.js?v=4.2.0';
import { icon } from '../ui/icons.js?v=4.2.0';
import { openWordModal } from '../ui/wordModal.js?v=4.2.0';
import { toast } from '../ui/toast.js?v=4.2.0';
import { generateJson, extractGeminiJson } from '../services/gemini.js?v=4.2.0';
import { getCachedWord, lookupWord, lookupWordsBatch } from '../services/dictionary.js?v=4.2.0';

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
    <section class="card accent" style="margin-bottom:18px"><div class="card-title"><div><span class="eyebrow">AI graded reader</span><h2>Çalışacağın kelimelerden yeni hikâye üret</h2><p class="muted" style="margin:6px 0 0">Review, learning veya Vocabulary ekranında seçtiğin kelimeleri hedefleyebilirsin.</p></div><span class="pill">Gemini</span></div><div class="grid grid-4 story-builder-grid"><label class="field"><span>Seviye</span><select id="aiStoryLevel">${['A1','A2','B1','B2','C1','C2'].map(l=>`<option ${state.settings.level===l?'selected':''}>${l}</option>`).join('')}</select></label><label class="field"><span>Kelime kaynağı</span><select id="aiStoryWordSource"><option value="smart">Learning + Review</option><option value="review">Sadece Review</option><option value="selected" ${(state.storyBuilderWordIds||[]).length?'selected':''}>Seçilenler (${(state.storyBuilderWordIds||[]).length})</option></select></label><label class="field"><span>Format</span><select id="aiStoryFormat"><option value="story">Story</option><option value="dialogue">Dialogue</option><option value="scenario">Daily scenario</option></select></label><label class="field"><span>Uzunluk</span><select id="aiStoryLength"><option value="short">Kısa</option><option value="medium" selected>Orta</option><option value="long">Uzun</option></select></label></div>${(state.storyBuilderWordIds||[]).length?`<div class="story-seed-banner"><strong>${state.storyBuilderWordIds.length} seçili kelime hazır.</strong><button class="ghost-button" id="clearStoryWords" type="button">Seçimi temizle</button></div>`:''}<button class="primary-button" id="generateStoryButton" type="button">${icon('spark')} Yeni öğretici hikâye oluştur</button></section>
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
  container.querySelector('#clearStoryWords')?.addEventListener('click',()=>{updateState(s=>{s.storyBuilderWordIds=[];});renderLibrary(container);});
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
  const button=container.querySelector('#generateStoryButton');
  const source=container.querySelector('#aiStoryWordSource')?.value||'smart';
  let targetPool=[];
  if(source==='selected'){const ids=new Set(state.storyBuilderWordIds||[]);targetPool=state.vocabulary.filter(v=>ids.has(v.id));}
  else if(source==='review')targetPool=state.vocabulary.filter(v=>v.status==='review');
  else targetPool=state.vocabulary.filter(v=>v.status==='learning'||v.status==='review');
  const targets=targetPool.slice().sort((a,b)=>(a.dueAt||0)-(b.dueAt||0)).slice(0,10);
  if(source==='selected'&&!targets.length){toast('Vocabulary ekranından önce hikâyede çalışmak istediğin kelimeleri seç.');button.disabled=false;button.innerHTML=`${icon('spark')} Yeni öğretici hikâye oluştur`;return;}
  const targetText=targets.length?targets.map(v=>`${v.word}${v.meaningTr?` (${v.meaningTr})`:''}`).join(', '):'No required target words; choose useful everyday vocabulary.';
  button.disabled=true;
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
  const words=chapter.sentences.map(s=>s.text).join(' ').match(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿ]+)?/g)?.length||0;
  const completed=!!getState().reading.completedChapters[`${book.id}:${safeIndex}`];
  const savedKeys=new Set(state.vocabulary.map(v=>normalizeKey(v.word)));
  const coverage=chapter.vocabulary.length?Math.round(chapter.vocabulary.filter(v=>savedKeys.has(normalizeKey(v.word))).length/chapter.vocabulary.length*100):0;
  const inventory=chapterWordInventory(chapter);

  container.innerHTML=`<section class="page ${focus?'reader-focus-mode':''}" id="readerPage">
    <div class="reader-toolbar">
      <div class="left"><a class="mini-button" href="#/read" aria-label="Kitaplığa dön">${icon('arrow-left')}</a><span class="badge">${book.level}</span><span class="pill">${safeIndex+1}/${book.chapters.length}</span></div>
      <div class="right"><button class="mini-button" id="toggleAllTranslations" type="button" title="Tüm cümle çevirilerini göster/gizle">${icon('translate')}</button><button class="mini-button" id="playChapterButton" type="button" title="Bölümü dinle">${icon('volume')}</button><button class="mini-button" id="readerModeButton" type="button" title="Focus/Learning görünümü">${icon(focus?'brain':'book-open')}</button></div>
    </div>
    <div class="reader-shell">
      <article class="reader-page">
        <header class="reader-heading"><span class="book-kicker">${escapeHtml(book.title)} · Chapter ${safeIndex+1}</span><h1>${escapeHtml(chapter.title)}</h1><p>${escapeHtml(chapter.summary)}</p></header>
        <section class="chapter-vocab"><div class="card-title"><div><h3>Bu bölümde karşılaşacağın ${chapter.vocabulary.length} hedef ifade</h3><p class="muted" style="margin:4px 0 0">Kelime havuzundaki ifadeler okuma metninde çalışma durumuna göre ayrıca vurgulanır.</p></div><button class="ghost-button" id="addChapterTargetsReview" type="button">${icon('rotate')} Hepsini Review’a al</button></div><div class="chapter-vocab-list">${chapter.vocabulary.map((v,i)=>chapterVocabPill(v,i,state)).join('')}</div></section>
        <div class="reader-legend"><span>Metin işaretleri:</span><span class="legend-item target"><span class="legend-dot"></span>Hedef ifade</span><span class="legend-item learning"><span class="legend-dot"></span>Öğreniliyor</span><span class="legend-item review"><span class="legend-dot"></span>Tekrar</span><span class="legend-item mastered"><span class="legend-dot"></span>Öğrenildi</span><span>Diğer kelimeler düz görünür ama tamamı tıklanabilir.</span></div>
        <div class="reading-content" id="readingContent">${chapter.sentences.map((s,i)=>sentenceHtml(s,i,chapter.vocabulary)).join('')}</div>
        <section class="quiz-block" id="chapterQuiz"><span class="eyebrow">Comprehension</span><h3>Bölümü anladın mı?</h3><p class="muted">Önce hikâyenin anlamını kontrol et.</p>${chapter.quiz.map((q,qi)=>quizHtml(q,qi)).join('')}</section>
        <section class="quiz-block vocab-lab" id="vocabQuiz"><span class="eyebrow">Vocabulary lab</span><h3>Kelimeyi gerçekten hatırlıyor musun?</h3><p class="muted">Türkçe anlam, İngilizce tanım ve cümle boşluğu olmak üzere farklı soru türleri.</p>${practiceQuizHtml(chapter)}</section>
        <section class="quiz-block" id="retellBlock"><span class="eyebrow">Active recall</span><h3>Bu bölümü kendi cümlelerinle anlat</h3><p class="muted">İngilizce 2–4 cümle yaz. AI, seviyene göre anlaşılabilirlik ve dil kullanımı hakkında kısa geri bildirim verebilir.</p><label class="field"><span>Your retelling</span><textarea id="retellInput" placeholder="In this chapter, Maya..."></textarea></label><button class="secondary-button" id="retellFeedbackButton" type="button">${icon('spark')} AI feedback</button><div id="retellFeedback" style="margin-top:12px"></div></section>
        <section class="chapter-complete"><h3>${completed?'Bu bölümü tamamladın.':'Bölümü bitirdin mi?'}</h3><p>${words} kelime okudun. Bitirdiğinde ilerlemen ve günlük serin güncellenir.</p><button class="primary-button" id="completeChapterButton" type="button">${icon('check')} ${completed?'Tamamlandı':'Bölümü tamamla'}</button></section>
        <nav class="reader-nav">${safeIndex>0?`<a class="secondary-button" href="#/read/${book.id}/${safeIndex-1}">${icon('arrow-left')} Önceki bölüm</a>`:'<span></span>'}${safeIndex<book.chapters.length-1?`<a class="primary-button" href="#/read/${book.id}/${safeIndex+1}">Sonraki bölüm ${icon('arrow')}</a>`:`<a class="primary-button" href="#/read">Kitaplığa dön ${icon('arrow')}</a>`}</nav>
      </article>
      <aside class="reader-side">
        <section class="card learning-panel" id="learningPanel"><span class="eyebrow">Learning panel</span><h3>Bir kelime seç</h3><p class="muted">Okurken bir kelime veya kalıba dokun. İngilizce açıklaması önce burada görünür; Türkçe anlam ve ayrıntılar ikinci adımda açılır.</p></section>
        <section class="card reader-progress"><div class="reader-progress-row"><span>Kitap ilerlemesi</span><strong>${book.chapters.filter((_,i)=>getState().reading.completedChapters[`${book.id}:${i}`]).length}/${book.chapters.length}</strong></div><div class="progress-track"><span style="width:${Math.round(book.chapters.filter((_,i)=>getState().reading.completedChapters[`${book.id}:${i}`]).length/book.chapters.length*100)}%"></span></div><div class="reader-progress-row" style="margin-top:15px"><span>Bu bölüm</span><strong>${words} kelime</strong></div><div class="reader-progress-row" style="margin-top:15px"><span>Hedef kelime coverage</span><strong>${coverage}%</strong></div><div class="progress-track"><span style="width:${coverage}%"></span></div></section>
        <section class="card chapter-word-browser" id="chapterWordBrowser"><div class="card-title"><div><span class="eyebrow">All words</span><h3 style="margin:3px 0 0">Bölümün tüm kelimeleri</h3></div><span class="pill">${inventory.length}</span></div><p class="muted">Hikâyedeki her kelimenin Türkçe anlamına ve geçtiği cümlenin çevirisine buradan ulaşabilirsin.</p>${translationCoverageHtml(inventory,chapter)}<div class="chapter-word-tools"><button class="secondary-button" id="prepareAllMeanings" type="button">${icon('translate')} Türkçe sözlüğü tamamla</button><button class="ghost-button" id="copyChapterWords" type="button">${icon('download')} Listeyi kopyala</button></div><p class="chapter-word-actions-note">Temel kelimeler yerel sözlükten gelir; eksik bağlamsal anlamlar tek tek istek yerine bölüm halinde hazırlanıp cache’lenir.</p><input class="search-input" id="chapterWordSearch" placeholder="Bölümde kelime ara…"/><div class="chapter-word-list" id="chapterWordList">${chapterWordListHtml(inventory,chapter)}</div></section>
        ${chapter.grammar?`<section class="card"><span class="eyebrow">Grammar discovery</span><h3 style="margin:0 0 8px">${escapeHtml(chapter.grammar.title)}</h3><p class="muted" style="line-height:1.6">${escapeHtml(chapter.grammar.note)}</p><div class="word-example"><p>${escapeHtml(chapter.grammar.example)}</p></div></section>`:''}
      </aside>
    </div>
  </section>`;

  const page=container.querySelector('#readerPage');
  container.querySelector('#toggleAllTranslations')?.addEventListener('click',()=>{page.classList.toggle('show-all-translations');});
  container.querySelector('#playChapterButton')?.addEventListener('click',()=>speak(chapter.sentences.map(s=>s.text).join(' '),.84));
  container.querySelector('#readerModeButton')?.addEventListener('click',()=>{
    const nowFocus=!page.classList.contains('reader-focus-mode'); page.classList.toggle('reader-focus-mode',nowFocus);
    updateState(s=>{s.settings.readerMode=nowFocus?'focus':'learning';});
  });
  container.querySelectorAll('.chapter-vocab-list [data-vocab-index]').forEach(btn=>btn.addEventListener('click',()=>{const entry=chapter.vocabulary[Number(btn.dataset.vocabIndex)];resolveReaderEntry(entry.word,chapter,book,container,{openModal:true,sentenceContext:sentenceContextForWord(entry.word,chapter)});}));
  container.querySelector('#readingContent')?.addEventListener('click',e=>handleReadingClick(e,chapter,container,book));
  container.querySelector('#chapterWordList')?.addEventListener('click',e=>handleChapterWordClick(e,chapter,book,container));
  container.querySelector('#chapterWordSearch')?.addEventListener('input',e=>renderChapterWordFilter(container,inventory,chapter,e.target.value));
  container.querySelector('#prepareAllMeanings')?.addEventListener('click',()=>prepareAllMeanings(container,inventory,chapter,book));
  container.querySelector('#copyChapterWords')?.addEventListener('click',()=>copyChapterWords(inventory,chapter));
  container.querySelector('#addChapterTargetsReview')?.addEventListener('click',()=>addChapterTargetsToReview(chapter,container));
  container.querySelector('#chapterQuiz')?.addEventListener('click',e=>handleQuizClick(e,chapter));
  container.querySelector('#vocabQuiz')?.addEventListener('click',e=>handlePracticeQuizClick(e,chapter));
  container.querySelector('#retellFeedbackButton')?.addEventListener('click',()=>evaluateRetelling(book,chapter,container));
  container.querySelector('#completeChapterButton')?.addEventListener('click',()=>completeChapter(book,safeIndex,words,container));
  scheduleAutoPrepareMeanings(container,inventory,chapter,book);
  window.addEventListener('hashchange',stopSpeaking,{once:true});
}

function sentenceHtml(sentence,index,vocab) {
  return `<div class="sentence-row" data-sentence="${index}"><p class="sentence-text">${interactiveText(sentence.text,vocab)}</p><div class="sentence-actions"><button type="button" data-action="speak" title="Cümleyi dinle">${icon('volume')}</button><button type="button" data-action="translate" title="Türkçe çeviri">${icon('translate')}</button><button type="button" data-action="save-sentence" title="Cümleyi kaydet">${icon('plus')}</button></div><div class="sentence-translation">${escapeHtml(sentence.tr)}</div></div>`;
}

function interactiveText(text,vocab) {
  const map=new Map(vocab.map((v,i)=>[normalizeKey(v.word),i]));
  const phrases=[...map.keys()].filter(k=>k.includes(' ')).sort((a,b)=>b.length-a.length).map(escapeRegExp);
  const wordPattern="[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿ]+)?";
  const pattern=phrases.length?`${phrases.join('|')}|${wordPattern}`:wordPattern;
  const re=new RegExp(`\\b(?:${pattern})\\b`,'gi');
  const state=getState();
  const savedMap=new Map(state.vocabulary.map(v=>[normalizeKey(v.word),v]));
  let out='',cursor=0,m;
  while((m=re.exec(text))){
    out+=escapeHtml(text.slice(cursor,m.index));
    const visible=m[0],key=normalizeKey(visible),idx=map.get(key),saved=savedMap.get(key);
    const status=saved?`status-${saved.status||'learning'}`:'status-unsaved';
    const classes=['reader-word',idx!==undefined?'target':'',saved?'in-vocabulary':'',status].filter(Boolean).join(' ');
    out+=`<span class="${classes}" data-reader-word="${encodeURIComponent(visible)}" data-word-key="${encodeURIComponent(key)}" ${idx!==undefined?`data-vocab-index="${idx}"`:''}>${escapeHtml(visible)}</span>`;
    cursor=m.index+visible.length;
  }
  return out+escapeHtml(text.slice(cursor));
}

function chapterWordInventory(chapter){
  const seen=new Map();
  for(const sentence of chapter.sentences||[]){
    const words=String(sentence.text||'').match(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿ]+)?/g)||[];
    for(const word of words){const key=normalizeKey(word);if(key&&!seen.has(key))seen.set(key,word);}
  }
  return [...seen.values()].sort((a,b)=>a.localeCompare(b,'en'));
}

function findChapterTarget(word,chapter){
  const key=normalizeKey(word);
  return (chapter.vocabulary||[]).find(v=>normalizeKey(v.word)===key)||null;
}

function statusClassForWord(word,state=getState()){
  const key=normalizeKey(word);
  const item=state.vocabulary.find(v=>normalizeKey(v.word)===key);
  return item?`status-${item.status||'learning'}`:'status-unsaved';
}

function chapterVocabPill(v,index,state){
  const key=normalizeKey(v.word);
  const item=state.vocabulary.find(x=>normalizeKey(x.word)===key);
  const status=item?.status||'unsaved';
  const label=status==='mastered'?'Öğrenildi':status==='review'?'Tekrar':status==='learning'?'Öğreniliyor':'Yeni';
  return `<button class="pill chapter-vocab-pill status-${status}" type="button" data-vocab-index="${index}" data-word-key="${encodeURIComponent(key)}"><span>${escapeHtml(v.word)}</span><small>${label}</small></button>`;
}

function knownChapterEntry(word,chapter){
  return findChapterTarget(word,chapter)||getCachedWord(word)||null;
}

function sentenceContextForWord(word,chapter){
  const key=normalizeKey(word);
  if(!key)return {text:'',tr:'',index:-1};
  const escaped=escapeRegExp(key).replace(/\s+/g,'\\s+');
  const re=new RegExp(`\\b${escaped}\\b`,'i');
  const index=(chapter.sentences||[]).findIndex(s=>re.test(normalizeKey(s.text)));
  const sentence=index>=0?chapter.sentences[index]:chapter.sentences?.[0];
  return {text:sentence?.text||'',tr:sentence?.tr||'',index:index>=0?index:0};
}

function chapterWordContexts(inventory,chapter){
  const result={};
  for(const word of inventory)result[normalizeKey(word)]=sentenceContextForWord(word,chapter);
  return result;
}

function chapterWordListHtml(inventory,chapter){
  const state=getState();
  const savedKeys=new Set(state.vocabulary.map(v=>normalizeKey(v.word)));
  return inventory.map(word=>{
    const known=knownChapterEntry(word,chapter);
    const context=sentenceContextForWord(word,chapter);
    const status=statusClassForWord(word,state);
    const saved=savedKeys.has(normalizeKey(word));
    return `<button class="chapter-word-row ${status} ${saved?'in-vocabulary':''}" type="button" data-chapter-word="${encodeURIComponent(word)}" data-word-key="${encodeURIComponent(normalizeKey(word))}"><span class="chapter-word-main"><strong>${escapeHtml(word)}</strong><small>${escapeHtml(known?.meaningTr||'Türkçe anlam hazırlanıyor…')}</small><span class="chapter-word-context">${escapeHtml(context.tr||'Cümle çevirisi hazır')}</span></span>${known?.ipa?`<span class="chapter-word-ipa">${escapeHtml(known.ipa)}</span>`:''}</button>`;
  }).join('');
}

function translationCoverageHtml(inventory,chapter){
  const ready=inventory.filter(word=>knownChapterEntry(word,chapter)?.meaningTr).length;
  const pct=inventory.length?Math.round(ready/inventory.length*100):100;
  return `<div class="translation-coverage" id="translationCoverage"><div class="reader-progress-row"><span>Türkçe sözlük kapsamı</span><strong>${ready}/${inventory.length} · %${pct}</strong></div><div class="progress-track"><span style="width:${pct}%"></span></div></div>`;
}

function updateTranslationCoverage(container,inventory,chapter){
  const current=container.querySelector('#translationCoverage');
  if(current)current.outerHTML=translationCoverageHtml(inventory,chapter);
}

function renderChapterWordFilter(container,inventory,chapter,query=''){
  const q=String(query||'').trim().toLowerCase();
  const filtered=q?inventory.filter(w=>w.toLowerCase().includes(q)):inventory;
  const list=container.querySelector('#chapterWordList');
  if(list)list.innerHTML=chapterWordListHtml(filtered,chapter)||`<p class="muted">Kelime bulunamadı.</p>`;
  updateTranslationCoverage(container,inventory,chapter);
}


async function resolveReaderEntry(word,chapter,book,container,{openModal=false,sentenceContext=null}={}){
  const context=sentenceContext||sentenceContextForWord(word,chapter);
  const target=findChapterTarget(word,chapter);
  const cached=target||getCachedWord(word);
  const enrich=entry=>({...entry,source:`${book.title} — ${chapter.title}`,contextSentence:context.text,contextSentenceTr:context.tr});
  if(cached?.meaningTr||cached?.definitionEn){const ready=enrich(cached);selectEntry(ready,container,openModal);return ready;}
  const loading=enrich({word,ipa:'',definitionEn:'Anlam ve açıklama hazırlanıyor…',meaningTr:'',example:context.text,type:'word',level:book.level});
  selectEntry(loading,container,false);
  try{
    const entry=await lookupWord(word,{context:context.text,level:book.level});
    const ready=enrich(entry);
    selectEntry(ready,container,openModal);
    const inventory=chapterWordInventory(chapter);
    renderChapterWordFilter(container,inventory,chapter,container.querySelector('#chapterWordSearch')?.value||'');
    return ready;
  }catch(err){
    console.error(err);
    if(err.status===401)toast('Bu kelimenin Türkçe anlamını getirmek için AI ayarlarında Gemini API anahtarı veya proxy gerekli.');
    else toast('Kelime anlamı şu anda getirilemedi.');
    selectEntry({...loading,definitionEn:'Bu kelime için çevrim içi açıklama alınamadı.',meaningTr:''},container,false);
    return loading;
  }
}

async function handleReadingClick(event,chapter,container,book) {
  const row=event.target.closest('.sentence-row'); if(!row)return;
  const index=Number(row.dataset.sentence); const sentence=chapter.sentences[index];
  const action=event.target.closest('button[data-action]');
  if(action){ if(action.dataset.action==='speak')speak(sentence.text,.84); else if(action.dataset.action==='translate')row.classList.toggle('translation-visible'); else if(action.dataset.action==='save-sentence')saveSentence(sentence); return; }
  const word=event.target.closest('[data-reader-word]'); if(!word)return;
  const visible=decodeURIComponent(word.dataset.readerWord);
  const entryIndex=word.dataset.vocabIndex;
  const context={text:sentence.text,tr:sentence.tr,index};
  if(entryIndex!==undefined){selectEntry({...chapter.vocabulary[Number(entryIndex)],source:`${book.title} — ${chapter.title}`,contextSentence:sentence.text,contextSentenceTr:sentence.tr},container,window.innerWidth<900);return;}
  await resolveReaderEntry(visible,chapter,book,container,{openModal:window.innerWidth<900,sentenceContext:context});
}

async function handleChapterWordClick(event,chapter,book,container){
  const row=event.target.closest('[data-chapter-word]');if(!row)return;
  const word=decodeURIComponent(row.dataset.chapterWord);
  await resolveReaderEntry(word,chapter,book,container,{openModal:window.innerWidth<900,sentenceContext:sentenceContextForWord(word,chapter)});
}


async function copyChapterWords(inventory,chapter){
  const rows=inventory.map(word=>{const x=knownChapterEntry(word,chapter);const c=sentenceContextForWord(word,chapter);return `${word}	${x?.meaningTr||''}	${x?.ipa||''}	${c.text}	${c.tr}`;});
  try{await navigator.clipboard.writeText(['WORD\tTÜRKÇE\tIPA\tCONTEXT\tCÜMLE ÇEVİRİSİ',...rows].join('\n'));toast(`${inventory.length} bölüm kelimesi, bağlam cümleleriyle panoya kopyalandı.`);}catch{toast('Tarayıcı panoya yazmaya izin vermedi.');}
}

async function prepareAllMeanings(container,inventory,chapter,book){
  const button=container.querySelector('#prepareAllMeanings');if(!button)return;
  button.disabled=true;
  try{
    const unknown=inventory.filter(word=>{const x=knownChapterEntry(word,chapter);return !(x?.meaningTr&&x?.definitionEn);});
    if(!unknown.length){toast('Bu bölümdeki tüm kelimelerin anlamları zaten hazır.');return;}
    await lookupWordsBatch(unknown,{context:chapter.sentences.map(s=>s.text).join(' '),contexts:chapterWordContexts(inventory,chapter),level:book.level,onAttempt:({model,attempt,batch,totalBatches})=>{button.textContent=attempt>1?`${model} tekrar…`:`${model} · ${batch||1}/${totalBatches||1} hazırlanıyor…`;}});
    renderChapterWordFilter(container,inventory,chapter,container.querySelector('#chapterWordSearch')?.value||'');
    toast('Bölümdeki kelimelerin Türkçe anlamları hazırlandı ve cache’lendi.');
  }catch(err){console.error(err);toast(err.status===401?'Tüm kelimeleri çevirmek için AI ayarlarında Gemini API anahtarı veya proxy gerekli.':'Kelime listesi şu anda tamamlanamadı.');}
  finally{button.disabled=false;button.innerHTML=`${icon('translate')} Türkçe sözlüğü tamamla`;updateTranslationCoverage(container,inventory,chapter);}
}

function scheduleAutoPrepareMeanings(container,inventory,chapter,book){
  const state=getState();
  if(!state.settings.apiKey&&!state.settings.proxyEndpoint)return;
  const unknown=inventory.filter(word=>!knownChapterEntry(word,chapter)?.meaningTr);
  if(!unknown.length)return;
  window.setTimeout(async()=>{
    if(!document.body.contains(container))return;
    try{
      await lookupWordsBatch(unknown,{context:chapter.sentences.map(s=>s.text).join(' '),contexts:chapterWordContexts(inventory,chapter),level:book.level});
      if(!document.body.contains(container))return;
      renderChapterWordFilter(container,inventory,chapter,container.querySelector('#chapterWordSearch')?.value||'');
    }catch(err){
      console.debug('[VocabStory] background dictionary preparation skipped',err?.status||err);
    }
  },700);
}


function addChapterTargetsToReview(chapter,container){
  for(const entry of chapter.vocabulary||[]){const item=ensureVocab({...entry,source:'chapter target'});if(item)setWordStatus(item.id,'review');}
  for(const btn of container.querySelectorAll('.chapter-vocab-list [data-vocab-index]')){btn.classList.remove('status-unsaved','status-learning','status-mastered');btn.classList.add('status-review');const small=btn.querySelector('small');if(small)small.textContent='Tekrar';}
  refreshAllWordStatusVisuals(container);
  toast(`${chapter.vocabulary.length} hedef kelime tekrar listesine alındı.`);
}

function refreshAllWordStatusVisuals(container){
  container.querySelectorAll('[data-word-key]').forEach(el=>{
    const key=decodeURIComponent(el.dataset.wordKey||'');
    const item=getState().vocabulary.find(v=>normalizeKey(v.word)===key);
    el.classList.remove('status-unsaved','status-learning','status-review','status-mastered');
    el.classList.add(`status-${item?.status||'unsaved'}`);
    if(el.classList.contains('reader-word')||el.classList.contains('chapter-word-row'))el.classList.toggle('in-vocabulary',!!item);
  });
}

function selectEntry(entry,container,openModal=false) {
  const panel=container.querySelector('#learningPanel');
  const saved=getState().vocabulary.find(v=>normalizeKey(v.word)===normalizeKey(entry.word));
  const status=saved?.status||'unsaved';
  if(panel){panel.innerHTML=`<span class="eyebrow">${escapeHtml([entry.level,entry.type].filter(Boolean).join(' · ')||'Vocabulary')}</span><div class="selected-word">${escapeHtml(entry.word)}</div><div class="selected-ipa">${escapeHtml(entry.ipa||'IPA hazırlanmadı')}</div><div class="selected-definition">${escapeHtml(entry.definitionEn||'İngilizce açıklama henüz yok.')}</div><div class="selected-turkish"><strong>Türkçe</strong><span>${escapeHtml(entry.meaningTr||'Henüz hazırlanmadı.')}</span></div>${entry.contextSentence?`<div class="reader-context-card"><strong>Hikâyedeki cümle</strong><p class="context-en">${escapeHtml(entry.contextSentence)}</p><p class="context-tr">${escapeHtml(entry.contextSentenceTr||'Cümle çevirisi yok.')}</p></div>`:''}${entry.example&&entry.example!==entry.contextSentence?`<div class="word-example"><p>${escapeHtml(entry.example)}</p></div>`:''}<div class="word-status-actions"><button class="word-status-btn learning ${status==='learning'?'active':''}" type="button" data-panel-status="learning">${icon('plus')} Öğrenilecek</button><button class="word-status-btn review ${status==='review'?'active':''}" type="button" data-panel-status="review">${icon('rotate')} Tekrar</button><button class="word-status-btn mastered ${status==='mastered'?'active':''}" type="button" data-panel-status="mastered">${icon('check')} Biliyorum</button></div><div class="word-modal-actions"><button class="secondary-button" type="button" id="panelListen">${icon('volume')} Dinle</button><button class="ghost-button" type="button" id="panelDetails">Ayrıntılar</button></div>`;
    panel.querySelector('#panelListen')?.addEventListener('click',()=>speak(entry.word,.8));
    panel.querySelector('#panelDetails')?.addEventListener('click',()=>openWordModal(entry));
    panel.querySelector('.word-status-actions')?.addEventListener('click',e=>{const b=e.target.closest('[data-panel-status]');if(!b)return;const item=ensureVocab({...entry,source:entry.source||'reader'});if(item)setWordStatus(item.id,b.dataset.panelStatus);panel.querySelectorAll('[data-panel-status]').forEach(x=>x.classList.toggle('active',x===b));refreshAllWordStatusVisuals(container);toast(b.dataset.panelStatus==='mastered'?`“${entry.word}” öğrenildi olarak işaretlendi.`:b.dataset.panelStatus==='review'?`“${entry.word}” tekrar listesine alındı.`:`“${entry.word}” öğrenme listesine eklendi.`);});
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

function practiceQuestions(chapter){
  const vocab=(chapter.vocabulary||[]).filter(v=>v.word&&v.meaningTr);
  if(vocab.length<2)return [];
  const optionWords=(correct,index)=>[correct,...vocab.filter((_,i)=>i!==index).slice(0,3).map(v=>v.word)].slice(0,4);
  const optionMeanings=(correct,index)=>[correct,...vocab.filter((_,i)=>i!==index).slice(0,3).map(v=>v.meaningTr)].slice(0,4);
  const shuffleWithAnswer=(arr,correct)=>{
    const copy=[...new Set(arr)];
    copy.sort((a,b)=>normalizeKey(a).localeCompare(normalizeKey(b)));
    return {options:copy,answer:copy.indexOf(correct)};
  };
  const questions=[];
  const first=vocab[0];
  let x=shuffleWithAnswer(optionWords(first.word,0),first.word);
  questions.push({kind:'meaning',q:`“${first.meaningTr}” anlamına gelen ifade hangisi?`,options:x.options,answer:x.answer,explanation:`${first.word} → ${first.meaningTr}`});
  const second=vocab[Math.min(1,vocab.length-1)];
  x=shuffleWithAnswer(optionWords(second.word,Math.min(1,vocab.length-1)),second.word);
  questions.push({kind:'definition',q:`Which word/phrase matches this definition: “${second.definitionEn||second.meaningTr}”?`,options:x.options,answer:x.answer,explanation:`Correct: ${second.word}`});
  const third=vocab[Math.min(2,vocab.length-1)];
  const source=(chapter.sentences||[]).find(s=>new RegExp(`\\b${escapeRegExp(third.word)}\\b`,'i').test(s.text));
  if(source){
    const cloze=source.text.replace(new RegExp(`\\b${escapeRegExp(third.word)}\\b`,'i'),'_____');
    x=shuffleWithAnswer(optionWords(third.word,Math.min(2,vocab.length-1)),third.word);
    questions.push({kind:'cloze',q:cloze,options:x.options,answer:x.answer,explanation:`Cümlede doğal ifade: ${third.word}`});
  }
  if(vocab.length>=4){
    const fourth=vocab[3];
    x=shuffleWithAnswer(optionMeanings(fourth.meaningTr,3),fourth.meaningTr);
    questions.push({kind:'reverse',q:`“${fourth.word}” bu hikâyede hangi anlama geliyor?`,options:x.options,answer:x.answer,explanation:`${fourth.word} → ${fourth.meaningTr}`});
  }
  if(vocab.length>=5){
    const fifth=vocab[4];
    const sentence=(chapter.sentences||[]).find(s=>new RegExp(`\\b${escapeRegExp(fifth.word)}\\b`,'i').test(s.text));
    if(sentence){
      const cloze=sentence.text.replace(new RegExp(`\\b${escapeRegExp(fifth.word)}\\b`,'i'),'_____');
      x=shuffleWithAnswer(optionWords(fifth.word,4),fifth.word);
      questions.push({kind:'context',q:`Context challenge: ${cloze}`,options:x.options,answer:x.answer,explanation:`Doğru bağlam ifadesi: ${fifth.word}`});
    }
  }
  return questions;
}

function practiceQuizHtml(chapter){
  const qs=practiceQuestions(chapter);
  if(!qs.length)return `<p class="muted">Bu bölüm için yeterli hedef kelime yok.</p>`;
  return `<div class="vocab-quiz-progress" data-vocab-quiz-score>0 / ${qs.length}</div>${qs.map((q,i)=>`<div class="quiz-question practice-question" data-practice-question="${i}"><span class="quiz-kind">${q.kind==='cloze'||q.kind==='context'?'Fill the gap':q.kind==='definition'?'Definition':q.kind==='reverse'?'TR meaning':'Meaning'}</span><p>${escapeHtml(q.q)}</p><div class="quiz-options">${q.options.map((opt,oi)=>`<button class="quiz-option" type="button" data-practice-option="${oi}">${escapeHtml(opt)}</button>`).join('')}</div><small class="muted quiz-explanation"></small></div>`).join('')}`;
}

function handlePracticeQuizClick(event,chapter){
  const btn=event.target.closest('[data-practice-option]');if(!btn)return;
  const wrap=btn.closest('[data-practice-question]');if(!wrap||wrap.dataset.answered==='1')return;
  const qs=practiceQuestions(chapter);const qi=Number(wrap.dataset.practiceQuestion),oi=Number(btn.dataset.practiceOption),q=qs[qi];if(!q)return;
  wrap.dataset.answered='1';
  wrap.querySelectorAll('[data-practice-option]').forEach((b,i)=>{if(i===q.answer)b.classList.add('correct');else if(i===oi)b.classList.add('wrong');});
  wrap.querySelector('.quiz-explanation').textContent=q.explanation;
  updateState(s=>{s.quiz.total++;if(oi===q.answer)s.quiz.correct++;});
  wrap.dataset.correct=oi===q.answer?'1':'0';
  const block=wrap.closest('#vocabQuiz');const answered=[...block.querySelectorAll('[data-practice-question]')].filter(x=>x.dataset.answered==='1');const correct=answered.filter(x=>x.dataset.correct==='1').length;
  const score=block.querySelector('[data-vocab-quiz-score]');if(score)score.textContent=answered.length===qs.length?`${correct}/${qs.length} doğru · tamamlandı`:`${correct}/${answered.length} doğru · ${answered.length}/${qs.length} cevaplandı`;
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
