# VocabStory V4.1

VocabStory is a browser-based English learning app built around one loop:

**Read → Understand → Speak → Review → Remember**

V4.1 keeps the modular GitHub Pages-friendly architecture and expands the reader, vocabulary workspace, quiz system and Firefox speech support.

## What is included

### Home
- Daily goal and streak
- Continue reading
- Due SRS reviews
- Weekly activity
- Recent vocabulary

### Read
- A1, A2 and B1 built-in graded stories
- Chapter vocabulary preview with learning/review/mastered status colors
- Full unique chapter word list with search
- Click any word to fetch/cache contextual Turkish meaning, IPA and English explanation
- Batch “prepare all Turkish meanings” action
- Multi-word phrase recognition (`pick up`, `instead of`, etc.)
- Word / phrase learning panel
- IPA, English definition, Turkish context meaning and example sentence
- Sentence-level Turkish translation
- Sentence and full-chapter TTS
- Save sentence feature
- Chapter comprehension quiz
- Vocabulary Lab: Turkish meaning, English definition and fill-the-gap questions
- Grammar Discovery cards
- AI retelling feedback
- Focus / Learning reader modes
- Reading progress and word count
- AI graded-story generator using the user's vocabulary pool

### Speak
- Airport, café, hotel and work scenarios
- TTS shadowing
- Browser speech recognition when supported
- Firefox/Floorp fallback: MediaRecorder → Gemini audio evaluation
- Approximate sentence similarity score
- Gemini-generated roleplay with model fallback

### Vocabulary
- SRS review queue
- Again / Hard / Good / Easy review actions
- Search and All / Learning / Review / Mastered filters
- Full-row status colors for learning, review and mastered words
- Bulk word selection
- Study the selected/current filtered list as flashcards
- Copy the selected/current filtered list
- Send selected/review words directly to the AI story builder
- Quizlet-like smart paste importer
- Supports `word - meaning`, tab-separated and alternating word/meaning lines
- Removes copied UI noise such as `star filled`, `sound`, `edit`
- Saved sentences

### Progress
- Words read
- Mastered vocabulary
- Quiz accuracy
- Speaking average
- Weekly activity chart
- Book progress
- Milestones

### App / platform
- Modular ES modules
- Light / dark mode
- PWA shell + service worker
- Mobile bottom navigation
- Old V3 vocabulary, API key and activity migration
- Gemini retry + fallback model chain
- Optional backend proxy endpoint

## Project structure

```text
vocab-story-v4/
├─ index.html
├─ favicon.svg
├─ manifest.webmanifest
├─ service-worker.js
├─ README.md
├─ CHANGELOG.md
├─ css/
│  ├─ tokens.css
│  ├─ app.css
│  ├─ reader.css
│  └─ responsive.css
└─ js/
   ├─ app.js
   ├─ config.js
   ├─ router.js
   ├─ data/
   │  └─ books.js
   ├─ modules/
   │  ├─ home.js
   │  ├─ read.js
   │  ├─ speak.js
   │  ├─ vocabulary.js
   │  ├─ vocabImport.js
   │  └─ progress.js
   ├─ services/
   │  ├─ gemini.js
   │  ├─ speech.js
   │  ├─ dictionary.js
   │  ├─ srs.js
   │  └─ storage.js
   └─ ui/
      ├─ icons.js
      ├─ toast.js
      └─ wordModal.js
```

## Run locally

ES modules should be served over HTTP rather than opened with `file://`.

```bash
cd vocab-story-v4.1
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## GitHub Pages

Upload the **contents** of `vocab-story-v4.1/` to the repository/folder used by GitHub Pages. All asset paths are relative, so a project URL such as:

```text
https://USERNAME.github.io/vocab-story/
```

is supported.

After replacing an older VocabStory deployment, do one hard refresh (`Ctrl + Shift + R`). The V4 service worker is network-first and updates its cache as the new files are requested.

## Gemini configuration

Default preferred model is defined in:

```js
// js/config.js
preferredModel: 'gemini-3.8-flash'
```

The app includes retry/fallback behavior in `js/services/gemini.js`.

You can configure either:

1. A Gemini API key in **Settings → AI**, or
2. A backend proxy endpoint.

### Security note

A Gemini API key used directly from a static GitHub Pages site is visible to the browser user in DevTools / Network. For a public production deployment, use the proxy option and keep the provider API key on the server.

## Legacy migration

On the first V4 launch, the app can migrate these old V3 browser values:

- `vocab_pool`
- `gemini_api_key`
- `gemini_model`
- `vocabstory_activity`

V4 itself stores its application state under:

```text
vocabstory_v4_state
```

On Windows you can also double-click `start.bat`.

## Firefox speech fallback

Firefox does not expose the same native `SpeechRecognition` path used by Chromium browsers. V4.1 records a short microphone clip with `MediaRecorder` and sends it to Gemini for transcription/pronunciation matching when AI settings are configured. Text-to-speech still uses the browser `speechSynthesis` engine.

## Next suggested milestones

- Public-domain book catalog stored as separate JSON files
- Streaming audiobook word highlighting
- Per-user cloud accounts and sync
- Proper server-side Gemini proxy
- AI tutor for selected sentences and grammar questions
- Rich SRS scheduling / learning history
- Book search, tags and downloadable offline packs
