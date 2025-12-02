import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// HTML escape function to prevent XSS in emails
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  type: string;
  description: string;
  email: string | null;
  browserInfo: {
    userAgent: string;
    viewport: string;
    language: string;
  };
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const feedbackData: FeedbackRequest = await req.json();
    
    console.log("Received feedback:", {
      type: feedbackData.type,
      hasEmail: !!feedbackData.email,
      timestamp: feedbackData.timestamp,
    });

    // Format feedback type for display
    const typeLabels: Record<string, string> = {
      bug: "🐛 Bug Report",
      feature: "💡 Feature Request",
      general: "💬 General Feedback",
    };
    const typeLabel = typeLabels[feedbackData.type] || feedbackData.type;

    // Build email content with escaped user input
    const emailHtml = `
      <h1>${escapeHtml(typeLabel)}</h1>
      <p><strong>Submitted:</strong> ${escapeHtml(new Date(feedbackData.timestamp).toLocaleString())}</p>
      
      <h2>Description</h2>
      <p style="white-space: pre-wrap;">${escapeHtml(feedbackData.description)}</p>
      
      ${feedbackData.email ? `<p><strong>Contact Email:</strong> ${escapeHtml(feedbackData.email)}</p>` : '<p><em>Submitted anonymously</em></p>'}
      
      <hr style="margin: 20px 0;" />
      
      <h3>Browser Information</h3>
      <ul>
        <li><strong>User Agent:</strong> ${escapeHtml(feedbackData.browserInfo.userAgent)}</li>
        <li><strong>Viewport:</strong> ${escapeHtml(feedbackData.browserInfo.viewport)}</li>
        <li><strong>Language:</strong> ${escapeHtml(feedbackData.browserInfo.language)}</li>
      </ul>
    `;

    // Send email notification to developer
    const emailResponse = await resend.emails.send({
      from: "RecallMeeting Feedback <onboarding@resend.dev>",
      to: ["lumbernumbers1@hotmail.co.uk"],
      subject: `RecallMeeting Feedback: ${typeLabel}`,
      html: emailHtml,
      replyTo: feedbackData.email || undefined,
    });

    console.log("Feedback email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Feedback submitted successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-feedback function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
