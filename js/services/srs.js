import { APP_CONFIG } from '../config.js?v=4.1.2';
import { getState, updateState, registerActivity } from './storage.js?v=4.1.2';

export function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[’]/g,"'").replace(/[^a-z'\-\s]/g,' ').replace(/\s+/g,' ').trim();
}

export function ensureVocab(entry) {
  const key = normalizeKey(entry.word);
  if (!key) return null;
  let result;
  updateState(s => {
    const existing = s.vocabulary.find(v => normalizeKey(v.word) === key);
    if (existing) {
      Object.assign(existing, Object.fromEntries(Object.entries(entry).filter(([,v]) => v !== undefined && v !== '')));
      result = existing;
      return;
    }
    const now = Date.now();
    result = {
      id: crypto?.randomUUID?.() || `w_${now}_${Math.random().toString(36).slice(2)}`,
      word: entry.word,
      meaningTr: entry.meaningTr || entry.meaning || '',
      definitionEn: entry.definitionEn || '',
      ipa: entry.ipa || '',
      example: entry.example || '',
      type: entry.type || '',
      level: entry.level || '',
      source: entry.source || 'manual',
      status: 'learning',
      createdAt: now,
      dueAt: now,
      intervalDays: 0,
      repetitions: 0,
      ease: 2.5,
      lastReviewedAt: null
    };
    s.vocabulary.push(result);
  });
  return result;
}

export function getDueWords() {
  const now = Date.now();
  return getState().vocabulary.filter(v => (v.dueAt || 0) <= now && v.status !== 'mastered').sort((a,b)=>(a.dueAt||0)-(b.dueAt||0));
}

export function reviewWord(wordId, rating) {
  const now = Date.now();
  updateState(s => {
    const item = s.vocabulary.find(v => v.id === wordId);
    if (!item) return;
    item.lastReviewedAt = now;
    item.repetitions = (item.repetitions || 0) + 1;
    if (rating === 'again') {
      item.intervalDays = 0;
      item.dueAt = now + APP_CONFIG.srs.againMinutes * 60_000;
      item.ease = Math.max(1.3, (item.ease || 2.5) - .2);
      item.status = 'review';
    } else if (rating === 'hard') {
      item.intervalDays = Math.max(APP_CONFIG.srs.hardDays, Math.round((item.intervalDays || 1) * 1.2));
      item.dueAt = now + item.intervalDays * 86_400_000;
      item.ease = Math.max(1.3, (item.ease || 2.5) - .05);
      item.status = 'review';
    } else if (rating === 'good') {
      item.intervalDays = item.intervalDays ? Math.max(APP_CONFIG.srs.goodDays, Math.round(item.intervalDays * (item.ease || 2.5))) : APP_CONFIG.srs.goodDays;
      item.dueAt = now + item.intervalDays * 86_400_000;
      item.status = item.repetitions >= 4 ? 'mastered' : 'learning';
    } else if (rating === 'easy') {
      item.intervalDays = item.intervalDays ? Math.max(APP_CONFIG.srs.easyDays, Math.round(item.intervalDays * (item.ease || 2.5) * 1.35)) : APP_CONFIG.srs.easyDays;
      item.dueAt = now + item.intervalDays * 86_400_000;
      item.ease = Math.min(3.2, (item.ease || 2.5) + .1);
      item.status = item.repetitions >= 3 ? 'mastered' : 'learning';
    }
  });
  registerActivity('review',1);
}

export function setWordStatus(wordId, status) {
  updateState(s => {
    const item = s.vocabulary.find(v => v.id === wordId);
    if (!item) return;
    item.status = status;
    if (status === 'mastered') item.dueAt = Date.now() + 30 * 86_400_000;
    if (status === 'review') item.dueAt = Date.now();
  });
}
