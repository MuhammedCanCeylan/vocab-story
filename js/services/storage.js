import { APP_CONFIG } from '../config.js';

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

export function importState(jsonText) {
  const parsed = JSON.parse(jsonText);
  const imported = parsed?.state || parsed;
  if (!imported || typeof imported !== 'object') throw new Error('Invalid VocabStory backup');
  return replaceState(imported);
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
