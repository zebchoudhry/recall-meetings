import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Download, Sparkles, AlertCircle, Square, MessageCircle, Send, User, FileText, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { RecordingControls } from "./RecordingControls";
import { EmailSummary } from "./EmailSummary";
import { SpeakerSettings } from "./SpeakerSettings";
import { HighlightsSidebar, Highlight, ActionItem } from "./HighlightsSidebar";
import { ReplayModal } from "./ReplayModal";
import { PersonalDashboard, PersonalActionItem } from "./PersonalDashboard";
import { ActionItemNotification } from "./ActionItemNotification";
import { MeetingSummary } from "./MeetingSummary";
import { CheatSheet } from "./CheatSheet";
import { AppHeader } from "./AppHeader";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { VoiceClustering } from "@/utils/voiceClustering";
import { VoiceIdentifier } from "@/utils/voiceIdentifier";
import { storageManager, MeetingData } from "@/utils/storageManager";

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
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isDetectingActions, setIsDetectingActions] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [personalActionItems, setPersonalActionItems] = useState<PersonalActionItem[]>([]);
  const [currentNotification, setCurrentNotification] = useState<PersonalActionItem | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showPersonalDashboard, setShowPersonalDashboard] = useState(false);
  const [showMeetingSummary, setShowMeetingSummary] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState<Date | null>(null);
  const [catchUpData, setCatchUpData] = useState<string>("");
  const [showCatchUpData, setShowCatchUpData] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const { toast } = useToast();
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const voiceClusteringRef = useRef<VoiceClustering>(new VoiceClustering());
  const audioStreamRef = useRef<MediaStream | null>(null);
  const shouldKeepRecordingRef = useRef<boolean>(false); // More explicit name
  const stopRequestedRef = useRef<boolean>(false); // Track if stop was explicitly requested

  // Initialize storage manager
  useEffect(() => {
    const initStorage = async () => {
      try {
        await storageManager.init();
        console.log('💾 Storage manager initialized');
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      }
    };
    initStorage();
  }, []);

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
        
        // Auto-detect highlights for this entry
        const detectedHighlights = detectHighlights(newEntry);
        if (detectedHighlights.length > 0) {
          setHighlights(prev => [...prev, ...detectedHighlights]);
        }

        // Auto-detect personal action items
        if (userName) {
          const personalActions = detectPersonalActionItems(newEntry, userName);
          if (personalActions.length > 0) {
            setPersonalActionItems(prev => [...prev, ...personalActions]);
            // Show notification for the first new personal action item
            if (personalActions[0]) {
              setCurrentNotification(personalActions[0]);
              setShowNotification(true);
            }
          }
        }
        
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
        
        // Track meeting start time
        if (!meetingStartTime) {
          setMeetingStartTime(new Date());
        }
        
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

  const saveMeetingToStorage = async () => {
    if (!storageManager.isEnabled() || transcript.length === 0) {
      return;
    }

    try {
      const meetingId = currentMeetingId || Date.now().toString();
      const meetingData: MeetingData = {
        id: meetingId,
        title: `Meeting - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        date: meetingStartTime || new Date(),
        duration: getMeetingDuration(),
        transcript: transcript,
        summary: summary,
        highlights: highlights,
        actionItems: actionItems,
      };

      await storageManager.saveMeeting(meetingData);
      console.log('💾 Meeting saved to local storage');
      
      toast({
        title: "Meeting Saved",
        description: "Your meeting has been saved locally on this device",
      });
    } catch (error) {
      console.error('Failed to save meeting:', error);
      toast({
        title: "Save Failed",
        description: "Could not save meeting to local storage",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
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
    
    // Save meeting if storage is enabled
    await saveMeetingToStorage();
    
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

  const handleActionItemUpdate = (id: string, status: PersonalActionItem['status']) => {
    setPersonalActionItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status } : item
      )
    );
    
    const item = personalActionItems.find(item => item.id === id);
    if (item) {
      toast({
        title: "Action Item Updated",
        description: `"${item.taskDescription}" marked as ${status}`,
      });
    }
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

  const handleCatchMeUpShortcut = async () => {
    const assistantResponse = await handleCatchUpQuery("catch me up");
    setCatchUpData(assistantResponse.content);
    setShowCatchUpData(true);
    // Also add to chat for full history
    setChatMessages(prev => [assistantResponse, ...prev]);
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
      // Get the last 10 minutes of conversation
      const catchUpMinutes = 10;
      const cutoffTime = new Date(Date.now() - catchUpMinutes * 60 * 1000);
      const recentTranscript = transcript.filter(entry => entry.timestamp >= cutoffTime);
      
      if (recentTranscript.length === 0) {
        return {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `**Catch Me Up – Last ${catchUpMinutes} mins**\n\nNothing significant happened in the last ${catchUpMinutes} minutes. You're all caught up! 👍`,
          timestamp: new Date()
        };
      }

      if (recentTranscript.length === 1) {
        const entry = recentTranscript[0];
        return {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `**Catch Me Up – Last ${catchUpMinutes} mins**\n\n${entry.speaker} just said: "${entry.text.substring(0, 100)}${entry.text.length > 100 ? '...' : ''}"`,
          timestamp: new Date(),
          transcriptReferences: [{
            id: entry.id,
            text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
            speaker: entry.speaker
          }]
        };
      }

      // Generate a focused summary
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
          prompt: `Analyze this recent meeting conversation and provide a concise 2-3 sentence recap that covers:
1. What was discussed
2. Any key decisions made
3. Any tasks assigned or action items mentioned

Be conversational and direct - this is for someone who needs to quickly catch up. Focus only on the most important information.

Recent conversation:
${recentTranscript.map(entry => `${entry.speaker}: ${entry.text}`).join('\n')}

Provide exactly 2-3 sentences summarizing the above.`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate catch-up summary');
      }

      const { summary } = await response.json();
      
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `**Catch Me Up – Last ${catchUpMinutes} mins**\n\n${summary}`,
        timestamp: new Date(),
        transcriptReferences: recentTranscript.slice(0, 3).map(entry => ({
          id: entry.id,
          text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : ''),
          speaker: entry.speaker
        }))
      };
      
    } catch (error) {
      console.error('Error generating catch-up summary:', error);
      
      // Fallback: provide a simple summary of recent speakers and topics
      const catchUpMinutes = 10;
      const cutoffTime = new Date(Date.now() - catchUpMinutes * 60 * 1000);
      const recentTranscript = transcript.filter(entry => entry.timestamp >= cutoffTime);
      
      if (recentTranscript.length === 0) {
        return {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `**Catch Me Up – Last ${catchUpMinutes} mins**\n\nNothing happened in the last ${catchUpMinutes} minutes. You're all caught up!`,
          timestamp: new Date()
        };
      }
      
      const speakers = [...new Set(recentTranscript.map(entry => 
        entry.speaker.replace(/\s*\(\d+%\)/, '') // Remove confidence percentages for cleaner display
      ))];
      const lastEntry = recentTranscript[recentTranscript.length - 1];
      
      // Get speaker participation percentages
      const speakerStats = speakers.map(speaker => {
        const speakerEntries = recentTranscript.filter(entry => 
          entry.speaker.replace(/\s*\(\d+%\)/, '') === speaker
        );
        const percentage = Math.round((speakerEntries.length / recentTranscript.length) * 100);
        return `${speaker} (${percentage}% participation)`;
      });
      
      // Get recent key points
      const keyPoints = recentTranscript
        .slice(-3) // Last 3 entries
        .map(entry => `• ${entry.speaker.replace(/\s*\(\d+%\)/, '')}: "${entry.text.substring(0, 80)}${entry.text.length > 80 ? '...' : ''}"`)
        .join('\n');
      
      const content = `**Catch Me Up – Last ${catchUpMinutes} mins**

**Participants:**
${speakerStats.join('\n')}

**Recent Discussion:**
${keyPoints}`;
      
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: content,
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

  const detectHighlights = (entry: TranscriptEntry): Highlight[] => {
    const text = entry.text.toLowerCase();
    const highlights: Highlight[] = [];
    
    // Decision indicators - enhanced patterns
    const decisionPatterns = [
      /we (?:decided|decide|agreed|agree|will go with|chose|are going with)/i,
      /(?:decision|conclusion|final|verdict).*(?:is|was|will be)/i,
      /(?:let's|we'll) (?:go with|choose|pick|select|proceed with)/i,
      /(?:agreed|consensus|settled) (?:on|that|to)/i,
      /final decision.*(?:is|was|will be)/i,
      /we are moving forward with/i,
      /it's decided/i,
      /that's what we'll do/i,
    ];
    
    // Enhanced action item indicators - better person detection
    const actionPatterns = [
      // Person + action verb patterns
      /([A-Z][a-z]+|I|you|he|she|they)\s+(?:will|is going to|needs? to|should|must|has to)\s+(send|create|finish|complete|handle|do|prepare|review|follow up|call|email|schedule|update|write|draft|contact|organize|coordinate|present|analyze|research|investigate|implement|develop|design|test|deploy|launch)\s*(.+)/i,
      
      // Assignment patterns
      /([A-Z][a-z]+|I|you|he|she|they)\s+(?:is responsible for|will take care of|owns|is assigned to|will handle)\s+(.+)/i,
      
      // Task delegation patterns
      /(?:can|could|please)\s+([A-Z][a-z]+|you|he|she|they)\s+(send|create|finish|complete|handle|do|prepare|review|follow up|call|email|schedule|update|write|draft|contact|organize|coordinate|present|analyze|research|investigate|implement|develop|design|test|deploy|launch)\s*(.+)/i,
      
      // Future commitment patterns
      /([A-Z][a-z]+|I|you|he|she|they)['']?ll\s+(handle|take care of|work on|prepare|send|create|finish|complete|contact|follow up|review|update|schedule|coordinate|organize|present|analyze|research|investigate|implement|develop|design|test|deploy|launch)\s*(.+)/i,
    ];
    
    // Key updates indicators - enhanced for business metrics and important news
    const updatePatterns = [
      /(?:revenue|sales|profit|growth|performance|metrics|numbers|results) (?:increased|decreased|improved|dropped|rose|fell|up|down)/i,
      /(?:increased|decreased|improved|grew|dropped|rose|fell) (?:by )?(?:\d+%|\d+ percent)/i,
      /(?:quarterly|monthly|annual|yearly) (?:results|numbers|performance|revenue|sales)/i,
      /(?:important|urgent|critical|breaking|major|significant).*(?:update|news|information|development|change)/i,
      /(?:new|latest|recent) (?:development|progress|update|milestone|achievement)/i,
      /(?:changed|updated|modified|revised|announced|launched)/i,
      /(?:announce|announcing|announcement)/i,
      /(?:milestone|achievement|breakthrough|success|win)/i,
    ];
    
    // Agreement indicators
    const agreementPatterns = [
      /(?:everyone|all|we) (?:agree|agreed|consensus)/i,
      /(?:unanimous|universal) (?:agreement|consensus)/i,
      /(?:yes|right|exactly|absolutely|definitely).*(?:agreed|agree)/i,
      /(?:sounds good|looks good|works for me|i'm on board)/i,
    ];
    
    // Question indicators
    const questionPatterns = [
      /\?$/,
      /(?:what|how|when|where|why|who) (?:do you|should we|can we)/i,
      /(?:question|concern|issue|problem)/i,
    ];
    
    // Check for decisions
    if (decisionPatterns.some(pattern => pattern.test(entry.text))) {
      highlights.push({
        id: `highlight_${entry.id}_decision`,
        type: 'decision',
        text: entry.text,
        speaker: entry.speaker,
        timestamp: entry.timestamp,
        transcriptEntryId: entry.id,
        confidence: 0.8,
      });
    }
    
    // Check for updates
    if (updatePatterns.some(pattern => pattern.test(entry.text))) {
      highlights.push({
        id: `highlight_${entry.id}_update`,
        type: 'update',
        text: entry.text,
        speaker: entry.speaker,
        timestamp: entry.timestamp,
        transcriptEntryId: entry.id,
        confidence: 0.7,
      });
    }
    
    // Check for agreements
    if (agreementPatterns.some(pattern => pattern.test(entry.text))) {
      highlights.push({
        id: `highlight_${entry.id}_agreement`,
        type: 'agreement',
        text: entry.text,
        speaker: entry.speaker,
        timestamp: entry.timestamp,
        transcriptEntryId: entry.id,
        confidence: 0.9,
      });
    }
    
    // Check for action items and create structured ActionItem objects
    const actionItemMatches = actionPatterns.map(pattern => {
      const match = entry.text.match(pattern);
      if (match) {
        return {
          pattern,
          match,
          responsiblePerson: extractPersonFromMatch(match, entry.speaker),
          taskDescription: extractTaskFromMatch(match)
        };
      }
      return null;
    }).filter(Boolean);

    if (actionItemMatches.length > 0) {
      // Create highlight for action items
      highlights.push({
        id: `highlight_${entry.id}_action`,
        type: 'action',
        text: entry.text,
        speaker: entry.speaker,
        timestamp: entry.timestamp,
        transcriptEntryId: entry.id,
        confidence: 0.8,
      });

      // Create structured action items
      actionItemMatches.forEach((actionMatch, index) => {
        if (actionMatch) {
          const newActionItem: ActionItem = {
            id: `action_${entry.id}_${index}`,
            responsiblePerson: actionMatch.responsiblePerson,
            taskDescription: actionMatch.taskDescription,
            assignedBy: entry.speaker,
            timestamp: entry.timestamp,
            transcriptEntryId: entry.id,
            isForCurrentUser: isUserMentioned(actionMatch.responsiblePerson, userName),
            priority: extractPriorityFromText(entry.text),
            dueDate: extractDueDateFromText(entry.text)
          };
          
          // Add to action items state
          setActionItems(prev => [...prev, newActionItem]);
        }
      });
    }
    
    // Check for questions
    if (questionPatterns.some(pattern => pattern.test(entry.text))) {
      highlights.push({
        id: `highlight_${entry.id}_question`,
        type: 'question',
        text: entry.text,
        speaker: entry.speaker,
        timestamp: entry.timestamp,
        transcriptEntryId: entry.id,
        confidence: 0.6,
      });
    }
    
    return highlights;
  };

  // Helper functions for action item extraction
  const extractPersonFromMatch = (match: RegExpMatchArray, speaker: string): string => {
    const person = match[1]?.trim();
    if (!person) return speaker;
    
    // Handle pronouns based on speaker context
    if (person.toLowerCase() === 'i') return speaker;
    if (person.toLowerCase() === 'you') return userName || 'You';
    if (person.toLowerCase() === 'he' || person.toLowerCase() === 'she' || person.toLowerCase() === 'they') {
      return 'Someone'; // Could be enhanced with context tracking
    }
    
    return person;
  };

  const extractTaskFromMatch = (match: RegExpMatchArray): string => {
    // Get the action verb and task description
    const action = match[2]?.trim() || '';
    const description = match[3]?.trim() || '';
    
    if (action && description) {
      return `${action} ${description}`.trim();
    } else if (action) {
      return action;
    } else {
      // Fallback to the whole matched portion
      return match[0]?.trim() || 'Complete task';
    }
  };

  const isUserMentioned = (responsiblePerson: string, currentUser: string): boolean => {
    if (!currentUser) return false;
    
    const lowerResponsible = responsiblePerson.toLowerCase();
    const lowerUser = currentUser.toLowerCase();
    
    return lowerResponsible === lowerUser || 
           lowerResponsible === 'you' ||
           lowerResponsible.includes(lowerUser);
  };

  const extractDueDateFromText = (text: string): Date | undefined => {
    const dueDatePatterns = [
      { pattern: /by\s+(tomorrow)/i, days: 1 },
      { pattern: /by\s+(today|tonight)/i, days: 0 },
      { pattern: /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, days: 7 }, // Rough estimate
      { pattern: /by\s+(next week)/i, days: 7 },
      { pattern: /by\s+(this week|end of week)/i, days: 5 },
      { pattern: /due\s+(tomorrow)/i, days: 1 },
      { pattern: /deadline\s+(tomorrow)/i, days: 1 },
    ];

    for (const { pattern, days } of dueDatePatterns) {
      if (pattern.test(text)) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);
        return dueDate;
      }
    }
    
    return undefined;
  };

  const extractPriorityFromText = (text: string): 'low' | 'medium' | 'high' => {
    const urgentWords = /\b(urgent|asap|immediately|critical|high priority|emergency)\b/i;
    const lowWords = /\b(when you can|whenever|low priority|not urgent)\b/i;
    
    if (urgentWords.test(text)) return 'high';
    if (lowWords.test(text)) return 'low';
    return 'medium';
  };

  const getMeetingDuration = (): number => {
    if (!meetingStartTime) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - meetingStartTime.getTime()) / (1000 * 60));
  };

  const exportMeetingSummary = async (summaryText: string) => {
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Summary Exported",
      description: "Meeting summary has been downloaded",
    });
  };

  const emailMeetingSummary = async (summaryText: string) => {
    // This would integrate with the existing email functionality
    toast({
      title: "Email Feature",
      description: "Email integration coming soon!",
    });
  };

  const detectPersonalActionItems = (entry: TranscriptEntry, currentUserName: string): PersonalActionItem[] => {
    const text = entry.text;
    const lowerText = text.toLowerCase();
    const lowerUserName = currentUserName.toLowerCase();
    const personalActions: PersonalActionItem[] = [];
    
    // Patterns for detecting personal assignments
    const personalActionPatterns = [
      // Direct name assignments
      new RegExp(`${lowerUserName}\\s+(?:will|should|needs? to|has to|must|is going to)\\s+(.+)`, 'i'),
      new RegExp(`(?:please|can)\\s+${lowerUserName}\\s+(.+)`, 'i'),
      new RegExp(`${lowerUserName}[,:]?\\s+(?:you|your)\\s+(?:need to|should|will|task is to)\\s+(.+)`, 'i'),
      
      // "You" assignments (when current user is speaking or being addressed)
      /(?:you|your)\s+(?:need to|should|will|have to|must|are responsible for|task is to)\s+(.+)/i,
      /(?:can you|could you|please)\s+(.+)/i,
      /(?:your|you're)\s+(?:responsible for|in charge of|handling)\s+(.+)/i,
      
      // Assignment patterns
      /(?:assigned? to|delegated? to|giving to)\s+(?:you|${lowerUserName})[,:]?\s*(.+)/i,
      /(?:action item for|task for)\s+(?:you|${lowerUserName})[,:]?\s*(.+)/i,
    ];

    // Priority detection
    const getPriority = (text: string): PersonalActionItem['priority'] => {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('immediately')) {
        return 'high';
      }
      if (lowerText.includes('soon') || lowerText.includes('priority') || lowerText.includes('important')) {
        return 'medium';
      }
      return 'low';
    };

    // Due date extraction
    const extractDueDate = (text: string): string | undefined => {
      const dueDatePatterns = [
        /by\s+(tomorrow|today|tonight)/i,
        /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        /by\s+(next week|this week|end of week)/i,
        /by\s+(\d{1,2}\/\d{1,2})/,
        /due\s+(tomorrow|today|tonight)/i,
        /deadline\s+(tomorrow|today|tonight)/i,
      ];

      for (const pattern of dueDatePatterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1];
        }
      }
      return undefined;
  };


    // Check each pattern
    personalActionPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) {
        const taskDescription = match[1].trim();
        
        // Skip if the task description is too short or generic
        if (taskDescription.length < 5 || taskDescription.toLowerCase().includes('know')) {
          return;
        }

        personalActions.push({
          id: `personal_${entry.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          taskDescription: taskDescription,
          assignedBy: entry.speaker,
          responsiblePerson: currentUserName,
          dueDate: extractDueDate(text),
          priority: getPriority(text),
          status: 'pending',
          transcriptEntryId: entry.id,
          timestamp: entry.timestamp,
          confidence: 0.8,
        });
      }
    });

    return personalActions;
  };

  const handlePersonalActionUpdate = (id: string, status: PersonalActionItem['status']) => {
    setPersonalActionItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status } : item
      )
    );
  };


  const handleHighlightClick = (transcriptEntryId: string) => {
    // Find the highlight that matches this transcript entry
    const highlight = highlights.find(h => h.transcriptEntryId === transcriptEntryId);
    if (highlight) {
      setSelectedHighlight(highlight);
      setIsReplayModalOpen(true);
    }
    
    // Also scroll to the transcript entry
    scrollToTranscriptEntry(transcriptEntryId);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-background">
        {/* App Header */}
        <AppHeader />
        
        <div className="flex w-full max-w-[1600px] mx-auto gap-3">
          {/* Main Content */}
          <div className="flex-1 p-6">
          <div className="space-y-6">

            {/* Title Section */}
            <div className="text-center space-y-2">
              <h1 className="text-meeting-title text-foreground">Call Transcription Assistant</h1>
              <p className="text-body text-muted-foreground">
                Real-time speech-to-text with speaker identification and AI summarization
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Left Column - Controls and Settings */}
              <div className="space-y-4">
                <SpeakerSettings
                  expectedSpeakers={expectedSpeakers}
                  onSpeakerCountChange={handleSpeakerCountChange}
                  onReset={handleResetSpeakers}
                  detectedSpeakers={detectedSpeakers}
                  onSpeakerNameChange={handleSpeakerNameChange}
                  userName={userName}
                  onUserNameChange={setUserName}
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
                
                </Card>

                {/* Chat Messages */}
                {chatMessages.length > 0 && (
                  <Card className="p-4 space-y-3 max-h-64 overflow-y-auto">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      Ask About Meeting
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Silently ask questions without interrupting the conversation
                    </p>
                    <div className="space-y-3">
                      {chatMessages.slice(0, 3).map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg text-sm ${
                            message.type === 'user' 
                              ? 'bg-primary/10 border-l-2 border-primary' 
                              : 'bg-muted border-l-2 border-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.type === 'user' ? (
                              <User className="w-3 h-3" />
                            ) : (
                              <MessageCircle className="w-3 h-3" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-foreground leading-relaxed">{message.content}</p>
                          
                          {/* Show transcript references if available */}
                          {message.transcriptReferences && message.transcriptReferences.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-muted-foreground">Referenced from transcript:</p>
                              {message.transcriptReferences.map((ref, index) => (
                                <button
                                  key={index}
                                  onClick={() => scrollToTranscriptEntry(ref.id)}
                                  className="block w-full text-left p-2 bg-background/50 rounded border text-xs hover:bg-accent transition-colors"
                                >
                                  <span className="font-medium">{ref.speaker}:</span> {ref.text.substring(0, 60)}...
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {chatMessages.length > 3 && (
                        <button
                          onClick={() => setShowPersonalDashboard(true)}
                          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors p-2 border rounded-lg hover:bg-accent"
                        >
                          View all {chatMessages.length} messages in dashboard
                        </button>
                      )}
                    </div>
                  </Card>
                )}

              </div>

              {/* Center Column - Transcript Display */}
              <div className="lg:col-span-3 space-y-4">
                <TranscriptDisplay 
                  transcript={transcript} 
                  isRecording={isRecording}
                />
                
                {/* Voice Assistant Input - Full Width */}
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-sm text-foreground">Ask About Meeting</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Type questions like: "Who mentioned the budget?" or "What did I miss?"
                    </p>
                    <form onSubmit={handleQuerySubmit} className="flex gap-2">
                      <Input
                        value={assistantQuery}
                        onChange={(e) => setAssistantQuery(e.target.value)}
                        placeholder="Ask about the meeting..."
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" variant="outline">
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </Card>
                
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

              {/* Right Column - Catch Me Up */}
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold text-sm text-foreground mb-3">Quick Actions</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 transition-all duration-200"
                          onClick={handleCatchMeUpShortcut}
                          disabled={transcript.length === 0}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Catch Me Up
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Get a quick summary of what you've missed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Card>

                {/* Ask About Meeting & Meeting Summary Card */}
                <Card className="p-4">
                  <h3 className="font-semibold text-sm text-foreground mb-3">Meeting Tools</h3>
                  <div className="space-y-2">
                    {/* Ask About Meeting Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 text-purple-700 hover:text-purple-800 transition-all duration-200 shadow-sm"
                            onClick={() => setShowPersonalDashboard(true)}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Ask About Meeting
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Ask questions about the meeting without interrupting - perfect for silent participation, finding specific topics, or getting quick insights</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Meeting Summary Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-white/50 hover:bg-white/70 border-secondary/30 text-secondary hover:text-secondary-foreground hover:bg-secondary transition-all duration-200"
                            onClick={() => setShowMeetingSummary(!showMeetingSummary)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Meeting Summary
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View comprehensive meeting summary and insights</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </Card>

                {/* Email Summary */}
                <EmailSummary summary={summary} isGenerating={isGeneratingSummary} />
                
                {/* Catch Me Up Output */}
                {showCatchUpData && (
                  <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Summary</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowCatchUpData(false)}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="text-sm space-y-2">
                        {catchUpData.split('\n').map((line, index) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return (
                              <h5 key={index} className="font-semibold text-blue-800 border-b border-blue-200 pb-1 mb-2">
                                {line.replace(/\*\*/g, '')}
                              </h5>
                            );
                          }
                          if (line.startsWith('•')) {
                            return (
                              <div key={index} className="flex items-start gap-2 text-gray-700 leading-relaxed">
                                <span className="text-blue-600 font-bold mt-0.5">•</span>
                                <span className="flex-1">{line.substring(1).trim()}</span>
                              </div>
                            );
                          }
                          if (line.trim() && !line.startsWith('**')) {
                            return (
                              <p key={index} className="text-gray-700 leading-relaxed pl-2">
                                {line}
                              </p>
                            );
                          }
                          return <div key={index} className="h-1"></div>;
                        })}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
              </div>
            </div>
          </div>

          {/* Highlights Sidebar - Integrated within main layout */}
          <div className="flex-shrink-0">
            <HighlightsSidebar 
              highlights={highlights}
              actionItems={actionItems}
              transcript={transcript}
              currentUser={userName}
              onHighlightClick={handleHighlightClick}
            />
          </div>
        </div>

        {/* Replay Modal */}
        <ReplayModal
          highlight={selectedHighlight}
          transcript={transcript}
          isOpen={isReplayModalOpen}
          onClose={() => {
            setIsReplayModalOpen(false);
            setSelectedHighlight(null);
          }}
        />

        {/* Personal Action Item Notification */}
        <ActionItemNotification
          actionItem={currentNotification}
          isVisible={showNotification}
          onDismiss={() => {
            setShowNotification(false);
            setCurrentNotification(null);
          }}
          onViewDashboard={() => setShowPersonalDashboard(true)}
        />

        {/* Cheat Sheet */}
        <CheatSheet
          transcript={transcript}
          highlights={highlights}
          actionItems={actionItems}
          currentUser={userName}
          meetingDuration={`${getMeetingDuration()} minutes`}
          meetingStartTime={meetingStartTime || new Date()}
          isVisible={showCheatSheet}
          onClose={() => setShowCheatSheet(false)}
        />

        {/* Meeting Summary Modal */}
        <MeetingSummary
          transcript={transcript}
          highlights={highlights}
          actionItems={actionItems}
          personalActionItems={personalActionItems}
          meetingDuration={getMeetingDuration()}
          isVisible={showMeetingSummary}
          onClose={() => setShowMeetingSummary(false)}
          onExport={exportMeetingSummary}
          onEmail={emailMeetingSummary}
        />

        {/* Personal Dashboard Modal */}
        {showPersonalDashboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative max-h-[90vh] overflow-auto">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => setShowPersonalDashboard(false)}
              >
                ×
              </Button>
              <PersonalDashboard
                personalActionItems={personalActionItems}
                userName={userName}
                onUserNameChange={setUserName}
                onActionItemUpdate={handleActionItemUpdate}
                onViewInTranscript={scrollToTranscriptEntry}
              />
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};