import { useState } from "react";
import { X, Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Highlight } from "./HighlightsSidebar";

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

interface ReplayModalProps {
  highlight: Highlight | null;
  transcript: TranscriptEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export function ReplayModal({ highlight, transcript, isOpen, onClose }: ReplayModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  if (!isOpen || !highlight) return null;

  // Get 30 seconds of context around the highlight
  const getContextEntries = () => {
    const highlightIndex = transcript.findIndex(entry => entry.id === highlight.transcriptEntryId);
    if (highlightIndex === -1) return [];

    // Get entries from 30 seconds before to 30 seconds after
    const thirtySecondsMs = 30 * 1000;
    const highlightTime = highlight.timestamp.getTime();
    
    return transcript.filter(entry => {
      const entryTime = entry.timestamp.getTime();
      return Math.abs(entryTime - highlightTime) <= thirtySecondsMs;
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const contextEntries = getContextEntries();
  const totalDuration = 30; // 30 second window

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Simulate audio playback
      const interval = setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
  };

  const handleRestart = () => {
    setPlaybackTime(0);
    setIsPlaying(false);
  };

  const getHighlightTypeColor = (type: Highlight['type']) => {
    switch (type) {
      case 'decision':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'agreement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'action':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'question':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Badge className={getHighlightTypeColor(highlight.type)}>
              {highlight.type.charAt(0).toUpperCase() + highlight.type.slice(1)}
            </Badge>
            <h2 className="text-lg font-semibold">30-Second Replay</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Audio Controls */}
        <div className="p-6 border-b bg-secondary/50">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={handlePlayPause}
              variant={isPlaying ? "secondary" : "default"}
              size="lg"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 mr-2" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              {isPlaying ? "Pause" : "Play Context"}
            </Button>
            
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {Math.floor(playbackTime)}s / {totalDuration}s
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-100"
              style={{ width: `${(playbackTime / totalDuration) * 100}%` }}
            />
          </div>

          {/* Audio recording note */}
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Audio replay requires recording capabilities. 
              Currently showing transcript context from ±30 seconds around this moment.
            </p>
          </div>
        </div>

        {/* Transcript Context */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold">Conversation Context</h3>
              <Badge variant="outline">{contextEntries.length} entries</Badge>
            </div>

            {contextEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No context entries found around this moment.
              </p>
            ) : (
              contextEntries.map((entry) => {
                const isHighlightEntry = entry.id === highlight.transcriptEntryId;
                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isHighlightEntry
                        ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20'
                        : 'bg-background border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`px-2 py-1 rounded-md text-xs font-medium border ${
                          isHighlightEntry 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-secondary text-secondary-foreground border-border'
                        }`}>
                          {entry.speaker}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {entry.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`leading-relaxed ${
                          isHighlightEntry ? 'font-medium text-foreground' : 'text-foreground'
                        }`}>
                          {entry.text}
                        </p>
                        
                        {isHighlightEntry && (
                          <div className="mt-2 pt-2 border-t border-primary/20">
                            <Badge className={getHighlightTypeColor(highlight.type)}>
                              🎯 Highlighted as {highlight.type}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {Math.round(entry.confidence * 100)}% confidence
                          </span>
                          {isHighlightEntry && (
                            <span className="text-xs text-primary font-medium">
                              ← This moment was highlighted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-secondary/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing conversation context from {highlight.timestamp.toLocaleString()}
            </p>
            <Button onClick={onClose} variant="outline">
              Close Replay
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}