import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    
    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcript is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing brainstorm transcript:", transcript.substring(0, 200) + "...");

    const systemPrompt = `You are an expert brainstorm analyzer. Your job is to analyze brainstorming session transcripts and extract key insights.

You MUST respond with valid JSON in exactly this format:
{
  "summary": "A concise executive summary of the brainstorm session (max 200 words)",
  "key_ideas": ["idea 1", "idea 2", ...],
  "actions": ["action item 1", "action item 2", ...],
  "decisions": ["decision 1", "decision 2", ...],
  "final_idea": "The single most actionable and promising idea from the session, distilled into one clear statement"
}

Guidelines:
- Extract 3-10 key ideas mentioned
- Identify specific action items with clear ownership if mentioned
- Note any decisions that were made
- The final_idea should be the BEST, most actionable concept that emerged
- Be concise and actionable
- If the transcript is unclear or too short, still provide your best analysis`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this brainstorming session transcript:\n\n${transcript}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from AI");
    }

    console.log("AI response:", content);

    // Parse the JSON response
    let result;
    try {
      // Try to extract JSON from the response (sometimes wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Provide fallback structure
      result = {
        summary: content.substring(0, 500),
        key_ideas: ["Unable to parse structured response"],
        actions: [],
        decisions: [],
        final_idea: "Please review the transcript manually"
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Process brainstorm error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
