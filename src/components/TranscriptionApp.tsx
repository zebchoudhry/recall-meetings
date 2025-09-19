import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Download, Sparkles, AlertCircle, Square, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { RecordingControls } from "./RecordingControls";
import { SummaryPanel } from "./SummaryPanel";
import { EmailSummary } from "./EmailSummary";
import { SpeakerSettings } from "./SpeakerSettings";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VoiceClustering } from "@/utils/voiceClustering";
import { VoiceIdentifier } from "@/utils/voiceIdentifier";

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  transcriptReferences?: {
    id: string;
    text: string;
    speaker: string;
  }[];
}

interface ActionItem {
  id: string;
  responsiblePerson: string;
  taskDescription: string;
  transcriptEntryId: string;
  timestamp: Date;
  confidence: number;
}

// Type declarations for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface VoiceProfile {
  id: string;
  name: string;
  voicePattern: {
    avgPitch: number;
    pitchRange: number;
    avgFrequency: number;
    spectralCentroid: number;
  };
}

export const TranscriptionApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [expectedSpeakers, setExpectedSpeakers] = useState(2);
  const [detectedSpeakers, setDetectedSpeakers] = useState<any[]>([]);
  const [isVoiceAssistantListening, setIsVoiceAssistantListening] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isDetectingActions, setIsDetectingActions] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const voiceClusteringRef = useRef<VoiceClustering>(new VoiceClustering());
  const audioStreamRef = useRef<MediaStream | null>(null);
  const shouldKeepRecordingRef = useRef<boolean>(false); // More explicit name
  const stopRequestedRef = useRef<boolean>(false); // Track if stop was explicitly requested

  useEffect(() => {
    console.log('🚀 TranscriptionApp mounted');
    console.log('📋 Current detected speakers:', detectedSpeakers);
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('❌ Speech Recognition not available');
      console.log('   - window.SpeechRecognition:', !!window.SpeechRecognition);
      console.log('   - window.webkitSpeechRecognition:', !!window.webkitSpeechRecognition);
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    } else {
      console.log('✅ Speech Recognition available');
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "Recording Started",
        description: "Listening for speech...",
      });
    };

    recognition.onend = () => {
      console.log('🔴 Recognition ended');
      console.log('  - shouldKeepRecordingRef.current:', shouldKeepRecordingRef.current);
      console.log('  - stopRequestedRef.current:', stopRequestedRef.current);
      
      setIsListening(false);
      
      // Only restart if:
      // 1. We should keep recording AND
      // 2. Stop was NOT explicitly requested
      if (shouldKeepRecordingRef.current && !stopRequestedRef.current) {
        try {
          console.log('🔄 Auto-restarting recognition...');
          setTimeout(() => {
            if (shouldKeepRecordingRef.current && !stopRequestedRef.current && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 100); // Small delay to prevent rapid restart loops
        } catch (error) {
          console.log('Recognition restart failed:', error);
          // If restart fails, stop recording completely
          shouldKeepRecordingRef.current = false;
          setIsRecording(false);
        }
      } else {
        console.log('🛑 Not restarting - recording should stop');
        shouldKeepRecordingRef.current = false;
        setIsRecording(false);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        console.log('🎤 Processing speech result:', finalTranscript);
        
        // Create entry immediately with placeholder speaker
        const entryId = Date.now().toString();
        const newEntry: TranscriptEntry = {
          id: entryId,
          speaker: "Analyzing...",
          text: finalTranscript.trim(),
          timestamp: new Date(),
          confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0.9,
        };

        console.log('📝 Adding transcript entry immediately:', newEntry);
        setTranscript(prev => [...prev, newEntry]);
        
        // Quick background voice analysis (completely non-blocking)
        if (audioStreamRef.current) {
          console.log('🔍 Starting ultra-fast voice analysis...');
          
          // Ultra-fast analysis with aggressive timeout
          const analysisPromise = new VoiceIdentifier().analyzeAudioStream(audioStreamRef.current);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Quick timeout')), 500) // Only 500ms max
          );
          
          Promise.race([analysisPromise, timeoutPromise])
            .then((pattern: any) => {
              console.log('📊 Voice pattern:', pattern);
              
              // Use clustering-based identification
              const identification = voiceClusteringRef.current.identifySpeaker(pattern);
              console.log('🎯 Clustering-based identification:', identification);
              
              // Update detected speakers list
              setDetectedSpeakers(voiceClusteringRef.current.getClusters());
              
              const speakerLabel = identification.confidence > 0 ? 
                `${identification.name} (${Math.round(identification.confidence * 100)}%)` : 
                "Unknown Speaker";
              
              // Update the entry with speaker identification
              setTranscript(prev => prev.map(entry => 
                entry.id === entryId 
                  ? { ...entry, speaker: speakerLabel }
                  : entry
              ));
              
              console.log('✅ Updated speaker to:', speakerLabel);
            })
            .catch(error => {
              console.log('⚡ Quick analysis timeout - using fallback');
              // Quick fallback to Unknown Speaker - don't slow down transcript
              setTranscript(prev => prev.map(entry => 
                entry.id === entryId 
                  ? { ...entry, speaker: "Unknown Speaker" }
                  : entry
              ));
            });
        } else {
          // No voice analysis - immediately set to Unknown Speaker
          setTranscript(prev => prev.map(entry => 
            entry.id === entryId 
              ? { ...entry, speaker: "Unknown Speaker" }
              : entry
          ));
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      console.log('  - stopRequestedRef.current:', stopRequestedRef.current);
      
      // If stop was requested, don't show error toast
      if (!stopRequestedRef.current) {
        toast({
          title: "Recognition Error",
          description: `Error: ${event.error}`,
          variant: "destructive",
        });
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, toast]);

  const startRecording = async () => {
    console.log('startRecording function called');
    
    try {
      console.log('Checking browser support for Speech Recognition...');
      
      // Check if browser supports speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech Recognition not supported');
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
          variant: "destructive",
        });
        return;
      }

      console.log('Requesting microphone permission...');
      // Request microphone permission and store stream for voice analysis
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      console.log('Microphone permission granted, stream:', stream);
      console.log('📋 Available detected speakers for identification:', detectedSpeakers);
      console.log('🔧 Voice clustering ready for analysis');
      
      if (recognitionRef.current) {
        console.log('Starting speech recognition...');
        
        // Set all flags BEFORE starting
        shouldKeepRecordingRef.current = true;
        stopRequestedRef.current = false;
        setIsRecording(true);
        
        recognitionRef.current.start();
      } else {
        console.error('Speech recognition not initialized');
        toast({
          title: "Recognition Error", 
          description: "Speech recognition not properly initialized",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in startRecording:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to start recording.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stop recording requested');
    
    // IMMEDIATELY set flags to prevent any restarts
    stopRequestedRef.current = true;
    shouldKeepRecordingRef.current = false;
    setIsRecording(false);
    setIsListening(false);
    
    console.log('  - Set stopRequestedRef.current = true');
    console.log('  - Set shouldKeepRecordingRef.current = false');
    
    if (recognitionRef.current) {
      try {
        console.log('  - Calling recognition.abort()');
        (recognitionRef.current as any).abort();
        console.log('✅ Recognition aborted successfully');
      } catch (error) {
        console.log('Error aborting recognition:', error);
        // Fallback to stop() if abort() fails
        try {
          recognitionRef.current.stop();
        } catch (stopError) {
          console.log('Error stopping recognition:', stopError);
        }
      }
    }
    
    // CRITICALLY IMPORTANT: Stop the microphone stream completely
    if (audioStreamRef.current) {
      console.log('  - Stopping all microphone tracks');
      audioStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('    - Stopped track:', track.kind, track.label);
      });
      audioStreamRef.current = null;
      console.log('🎤 Audio stream completely stopped');
    }
    
    toast({
      title: "Recording Stopped",
      description: "Transcription complete.",
    });
  };

  const handleSpeakerCountChange = (count: number) => {
    setExpectedSpeakers(count);
    voiceClusteringRef.current.setExpectedSpeakers(count);
  };

  const handleResetSpeakers = () => {
    voiceClusteringRef.current.reset();
    setDetectedSpeakers([]);
    toast({
      title: "Speaker Detection Reset",
      description: "All speaker clusters have been cleared.",
    });
  };

  const handleSpeakerNameChange = (speakerId: string, newName: string) => {
    voiceClusteringRef.current.updateSpeakerName(speakerId, newName);
    setDetectedSpeakers(voiceClusteringRef.current.getClusters());
    
    // Update existing transcript entries with the new name
    setTranscript(prev => prev.map(entry => {
      // Check if this entry matches the speaker being renamed
      const speakerPattern = new RegExp(`Speaker ${speakerId}\\s*\\(\\d+%\\)`);
      if (speakerPattern.test(entry.speaker)) {
        const confidenceMatch = entry.speaker.match(/\((\d+)%\)/);
        const confidence = confidenceMatch ? confidenceMatch[1] : '50';
        return { ...entry, speaker: `${newName} (${confidence}%)` };
      }
      return entry;
    }));
    
    toast({
      title: "Speaker Renamed",
      description: `Speaker ${speakerId} is now called ${newName}`,
    });
  };

  const generateSummary = async () => {
    if (transcript.length === 0) {
      toast({
        title: "No Transcript",
        description: "Record some conversation first to generate a summary.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSummary(true);
    console.log('🤖 Starting AI summary generation...');
    console.log('📝 Transcript data:', transcript);
    
    try {
      // For now, let's create a simple local summary until we fix the edge function
      const transcriptText = transcript
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n');
      
      // Generate a basic summary from the transcript
      const summary = generateLocalSummary(transcriptText);
      
      setSummary(summary);
      toast({
        title: "Summary Generated",
        description: "AI summary is ready for review.",
      });
    } catch (error) {
      console.error('❌ Error generating summary:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Summary Error",
        description: `Failed to generate AI summary: ${errorMessage}`,
        variant: "destructive",
      });
      setSummary(`Unable to generate AI summary. Error: ${errorMessage}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateLocalSummary = (transcriptText: string): string => {
    const lines = transcriptText.split('\n').filter(line => line.trim());
    const speakers = [...new Set(lines.map(line => line.split(':')[0].trim()))];
    
    // Extract content without speaker labels
    const statements = lines.map(line => {
      const colonIndex = line.indexOf(':');
      return colonIndex > -1 ? line.substring(colonIndex + 1).trim() : line.trim();
    });
    
    // Identify key topics and themes
    const keyWords = extractKeyTopics(statements);
    const actionItems = extractActionItems(statements);
    const decisions = extractDecisions(statements);
    const questions = extractQuestions(statements);
    
    return `## Meeting Summary

**Participants:** ${speakers.join(', ')} (${statements.length} total exchanges)

### 🎯 Key Topics Discussed
${keyWords.length > 0 ? keyWords.map(topic => `• ${topic}`).join('\n') : '• No specific topics identified'}

### ✅ Decisions Made
${decisions.length > 0 ? decisions.map(decision => `• ${decision}`).join('\n') : '• No clear decisions identified'}

### 📋 Action Items & Next Steps  
${actionItems.length > 0 ? actionItems.map(action => `• ${action}`).join('\n') : '• No action items mentioned'}

### ❓ Questions Raised
${questions.length > 0 ? questions.map(q => `• ${q}`).join('\n') : '• No questions identified'}

### 💬 Key Highlights
${getKeyHighlights(statements).map((highlight, i) => `${i + 1}. ${highlight}`).join('\n')}

---
*Summary generated from ${statements.length} statements. Review the full transcript for complete context.*`;
  };

  const extractKeyTopics = (statements: string[]): string[] => {
    const topics: string[] = [];
    const topicKeywords = ['about', 'regarding', 'concerning', 'discuss', 'talk about', 'focus on'];
    
    statements.forEach(statement => {
      const lower = statement.toLowerCase();
      // Look for topic indicators
      if (lower.includes('we need to') || lower.includes('let\'s talk about') || lower.includes('regarding')) {
        topics.push(statement.length > 80 ? statement.substring(0, 80) + '...' : statement);
      }
      // Extract subjects from longer statements
      if (statement.length > 20 && !statement.includes('uh') && !statement.includes('um')) {
        const words = statement.split(' ');
        if (words.length > 3 && words.length < 15) {
          topics.push(statement);
        }
      }
    });
    
    return topics.slice(0, 5); // Limit to top 5 topics
  };

  const extractActionItems = (statements: string[]): string[] => {
    const actions: string[] = [];
    const actionKeywords = ['need to', 'should', 'will', 'going to', 'have to', 'must', 'by the', 'deadline', 'schedule'];
    
    statements.forEach(statement => {
      const lower = statement.toLowerCase();
      if (actionKeywords.some(keyword => lower.includes(keyword))) {
        if (!lower.includes('baby') && statement.length > 10) { // Filter out baby talk
          actions.push(statement.length > 100 ? statement.substring(0, 100) + '...' : statement);
        }
      }
    });
    
    return actions.slice(0, 4);
  };

  const extractDecisions = (statements: string[]): string[] => {
    const decisions: string[] = [];
    const decisionKeywords = ['decided', 'agreed', 'final', 'conclusion', 'resolved', 'determined', 'chose'];
    
    statements.forEach(statement => {
      const lower = statement.toLowerCase();
      if (decisionKeywords.some(keyword => lower.includes(keyword))) {
        decisions.push(statement.length > 100 ? statement.substring(0, 100) + '...' : statement);
      }
    });
    
    return decisions.slice(0, 3);
  };

  const extractQuestions = (statements: string[]): string[] => {
    return statements
      .filter(statement => statement.includes('?') && statement.length > 5)
      .map(q => q.length > 80 ? q.substring(0, 80) + '...' : q)
      .slice(0, 4);
  };

  const getKeyHighlights = (statements: string[]): string[] => {
    // Get the most substantial statements (not just baby talk)
    return statements
      .filter(statement => 
        statement.length > 15 && 
        !statement.toLowerCase().includes('baby baby baby') &&
        !statement.toLowerCase().includes('uh') &&
        !statement.toLowerCase().includes('um')
      )
      .slice(0, 3)
      .map(statement => statement.length > 120 ? statement.substring(0, 120) + '...' : statement);
  };

  const exportTranscript = () => {
    const transcriptText = transcript.map(entry => 
      `[${entry.timestamp.toLocaleTimeString()}] ${entry.speaker}: ${entry.text}`
    ).join('\n\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Transcript Exported",
      description: "Transcript has been downloaded as a text file.",
    });
  };

  const clearTranscript = () => {
    setTranscript([]);
    setSummary("");
    toast({
      title: "Transcript Cleared",
      description: "Ready for a new conversation.",
    });
  };

  const toggleVoiceAssistant = () => {
    setIsVoiceAssistantListening(!isVoiceAssistantListening);
    if (!isVoiceAssistantListening) {
      toast({
        title: "Voice Assistant Activated",
        description: "Say 'Hey Assistant' to activate voice commands",
      });
    } else {
      toast({
        title: "Voice Assistant Deactivated",
        description: "Voice commands are now disabled",
      });
    }
  };

  const handleAssistantQuery = (query: string) => {
    if (!query.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [userMessage, ...prev]);
    
    // Clear the input
    setAssistantQuery("");
    
    // Simulate assistant response (replace with actual AI integration)
    setTimeout(async () => {
      const assistantResponse = await generateMockResponse(query);
      setChatMessages(prev => [assistantResponse, ...prev]);
    }, 1000);
  };

  const handleWhoSaidQuery = (searchTerm: string, originalQuery: string): ChatMessage => {
    // Search for matching transcript entries
    const matches = transcript.filter(entry => 
      entry.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (matches.length === 0) {
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I couldn't find anyone who mentioned "${searchTerm}" in the transcript. Try a different keyword or phrase.`,
        timestamp: new Date()
      };
    }

    // Group matches by speaker
    const speakerMatches = matches.reduce((acc, entry) => {
      const speaker = entry.speaker;
      if (!acc[speaker]) {
        acc[speaker] = [];
      }
      acc[speaker].push(entry);
      return acc;
    }, {} as Record<string, typeof matches>);

    const speakerList = Object.keys(speakerMatches);
    const totalMatches = matches.length;

    let content = `Found ${totalMatches} mention${totalMatches > 1 ? 's' : ''} of "${searchTerm}":\n\n`;
    
    speakerList.forEach(speaker => {
      const count = speakerMatches[speaker].length;
      content += `• **${speaker}** mentioned it ${count} time${count > 1 ? 's' : ''}\n`;
    });

    content += `\nClick on any snippet below to jump to that moment in the transcript.`;

    // Prepare transcript references (limit to 5 most recent)
    const transcriptReferences = matches
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map(entry => {
        // Highlight the search term in the text preview
        const text = entry.text;
        const maxLength = 80;
        const searchIndex = text.toLowerCase().indexOf(searchTerm.toLowerCase());
        
        let preview = text;
        if (searchIndex !== -1) {
          // Try to center the search term in the preview
          const start = Math.max(0, searchIndex - 30);
          const end = Math.min(text.length, start + maxLength);
          preview = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
        } else if (text.length > maxLength) {
          preview = text.substring(0, maxLength) + '...';
        }

        return {
          id: entry.id,
          text: preview,
          speaker: entry.speaker
        };
      });

    return {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content,
      timestamp: new Date(),
      transcriptReferences
    };
  };

  const detectActionItems = async () => {
    if (transcript.length === 0 || isDetectingActions) return;
    
    setIsDetectingActions(true);
    
    try {
      console.log('🎯 Detecting action items...');
      
      const response = await fetch(`${window.location.origin}/functions/v1/detect-action-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript.map(entry => ({
            id: entry.id,
            text: entry.text,
            speaker: entry.speaker,
            timestamp: entry.timestamp
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to detect action items');
      }

      const { actionItems: detectedItems } = await response.json();
      
      setActionItems(detectedItems || []);
      
      if (detectedItems && detectedItems.length > 0) {
        toast({
          title: "Action Items Detected",
          description: `Found ${detectedItems.length} action item${detectedItems.length !== 1 ? 's' : ''}`,
        });
      }
      
      console.log('✅ Action items detected:', detectedItems);
      
    } catch (error) {
      console.error('Error detecting action items:', error);
      toast({
        title: "Action Detection Failed",
        description: "Unable to detect action items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDetectingActions(false);
    }
  };

  const handleCatchUpQuery = async (originalQuery: string): Promise<ChatMessage> => {
    try {
      // Get the last 7 minutes of conversation (good middle ground between 5-10)
      const catchUpMinutes = 7;
      const cutoffTime = new Date(Date.now() - catchUpMinutes * 60 * 1000);
      const recentTranscript = transcript.filter(entry => entry.timestamp >= cutoffTime);
      
      if (recentTranscript.length === 0) {
        return {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Nothing significant happened in the last ${catchUpMinutes} minutes. You're all caught up! 👍`,
          timestamp: new Date()
        };
      }

      if (recentTranscript.length === 1) {
        const entry = recentTranscript[0];
        return {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Quick catch-up: ${entry.speaker} just said "${entry.text.substring(0, 100)}${entry.text.length > 100 ? '...' : ''}"`,
          timestamp: new Date(),
          transcriptReferences: [{
            id: entry.id,
            text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
            speaker: entry.speaker
          }]
        };
      }

      // Generate a very brief summary using a modified prompt
      const response = await fetch(`${window.location.origin}/functions/v1/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: recentTranscript.map(entry => ({
            text: entry.text,
            speaker: entry.speaker,
            timestamp: entry.timestamp
          })),
          prompt: `Provide a very brief 2-3 sentence summary of this recent meeting conversation. Focus only on the most important points, decisions, or topics discussed. Be concise and conversational - this is for someone who briefly zoned out and needs to quickly catch up without others noticing.

Recent conversation:
${recentTranscript.map(entry => `${entry.speaker}: ${entry.text}`).join('\n')}

Summary (2-3 sentences max):`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate catch-up summary');
      }

      const { summary } = await response.json();
      
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Quick catch-up: ${summary}`,
        timestamp: new Date(),
        transcriptReferences: recentTranscript.slice(0, 2).map(entry => ({
          id: entry.id,
          text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
          speaker: entry.speaker
        }))
      };
      
    } catch (error) {
      console.error('Error generating catch-up summary:', error);
      
      // Fallback: provide a simple summary of recent speakers and topics
      const catchUpMinutes = 7;
      const cutoffTime = new Date(Date.now() - catchUpMinutes * 60 * 1000);
      const recentTranscript = transcript.filter(entry => entry.timestamp >= cutoffTime);
      
      if (recentTranscript.length === 0) {
        return {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: "Nothing happened in the last few minutes. You're all caught up!",
          timestamp: new Date()
        };
      }
      
      const speakers = [...new Set(recentTranscript.map(entry => entry.speaker))];
      const lastEntry = recentTranscript[recentTranscript.length - 1];
      
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Quick catch-up: ${speakers.join(' and ')} have been discussing. Most recent: "${lastEntry.text.substring(0, 80)}${lastEntry.text.length > 80 ? '...' : ''}"`,
        timestamp: new Date(),
        transcriptReferences: recentTranscript.slice(-2).map(entry => ({
          id: entry.id,
          text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
          speaker: entry.speaker
        }))
      };
    }
  };

  const generateMockResponse = async (query: string): Promise<ChatMessage> => {
    const lowerQuery = query.toLowerCase();
    let content = "";
    let transcriptReferences: ChatMessage['transcriptReferences'] = [];
    
    // Check for "catch me up" queries
    const catchUpMatch = lowerQuery.match(/catch\s+me\s+up|catch\s*up|what\s+did\s+i\s+miss|what\s+happened/);
    if (catchUpMatch) {
      return await handleCatchUpQuery(query);
    }
    
    // Check for "who said" queries
    const whoSaidMatch = lowerQuery.match(/who said (.+?)(?:\?|$)/);
    if (whoSaidMatch) {
      return handleWhoSaidQuery(whoSaidMatch[1].trim(), query);
    }
    
    // Check for time-based summary requests
    const timeMatch = lowerQuery.match(/(\d+)\s*(minute|minutes|min)/);
    if ((lowerQuery.includes('summary') || lowerQuery.includes('summarize')) && timeMatch) {
      const minutes = parseInt(timeMatch[1]);
      return await handleTimeSummary(minutes, query);
    }
    
    // Find relevant transcript entries based on query
    const findRelevantEntries = (keywords: string[]) => {
      return transcript.filter(entry => 
        keywords.some(keyword => 
          entry.text.toLowerCase().includes(keyword.toLowerCase())
        )
      ).slice(0, 3); // Limit to 3 most relevant
    };
    
    if (lowerQuery.includes('summary') || lowerQuery.includes('summarize')) {
      content = "I can help you summarize the meeting. Here are some key moments I found:";
      transcriptReferences = findRelevantEntries(['decision', 'action', 'need to', 'will do', 'agree'])
        .map(entry => ({
          id: entry.id,
          text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
          speaker: entry.speaker
        }));
    } else if (lowerQuery.includes('action') || lowerQuery.includes('todo')) {
      content = "I found these potential action items in the conversation:";
      transcriptReferences = findRelevantEntries(['will', 'need to', 'should', 'must', 'action', 'task'])
        .map(entry => ({
          id: entry.id,
          text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
          speaker: entry.speaker
        }));
      
      // Trigger automatic action item detection if we haven't done it recently
      if (transcript.length > 0 && !isDetectingActions) {
        detectActionItems();
      }
    } else if (lowerQuery.includes('decision') || lowerQuery.includes('decide')) {
      content = "Here are the decisions I noticed in the transcript:";
      transcriptReferences = findRelevantEntries(['decide', 'decision', 'agree', 'choose', 'go with'])
        .map(entry => ({
          id: entry.id,
          text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
          speaker: entry.speaker
        }));
    } else if (lowerQuery.includes('question') || lowerQuery.includes('ask')) {
      content = "I found these questions in the conversation:";
      transcriptReferences = transcript.filter(entry => 
        entry.text.includes('?') || 
        entry.text.toLowerCase().includes('what') ||
        entry.text.toLowerCase().includes('how') ||
        entry.text.toLowerCase().includes('why')
      ).slice(0, 3)
        .map(entry => ({
          id: entry.id,
          text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
          speaker: entry.speaker
        }));
    } else {
      content = `I understand you're asking about "${query}". I'm here to help with meeting transcription, speaker identification, and generating summaries.`;
      // Find any transcript entries that might be relevant to the query
      const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 3);
      transcriptReferences = findRelevantEntries(queryWords)
        .map(entry => ({
          id: entry.id,
          text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
          speaker: entry.speaker
        }));
    }
    
    return {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content,
      timestamp: new Date(),
      transcriptReferences: transcriptReferences.length > 0 ? transcriptReferences : undefined
    };
  };

  const handleTimeSummary = async (minutes: number, originalQuery: string): Promise<ChatMessage> => {
    try {
      // Filter transcript entries from the last X minutes
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      const recentTranscript = transcript.filter(entry => entry.timestamp >= cutoffTime);
      
      if (recentTranscript.length === 0) {
        return {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `No conversation found in the last ${minutes} minute${minutes > 1 ? 's' : ''}. Try recording more content first.`,
          timestamp: new Date()
  };
      }

      // Call the Supabase edge function for AI summarization
      const response = await fetch(`${window.location.origin}/functions/v1/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: recentTranscript.map(entry => ({
            text: entry.text,
            speaker: entry.speaker,
            timestamp: entry.timestamp
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const { summary } = await response.json();
      
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Here's a summary of the last ${minutes} minute${minutes > 1 ? 's' : ''}:\n\n${summary}`,
        timestamp: new Date(),
        transcriptReferences: recentTranscript.slice(0, 3).map(entry => ({
          id: entry.id,
          text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
          speaker: entry.speaker
        }))
  };
      
    } catch (error) {
      console.error('Error generating time-based summary:', error);
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I couldn't generate a summary for the last ${minutes} minute${minutes > 1 ? 's' : ''}. Please try again.`,
        timestamp: new Date()
  };
    }
  };

  const scrollToTranscriptEntry = (entryId: string) => {
    const element = document.getElementById(`transcript-entry-${entryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary/20');
      setTimeout(() => {
        element.classList.remove('bg-primary/20');
      }, 2000);
    }
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAssistantQuery(assistantQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAssistantQuery(assistantQuery);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Call Transcription Assistant</h1>
          <p className="text-muted-foreground">
            Real-time speech-to-text with speaker identification and AI summarization
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Controls and Settings */}
          <div className="space-y-4">
            <SpeakerSettings
              expectedSpeakers={expectedSpeakers}
              onSpeakerCountChange={handleSpeakerCountChange}
              onReset={handleResetSpeakers}
              detectedSpeakers={detectedSpeakers}
              onSpeakerNameChange={handleSpeakerNameChange}
            />
            
            <RecordingControls
              isRecording={isRecording}
              isListening={isListening}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onClear={clearTranscript}
              transcriptLength={transcript.length}
            />
            
            {/* Export and Summary Controls */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm text-foreground">Actions</h3>
              
              <Button
                onClick={() => {
                  console.log('🔥 AI Summary button clicked!');
                  console.log('📊 Transcript length:', transcript.length);
                  console.log('📊 Transcript data:', transcript);
                  generateSummary();
                }}
                disabled={transcript.length === 0 || isGeneratingSummary}
                className="w-full"
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGeneratingSummary ? "Generating..." : "AI Summary"}
              </Button>
              
              <Button
                onClick={exportTranscript}
                disabled={transcript.length === 0}
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Transcript
              </Button>
              
              {/* Action Items Detection Button */}
              <Button
                onClick={detectActionItems}
                disabled={transcript.length === 0 || isDetectingActions}
                className="w-full"
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isDetectingActions ? "Detecting..." : "Detect Action Items"}
              </Button>
              
              {/* Voice Assistant Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleVoiceAssistant}
                      variant={isVoiceAssistantListening ? "default" : "outline"}
                      className={`w-full ${isVoiceAssistantListening ? "animate-pulse" : ""}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Voice Assistant
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>🎤 Tip: Mute yourself in Zoom/Teams/Meet before speaking to the assistant so others don't hear your query.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Text Input for Assistant Queries */}
              <div className="space-y-2">
                <form onSubmit={handleQuerySubmit} className="flex gap-2">
                  <Input
                    value={assistantQuery}
                    onChange={(e) => setAssistantQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your question to the assistant..."
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    variant="outline"
                    disabled={!assistantQuery.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>

            {/* Chat Panel for Assistant Responses */}
            {chatMessages.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-foreground mb-3">Assistant Chat</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-secondary text-secondary-foreground mr-4'
                      }`}
                    >
                      <div className="font-medium text-xs opacity-75 mb-1">
                        {message.type === 'user' ? 'You' : 'Assistant'}
                      </div>
                      <div className="mb-2">{message.content}</div>
                      
                      {/* Transcript References */}
                      {message.transcriptReferences && message.transcriptReferences.length > 0 && (
                        <div className="space-y-1 mt-2 pt-2 border-t border-border/50">
                          <div className="text-xs opacity-75 mb-1">Related transcript:</div>
                          {message.transcriptReferences.map((ref) => (
                            <button
                              key={ref.id}
                              onClick={() => scrollToTranscriptEntry(ref.id)}
                              className="block w-full text-left p-2 rounded bg-background/50 hover:bg-background/80 transition-colors text-xs"
                            >
                              <div className="font-medium text-primary">{ref.speaker}</div>
                              <div className="opacity-80">"{ref.text}"</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Action Items Panel */}
            {actionItems.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-foreground mb-3">
                  Detected Action Items ({actionItems.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {actionItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm text-primary">
                          {item.responsiblePerson}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(item.confidence * 100)}% confidence
                        </div>
                      </div>
                      <div className="text-sm text-foreground mb-2">
                        {item.taskDescription}
                      </div>
                      <button
                        onClick={() => scrollToTranscriptEntry(item.transcriptEntryId)}
                        className="text-xs text-primary hover:underline"
                      >
                        📍 View in transcript ({item.timestamp.toLocaleTimeString()})
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Summary Panel */}
            {summary && (
              <SummaryPanel summary={summary} isGenerating={isGeneratingSummary} />
            )}

            {/* Email Summary */}
            <EmailSummary summary={summary} isGenerating={isGeneratingSummary} />
          </div>

          {/* Right Column - Transcript Display */}
          <div className="lg:col-span-3 space-y-4">
            <TranscriptDisplay 
              transcript={transcript} 
              isRecording={isRecording}
            />
            
            {/* Mobile-only Stop Recording Button */}
            {isRecording && (
              <div className="block lg:hidden">
                <Button
                  onClick={stopRecording}
                  className="w-full"
                  variant="destructive"
                  size="lg"
                >
                  <Square className="w-4 h-4 mr-2 fill-current" />
                  Stop Recording
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};