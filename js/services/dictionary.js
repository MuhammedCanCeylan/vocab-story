import { getState, updateState } from './storage.js?v=4.2.0';
import { normalizeKey } from './srs.js?v=4.2.0';
import { generateJson, extractGeminiJson } from './gemini.js?v=4.2.0';
import { coreDictionaryEntry } from '../data/coreDictionary.js?v=4.2.0';

function fromVocabulary(word) {
  const key=normalizeKey(word);
  const item=getState().vocabulary.find(v=>normalizeKey(v.word)===key);
  return item ? { ...item, word:item.word || word } : null;
}

export function getCachedWord(word) {
  const key=normalizeKey(word);
  if(!key)return null;
  const vocab=fromVocabulary(word);
  const dict=getState().dictionary?.[key]||null;
  const local=coreDictionaryEntry(word);
  const layers=[local,dict,vocab].filter(Boolean);
  if(!layers.length)return null;
  const merged={word};
  for(const layer of layers){
    for(const [k,v] of Object.entries(layer)){
      if(v!==undefined&&v!==null&&v!=='')merged[k]=v;
    }
  }
  return merged;
}

export async function lookupWord(word,{context='',level='A2'}={}) {
  const key=normalizeKey(word);
  if(!key)throw new Error('Invalid word');
  const cached=getCachedWord(word);
  if(cached?.meaningTr && cached?.definitionEn)return cached;
  const state=getState();
  if(!state.settings.apiKey && !state.settings.proxyEndpoint) {
    return cached || {word,meaningTr:'',definitionEn:'',ipa:'',example:context,type:'word',level,source:'dictionary'};
  }
  const prompt=`You are an English-Turkish learner dictionary. Student CEFR level: ${level}. Target: "${word}". Context sentence: "${context}". Return ONLY JSON: {"word":"canonical English word or phrase","ipa":"/American IPA/","definitionEn":"short simple English definition at ${level}","meaningTr":"the natural Turkish meaning in THIS context","example":"one short new English example","type":"noun|verb|adjective|adverb|preposition|pronoun|determiner|conjunction|phrase|phrasal verb|other","level":"estimated CEFR"}. Do not add markdown.`;
  const {data}=await generateJson(prompt);
  const result=extractGeminiJson(data);
  const entry={word:result.word||word,ipa:result.ipa||'',definitionEn:result.definitionEn||'',meaningTr:result.meaningTr||'',example:result.example||context,type:result.type||'word',level:result.level||level,source:'dictionary'};
  updateState(s=>{ if(!s.dictionary)s.dictionary={}; s.dictionary[key]=entry; });
  return entry;
}

export async function lookupWordsBatch(words,{context='',contexts={},level='A2',onAttempt}={}) {
  const unique=[...new Map(words.map(w=>[normalizeKey(w),w])).values()].filter(Boolean);
  const missing=unique.filter(w=>{const x=getCachedWord(w);return !(x?.meaningTr && x?.definitionEn);});
  if(!missing.length)return unique.map(w=>getCachedWord(w)).filter(Boolean);
  const state=getState();
  if(!state.settings.apiKey && !state.settings.proxyEndpoint) throw Object.assign(new Error('AI settings missing'),{status:401});
  const chunks=[];for(let i=0;i<missing.length;i+=55)chunks.push(missing.slice(i,i+55));
  for(let ci=0;ci<chunks.length;ci++){
    const batch=chunks[ci];
    const requestItems=batch.map(word=>({word,context:contexts?.[normalizeKey(word)]?.text||contexts?.[normalizeKey(word)]||context||''}));
    const prompt=`You are an English-Turkish learner dictionary. Student level: ${level}. Translate EVERY requested English item into the natural Turkish meaning it has in its own context sentence. Do not skip articles, pronouns, prepositions, conjunctions, auxiliaries, or inflected verbs. Requested items: ${JSON.stringify(requestItems)}. Return ONLY JSON: {"items":[{"requested":"exact requested surface form","word":"dictionary headword or same form","ipa":"/American IPA/ or empty for function words if unnecessary","definitionEn":"short simple English definition","meaningTr":"natural Turkish meaning in the supplied context","type":"part of speech or phrase","level":"estimated CEFR"}]}. Keep one result for every requested word and do not add markdown.`;
    const {data}=await generateJson(prompt,{onAttempt:info=>onAttempt?.({...info,batch:ci+1,totalBatches:chunks.length})});
    const result=extractGeminiJson(data);
    const items=Array.isArray(result.items)?result.items:[];
    updateState(s=>{
      if(!s.dictionary)s.dictionary={};
      for(const item of items){
        const requested=item.requested||item.word;
        const k=normalizeKey(requested); if(!k)continue;
        s.dictionary[k]={word:requested,lemma:item.word||requested,ipa:item.ipa||'',definitionEn:item.definitionEn||'',meaningTr:item.meaningTr||'',example:'',type:item.type||'word',level:item.level||level,source:'dictionary'};
      }
    });
  }
  return unique.map(w=>getCachedWord(w)).filter(Boolean);
}
