# Changelog

## 4.2.0 — 2026-09-25

### Reader vocabulary clarity
- Reader text no longer visually marks every clickable word.
- Every word remains clickable, but only meaningful learning states are highlighted.
- Unsaved chapter targets use the purple target style.
- Words already in the user's vocabulary pool are highlighted by their real status:
  - Learning → cyan/blue
  - Review → amber
  - Mastered → green
- Added a compact color legend below the chapter target vocabulary.

### Complete Turkish access
- Every bundled story word now has an immediate Turkish meaning through chapter vocabulary or the local core dictionary; built-in books do not require AI for word translation.
- Added a local `js/data/coreDictionary.js` layer.
- Generated/dynamic stories use the local dictionary first and batch only the remaining unknown words through Gemini.
- Batch dictionary requests now include each word's own context sentence for better contextual Turkish meanings.
- Dictionary batch results are stored under the exact requested surface form so inflected words such as `went`, `grabbed`, or `waiting` remain addressable.
- Clicking a word now shows both the English story sentence and its Turkish sentence translation in the learning panel and word modal.
- “All words” rows also show the Turkish context sentence preview.
- Added Turkish dictionary coverage progress to the chapter word browser.
- Added automatic background dictionary completion when AI/proxy settings exist.
- Chapter word export now includes word, Turkish meaning, IPA, English context sentence and Turkish sentence translation.

### Sentence translation
- Added a Reader-toolbar action to show/hide all Turkish sentence translations at once.
- Existing per-sentence translation buttons remain available.

### Vocabulary workspace
- Fixed the All / Learning / Review / Mastered filter bar overflowing into the Smart Import card on desktop.
- Filter buttons now stay inside the vocabulary card and adapt to a 2×2 layout on narrow screens.

### Quiz
- Vocabulary Lab now supports up to five question types/items per chapter.
- Added reverse Turkish meaning and an additional contextual fill-the-gap challenge.
- Quiz progress now reports actual correct answers as well as answered count.

### Text handling
- Reader tokenization now supports Latin diacritics such as `café` instead of truncating them.
- Vocabulary key normalization strips diacritics only for matching, preserving the visible source text.

### Translation architecture
- Kept Google Cloud Translation out of the public static frontend because Cloud Translation v3 is designed around server-side credentials and adding another exposed billed key would reduce security.
- The translation layer is now structured so a future backend proxy can replace Gemini dictionary completion without changing Reader UI code.

## 4.1.2 — 2026-09-25

### Hotfix
- Fixed a broken multiline string literal in `js/modules/read.js` inside the chapter-word copy action.
- Added strict ES-module syntax validation and stronger cache busting.

## 4.1.0 — 2026-09-25

### Reader & dictionary
- Added a searchable list of every unique word in each chapter.
- Added contextual Turkish dictionary caching and batch preparation.
- Added visible learning/review/mastered states and chapter target review actions.

### Vocabulary workspace
- Added status counters/filters, full-row colors, bulk selection, list study, copy and story-builder actions.

### Quiz
- Added Vocabulary Lab alongside comprehension.

### Firefox / Floorp speech
- Added MediaRecorder + Gemini audio fallback when native SpeechRecognition is unavailable.

## 4.0.0 — 2026-09-25

- Replaced the single-file prototype with modular HTML/CSS/ES modules.
- Added Home, Read, Speak, Vocabulary and Progress routes.
- Added graded reader, SRS, smart import, progress tracking, PWA shell and Gemini fallback service.
