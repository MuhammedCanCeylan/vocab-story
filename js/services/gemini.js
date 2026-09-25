import { APP_CONFIG } from '../config.js';
import { getState, updateState } from './storage.js';

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

async function requestProxy({ endpoint, model, prompt }) {
  const response = await fetch(endpoint, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({model,prompt})
  });
  const text = await response.text().catch(()=> '');
  if (!response.ok) { const error=new Error(`Proxy ${response.status} · ${text.slice(0,240)}`); error.status=response.status; throw error; }
  return JSON.parse(text);
}

export async function generateJson(prompt, { onAttempt } = {}) {
  const { settings } = getState();
  const proxy = settings.proxyEndpoint?.trim();
  const apiKey = settings.apiKey?.trim();
  if (!proxy && !apiKey) throw Object.assign(new Error('Gemini API key missing'), { status:401 });
  const candidates = modelsFor(settings.model);
  let lastError;

  for (let i=0;i<candidates.length;i++) {
    const model = candidates[i];
    const attempts = i===0 ? 2 : 1;
    for (let attempt=0; attempt<attempts; attempt++) {
      onAttempt?.({model,attempt:attempt+1,index:i,total:candidates.length});
      try {
        const data = proxy ? await requestProxy({endpoint:proxy,model,prompt}) : await requestDirect({apiKey,model,prompt});
        updateState(s => { s.settings.model = model; });
        return {data,model};
      } catch (error) {
        lastError = error;
        if (error.status === 404) break;
        if (error.status && !retryable(error.status)) throw error;
        if (attempt < attempts-1) {
          await wait(850*(2**attempt) + Math.floor(Math.random()*400));
          continue;
        }
        break;
      }
    }
  }
  throw lastError || new Error('No Gemini model available');
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
