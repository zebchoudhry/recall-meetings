import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrainstormEmailRequest {
  to_email: string;
  transcript: string;
  summary: string;
  key_ideas: string[];
  actions: string[];
  decisions: string[];
  final_idea: string;
  duration_seconds: number;
  session_date: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const data: BrainstormEmailRequest = await req.json();

    const { to_email, transcript, summary, key_ideas, actions, decisions, final_idea, duration_seconds, session_date } = data;

    if (!to_email || !to_email.includes("@")) {
      throw new Error("Valid email address is required");
    }

    const durationMinutes = Math.floor(duration_seconds / 60);
    const durationDisplay = durationMinutes > 0 ? `${durationMinutes} min` : `${duration_seconds} sec`;

    const keyIdeasHtml = key_ideas.length > 0 
      ? key_ideas.map(idea => `<li style="margin-bottom: 8px;">${idea}</li>`).join("")
      : "<li>No key ideas extracted</li>";

    const actionsHtml = actions.length > 0
      ? actions.map(action => `<li style="margin-bottom: 8px;">${action}</li>`).join("")
      : "<li>No action items identified</li>";

    const decisionsHtml = decisions.length > 0
      ? decisions.map(decision => `<li style="margin-bottom: 8px;">${decision}</li>`).join("")
      : "<li>No decisions recorded</li>";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🧠 Brainstorm Session Complete</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${session_date} • ${durationDisplay}</p>
  </div>

  <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
    
    <!-- Final Best Idea -->
    <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h2 style="color: #c44536; margin: 0 0 10px 0; font-size: 16px;">🎯 FINAL BEST IDEA</h2>
      <p style="color: #333; margin: 0; font-size: 18px; font-weight: 600;">${final_idea || "No final idea extracted"}</p>
    </div>

    <!-- Executive Summary -->
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin: 0 0 12px 0; font-size: 16px;">📋 Executive Summary</h2>
      <p style="color: #666; margin: 0;">${summary || "No summary available"}</p>
    </div>

    <!-- Key Ideas -->
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin: 0 0 12px 0; font-size: 16px;">💡 Key Ideas</h2>
      <ul style="color: #666; margin: 0; padding-left: 20px;">
        ${keyIdeasHtml}
      </ul>
    </div>

    <!-- Action Items -->
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin: 0 0 12px 0; font-size: 16px;">✅ Action Items</h2>
      <ul style="color: #666; margin: 0; padding-left: 20px;">
        ${actionsHtml}
      </ul>
    </div>

    <!-- Decisions -->
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin: 0 0 12px 0; font-size: 16px;">📌 Decisions Made</h2>
      <ul style="color: #666; margin: 0; padding-left: 20px;">
        ${decisionsHtml}
      </ul>
    </div>

    <!-- Full Transcript -->
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin: 0 0 12px 0; font-size: 16px;">📝 Full Transcript</h2>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; max-height: 300px; overflow-y: auto;">
        <pre style="color: #666; margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 14px;">${transcript || "No transcript available"}</pre>
      </div>
    </div>

  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Sent by RecallMeeting Brainstorm • Your ideas, automatically captured</p>
  </div>

</body>
</html>
`;

    console.log("Sending brainstorm email to:", to_email);

    const emailResponse = await resend.emails.send({
      from: "RecallMeeting <onboarding@resend.dev>",
      to: [to_email],
      subject: `🧠 Brainstorm Session: ${final_idea?.substring(0, 50) || "Your Ideas"}...`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Send brainstorm email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
