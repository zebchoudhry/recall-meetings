import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Lightbulb, 
  CheckCircle, 
  Target,
  Mail,
  X
} from "lucide-react";

interface BrainstormTag {
  type: "idea" | "decision" | "action" | "concept";
  text: string;
  timestamp: Date;
}

interface BrainstormSessionProps {
  onSessionEnd: () => void;
  userEmail: string;
}

export const BrainstormSession = ({ onSessionEnd, userEmail }: BrainstormSessionProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [tags, setTags] = useState<BrainstormTag[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldRestartRef = useRef(false);

  // Timer effect
  useEffect(() => {
    if (isRecording && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, startTime]);

  // Audio visualization
  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
    }
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  // Background tag detection
  const detectTags = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    const newTags: BrainstormTag[] = [];

    // Detect ideas
    if (lowerText.includes("idea") || lowerText.includes("what if") || lowerText.includes("how about") || lowerText.includes("we could")) {
      newTags.push({ type: "idea", text: text.trim(), timestamp: new Date() });
    }
    // Detect decisions
    if (lowerText.includes("let's do") || lowerText.includes("decided") || lowerText.includes("we will") || lowerText.includes("going with")) {
      newTags.push({ type: "decision", text: text.trim(), timestamp: new Date() });
    }
    // Detect actions
    if (lowerText.includes("action") || lowerText.includes("need to") || lowerText.includes("should") || lowerText.includes("will do")) {
      newTags.push({ type: "action", text: text.trim(), timestamp: new Date() });
    }
    // Detect strong concepts
    if (lowerText.includes("important") || lowerText.includes("key") || lowerText.includes("main") || lowerText.includes("critical")) {
      newTags.push({ type: "concept", text: text.trim(), timestamp: new Date() });
    }

    if (newTags.length > 0) {
      setTags(prev => [...prev, ...newTags].slice(-20)); // Keep last 20 tags
    }
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      // Setup audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Setup speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser");
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("Speech recognition started");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + " ";
            detectTags(result[0].transcript);
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          setTranscript(prev => prev + final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech" && event.error !== "aborted") {
          toast({
            title: "Recognition Error",
            description: `Error: ${event.error}. Try speaking again.`,
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        console.log("Speech recognition ended, shouldRestart:", shouldRestartRef.current);
        if (shouldRestartRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to restart recognition:", e);
          }
        }
      };

      recognitionRef.current = recognition;
      shouldRestartRef.current = true;
      recognition.start();
      
      setIsRecording(true);
      setStartTime(new Date());
      updateAudioLevel();

      toast({
        title: "Recording Started",
        description: "Start brainstorming! Your ideas are being captured.",
      });

    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use brainstorm mode.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    shouldRestartRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
    setAudioLevel(0);

    // Process the brainstorm
    if (transcript.trim().length > 10) {
      await processBrainstorm();
    } else {
      toast({
        title: "Session Too Short",
        description: "Please record more content before ending the session.",
        variant: "destructive",
      });
    }
  };

  const processBrainstorm = async () => {
    setIsProcessing(true);
    setProcessingStep("Analyzing your brainstorm...");

    try {
      // Step 1: Process with AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke("process-brainstorm", {
        body: { transcript }
      });

      if (aiError) throw aiError;

      setProcessingStep("Generating summary...");

      const { summary, key_ideas, actions, decisions, final_idea } = aiData;

      // Step 2: Save to database
      setProcessingStep("Saving session...");
      
      const { error: dbError } = await supabase
        .from("brainstorm_sessions")
        .insert({
          user_email: userEmail,
          transcript,
          summary,
          key_ideas,
          actions,
          decisions,
          final_idea,
          duration_seconds: elapsedTime
        });

      if (dbError) {
        console.error("Database error:", dbError);
        // Continue even if DB save fails
      }

      // Step 3: Send email
      setProcessingStep("Sending email...");
      
      const { error: emailError } = await supabase.functions.invoke("send-brainstorm-email", {
        body: {
          to_email: userEmail,
          transcript,
          summary,
          key_ideas,
          actions,
          decisions,
          final_idea,
          duration_seconds: elapsedTime,
          session_date: new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        }
      });

      if (emailError) {
        console.error("Email error:", emailError);
        toast({
          title: "Email Not Sent",
          description: "Session saved but email delivery failed. Check your email settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Brainstorm Complete! 🎉",
          description: "Your session summary has been emailed to you.",
        });
      }

      // Privacy: Clear local data (audio already not stored)
      setTranscript("");
      setInterimTranscript("");
      setTags([]);
      
      onSessionEnd();

    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process brainstorm session.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const cancelSession = () => {
    shouldRestartRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
    setTranscript("");
    setInterimTranscript("");
    setTags([]);
    onSessionEnd();
  };

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="p-8 max-w-md text-center space-y-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Processing Your Brainstorm</h2>
            <p className="text-muted-foreground">{processingStep}</p>
          </div>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isRecording ? (
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-muted" />
            )}
            <span className="font-medium">
              {isRecording ? "Recording" : "Ready"}
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-primary">
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        <Button variant="ghost" size="icon" onClick={cancelSession}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Waveform Visualization */}
      <div className="h-24 bg-muted/30 flex items-center justify-center relative overflow-hidden">
        <div className="flex items-center gap-1 h-full py-4">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(8, audioLevel * 100 * Math.sin((i / 50) * Math.PI) * (0.5 + Math.random() * 0.5))}%`,
                opacity: 0.3 + audioLevel * 0.7
              }}
            />
          ))}
        </div>
        {!isRecording && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <p className="text-muted-foreground">Click "Start Recording" to begin</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Transcript Area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Live Transcript</h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="prose prose-sm max-w-none">
              {transcript ? (
                <p className="whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-muted-foreground italic">{interimTranscript}</span>
                  )}
                </p>
              ) : (
                <p className="text-muted-foreground italic">
                  {isRecording 
                    ? "Start speaking... your words will appear here."
                    : "Press 'Start Recording' to begin your brainstorm session."}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Tags Sidebar */}
        <div className="w-72 border-l bg-muted/20 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Live Detection</h3>
            <p className="text-xs text-muted-foreground">AI is tagging in real-time</p>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Tags will appear as you brainstorm...
                </p>
              ) : (
                tags.map((tag, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-sm ${
                      tag.type === "idea" 
                        ? "bg-yellow-500/10 border border-yellow-500/30" 
                        : tag.type === "decision"
                        ? "bg-green-500/10 border border-green-500/30"
                        : tag.type === "action"
                        ? "bg-blue-500/10 border border-blue-500/30"
                        : "bg-purple-500/10 border border-purple-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {tag.type === "idea" && <Lightbulb className="w-3 h-3 text-yellow-500" />}
                      {tag.type === "decision" && <CheckCircle className="w-3 h-3 text-green-500" />}
                      {tag.type === "action" && <Target className="w-3 h-3 text-blue-500" />}
                      {tag.type === "concept" && <Mail className="w-3 h-3 text-purple-500" />}
                      <span className="text-xs font-medium capitalize">{tag.type}</span>
                    </div>
                    <p className="text-xs line-clamp-2">{tag.text}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-t bg-card">
        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <Button
              size="lg"
              onClick={startRecording}
              className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
            >
              <Mic className="w-6 h-6 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              onClick={stopRecording}
              className="h-14 px-8 text-lg animate-pulse"
            >
              <MicOff className="w-6 h-6 mr-2" />
              End Session
            </Button>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {isRecording 
            ? "Speak freely. Press 'End Session' when done to get your AI-powered summary."
            : "Your brainstorm will be transcribed, analyzed, and emailed to you automatically."}
        </p>
      </div>
    </div>
  );
};
