# Changelog

## 4.0.0 — 2026-09-25

### Architecture
- Replaced the single-file prototype with modular HTML, CSS and ES modules.
- Added hash routing for Home, Read, Speak, Vocabulary and Progress.
- Added PWA manifest and network-first service worker shell cache.

### Reader
- Added graded library and chapter reader.
- Added sentence-level translation and TTS.
- Added word/phrase recognition with multi-word target support.
- Added English-first vocabulary explanations, IPA, Turkish context meanings and examples.
- Added chapter vocabulary preview, quizzes, Grammar Discovery and saved sentences.
- Added active-recall retelling with optional Gemini feedback.
- Added AI graded-story generation from the vocabulary pool.

### Learning system
- Added basic SRS queue and four review ratings.
- Added smart vocabulary paste importer.
- Added reading, quiz, speaking and weekly activity tracking.
- Added daily goal, streak and milestone UI.

### Speaking
- Added practical airport, café, hotel and work scenarios.
- Added TTS, speech recognition integration and similarity scoring.
- Added optional AI roleplay generation.

### Compatibility
- Added migration of legacy V3 vocabulary/API/activity data.
- Added Gemini retry/fallback service.
