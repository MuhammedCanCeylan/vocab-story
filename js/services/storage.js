import { APP_CONFIG } from '../config.js?v=4.2.1';

const defaultState = () => ({
  settings: {
    level: APP_CONFIG.defaultLevel,
    dailyGoal: APP_CONFIG.dailyGoal,
    readerMode: 'learning',
    apiKey: '',
    model: APP_CONFIG.preferredModel,
    proxyEndpoint: ''
  },
  vocabulary: [],
  dictionary: {},
  storyBuilderWordIds: [],
  generatedLessons: [],
  savedSentences: [],
  reading: {
    currentBookId: 'last-train',
    currentChapter: 0,
    completedChapters: {},
    bookProgress: {},
    totalWordsRead: 0,
    totalMinutesRead: 0,
    sessions: []
  },
  speaking: {
    attempts: 0,
    totalScore: 0,
    bestScore: 0
  },
  activity: {
    streak: 0,
    lastActiveDate: '',
    lessonsToday: 0,
    days: {}
  },
  quiz: {
    correct: 0,
    total: 0
  }
});

function deepMerge(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return base;
  const output = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value)) output[key] = value;
    else if (value && typeof value === 'object' && base?.[key] && typeof base[key] === 'object') output[key] = deepMerge(base[key], value);
    else output[key] = value;
  }
  return output;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKey);
    return raw ? deepMerge(defaultState(), JSON.parse(raw)) : defaultState();
  } catch {
    return defaultState();
  }
}

let state = loadState();

export function getState() { return state; }
export function saveState() { localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(state)); }
export function updateState(mutator) { mutator(state); saveState(); return state; }

export function replaceState(nextState) {
  state = deepMerge(defaultState(), nextState);
  saveState();
  return state;
}

export function resetState() {
  state = defaultState();
  saveState();
  return state;
}

export function exportState() {
  return JSON.stringify({ version: APP_CONFIG.version, exportedAt: new Date().toISOString(), state }, null, 2);
}

function normalizeImportKey(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z'\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeImportedStatus(value) {
  const status = String(value || '').toLowerCase().trim();
  if (['mastered','learned','known','biliyorum','öğrenildi','ogrendi'].includes(status)) return 'mastered';
  if (['review','repeat','relearn','tekrar'].includes(status)) return 'review';
  return 'learning';
}

function normalizeImportedWord(entry, index=0) {
  if (!entry || typeof entry !== 'object') return null;
  const word = String(entry.word ?? entry.term ?? entry.english ?? entry.front ?? '').trim();
  if (!word) return null;
  const now = Date.now();
  const status = normalizeImportedStatus(entry.status);
  return {
    id: String(entry.id || `import_${now}_${index}_${Math.random().toString(36).slice(2,8)}`),
    word,
    meaningTr: String(entry.meaningTr ?? entry.meaning ?? entry.turkish ?? entry.translation ?? entry.back ?? '').trim(),
    definitionEn: String(entry.definitionEn ?? entry.definition ?? '').trim(),
    ipa: String(entry.ipa ?? entry.phonetic ?? '').trim(),
    example: String(entry.example ?? entry.exampleSentence ?? '').trim(),
    type: String(entry.type ?? entry.partOfSpeech ?? '').trim(),
    level: String(entry.level ?? '').trim(),
    source: String(entry.source || 'import'),
    status,
    createdAt: Number(entry.createdAt) || now - index,
    dueAt: Number(entry.dueAt) || (status === 'mastered' ? now + 30 * 86_400_000 : now),
    intervalDays: Number(entry.intervalDays) || (status === 'mastered' ? 30 : 0),
    repetitions: Number(entry.repetitions) || (status === 'mastered' ? 4 : 0),
    ease: Number(entry.ease) || 2.5,
    lastReviewedAt: entry.lastReviewedAt ? Number(entry.lastReviewedAt) || null : null
  };
}

function normalizeImportedVocabulary(list) {
  if (!Array.isArray(list)) return [];
  const result = [];
  const seen = new Set();
  list.forEach((entry, index) => {
    const normalized = normalizeImportedWord(entry, index);
    if (!normalized) return;
    const key = normalizeImportKey(normalized.word);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });
  return result;
}

