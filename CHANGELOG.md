# Changelog

## 4.1.2 — 2026-09-25

### Hotfix
- Fixed a broken multiline string literal in `js/modules/read.js` inside the chapter-word copy action.
- `rows.join('\n')` now uses an escaped newline instead of a literal line break inside single quotes.
- Bumped all ES-module cache-busting query strings and the service-worker cache namespace to 4.1.2.
- Validation now uses `node --input-type=module --check` for ES modules so this class of syntax error is caught before release.

## 4.1.0 — 2026-09-25

### Reader & dictionary
- Added a searchable list of every unique word in each chapter.
- Any non-target word can request a contextual Turkish meaning, IPA and simple English definition through Gemini and cache the result locally.
- Added batch preparation of Turkish meanings for a full chapter.
- Added visible learning/review/mastered states to chapter target vocabulary and reader tokens.
- Added one-click “move all chapter targets to Review”.

### Vocabulary workspace
- Added All / Learning / Review / Mastered counters and filters.
- Word rows now change their full visual treatment based on status.
- Added bulk selection, filtered-list study mode, list copy and story-builder actions.
- Selected or filtered words can seed a new AI graded story.
- Added a dedicated flashcard study session for any filtered/selected list.

### Quiz
- Added Vocabulary Lab questions alongside comprehension: Turkish meaning, English definition and contextual fill-the-gap.

### Firefox / Floorp speech
- Hardened browser TTS voice loading.
- Added MediaRecorder + Gemini audio fallback when native SpeechRecognition is unavailable.
- Audio is sent as a supported inline audio MIME payload and scored against the target sentence.

### Platform
- Added a dictionary cache to V4 state.
- Bumped the service-worker cache namespace.
- Added `start.bat` and `start.ps1` for local Windows development.

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
