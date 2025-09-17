import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Download, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { RecordingControls } from "./RecordingControls";
import { SummaryPanel } from "./SummaryPanel";
import { EmailSummary } from "./EmailSummary";
import { SpeakerSettings } from "./SpeakerSettings";
import { VoiceClustering } from "@/utils/voiceClustering";
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
  const [expectedSpeakers, setExpectedSpeakers] = useState(2);
  const [detectedSpeakers, setDetectedSpeakers] = useState<any[]>([]);
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
      console.log('📡 Making request to /functions/v1/generate-summary');
      const response = await fetch('/functions/v1/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const data = await response.json();
      console.log('📡 Response data:', data);
      
      if (data.error) {
        console.error('❌ API returned error:', data.error);
        throw new Error(data.error);
      }
      
      setSummary(data.summary);
      toast({
        title: "Summary Generated",
        description: "AI summary is ready for review.",
      });
    } catch (error) {
      console.error('❌ Error generating summary:', error);
      toast({
        title: "Summary Error",
        description: "Failed to generate AI summary. Please try again.",
        variant: "destructive",
      });
      setSummary('Unable to generate AI summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
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

            {/* Email Summary */}
            <EmailSummary summary={summary} isGenerating={isGeneratingSummary} />
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