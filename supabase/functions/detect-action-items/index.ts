import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: string;
  timestamp: Date;
}

interface ActionItem {
  id: string;
  responsiblePerson: string;
  taskDescription: string;
  transcriptEntryId: string;
  timestamp: Date;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transcript } = await req.json()
    
    // Input validation
    if (!transcript || !Array.isArray(transcript)) {
      return new Response(
        JSON.stringify({ error: 'Invalid transcript data', actionItems: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (transcript.length === 0 || transcript.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Transcript must contain between 1 and 1000 entries', actionItems: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate transcript entries
    for (const entry of transcript) {
      if (!entry.id || !entry.text || typeof entry.text !== 'string' || entry.text.length > 5000) {
        return new Response(
          JSON.stringify({ error: 'Invalid transcript entry format', actionItems: [] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured', actionItems: [] }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format transcript for AI analysis
    const transcriptText = transcript
      .map((entry: TranscriptEntry, index: number) => `[${index}] ${entry.speaker}: ${entry.text}`)
      .join('\n')

    const prompt = `Analyze this meeting transcript and extract all action items. Look for:
- Tasks or commitments mentioned by speakers
- Verbs indicating future actions (will, should, need to, must, going to, plan to)
- Specific responsibilities assigned to people
- Follow-up actions or deliverables

For each action item found, return a JSON array with objects containing:
- "responsiblePerson": The person responsible (use speaker name or mentioned name)
- "taskDescription": Clear description of the task
- "transcriptIndex": The index number [0], [1], etc. where this was mentioned
- "confidence": Confidence score 0-1 for how certain this is an action item

Be precise and only include clear, actionable items. Ignore vague statements.

Transcript:
${transcriptText}

Return only valid JSON array, no other text:`

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
          temperature: 0.1,
          maxOutputTokens: 2000,
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    
    console.log('🤖 AI Response:', aiResponse);

    // Parse AI response as JSON
    let parsedActionItems: any[] = [];
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\[(.*?)\]/s);
      const jsonString = jsonMatch ? `[${jsonMatch[1]}]` : aiResponse;
      parsedActionItems = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: try to extract manually or return empty array
      parsedActionItems = [];
    }

    // Map AI results to structured action items with transcript references
    const actionItems: ActionItem[] = parsedActionItems
      .filter(item => 
        item.responsiblePerson && 
        item.taskDescription && 
        typeof item.transcriptIndex === 'number' &&
        item.transcriptIndex >= 0 && 
        item.transcriptIndex < transcript.length
      )
      .map(item => {
        const transcriptEntry = transcript[item.transcriptIndex];
        return {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          responsiblePerson: item.responsiblePerson,
          taskDescription: item.taskDescription,
          transcriptEntryId: transcriptEntry.id,
          timestamp: new Date(transcriptEntry.timestamp),
          confidence: item.confidence || 0.8
        };
      });

    console.log(`✅ Detected ${actionItems.length} action items`);

    return new Response(
      JSON.stringify({ 
        actionItems,
        summary: `Found ${actionItems.length} action item${actionItems.length !== 1 ? 's' : ''}`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error detecting action items:', error instanceof Error ? error.message : 'Unknown error')
    return new Response(
      JSON.stringify({ 
        error: 'Failed to detect action items. Please try again later.',
        actionItems: []
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