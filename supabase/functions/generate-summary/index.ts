import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscriptEntry {
  text: string;
  speaker: string;
  timestamp: Date;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🤖 Generate summary function called');
    const { transcript } = await req.json()
    console.log('📝 Received transcript:', transcript);
    
    if (!transcript || !Array.isArray(transcript)) {
      console.error('❌ Invalid transcript data:', transcript);
      throw new Error('Invalid transcript data')
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    console.log('🔑 API key exists:', !!apiKey);
    if (!apiKey) {
      console.error('❌ Google Gemini API key not configured');
      throw new Error('Google Gemini API key not configured')
    }

    // Format transcript for AI analysis
    const transcriptText = transcript
      .map((entry: TranscriptEntry) => `${entry.speaker}: ${entry.text}`)
      .join('\n')

    const prompt = `Please analyze this conversation transcript and provide a comprehensive summary. Include:

1. Key discussion points and topics covered
2. Important decisions or conclusions reached
3. Action items or next steps mentioned
4. Main participants and their contributions
5. Overall tone and context of the conversation

Transcript:
${transcriptText}

Please format your response in a clear, structured way with bullet points where appropriate.`

    // Call Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary'

    return new Response(
      JSON.stringify({ summary }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error generating summary:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate summary',
        summary: 'Unable to generate AI summary. Please try again.' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})