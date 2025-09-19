import { Mic, MicOff, RotateCcw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RecordingControlsProps {
  isRecording: boolean;
  isListening: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClear: () => void;
  transcriptLength: number;
}

export const RecordingControls = ({
  isRecording,
  isListening,
  onStartRecording,
  onStopRecording,
  onClear,
  transcriptLength,
}: RecordingControlsProps) => {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-sm text-foreground">Recording Controls</h3>
      
      {/* Main Record Button */}
      <div className="text-center">
        {!isRecording ? (
          <Button
            onClick={() => {
              console.log('Record button clicked');
              onStartRecording();
            }}
            size="lg"
            className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-semibold"
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Transcription
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            size="lg"
            variant="destructive"
            className="w-full h-12 animate-recording-pulse"
          >
            <MicOff className="w-5 h-5 mr-2" />
            Stop Transcription
          </Button>
        )}
      </div>

      {/* Status Indicators */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status:</span>
          <div className="flex items-center space-x-2">
            {isListening ? (
              <>
                <Activity className="w-4 h-4 text-success animate-pulse" />
                <span className="text-success font-medium">Listening</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-muted" />
                <span className="text-muted-foreground">Idle</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Entries:</span>
          <span className="font-medium text-foreground">{transcriptLength}</span>
        </div>
      </div>

      {/* Clear Button */}
      <Button
        onClick={onClear}
        variant="outline"
        size="sm"
        className="w-full"
        disabled={transcriptLength === 0}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Clear Transcript
      </Button>
    </Card>
  );
};