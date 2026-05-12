## Goal

Apply the highest-impact audio quality wins that don't require new paid services or breaking changes. Two areas:

1. **Cleaner microphone capture** for the main meeting recorder.
2. **Language-aware, higher-quality TTS** so the voice matches what the user speaks.

A bigger upgrade (replacing the browser's Web Speech API with a server-side ASR like Deepgram/Whisper) is intentionally **out of scope** here — it's a bigger lift, costs money per minute, and needs a separate decision.

---

## Changes

### 1. Main recorder — better mic constraints

In `src/components/TranscriptionApp.tsx` (line 437) replace:

```ts
getUserMedia({ audio: true })
```

with the same constraints the Brainstorm flow already uses, plus mono + 16 kHz which is ideal for speech recognition:

```ts
getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 16000,
  },
})
```

Effect: less echo, less background hiss, more consistent levels, smaller bandwidth — which all help Web Speech recognition accuracy.

### 2. TTS edge function — language-aware + best voices

`supabase/functions/text-to-speech/index.ts` is hard-coded to `en-US-Neural2-J`. Two improvements:

- Accept a `lang` parameter (ISO code: `en`, `es`, `fr`, …).
- Map each supported language to Google's best available voice tier in this order: **Chirp 3 HD → Studio → Neural2 → WaveNet → Standard**. For our 10 languages that resolves to (current best, all available without extra setup):

  | lang | voice |
  |---|---|
  | en | `en-US-Studio-O` (female) / `en-US-Studio-Q` (male) |
  | es | `es-ES-Neural2-F` |
  | fr | `fr-FR-Neural2-D` |
  | de | `de-DE-Neural2-F` |
  | pt | `pt-BR-Neural2-C` |
  | it | `it-IT-Neural2-A` |
  | zh | `cmn-CN-Wavenet-A` |
  | ja | `ja-JP-Neural2-B` |
  | hi | `hi-IN-Neural2-A` |
  | ar | `ar-XA-Wavenet-A` |

- Default `lang` to `en` if missing, so existing callers keep working.

### 3. Pass language from the client

`src/components/BrainstormSession.tsx` is the only TTS caller. Update its fetch body to include `lang: spokenLang` (it already has access to it). Also pass it through the prop chain if needed.

### 4. (Tiny) MediaRecorder hint

In `src/components/VoiceEnrollment.tsx` request `{ mimeType: "audio/webm;codecs=opus" }` when supported, with a graceful fallback. Stops Chrome from silently choosing a worse container while still letting Safari fall back.

---

## Out of scope (mention in chat after, don't build now)

- Replacing Web Speech API with server-side ASR (Deepgram / AssemblyAI / Whisper) for cross-browser support, punctuation, and diarization.
- Replacing the homegrown pitch-based speaker ID with a real voice-embedding model.
- Adding ElevenLabs as an alternate TTS provider.

These are real upgrades but each adds a paid dependency, so I'll flag them as next steps and let you choose.

---

## Files touched

- `src/components/TranscriptionApp.tsx` — mic constraints
- `supabase/functions/text-to-speech/index.ts` — language-aware voice selection
- `src/components/BrainstormSession.tsx` — pass `lang` to TTS
- `src/components/VoiceEnrollment.tsx` — explicit MediaRecorder mimeType
