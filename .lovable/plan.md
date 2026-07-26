# Kindred Recall pilot handoff — Edge Function (revised)

Add one new Edge Function that a signed-in user can call to forward a **meeting summary only** (no audio, no transcript) to the Kindred Recall pilot endpoint. Nothing sends automatically — this turn only builds and tests the function; wiring UI comes later.

## What gets built

**New file:** `supabase/functions/send-meeting-to-kindred/index.ts`
**New file:** `supabase/functions/send-meeting-to-kindred/index.test.ts`
**Updated:** `supabase/config.toml` — register the function with `verify_jwt = false` (JWT validated in code, matching other functions here).

No database migration, no schema change, no frontend change.

## Behaviour

1. **Auth.** Require `Authorization: Bearer <jwt>`. Validate with `supabase.auth.getClaims(token)`; reject 401 otherwise. Extract `sub` (never logged, never returned, never sent upstream).

2. **Input — strict Zod schema.** Body is parsed with `.strict()` so any unknown property (including `audio`, `transcript`, `audio_url`, `transcript_text`, `audio_base64`, `raw_audio`, etc.) fails validation and returns a generic 400. Fields:
   - `recall_meeting_id` — string, **3–240** chars (client-local meeting id)
   - `title` — string, **2–240**
   - `started_at` — ISO datetime
   - `ended_at` — ISO datetime **or** null
   - `duration_minutes` — number, ≥ 0, ≤ 1440
   - `participants` — array (max 50) of `.strict()` `{ name: string 1–100 }`
   - `summary` — string, **2–6000**

3. **Stable outbound ID (cross-user collision-safe).** Compute
   `outbound_id = "recall-" + sha256hex(sub + ":" + recall_meeting_id)`
   using `crypto.subtle.digest("SHA-256", ...)`. The raw `sub` is used only for hashing — never logged, never returned, never included in the outbound payload. The hash goes into `recall_meeting_id` on the outbound body.

4. **Never load audio or transcript.** No code path reads either; the strict schema rejects them at the door.

5. **Outbound request.** `POST KINDRED_RECALL_ENDPOINT` with headers:
   - `Authorization: Bearer ${KINDRED_RECALL_API_CREDENTIAL}`
   - `Content-Type: application/json`
   - `X-Kindred-Workspace-Key: ${KINDRED_RECALL_WORKSPACE_KEY}`
   - `X-Kindred-Sent-At: <new Date().toISOString()>`

   Body (exact spec shape):
   ```json
   {
     "schema_version": "kindred.recall.v1",
     "source": "recall_meetings",
     "recall_meeting_id": "<hashed outbound id>",
     "meeting": { "title": "...", "started_at": "...", "ended_at": "... or null",
                  "duration_minutes": N, "participants": [{ "name": "..." }],
                  "summary": "..." },
     "decisions": [],
     "proposed_actions": [],
     "privacy": { "transcript_included": false, "audio_included": false,
                  "requires_human_approval": true }
   }
   ```

6. **Response handling.**
   - `202` → `{ ok: true, status: "accepted" }`.
   - `200` and parsed body `status === "duplicate"` → `{ ok: true, status: "duplicate" }`.
   - Anything else → return `{ ok: false, error: "Upstream rejected the request" }` with HTTP 502.
   - **Logging on failure:** only `console.error` the HTTP status and a generated `correlation_id` (crypto.randomUUID). Never log the upstream body, headers, response text, or any snippet of it. Return the `correlation_id` to the caller so support can trace it.

7. **Secret hygiene.** Secrets read only via `Deno.env.get(...)`. If any of the three (`KINDRED_RECALL_ENDPOINT`, `KINDRED_RECALL_WORKSPACE_KEY`, `KINDRED_RECALL_API_CREDENTIAL`) is missing, return a **generic 500** with `{ ok: false, error: "Service not configured" }` — the response and logs never name which secret is missing. Secrets never appear in logs, responses, or DB.

8. **CORS.** Standard preflight + `corsHeaders` on every response.

## Tests (`index.test.ts`)

Upstream and Supabase `getClaims` are mocked; no real network. Cases:

- 401 when `Authorization` header is missing.
- 400 when required fields are missing or out of the new bounds (e.g. summary length 1 or 6001, title length 1).
- **400 when body contains `transcript`, `audio`, `audio_url`, `transcript_text`, or `audio_base64`** (strict-mode rejection).
- 202 upstream → `{ ok: true, status: "accepted" }`.
- 200 upstream with `{ status: "duplicate" }` → `{ ok: true, status: "duplicate" }`.
- 500-class upstream → generic 502, response contains no upstream body text; captured `console.error` output contains only status + a UUID-shaped correlation id.
- **Determinism:** same `sub` + same `recall_meeting_id` produces the same outbound `recall_meeting_id` across two calls (assert via captured outbound body).
- **Cross-user isolation:** two different `sub`s with the same client `recall_meeting_id` produce different outbound `recall_meeting_id` values.
- **Missing secret:** unset `KINDRED_RECALL_ENDPOINT` (and separately each other secret) → generic 500, error message does not mention `endpoint`, `workspace`, `credential`, or any secret name.

Run via the edge-function test tool after implementation and paste results.

## Explicitly out of scope

- No UI button, no auto-send, no cron.
- No `meetings` table — client sends its own local meeting per the earlier answer.
- No changes to existing functions or components.

## Technical notes

- Function directory: `supabase/functions/send-meeting-to-kindred/` (flat: `index.ts` + `index.test.ts`).
- Uses `npm:@supabase/supabase-js@2` and `npm:zod` via Deno specifiers.
- Correlation id via `crypto.randomUUID()`; SHA-256 via `crypto.subtle.digest`.
