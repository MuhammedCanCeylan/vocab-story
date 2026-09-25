import { APP_CONFIG } from '../config.js?v=4.1.1';
import { getState, updateState } from './storage.js?v=4.1.1';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const retryable = status => [408,429,500,502,503,504].includes(Number(status));

function modelsFor(preferred) {
  return [...new Set([preferred || APP_CONFIG.preferredModel, ...APP_CONFIG.fallbackModels])];
}

async function requestDirect({ apiKey, model, prompt }) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      contents:[{parts:[{text:prompt}]}],
      generationConfig:{responseMimeType:'application/json'}
    })
  });
  const text = await response.text().catch(()=> '');
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} · model=${model} · ${text.slice(0,240)}`);
    error.status = response.status; error.model = model; error.body = text;
    throw error;
  }
  return JSON.parse(text);
}

async function blobToBase64(blob) {
  const buffer=await blob.arrayBuffer();
  const bytes=new Uint8Array(buffer);
  let binary='';
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(binary);
}

async function requestDirectAudio({apiKey,model,prompt,audioBlob}) {
  const data=await blobToBase64(audioBlob);
  const mimeType=(audioBlob.type || 'audio/webm').split(';')[0];
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      contents:[{parts:[
        {text:prompt},
        {inlineData:{mimeType,data}}
      ]}],
      generationConfig:{responseMimeType:'application/json'}
    })
  });
  const text=await response.text().catch(()=> '');
  if(!response.ok){const error=new Error(`HTTP ${response.status} · model=${model} · audio · ${text.slice(0,240)}`);error.status=response.status;error.model=model;error.body=text;throw error;}
  return JSON.parse(text);
}

async function requestProxy({ endpoint, model, prompt }) {
  const response = await fetch(endpoint, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({model,prompt})
  });
  const text = await response.text().catch(()=> '');
  if (!response.ok) { const error=new Error(`Proxy ${response.status} · ${text.slice(0,240)}`); error.status=response.status; throw error; }
  return JSON.parse(text);
}

async function requestProxyAudio({endpoint,model,prompt,audioBlob}){
  const data=await blobToBase64(audioBlob);
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,prompt,audio:{mimeType:(audioBlob.type||'audio/webm').split(';')[0],data}})});
  const text=await response.text().catch(()=> '');
  if(!response.ok){const error=new Error(`Proxy ${response.status} · audio · ${text.slice(0,240)}`);error.status=response.status;throw error;}
  return JSON.parse(text);
}

async function withFallback(executor,{onAttempt}={}){
  const {settings}=getState();
  const candidates=modelsFor(settings.model);
  let lastError;
  for(let i=0;i<candidates.length;i++){
    const model=candidates[i];
    const attempts=i===0?2:1;
    for(let attempt=0;attempt<attempts;attempt++){
      onAttempt?.({model,attempt:attempt+1,index:i,total:candidates.length});
      try{
        const data=await executor(model);
        updateState(s=>{s.settings.model=model;});
        return {data,model};
      }catch(error){
        lastError=error;
        if(error.status===404)break;
        if(error.status&&!retryable(error.status))throw error;
        if(attempt<attempts-1){await wait(850*(2**attempt)+Math.floor(Math.random()*400));continue;}
        break;
      }
    }
  }
  throw lastError||new Error('No Gemini model available');
}

export async function generateJson(prompt, { onAttempt } = {}) {
  const { settings } = getState();
  const proxy = settings.proxyEndpoint?.trim();
  const apiKey = settings.apiKey?.trim();
  if (!proxy && !apiKey) throw Object.assign(new Error('Gemini API key missing'), { status:401 });
  return withFallback(model=>proxy?requestProxy({endpoint:proxy,model,prompt}):requestDirect({apiKey,model,prompt}),{onAttempt});
}

export async function generateAudioJson(audioBlob,prompt,{onAttempt}={}){
  const {settings}=getState();
  const proxy=settings.proxyEndpoint?.trim();
  const apiKey=settings.apiKey?.trim();
  if(!proxy&&!apiKey)throw Object.assign(new Error('Gemini API key missing'),{status:401});
  if(!(audioBlob instanceof Blob)||!audioBlob.size)throw new Error('Audio recording is empty');
  return withFallback(model=>proxy?requestProxyAudio({endpoint:proxy,model,prompt,audioBlob}):requestDirectAudio({apiKey,model,prompt,audioBlob}),{onAttempt});
}

export function extractGeminiJson(payload) {
  if (payload?.candidates) {
    const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Empty Gemini response');
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
  if (payload?.data) return payload.data;
  return payload;
}
