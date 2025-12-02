import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mic, 
  MicOff, 
  Loader2, 
  X,
  Volume2,
  VolumeX
} from "lucide-react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BrainstormSessionProps {
  onSessionEnd: () => void;
  userEmail: string;
}

export const BrainstormSession = ({ onSessionEnd, userEmail }: BrainstormSessionProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentUserSpeech, setCurrentUserSpeech] = useState("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldRestartRef = useRef(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [conversation, currentUserSpeech]);

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

  // Text-to-speech for AI responses
  const speakText = useCallback((text: string) => {
    if (isMuted || !text.trim()) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to get a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Samantha') || 
      v.name.includes('Alex') ||
      v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => {
      setIsAISpeaking(true);
      // Pause recognition while AI speaks to avoid feedback
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log("Recognition already stopped");
        }
      }
    };
    
    utterance.onend = () => {
      setIsAISpeaking(false);
      // Resume recognition after AI finishes speaking
      if (shouldRestartRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log("Recognition restart failed:", e);
        }
      }
    };
    
    utterance.onerror = () => {
      setIsAISpeaking(false);
    };
    
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Get AI response
  const getAIResponse = useCallback(async (userMessage: string) => {
    try {
      const systemPrompt = `You are a helpful brainstorming partner having a voice conversation. Keep your responses concise (2-4 sentences max) and conversational. Help the user explore and develop their ideas. Ask clarifying questions, offer suggestions, and help them think through problems. Be encouraging and collaborative. Do not use markdown formatting, bullet points, or numbered lists - speak naturally as if in a real conversation.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversation.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage }
      ];

      const { data, error } = await supabase.functions.invoke("brainstorm-chat", {
        body: { messages }
      });

      if (error) throw error;
      
      const aiResponse = data.response || "I'm sorry, I didn't catch that. Could you repeat?";
      
      // Add AI response to conversation
      setConversation(prev => [...prev, {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      }]);
      
      // Speak the response
      speakText(aiResponse);
      
    } catch (error) {
      console.error("AI response error:", error);
      const fallbackResponse = "I'm having trouble processing that. Could you try again?";
      setConversation(prev => [...prev, {
        role: "assistant",
        content: fallbackResponse,
        timestamp: new Date()
      }]);
      speakText(fallbackResponse);
    }
  }, [conversation, speakText]);

  // Process user speech after silence
  const processUserSpeech = useCallback((finalText: string) => {
    if (!finalText.trim()) return;
    
    // Add user message to conversation
    setConversation(prev => [...prev, {
      role: "user",
      content: finalText.trim(),
      timestamp: new Date()
    }]);
    
    setCurrentUserSpeech("");
    
    // Get AI response
    getAIResponse(finalText.trim());
  }, [getAIResponse]);

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
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          setCurrentUserSpeech(prev => prev + final);
          
          // Reset silence timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          
          // Process after 1.5 seconds of silence
          silenceTimeoutRef.current = setTimeout(() => {
            setCurrentUserSpeech(current => {
              if (current.trim()) {
                processUserSpeech(current);
              }
              return "";
            });
          }, 1500);
        }
        
        if (interim) {
          // Reset silence timeout on interim results too
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
        }
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
        if (shouldRestartRef.current && !isAISpeaking) {
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

      // Initial AI greeting
      const greeting = "Hello! I'm your brainstorming partner. What would you like to explore today? Just speak your ideas and I'll help you develop them.";
      setConversation([{
        role: "assistant",
        content: greeting,
        timestamp: new Date()
      }]);
      speakText(greeting);

      toast({
        title: "Session Started",
        description: "Start brainstorming! Speak naturally and I'll respond.",
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
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
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

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    setIsRecording(false);
    setAudioLevel(0);
    setIsAISpeaking(false);

    // Process the brainstorm if we have conversation
    if (conversation.length > 1) {
      await processBrainstorm();
    } else {
      toast({
        title: "Session Too Short",
        description: "Please have a conversation before ending the session.",
        variant: "destructive",
      });
    }
  };

  const processBrainstorm = async () => {
    setIsProcessing(true);
    setProcessingStep("Analyzing your brainstorm...");

    try {
      // Build full transcript from conversation
      const transcript = conversation.map(m => 
        `${m.role === "user" ? "You" : "AI"}: ${m.content}`
      ).join("\n\n");

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
          description: "Session saved but email delivery failed.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Brainstorm Complete!",
          description: "Your session summary has been emailed to you.",
        });
      }

      setConversation([]);
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
    window.speechSynthesis.cancel();
    
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
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    setIsRecording(false);
    setConversation([]);
    setCurrentUserSpeech("");
    onSessionEnd();
  };

  const toggleMute = () => {
    if (!isMuted) {
      window.speechSynthesis.cancel();
    }
    setIsMuted(!isMuted);
  };

  // Interrupt AI speech when user starts speaking
  const interruptAI = () => {
    if (isAISpeaking) {
      window.speechSynthesis.cancel();
      setIsAISpeaking(false);
    }
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
              {isAISpeaking ? "AI Speaking..." : isRecording ? "Listening" : "Ready"}
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-primary">
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMute}
            title={isMuted ? "Unmute AI" : "Mute AI"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={cancelSession}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div 
        className="h-24 bg-muted/30 flex items-center justify-center relative overflow-hidden cursor-pointer"
        onClick={interruptAI}
      >
        <div className="flex items-center gap-1 h-full py-4">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${
                isAISpeaking ? "bg-green-500" : "bg-primary"
              }`}
              style={{
                height: `${Math.max(8, (isAISpeaking ? 0.5 : audioLevel) * 100 * Math.sin((i / 50) * Math.PI) * (0.5 + Math.random() * 0.5))}%`,
                opacity: 0.3 + (isAISpeaking ? 0.5 : audioLevel) * 0.7
              }}
            />
          ))}
        </div>
        {!isRecording && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <p className="text-muted-foreground">Click "Start Session" to begin</p>
          </div>
        )}
        {isAISpeaking && (
          <div className="absolute bottom-2 text-xs text-muted-foreground">
            Click to interrupt
          </div>
        )}
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4 max-w-3xl mx-auto">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Current user speech (interim) */}
            {currentUserSpeech && (
              <div className="flex justify-end">
                <div className="max-w-[80%] p-4 rounded-2xl bg-primary/50 text-primary-foreground rounded-br-md">
                  <p className="text-sm italic">{currentUserSpeech}</p>
                </div>
              </div>
            )}
            
            {conversation.length === 0 && !isRecording && (
              <div className="text-center text-muted-foreground py-12">
                <p>Start a session to begin your voice brainstorm</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Controls */}
      <div className="p-6 border-t bg-card">
        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <Button
              size="lg"
              onClick={startRecording}
              className="h-14 px-8 text-lg"
            >
              <Mic className="w-6 h-6 mr-2" />
              Start Session
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              onClick={stopRecording}
              className="h-14 px-8 text-lg"
            >
              <MicOff className="w-6 h-6 mr-2" />
              End Session
            </Button>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {isRecording 
            ? "Speak naturally. The AI will respond by voice. Press 'End Session' when done."
            : "Have a voice conversation with AI. Summary will be emailed automatically."}
        </p>
      </div>
    </div>
  );
};