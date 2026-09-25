export const APP_CONFIG = {
  version: '4.1.0',
  storageKey: 'vocabstory_v4_state',
  defaultLevel: 'A2',
  dailyGoal: 3,
  preferredModel: 'gemini-3.8-flash',
  fallbackModels: [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite'
  ],
  targetWordsPerLesson: 7,
  srs: {
    againMinutes: 10,
    hardDays: 1,
    goodDays: 3,
    easyDays: 7
  }
};
