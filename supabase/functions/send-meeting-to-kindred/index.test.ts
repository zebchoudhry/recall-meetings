import {
  assertEquals,
  assert,
  assertNotEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleRequest, type VerifyToken } from "./index.ts";

const ENDPOINT = "https://kindred.example.com/recall";

function setSecrets(opts: {
  endpoint?: string | null;
  workspaceKey?: string | null;
  apiCredential?: string | null;
} = {}) {
  const set = (k: string, v: string | null | undefined) => {
    if (v === null) Deno.env.delete(k);
    else if (v !== undefined) Deno.env.set(k, v);
  };
  set("KINDRED_RECALL_ENDPOINT", opts.endpoint === undefined ? ENDPOINT : opts.endpoint);
  set("KINDRED_RECALL_WORKSPACE_KEY", opts.workspaceKey === undefined ? "ws-key" : opts.workspaceKey);
  set("KINDRED_RECALL_API_CREDENTIAL", opts.apiCredential === undefined ? "api-cred" : opts.apiCredential);
}

function makeVerify(sub: string): VerifyToken {
  return async () => ({ sub });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    recall_meeting_id: "local-abc-123",
    title: "Weekly sync",
    started_at: "2026-07-25T10:00:00.000Z",
    ended_at: "2026-07-25T10:30:00.000Z",
    duration_minutes: 30,
    participants: [{ name: "Alice" }, { name: "Bob" }],
    summary: "We discussed the roadmap.",
    ...overrides,
  };
}

function makeRequest(body: unknown, opts: { auth?: string | null } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth !== null) headers["Authorization"] = opts.auth ?? "Bearer test-jwt";
  return new Request("https://fn.test/", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

type Capture = { url: string; init: RequestInit; bodyJson: any };
function installFetchMock(response: Response): { captured: Capture[]; restore: () => void } {
  const original = globalThis.fetch;
  const captured: Capture[] = [];
  globalThis.fetch = (async (input: any, init: any) => {
    const url = typeof input === "string" ? input : input.url;
    let bodyJson: any = null;
    try { bodyJson = init?.body ? JSON.parse(init.body as string) : null; } catch { /* ignore */ }
    captured.push({ url, init, bodyJson });
    return response.clone();
  }) as typeof fetch;
  return { captured, restore: () => { globalThis.fetch = original; } };
}

Deno.test("401 when Authorization header missing", async () => {
  setSecrets();
  const res = await handleRequest(makeRequest(validBody(), { auth: null }), makeVerify("u1"));
  assertEquals(res.status, 401);
  await res.body?.cancel();
});

Deno.test("400 when required field is missing", async () => {
  setSecrets();
  const body: any = validBody();
  delete body.title;
  const res = await handleRequest(makeRequest(body), makeVerify("u1"));
  assertEquals(res.status, 400);
  await res.body?.cancel();
});

Deno.test("400 when summary is too long", async () => {
  setSecrets();
  const res = await handleRequest(
    makeRequest(validBody({ summary: "x".repeat(6001) })),
    makeVerify("u1"),
  );
  assertEquals(res.status, 400);
  await res.body?.cancel();
});

Deno.test("400 when body contains transcript / audio-like extra fields", async () => {
  setSecrets();
  for (const extra of ["transcript", "audio", "audio_url", "transcript_text", "audio_base64"]) {
    const res = await handleRequest(
      makeRequest(validBody({ [extra]: "leaky" })),
      makeVerify("u1"),
    );
    assertEquals(res.status, 400, `expected 400 for extra field ${extra}`);
    await res.body?.cancel();
  }
});

Deno.test("202 upstream -> { ok: true, status: 'accepted' } and no transcript/audio in outbound body", async () => {
  setSecrets();
  const { captured, restore } = installFetchMock(new Response(null, { status: 202 }));
  try {
    const res = await handleRequest(makeRequest(validBody()), makeVerify("u1"));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { ok: true, status: "accepted" });
    assertEquals(captured.length, 1);
    const outbound = captured[0];
    assertEquals(outbound.url, ENDPOINT);
    const headers = new Headers(outbound.init.headers as HeadersInit);
    assertEquals(headers.get("Authorization"), "Bearer api-cred");
    assertEquals(headers.get("X-Kindred-Workspace-Key"), "ws-key");
    assert(headers.get("X-Kindred-Sent-At"));
    assertEquals(outbound.bodyJson.privacy, {
      transcript_included: false,
      audio_included: false,
      requires_human_approval: true,
    });
    const bodyStr = JSON.stringify(outbound.bodyJson);
    for (const forbidden of ["transcript", "audio_url", "audio_base64", "raw_audio"]) {
      assert(!bodyStr.includes(forbidden), `outbound body must not contain ${forbidden}`);
    }
  } finally { restore(); }
});

