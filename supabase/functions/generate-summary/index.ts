import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { transcript } = await req.json()
    
    // Input validation
    if (!transcript || !Array.isArray(transcript)) {
      return new Response(
        JSON.stringify({ error: 'Invalid transcript data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (transcript.length === 0 || transcript.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Transcript must contain between 1 and 1000 entries' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate transcript entries
    for (const entry of transcript) {
      if (!entry.text || typeof entry.text !== 'string' || entry.text.length > 5000) {
        return new Response(
          JSON.stringify({ error: 'Invalid transcript entry format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format transcript for AI analysis
    const transcriptText = transcript
      .map((entry: TranscriptEntry) => `${entry.speaker}: ${entry.text}`)
      .join('\n')

    const systemPrompt = `You are an expert meeting analyst. Analyze conversation transcripts and provide comprehensive, well-structured summaries. Include key discussion points, decisions, action items, participant contributions, and overall context. Format your response with clear bullet points where appropriate.`

    const userPrompt = `Please analyze this conversation transcript and provide a comprehensive summary. Include:

1. Key discussion points and topics covered
2. Important decisions or conclusions reached
3. Action items or next steps mentioned
4. Main participants and their contributions
5. Overall tone and context of the conversation

Transcript:
${transcriptText}

Please format your response in a clear, structured way with bullet points where appropriate.`

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const errorData = await response.text()
      console.error('Lovable AI Gateway error:', errorData)
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content || 'Unable to generate summary'

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
    console.error('Error generating summary:', error instanceof Error ? error.message : 'Unknown error')
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate summary. Please try again later.',
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
