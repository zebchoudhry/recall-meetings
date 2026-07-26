import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

export type VerifyToken = (token: string) => Promise<{ sub: string } | null>;

export const defaultVerifyToken: VerifyToken = async (token) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    return { sub: String(data.claims.sub) };
  } catch {
    return null;
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ParticipantSchema = z
  .object({ name: z.string().min(1).max(100) })
  .strict();

const BodySchema = z
  .object({
    recall_meeting_id: z.string().min(3).max(240),
    title: z.string().min(2).max(240),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime().nullable(),
    duration_minutes: z.number().min(0).max(1440),
    participants: z.array(ParticipantSchema).max(50),
    summary: z.string().min(2).max(6000),
  })
  .strict();

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function handleRequest(
  req: Request,
  verifyToken: VerifyToken = defaultVerifyToken,
): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  // --- Auth ---
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const verified = await verifyToken(token);
  if (!verified) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }
  const sub = verified.sub;

  // --- Secrets ---
  const endpoint = Deno.env.get("KINDRED_RECALL_ENDPOINT");
  const workspaceKey = Deno.env.get("KINDRED_RECALL_WORKSPACE_KEY");
  const apiCredential = Deno.env.get("KINDRED_RECALL_API_CREDENTIAL");
  if (!endpoint || !workspaceKey || !apiCredential) {
    return json({ ok: false, error: "Service not configured" }, 500);
  }

  // --- Input ---
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid request" }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: "Invalid request" }, 400);
  }
  const body = parsed.data;

  // --- Stable outbound ID ---
  const outboundId =
    "recall-" + (await sha256Hex(`${sub}:${body.recall_meeting_id}`));

  const payload = {
    schema_version: "kindred.recall.v1",
    source: "recall_meetings",
    recall_meeting_id: outboundId,
    meeting: {
      title: body.title,
      started_at: body.started_at,
      ended_at: body.ended_at,
      duration_minutes: body.duration_minutes,
      participants: body.participants.map((p) => ({ name: p.name })),
      summary: body.summary,
    },
    decisions: [],
    proposed_actions: [],
    privacy: {
      transcript_included: false,
      audio_included: false,
      requires_human_approval: true,
    },
  };

  const correlationId = crypto.randomUUID();

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiCredential}`,
        "Content-Type": "application/json",
        "X-Kindred-Workspace-Key": workspaceKey,
        "X-Kindred-Sent-At": new Date().toISOString(),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    console.error(
      `send-meeting-to-kindred network_error correlation_id=${correlationId}`,
    );
    return json(
      { ok: false, error: "Upstream rejected the request", correlation_id: correlationId },
      502,
    );
  }

  if (upstream.status === 202) {
    // Consume body to avoid resource leak; do not read content.
    try { await upstream.arrayBuffer(); } catch { /* ignore */ }
    return json({ ok: true, status: "accepted" });
  }

  if (upstream.status === 200) {
    try {
      const data = await upstream.json();
      if (data && typeof data === "object" && (data as any).status === "duplicate") {
        return json({ ok: true, status: "duplicate" });
      }
    } catch {
      /* fall through to generic error */
    }
    console.error(
      `send-meeting-to-kindred upstream_unexpected status=200 correlation_id=${correlationId}`,
    );
    return json(
      { ok: false, error: "Upstream rejected the request", correlation_id: correlationId },
      502,
    );
  }

  // Any other status: log status + correlation only. Never log body.
  try { await upstream.arrayBuffer(); } catch { /* ignore */ }
  console.error(
    `send-meeting-to-kindred upstream_error status=${upstream.status} correlation_id=${correlationId}`,
  );
  return json(
    { ok: false, error: "Upstream rejected the request", correlation_id: correlationId },
    502,
  );
}

serve(handleRequest);