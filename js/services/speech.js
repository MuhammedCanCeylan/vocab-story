let voices = [];
let recognition = null;

export function initSpeech() {
  if ('speechSynthesis' in window) {
    const refresh = () => { voices = window.speechSynthesis.getVoices() || []; };
    refresh();
    window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
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
  return voices.find(v => /en-US/i.test(v.lang) && /Samantha|Google US|Microsoft.*Aria|Natural/i.test(v.name))
    || voices.find(v => /en-US/i.test(v.lang))
    || voices.find(v => /^en/i.test(v.lang));
}

export function speak(text, rate=.88) {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  const voice = bestVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() { window.speechSynthesis?.cancel?.(); }

export function recognizeOnce() {
  return new Promise((resolve, reject) => {
    if (!recognition) return reject(new Error('Speech recognition is not supported in this browser.'));
    recognition.onresult = e => resolve(e.results[0][0].transcript);
    recognition.onerror = e => reject(new Error(e.error || 'Speech recognition failed'));
    try { recognition.start(); } catch (e) { reject(e); }
  });
}

function clean(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim(); }
function levenshtein(a,b){
  const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i; for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[m][n];
}
export function similarity(a,b){ const x=clean(a),y=clean(b); if(!x&&!y)return 1; const max=Math.max(x.length,y.length,1); return Math.max(0,1-levenshtein(x,y)/max); }
