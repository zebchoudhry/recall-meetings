import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Best Google TTS voice per supported language.
// Tier preference: Studio > Neural2 > Wavenet > Standard.
const VOICE_MAP: Record<string, { languageCode: string; name: string; ssmlGender: "MALE" | "FEMALE" }> = {
  en: { languageCode: "en-US", name: "en-US-Studio-O", ssmlGender: "FEMALE" },
  es: { languageCode: "es-ES", name: "es-ES-Neural2-F", ssmlGender: "FEMALE" },
  fr: { languageCode: "fr-FR", name: "fr-FR-Neural2-D", ssmlGender: "MALE" },
  de: { languageCode: "de-DE", name: "de-DE-Neural2-F", ssmlGender: "FEMALE" },
  pt: { languageCode: "pt-BR", name: "pt-BR-Neural2-C", ssmlGender: "FEMALE" },
  it: { languageCode: "it-IT", name: "it-IT-Neural2-A", ssmlGender: "FEMALE" },
  zh: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-A", ssmlGender: "FEMALE" },
  ja: { languageCode: "ja-JP", name: "ja-JP-Neural2-B", ssmlGender: "FEMALE" },
  hi: { languageCode: "hi-IN", name: "hi-IN-Neural2-A", ssmlGender: "FEMALE" },
  ar: { languageCode: "ar-XA", name: "ar-XA-Wavenet-A", ssmlGender: "FEMALE" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, lang } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      console.error("Missing or empty text parameter");
      return new Response(
        JSON.stringify({ error: "Text parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_CLOUD_TTS_API_KEY");
    if (!apiKey) {
      console.error("GOOGLE_CLOUD_TTS_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "TTS API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langKey = typeof lang === "string" && VOICE_MAP[lang] ? lang : "en";
    const voice = VOICE_MAP[langKey];
    console.log(`Synthesizing speech (${text.length} chars) lang=${langKey} voice=${voice.name}`);

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: text.trim() },
          voice,
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.95,
            pitch: 0.0,
            volumeGainDb: 0.0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorBody = await ttsResponse.text();
      console.error(`Google TTS API error (${ttsResponse.status}):`, errorBody);
      return new Response(
        JSON.stringify({ error: "TTS synthesis failed", details: errorBody }),
        { status: ttsResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ttsData = await ttsResponse.json();
    console.log("TTS synthesis successful");

    return new Response(
      JSON.stringify({ audioContent: ttsData.audioContent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Text-to-speech function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
