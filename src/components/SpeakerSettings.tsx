import { useState } from "react";
import { Users, Settings, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SpeakerCluster {
  id: string;
  name: string;
  patterns: any[];
  centroid: any;
}

interface SpeakerSettingsProps {
  expectedSpeakers: number;
  onSpeakerCountChange: (count: number) => void;
  onReset: () => void;
  detectedSpeakers: SpeakerCluster[];
  onSpeakerNameChange: (speakerId: string, newName: string) => void;
  userName: string;
  onUserNameChange: (name: string) => void;
}

export const SpeakerSettings = ({ 
  expectedSpeakers, 
  onSpeakerCountChange, 
  onReset,
  detectedSpeakers,
  onSpeakerNameChange,
  userName,
  onUserNameChange
}: SpeakerSettingsProps) => {
  const [inputValue, setInputValue] = useState(expectedSpeakers.toString());
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCountChange = (value: string) => {
    setInputValue(value);
    const count = parseInt(value) || 2;
    if (count >= 1 && count <= 10) {
      onSpeakerCountChange(count);
    }
  };

  const startEditing = (speaker: SpeakerCluster) => {
    setEditingSpeaker(speaker.id);
    setEditName(speaker.name);
  };

  const saveEdit = () => {
    if (editingSpeaker && editName.trim()) {
      onSpeakerNameChange(editingSpeaker, editName.trim());
    }
    setEditingSpeaker(null);
    setEditName("");
  };

  const cancelEdit = () => {
    setEditingSpeaker(null);
    setEditName("");
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Settings className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Meeting Settings</h3>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="user-name" className="text-sm font-medium">
            Your Name
          </Label>
          <Input
            id="user-name"
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => onUserNameChange(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Set your name to get highlighted when mentioned in the meeting
          </p>
        </div>

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
            The system will automatically detect and group voices
          </p>
        </div>

        <div className="flex items-center justify-between p-2 bg-accent/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Expected:</span>
          </div>
          <span className="text-sm font-bold text-primary">{expectedSpeakers}</span>
        </div>

        {/* Detected Speakers */}
        {detectedSpeakers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Detected Speakers:</Label>
            {detectedSpeakers.map((speaker) => (
              <div key={speaker.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                {editingSpeaker === speaker.id ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8"
                      placeholder="Enter speaker name"
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    />
                    <Button size="sm" variant="ghost" onClick={saveEdit}>
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Users className="w-3 h-3 text-primary" />
                      <span className="text-sm font-medium">{speaker.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(speaker)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

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