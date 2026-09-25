const NOISE = [
  /^star(?:\s+filled|\s+outline|red)?$/i,
  /^(?:sound|audio|listen|play|pronounce|speaker)$/i,
  /^(?:edit|delete|remove|more|menu|share|copy)$/i,
  /^(?:favorite|favourite|bookmark|saved?)$/i,
  /^(?:volume_up|volume|hearing)$/i,
  /^[★☆🔊🔈🔉🔇✎✏️🗑️⋮…]+$/u
];

const clean = value => String(value||'').replace(/\u00a0/g,' ').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
const isNoise = line => !clean(line) || NOISE.some(re=>re.test(clean(line)));

function looksEnglish(value) {
  const s=clean(value);
  if(!s || s.length>80 || /[çğıöşüÇĞİÖŞÜ]/.test(s) || !/[A-Za-z]/.test(s) || s.split(/\s+/).length>8) return false;
  return /^[A-Za-z][A-Za-z'’\-]*(?:\s+[A-Za-z][A-Za-z'’\-]*)*$/.test(s);
}
function strongHeadword(value){ const s=clean(value); const letters=s.replace(/[^A-Za-z]/g,''); return looksEnglish(s) && letters && letters===letters.toUpperCase(); }

function splitLine(line) {
  const raw=String(line||'').replace(/\u00a0/g,' ').trim();
  const tabs=raw.split(/\t+/);
  if(tabs.length>=2){ const left=clean(tabs.shift()),right=clean(tabs.join(' ')); if(left&&right&&looksEnglish(left)) return {word:left,meaningTr:right}; }
  const s=clean(raw);
  for(const re of [/\s+[-–—]\s+/,/\s*[:=→|]\s*/]){
    const m=s.match(re); if(!m||m.index==null)continue;
    const left=s.slice(0,m.index).trim(),right=s.slice(m.index+m[0].length).trim();
    if(left&&right&&looksEnglish(left))return {word:left,meaningTr:right};
  }
  const comma=s.indexOf(','); if(comma>0){ const left=s.slice(0,comma).trim(),right=s.slice(comma+1).trim(); if(left&&right&&looksEnglish(left))return {word:left,meaningTr:right}; }
  return null;
}

export function parseVocabulary(raw) {
  const lines=String(raw||'').split(/\r?\n/).map(x=>String(x||'').replace(/\u00a0/g,' ').trim()).filter(x=>!isNoise(x));
  const entries=[],left=[];
  for(const line of lines){ const explicit=splitLine(line); if(explicit)entries.push(explicit); else left.push(clean(line)); }
  for(let i=0;i<left.length;){
    const current=left[i],next=left[i+1];
    const pair=next&&looksEnglish(current)&&(strongHeadword(current)||/[çğıöşüÇĞİÖŞÜ]/.test(next)||!looksEnglish(next));
    if(pair){entries.push({word:current,meaningTr:next});i+=2;} else {if(looksEnglish(current))entries.push({word:current,meaningTr:''});i++;}
  }
  const out=[],seen=new Set();
  for(const e of entries){ const key=clean(e.word).toLowerCase(); if(!key||seen.has(key))continue; seen.add(key); out.push({word:clean(e.word),meaningTr:clean(e.meaningTr)}); }
  return out;
}