Deno.test("200 duplicate -> { ok: true, status: 'duplicate' }", async () => {
  setSecrets();
  const { restore } = installFetchMock(
    new Response(JSON.stringify({ status: "duplicate" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  try {
    const res = await handleRequest(makeRequest(validBody()), makeVerify("u1"));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { ok: true, status: "duplicate" });
  } finally { restore(); }
});

Deno.test("upstream 500 -> generic 502 without leaking body; log has only status + correlation id", async () => {
  setSecrets();
  const secretMsg = "SUPER_SECRET_UPSTREAM_BODY_XYZ";
  const { restore } = installFetchMock(
    new Response(secretMsg, { status: 500 }),
  );
  const originalError = console.error;
  const logs: string[] = [];
  console.error = (...args: unknown[]) => { logs.push(args.map(String).join(" ")); };
  try {
    const res = await handleRequest(makeRequest(validBody()), makeVerify("u1"));
    assertEquals(res.status, 502);
    const body = await res.json();
    assertEquals(body.ok, false);
    assertEquals(body.error, "Upstream rejected the request");
    assert(typeof body.correlation_id === "string" && body.correlation_id.length > 0);
    assert(!JSON.stringify(body).includes(secretMsg));
    assertEquals(logs.length, 1);
    assert(!logs[0].includes(secretMsg), "log must not contain upstream body");
    assertStringIncludes(logs[0], "status=500");
    assertStringIncludes(logs[0], "correlation_id=");
  } finally {
    console.error = originalError;
    restore();
  }
});

Deno.test("deterministic outbound id for same sub + same local id", async () => {
  setSecrets();
  const { captured, restore } = installFetchMock(new Response(null, { status: 202 }));
  try {
    await handleRequest(makeRequest(validBody({ recall_meeting_id: "meet-1" })), makeVerify("user-A"));
    await handleRequest(makeRequest(validBody({ recall_meeting_id: "meet-1" })), makeVerify("user-A"));
    assertEquals(captured[0].bodyJson.recall_meeting_id, captured[1].bodyJson.recall_meeting_id);
    assertStringIncludes(captured[0].bodyJson.recall_meeting_id, "recall-");
  } finally { restore(); }
});

Deno.test("different users with same local id produce different outbound ids", async () => {
  setSecrets();
  const { captured, restore } = installFetchMock(new Response(null, { status: 202 }));
  try {
    await handleRequest(makeRequest(validBody({ recall_meeting_id: "shared-id" })), makeVerify("user-A"));
    await handleRequest(makeRequest(validBody({ recall_meeting_id: "shared-id" })), makeVerify("user-B"));
    assertNotEquals(captured[0].bodyJson.recall_meeting_id, captured[1].bodyJson.recall_meeting_id);
  } finally { restore(); }
});

Deno.test("outbound recall_meeting_id never contains raw sub", async () => {
  setSecrets();
  const { captured, restore } = installFetchMock(new Response(null, { status: 202 }));
  try {
    const sub = "raw-user-sub-should-not-leak";
    await handleRequest(makeRequest(validBody()), makeVerify(sub));
    const outboundId = captured[0].bodyJson.recall_meeting_id as string;
    assert(!outboundId.includes(sub));
  } finally { restore(); }
});

Deno.test("missing secret returns generic 500 without naming the secret", async () => {
  for (const missing of ["endpoint", "workspaceKey", "apiCredential"] as const) {
    setSecrets({ [missing]: null } as any);
    const res = await handleRequest(makeRequest(validBody()), makeVerify("u1"));
    assertEquals(res.status, 500);
    const body = await res.json();
    assertEquals(body, { ok: false, error: "Service not configured" });
    const s = JSON.stringify(body).toLowerCase();
    for (const word of ["endpoint", "workspace", "credential", "kindred", "api_credential"]) {
      assert(!s.includes(word), `response must not mention "${word}"`);
    }
    setSecrets();
  }
});