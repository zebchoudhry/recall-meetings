import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Download, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { RecordingControls } from "./RecordingControls";
import { SummaryPanel } from "./SummaryPanel";
import { VoiceEnrollment } from "./VoiceEnrollment";
import { VoiceIdentifier } from "@/utils/voiceIdentifier";

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
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
  const [enrolledProfiles, setEnrolledProfiles] = useState<VoiceProfile[]>([]);
  const { toast } = useToast();
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const currentSpeakerRef = useRef<string>("Unknown Speaker");
  const voiceIdentifierRef = useRef<VoiceIdentifier>(new VoiceIdentifier());
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    console.log('🚀 TranscriptionApp mounted');
    console.log('📋 Current enrolled profiles:', enrolledProfiles);
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      setIsListening(false);
      if (isRecording) {
        // Restart if we're still supposed to be recording
        recognition.start();
      }
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        console.log('🎤 Processing speech result:', finalTranscript);
        let speakerLabel = "Unknown Speaker";
        
        // Quick voice analysis with timeout to prevent delays
        if (audioStreamRef.current && enrolledProfiles.length > 0) {
          console.log('🔍 Starting voice analysis...');
          try {
            // Add timeout to prevent hanging
            const analysisPromise = voiceIdentifierRef.current.analyzeAudioStream(audioStreamRef.current);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Voice analysis timeout')), 2000)
            );
            
            const pattern = await Promise.race([analysisPromise, timeoutPromise]) as any;
            console.log('📊 Voice pattern:', pattern);
            
            const identification = voiceIdentifierRef.current.identifySpeaker(pattern);
            console.log('👤 Speaker identification result:', identification);
            
            if (identification.confidence > 0) {
              speakerLabel = `${identification.name} (${Math.round(identification.confidence * 100)}%)`;
              console.log('✅ Speaker identified:', speakerLabel);
            }
          } catch (error) {
            console.error('❌ Voice analysis error:', error);
            // Fallback: use previous speaker if available
            const lastEntry = transcript[transcript.length - 1];
            if (lastEntry && lastEntry.speaker !== "Unknown Speaker") {
              speakerLabel = lastEntry.speaker;
              console.log('🔄 Using previous speaker as fallback:', speakerLabel);
            }
          }
        } else {
          console.log('⚠️ No enrolled profiles or audio stream for identification');
        }

        const newEntry: TranscriptEntry = {
          id: Date.now().toString(),
          speaker: speakerLabel,
          text: finalTranscript.trim(),
          timestamp: new Date(),
          confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0.9,
        };

        console.log('📝 Adding transcript entry:', newEntry);
        setTranscript(prev => [...prev, newEntry]);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: "Recognition Error",
        description: `Error: ${event.error}`,
        variant: "destructive",
      });
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, toast, enrolledProfiles]); // Add enrolledProfiles dependency

  const startRecording = async () => {
    console.log('startRecording function called');
    
    try {
      console.log('Checking browser support for Speech Recognition...');
      
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
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
      console.log('📋 Available enrolled profiles for identification:', enrolledProfiles);
      console.log('🔧 Voice identifier profiles updated:', voiceIdentifierRef.current);
      
      if (recognitionRef.current) {
        console.log('Starting speech recognition...');
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
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    toast({
      title: "Recording Stopped",
      description: "Transcription complete.",
    });
  };

  const handleProfilesUpdate = (profiles: VoiceProfile[]) => {
    console.log('📋 Updating voice profiles:', profiles);
    setEnrolledProfiles(profiles);
    voiceIdentifierRef.current.updateProfiles(profiles);
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
    
    // Simulate AI processing - in a real app, you'd call an LLM API
    setTimeout(() => {
      const transcriptText = transcript.map(entry => 
        `${entry.speaker}: ${entry.text}`
      ).join('\n');
      
      setSummary(`**Key Discussion Points:**
• Main topics covered in this conversation
• Important decisions made
• Action items identified
• Follow-up required

**Participants:** ${Array.from(new Set(transcript.map(t => t.speaker))).join(', ')}
**Duration:** Approximately ${Math.ceil(transcript.length / 10)} minutes`);
      
      setIsGeneratingSummary(false);
      toast({
        title: "Summary Generated",
        description: "AI summary is ready for review.",
      });
    }, 2000);
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
          {/* Left Column - Controls and Voice Enrollment */}
          <div className="space-y-4">
            <VoiceEnrollment
              onProfilesUpdate={handleProfilesUpdate}
              enrolledProfiles={enrolledProfiles}
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
                onClick={generateSummary}
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

            {/* Summary Panel */}
            {summary && (
              <SummaryPanel summary={summary} isGenerating={isGeneratingSummary} />
            )}
          </div>

          {/* Right Column - Transcript Display */}
          <div className="lg:col-span-3">
            <TranscriptDisplay 
              transcript={transcript} 
              isRecording={isRecording}
            />
          </div>
        </div>
      </div>
    </div>
  );
};