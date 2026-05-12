## Localize app UI: English ↔ Spanish (v1)

### Goal
When a user picks **Español** in the "I speak" dropdown, the entire app interface (buttons, labels, status text, toasts) switches to Spanish. Picking **English** switches back. Other languages stay English for now.

### Approach
Lightweight in-house i18n — no library, no runtime translation calls. Two static string maps (`en`, `es`) and a tiny `t()` helper via React context.

### Steps

1. **Create `src/lib/i18n/strings.ts`**
   - Define a `Translations` type listing every UI key (e.g. `record.start`, `record.stop`, `record.status.listening`, `record.status.idle`, `record.entries`, `record.clear`, `lang.iSpeak`, `lang.showIn`, `lang.showOriginal`, `transcript.empty`, `transcript.translating`, `summary.generate`, `feedback.button`, `privacy.banner.title`, etc.).
   - Export `en` (source of truth) and `es` (Spanish copy authored inline).

2. **Create `src/lib/i18n/I18nProvider.tsx`**
   - Context exposes `{ uiLang, setUiLang, t(key, vars?) }`.
   - Persists `uiLang` in `localStorage` (`recall.uiLang`).
   - Falls back to `en` when a key is missing.
   - Sets `document.documentElement.lang`.

3. **Wrap app** in `src/App.tsx` with `<I18nProvider>`.

4. **Bind to "I speak"**
   - In `TranscriptionApp.tsx`, when `spokenLang` changes, call `setUiLang(spokenLang === "es" ? "es" : "en")`. Any non-Spanish selection keeps the UI in English.

5. **Replace hard-coded strings with `t(...)`** across the user-facing surface:
   - `RecordingControls` — Start/Stop Transcription, Status, Listening, Idle, Entries, Clear Transcript, heading.
   - `LanguageSelector` — Languages, I speak, Show in, Show original.
   - `TranscriptDisplay` — empty state, "Translating…".
   - `AppHeader` — nav + tagline.
   - `BrainstormLauncher` / `BrainstormSession` — visible buttons and prompts.
   - `EmailSummary`, `MeetingSummary`, `HighlightsSidebar`, `PersonalDashboard` — headings + buttons.
   - `FeedbackButton` / `FeedbackModal` — labels.
   - `PrivacyBanner`, `PrivacySettings`, `PrivacyModeIndicator` — text.
   - `CheatSheet` — headings.
   - Toast messages raised from these screens.

### Out of scope (v1)
- Other languages in the dropdown stay English in the UI (transcript translation still works for them as today).
- Landing page marketing copy and `public/user-guide.html`.
- Email templates.
- AI-generated content (transcripts, summaries) — already handled by the existing per-entry translation flow.

### Technical details
- `t(key, vars?)` with simple `{name}` interpolation.
- Type-safe: `Translations` is a flat keyed type so missing strings surface as TS errors.
- No network calls, no new secrets, switch is instant.

### File changes
- add: `src/lib/i18n/strings.ts`, `src/lib/i18n/I18nProvider.tsx`
- edit: `src/App.tsx`, `src/components/TranscriptionApp.tsx`, `src/components/RecordingControls.tsx`, `src/components/LanguageSelector.tsx`, `src/components/TranscriptDisplay.tsx`, `src/components/AppHeader.tsx`, plus the brainstorm / summary / privacy / feedback components listed above.
