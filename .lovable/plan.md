## Multi-Language Transcription & Live Translation

### Goal
Let participants pick their own spoken language and their preferred display language. As each person talks, everyone else sees the transcript translated into their chosen language in real time. Example: speaker talks English → Spanish viewer sees Spanish; speaker talks Spanish → English viewer sees English.

### Languages (initial set)
English, Spanish, French, German, Portuguese, Italian, Mandarin Chinese, Japanese, Hindi, Arabic. Easy to extend later.

### UX

**Language selector bar** above the transcript (and inside `RecordingControls`):
- "I speak" dropdown → sets the speech-recognition language (`recognition.lang`).
- "Show transcript in" dropdown → sets the viewer's display language.
- Quick-select chips (EN / ES / FR …) for one-tap switching.
- Stored in `localStorage` so it persists between sessions.

**Transcript display**:
- Each entry shows the translated text in the viewer's chosen language as the primary line.
- A small muted "original" line below shows the source text + source language badge (e.g. `EN`).
- A toggle in the header: "Show original" on/off.
- If source language == display language, no translation call is made and no "original" line is shown.

### How it works

```text
Mic → SpeechRecognition (lang = "I speak")
        → final transcript chunk (sourceLang, text)
        → if sourceLang !== displayLang:
              call translate edge function
              → store { text, sourceLang, translations: { es: "...", en: "..." } }
        → render translation for current displayLang
```

Translations are cached per entry per target language so switching the display language is instant for already-translated lines and only triggers new API calls for untranslated targets.

### Step-by-step

1. **New edge function `translate`** (`supabase/functions/translate/index.ts`)
   - Input: `{ text, sourceLang, targetLang }`
   - Uses Lovable AI Gateway (`google/gemini-2.5-flash`) with a strict system prompt: "Translate the user message from {sourceLang} to {targetLang}. Output only the translation, no quotes, no commentary."
   - Returns `{ translation }`. CORS + 429/402 handling like existing functions.
   - Register in `supabase/config.toml` with `verify_jwt = false`.

2. **Language config module** `src/lib/languages.ts`
   - Exports `SUPPORTED_LANGUAGES` array: `{ code: "en", bcp47: "en-US", label: "English", flag: "🇺🇸" }` etc.
   - Helpers `getLanguageByCode`, `getBcp47`.

3. **Language selector UI** `src/components/LanguageSelector.tsx`
   - Two `Select` dropdowns ("I speak" / "Show in") with flags and labels.
   - Compact variant for the recording bar.

4. **Update `TranscriptEntry` type** (in `TranscriptionApp.tsx` and `TranscriptDisplay.tsx`)
   - Add `sourceLang: string` and `translations: Record<string, string>` (target lang code → translated text).

5. **Wire into `TranscriptionApp.tsx`**
   - New state: `spokenLang`, `displayLang`, `showOriginal` (persisted in localStorage).
   - When `spokenLang` changes mid-session: stop & restart `recognition` with the new `recognition.lang`.
   - On every final transcript chunk:
     - Save entry with `sourceLang = spokenLang`, `translations = { [spokenLang]: text }`.
     - If `displayLang !== spokenLang`, call `supabase.functions.invoke("translate", …)` and merge the result into `translations`.
   - When the user changes `displayLang`, walk existing entries and translate any that don't yet have that target cached (batched, lightweight).

6. **Update `TranscriptDisplay.tsx`**
   - Render `entry.translations[displayLang] ?? entry.text` as the main text.
   - Show small `sourceLang` badge + original text underneath when `showOriginal` and `sourceLang !== displayLang`.
   - Add a "Translating…" shimmer state while a translation is pending.

7. **BrainstormSession (optional, scoped follow-up)**
   - Out of scope for this change unless you also want the AI brainstorm flow translated. Flag for a future step.

### Technical details

- **Source language for recognition**: Web Speech API only listens in one language at a time, so we use the speaker's "I speak" setting as `recognition.lang`. If multiple people speaking different languages share one mic, accuracy will drop — this is a Web Speech limitation, not our app. The doc on the language selector will note: "Each device should set its own spoken language for best accuracy."
- **Translation provider**: Lovable AI Gateway via existing `LOVABLE_API_KEY` (no new secret, no cost surprises beyond gateway usage).
- **Caching**: in-memory per entry; nothing persisted server-side. Saved meetings keep `translations` in their stored JSON so re-opens are instant.
- **Performance**: translations fire per final chunk, not per interim word. Pending translations don't block transcript rendering.
- **Fallback**: if the translate function errors, we render the original text and log the error — session never breaks.

### Out of scope (can do next)
- Translating the AI Brainstorm responses + TTS in another language.
- Per-entry "translate to a different language" one-off action.
- Persisting translations into the meeting summary / email export.
