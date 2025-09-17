import { useState } from "react";
import { Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SpeakerSettingsProps {
  expectedSpeakers: number;
  onSpeakerCountChange: (count: number) => void;
  onReset: () => void;
}

export const SpeakerSettings = ({ 
  expectedSpeakers, 
  onSpeakerCountChange, 
  onReset 
}: SpeakerSettingsProps) => {
  const [inputValue, setInputValue] = useState(expectedSpeakers.toString());

  const handleCountChange = (value: string) => {
    setInputValue(value);
    const count = parseInt(value) || 2;
    if (count >= 1 && count <= 10) {
      onSpeakerCountChange(count);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Settings className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Meeting Settings</h3>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="speaker-count" className="text-sm">
            How many people are speaking?
          </Label>
          <Input
            id="speaker-count"
            type="number"
            min="1"
            max="10"
            value={inputValue}
            onChange={(e) => handleCountChange(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            The system will automatically group voices into Speaker 1, Speaker 2, etc.
          </p>
        </div>

        <div className="flex items-center justify-between p-2 bg-accent/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Expected Speakers:</span>
          </div>
          <span className="text-sm font-bold text-primary">{expectedSpeakers}</span>
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Reset Speaker Detection
        </Button>
      </div>
    </Card>
  );
};