function mergeVocabulary(existing, incoming) {
  const merged = [...(Array.isArray(existing) ? existing : [])];
  const byKey = new Map(merged.map((item, index) => [normalizeImportKey(item.word), index]));
  let added = 0;
  let updated = 0;
  for (const item of incoming) {
    const key = normalizeImportKey(item.word);
    if (!key) continue;
    const index = byKey.get(key);
    if (index == null) {
      byKey.set(key, merged.length);
      merged.push(item);
      added++;
      continue;
    }
    const current = merged[index];
    merged[index] = {
      ...current,
      meaningTr: current.meaningTr || item.meaningTr,
      definitionEn: current.definitionEn || item.definitionEn,
      ipa: current.ipa || item.ipa,
      example: current.example || item.example,
      type: current.type || item.type,
      level: current.level || item.level,
      status: item.status || current.status
    };
    updated++;
  }
  return { vocabulary: merged, added, updated };
}

function extractLegacyVocabulary(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== 'object') return null;
  for (const key of ['vocabulary','vocabPool','vocab_pool','words','items']) {
    if (Array.isArray(parsed[key])) return parsed[key];
  }
  return null;
}

export function importState(jsonText) {
  const parsed = JSON.parse(String(jsonText || '').replace(/^\uFEFF/, ''));

  // V4 full backup: { version, exportedAt, state: { ... } }
  if (parsed && !Array.isArray(parsed) && parsed.state && typeof parsed.state === 'object') {
    const imported = { ...parsed.state };
    if (Array.isArray(imported.vocabulary)) imported.vocabulary = normalizeImportedVocabulary(imported.vocabulary);
    const next = replaceState(imported);
    return {
      mode: 'full',
      importedWords: next.vocabulary.length,
      addedWords: next.vocabulary.length,
      updatedWords: 0,
      totalWords: next.vocabulary.length,
      version: parsed.version || ''
    };
  }

  // Partial V4 state object without wrapper.
  if (parsed && !Array.isArray(parsed) && typeof parsed === 'object' &&
      ['settings','vocabulary','reading','speaking','activity','quiz','generatedLessons'].some(k => k in parsed)) {
    const imported = { ...parsed };
    if (Array.isArray(imported.vocabulary)) imported.vocabulary = normalizeImportedVocabulary(imported.vocabulary);
    const next = replaceState(imported);
    return {
      mode: 'state',
      importedWords: next.vocabulary.length,
      addedWords: next.vocabulary.length,
      updatedWords: 0,
      totalWords: next.vocabulary.length,
      version: parsed.version || ''
    };
  }

  // V1/V2/V3 backups were commonly just an array of vocabulary entries.
  // Some third-party/export variants wrap that array in vocabPool/vocab_pool/words/items.
  const legacyList = extractLegacyVocabulary(parsed);
  if (legacyList) {
    const normalized = normalizeImportedVocabulary(legacyList);
    if (!normalized.length && legacyList.length) throw new Error('No valid vocabulary entries in backup');
    if (!normalized.length) throw new Error('Backup contains zero vocabulary entries');
    const result = mergeVocabulary(state.vocabulary, normalized);
    state.vocabulary = result.vocabulary;
    saveState();
    return {
      mode: 'legacy-vocabulary',
      importedWords: normalized.length,
      addedWords: result.added,
      updatedWords: result.updated,
      totalWords: state.vocabulary.length,
      version: parsed?.version || 'legacy'
    };
  }

  throw new Error('Invalid VocabStory backup');
}

export function dayKey(date=new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

export function registerActivity(type, amount=1) {
  updateState(s => {
    const today = dayKey();
    const yesterday = dayKey(new Date(Date.now()-86400000));
    if (s.activity.lastActiveDate !== today) {
      s.activity.streak = s.activity.lastActiveDate === yesterday ? Math.max(1, s.activity.streak + 1) : 1;
      s.activity.lessonsToday = 0;
    }
    s.activity.lastActiveDate = today;
    if (!s.activity.days[today]) s.activity.days[today] = { lessons:0, words:0, minutes:0, reviews:0, speaking:0 };
    if (type === 'lesson') { s.activity.lessonsToday += amount; s.activity.days[today].lessons += amount; }
    else if (type === 'words') s.activity.days[today].words += amount;
    else if (type === 'minutes') s.activity.days[today].minutes += amount;
    else if (type === 'review') s.activity.days[today].reviews += amount;
    else if (type === 'speaking') s.activity.days[today].speaking += amount;
  });
}
