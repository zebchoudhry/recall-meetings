import { useState, useRef, useEffect } from "react";
import { User, UserPlus, Mic, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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

interface VoiceEnrollmentProps {
  onProfilesUpdate: (profiles: VoiceProfile[]) => void;
  enrolledProfiles: VoiceProfile[];
}

export const VoiceEnrollment = ({ onProfilesUpdate, enrolledProfiles }: VoiceEnrollmentProps) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [isRecordingEnrollment, setIsRecordingEnrollment] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved profiles from localStorage
    const saved = localStorage.getItem('voiceProfiles');
    if (saved) {
      const profiles = JSON.parse(saved);
      onProfilesUpdate(profiles);
    }
  }, [onProfilesUpdate]);

  const analyzeVoicePattern = (audioBuffer: AudioBuffer): VoiceProfile['voicePattern'] => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Simple pitch detection using autocorrelation
    const pitches: number[] = [];
    const frameSize = 1024;
    
    for (let i = 0; i < channelData.length - frameSize; i += frameSize / 2) {
      const frame = channelData.slice(i, i + frameSize);
      const pitch = detectPitch(frame, sampleRate);
      if (pitch > 50 && pitch < 400) { // Human voice range
        pitches.push(pitch);
      }
    }
    
    const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length || 0;
    const pitchRange = Math.max(...pitches) - Math.min(...pitches) || 0;
    
    // Frequency analysis
    const fftSize = 2048;
    const frequencies = performFFT(channelData.slice(0, fftSize));
    const avgFrequency = calculateAverageFrequency(frequencies);
    const spectralCentroid = calculateSpectralCentroid(frequencies);
    
    return {
      avgPitch: Math.round(avgPitch),
      pitchRange: Math.round(pitchRange),
      avgFrequency: Math.round(avgFrequency),
      spectralCentroid: Math.round(spectralCentroid)
    };
  };

  const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
    // Simple autocorrelation-based pitch detection
    const correlations: number[] = [];
    const minPeriod = Math.floor(sampleRate / 400); // 400 Hz max
    const maxPeriod = Math.floor(sampleRate / 50);  // 50 Hz min
    
    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period];
      }
      correlations.push(correlation);
    }
    
    const maxCorrelationIndex = correlations.indexOf(Math.max(...correlations));
    return sampleRate / (minPeriod + maxCorrelationIndex);
  };

  const performFFT = (buffer: Float32Array): Float32Array => {
    // Simplified FFT using browser's built-in analysis
    // In a real implementation, you'd use a proper FFT library
    const result = new Float32Array(buffer.length / 2);
    for (let i = 0; i < result.length; i++) {
      result[i] = Math.abs(buffer[i * 2]) + Math.abs(buffer[i * 2 + 1] || 0);
    }
    return result;
  };

  const calculateAverageFrequency = (frequencies: Float32Array): number => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < frequencies.length; i++) {
      sum += frequencies[i] * i;
      count += frequencies[i];
    }
    return count > 0 ? sum / count : 0;
  };

  const calculateSpectralCentroid = (frequencies: Float32Array): number => {
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < frequencies.length; i++) {
      numerator += i * frequencies[i];
      denominator += frequencies[i];
    }
    return denominator > 0 ? numerator / denominator : 0;
  };

  const startEnrollment = async () => {
    if (!newSpeakerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the speaker",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
        
        const voicePattern = analyzeVoicePattern(audioBuffer);
        const newProfile: VoiceProfile = {
          id: Date.now().toString(),
          name: newSpeakerName.trim(),
          voicePattern
        };
        
        const updatedProfiles = [...enrolledProfiles, newProfile];
        localStorage.setItem('voiceProfiles', JSON.stringify(updatedProfiles));
        onProfilesUpdate(updatedProfiles);
        
        setNewSpeakerName("");
        setShowEnrollment(false);
        
        toast({
          title: "Voice Enrolled",
          description: `${newProfile.name}'s voice pattern has been saved`,
        });
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecordingEnrollment(true);
      
      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecordingEnrollment(false);
        }
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not access microphone for enrollment",
        variant: "destructive",
      });
    }
  };

  const stopEnrollment = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecordingEnrollment(false);
    }
  };

  const removeProfile = (profileId: string) => {
    const updatedProfiles = enrolledProfiles.filter(p => p.id !== profileId);
    localStorage.setItem('voiceProfiles', JSON.stringify(updatedProfiles));
    onProfilesUpdate(updatedProfiles);
    
    toast({
      title: "Profile Removed",
      description: "Voice profile has been deleted",
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Speaker Profiles</h3>
        <Button
          onClick={() => setShowEnrollment(!showEnrollment)}
          size="sm"
          variant="outline"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Speaker
        </Button>
      </div>

      {/* Enrolled Speakers List */}
      <div className="space-y-2">
        {enrolledProfiles.map((profile) => (
          <div key={profile.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{profile.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {profile.voicePattern.avgPitch}Hz
              </span>
              <Button
                onClick={() => removeProfile(profile.id)}
                size="sm"
                variant="ghost"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {enrolledProfiles.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No speakers enrolled yet
          </p>
        )}
      </div>

      {/* Enrollment Form */}
      {showEnrollment && (
        <div className="space-y-3 border-t pt-3">
          <Input
            placeholder="Enter speaker name"
            value={newSpeakerName}
            onChange={(e) => setNewSpeakerName(e.target.value)}
            disabled={isRecordingEnrollment}
          />
          
          {!isRecordingEnrollment ? (
            <Button
              onClick={startEnrollment}
              className="w-full"
              disabled={!newSpeakerName.trim()}
            >
              <Mic className="w-4 h-4 mr-2" />
              Record Voice Sample (3s)
            </Button>
          ) : (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Mic className="w-4 h-4 text-recording-pulse animate-recording-pulse" />
                <span className="text-sm font-medium text-recording-pulse">
                  Recording voice sample...
                </span>
              </div>
              <Button
                onClick={stopEnrollment}
                size="sm"
                variant="outline"
              >
                <Check className="w-4 h-4 mr-2" />
                Stop Early
              </Button>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Say something clearly for 3 seconds to create a voice profile
          </p>
        </div>
      )}
    </Card>
  );
};