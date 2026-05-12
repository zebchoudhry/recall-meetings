import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Loader2 } from "lucide-react";
import { getLanguageByCode } from "@/lib/languages";

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
  sourceLang?: string;
  translations?: Record<string, string>;
  translating?: boolean;
}

interface TranscriptDisplayProps {
  transcript: TranscriptEntry[];
  isRecording: boolean;
  displayLang?: string;
  showOriginal?: boolean;
}

const getSpeakerColor = (speaker: string): string => {
  const colors = {
    "Speaker 1": "text-speaker-1",
    "Speaker 2": "text-speaker-2", 
    "Speaker 3": "text-speaker-3",
  };
  return colors[speaker as keyof typeof colors] || "text-speaker-unknown";
};

const getSpeakerBadgeColor = (speaker: string): string => {
  const colors = {
    "Speaker 1": "bg-speaker-1/10 border-speaker-1/20",
    "Speaker 2": "bg-speaker-2/10 border-speaker-2/20",
    "Speaker 3": "bg-speaker-3/10 border-speaker-3/20",
  };
  return colors[speaker as keyof typeof colors] || "bg-speaker-unknown/10 border-speaker-unknown/20";
};

export const TranscriptDisplay = ({
  transcript,
  isRecording,
  displayLang = "en",
  showOriginal = true,
}: TranscriptDisplayProps) => {
  return (
    <Card className="h-[600px] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-section-title text-foreground">Live Transcript</h2>
        {isRecording && (
          <div className="flex items-center space-x-2 text-recording-pulse">
            <Mic className="w-4 h-4 animate-recording-pulse" />
            <span className="text-caption font-medium">Recording</span>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-2">
              <Mic className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-body text-muted-foreground">
                {isRecording 
                  ? "Listening for speech..." 
                  : "Click the record button to start transcribing"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 content-spacing-sm">
            {transcript.map((entry) => {
              const sourceLang = entry.sourceLang ?? "en";
              const translated = entry.translations?.[displayLang];
              const isSameLang = sourceLang === displayLang;
              const primaryText = isSameLang ? entry.text : (translated ?? entry.text);
              const sourceLangInfo = getLanguageByCode(sourceLang);
              const showOriginalLine =
                showOriginal && !isSameLang && translated !== undefined;
              return (
              <div 
                key={entry.id}
                id={`transcript-entry-${entry.id}`}
                className="animate-fade-in group hover:bg-accent/50 rounded-lg p-3 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className={`px-2 py-1 rounded-md text-caption font-medium border ${getSpeakerBadgeColor(entry.speaker)}`}>
                    <span className={getSpeakerColor(entry.speaker)}>
                      {entry.speaker}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {sourceLangInfo && (
                        <span
                          className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5"
                          title={sourceLangInfo.label}
                        >
                          {sourceLang.toUpperCase()}
                        </span>
                      )}
                      <p className="transcript-text text-foreground flex-1">
                        {primaryText}
                        {entry.translating && !isSameLang && !translated && (
                          <Loader2 className="inline-block w-3 h-3 ml-2 animate-spin text-muted-foreground" />
                        )}
                      </p>
                    </div>
                    {showOriginalLine && (
                      <p className="text-xs text-muted-foreground italic mt-1 pl-8">
                        {entry.text}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-caption">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-caption">
                        {Math.round(entry.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};