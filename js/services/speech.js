import { generateAudioJson, extractGeminiJson } from './gemini.js?v=4.2.0';

let voices = [];
let recognition = null;
let activeUtterance = null;

export function initSpeech() {
  if ('speechSynthesis' in window) {
    const refresh = () => { voices = window.speechSynthesis.getVoices() || []; };
    refresh();
    window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
    setTimeout(refresh,250);
    setTimeout(refresh,1200);
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  }
}

function bestVoice() {
  if(!voices.length && 'speechSynthesis' in window) voices=window.speechSynthesis.getVoices()||[];
  return voices.find(v => /en-US/i.test(v.lang) && /Samantha|Google US|Microsoft.*Aria|Natural/i.test(v.name))
    || voices.find(v => /en-US/i.test(v.lang))
    || voices.find(v => /^en/i.test(v.lang))
    || voices[0];
}

export function canSpeak(){return 'speechSynthesis' in window;}
export function canNativeRecognize(){return !!recognition;}
export function canRecord(){return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);}
export function speechMode(){return canNativeRecognize()?'native':canRecord()?'gemini-audio':'none';}

export function speak(text, rate=.88) {
  if (!canSpeak() || !text) return false;
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    activeUtterance=u;
    u.lang = 'en-US';
    u.rate = rate;
    u.pitch=1;
    const voice = bestVoice();
    if (voice) u.voice = voice;
    u.onend=()=>{if(activeUtterance===u)activeUtterance=null;};
    u.onerror=()=>{if(activeUtterance===u)activeUtterance=null;};
    // Firefox can remain paused for a moment immediately after cancel().
    setTimeout(()=>{window.speechSynthesis.resume?.();window.speechSynthesis.speak(u);},25);
    return true;
  }catch{return false;}
}

export function stopSpeaking() { window.speechSynthesis?.cancel?.(); activeUtterance=null; }

export function recognizeOnce() {
  return new Promise((resolve, reject) => {
    if (!recognition) return reject(new Error('Speech recognition is not supported in this browser.'));
    recognition.onresult = e => resolve(e.results[0][0].transcript);
    recognition.onerror = e => reject(new Error(e.error || 'Speech recognition failed'));
    recognition.onend = () => {};
    try { recognition.start(); } catch (e) { reject(e); }
  });
}

function preferredMimeType(){
  const types=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];
  return types.find(t=>MediaRecorder.isTypeSupported?.(t))||'';
}

export async function recordAudioOnce(maxMs=6500){
  if(!canRecord())throw new Error('Bu tarayıcı mikrofon kaydını desteklemiyor.');
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  return new Promise((resolve,reject)=>{
    const chunks=[];
    let recorder;
    try{recorder=new MediaRecorder(stream,preferredMimeType()?{mimeType:preferredMimeType()}:undefined);}catch(err){stream.getTracks().forEach(t=>t.stop());reject(err);return;}
    const cleanup=()=>stream.getTracks().forEach(t=>t.stop());
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
    recorder.onerror=e=>{cleanup();reject(e.error||new Error('Ses kaydı başarısız.'));};
    recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});cleanup();blob.size?resolve(blob):reject(new Error('Ses kaydı boş geldi.'));};
    recorder.start(150);
    setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},maxMs);
  });
}

export async function evaluateSpeechAttempt(target,{level='A2',onStatus}={}){
  if(canNativeRecognize()){
    onStatus?.('Dinleniyor…');
    const transcript=await recognizeOnce();
    return {mode:'native',transcript,score:similarity(target,transcript),feedbackTr:''};
  }
  if(!canRecord())throw new Error('Bu tarayıcıda ne SpeechRecognition ne de MediaRecorder kullanılabiliyor.');
  const wordCount=String(target||'').trim().split(/\s+/).filter(Boolean).length;
  const duration=Math.max(4200,Math.min(9000,3000+wordCount*650));
  onStatus?.(`Firefox modu · ${Math.round(duration/1000)} sn kayıt…`);
  const blob=await recordAudioOnce(duration);
  onStatus?.('Ses Gemini ile değerlendiriliyor…');
  const prompt=`You are an English pronunciation and speech coach. Target sentence: "${target}". Student CEFR: ${level}. Listen to the audio. Return ONLY JSON: {"transcript":"what the learner actually said in English","score":0,"feedbackTr":"one short constructive Turkish sentence"}. score is 0-100 and should mainly reflect whether the spoken words match the target; minor accent differences should not be punished heavily.`;
  const {data,model}=await generateAudioJson(blob,prompt,{onAttempt:({model,attempt})=>onStatus?.(attempt>1?`${model} ses için tekrar deneniyor…`:`${model} sesi değerlendiriyor…`)});
  const result=extractGeminiJson(data);
  const score=Math.max(0,Math.min(100,Number(result.score)||0))/100;
  return {mode:'gemini-audio',transcript:String(result.transcript||''),score,feedbackTr:String(result.feedbackTr||''),model};
}

function clean(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim(); }
function levenshtein(a,b){
  const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i; for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[m][n];
}
export function similarity(a,b){ const x=clean(a),y=clean(b); if(!x&&!y)return 1; const max=Math.max(x.length,y.length,1); return Math.max(0,1-levenshtein(x,y)/max); }
