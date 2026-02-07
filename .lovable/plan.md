

## Add Google Cloud Text-to-Speech for Natural Voice

### Overview

Replace the robotic Browser TTS with Google Cloud's Neural2 voices for natural-sounding AI responses during brainstorm sessions.

### Step-by-Step

**Step 1: Store API Key Securely**
- Request your Google Cloud API key using the secure secret storage
- It will be stored as `GOOGLE_CLOUD_TTS_API_KEY` and accessible only by backend functions

**Step 2: Create New Backend Function (`text-to-speech`)**
- New file: `supabase/functions/text-to-speech/index.ts`
- Receives text from the frontend
- Calls Google Cloud TTS API with `en-US-Neural2-J` voice (natural-sounding male voice)
- Returns base64-encoded MP3 audio
- Includes CORS headers and error handling with logging

**Step 3: Update Brainstorm Session Voice Output**
- File: `src/components/BrainstormSession.tsx`
- Replace the `speakText` function: instead of Browser TTS (`SpeechSynthesisUtterance`), call the new `text-to-speech` backend function
- Play returned audio using the Web Audio API (`AudioContext` + `AudioBufferSourceNode`)
- Keep all existing behavior intact:
  - Pause speech recognition while AI speaks
  - Resume recognition after playback ends
  - Support mute toggle
  - Support click-to-interrupt (stops audio playback immediately)
- Add graceful fallback: if the cloud TTS fails (network issue, quota exceeded), automatically fall back to Browser TTS so the session never breaks

**Step 4: Register the Function**
- Update `supabase/config.toml` to include the new `text-to-speech` function with `verify_jwt = false`

### How the Flow Changes

```text
Current:
AI text response --> Browser TTS (robotic voice) --> Speaker

New:
AI text response --> Backend Function --> Google Cloud TTS API --> MP3 audio --> Web Audio API --> Speaker
                                                                     |
                                                          (on failure: fallback to Browser TTS)
```

### Technical Details

**Edge function (`supabase/functions/text-to-speech/index.ts`):**
- Reads `GOOGLE_CLOUD_TTS_API_KEY` from environment
- POST to `https://texttospeech.googleapis.com/v1/text:synthesize`
- Voice: `en-US-Neural2-J`, speaking rate `0.95`, pitch `-1.0` for a natural male voice
- Returns JSON with `{ audioContent: "<base64 MP3>" }`

**Frontend audio playback in `BrainstormSession.tsx`:**
- Convert base64 to data URI (`data:audio/mpeg;base64,...`)
- Play with `new Audio(dataUri)` for simplicity
- Track `onended` to resume speech recognition and reset `isAISpeaking`
- Interruption: call `audio.pause()` to halt playback immediately
- New `audioElementRef` to track currently playing audio

**Fallback strategy:**
- If the edge function returns an error, automatically fall back to Browser TTS
- Log the error for debugging but don't break the session

