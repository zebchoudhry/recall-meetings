import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BrainstormSession } from "./BrainstormSession";
import { BrainstormArchive } from "./BrainstormArchive";
import { Brain, Lightbulb, Mail, Shield, Clock, Archive } from "lucide-react";

interface BrainstormLauncherProps {
  onClose: () => void;
}

export const BrainstormLauncher = ({ onClose }: BrainstormLauncherProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const startSession = () => {
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address to receive your summary.",
        variant: "destructive",
      });
      return;
    }
    setIsSessionActive(true);
  };

  const handleSessionEnd = () => {
    setIsSessionActive(false);
  };

  if (isSessionActive) {
    return <BrainstormSession onSessionEnd={handleSessionEnd} userEmail={email} />;
  }

  if (showArchive) {
    return <BrainstormArchive userEmail={email} onBack={() => setShowArchive(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Voice Brainstorm</h2>
          <p className="text-muted-foreground mt-2">
            Capture your ideas hands-free. AI distills them into actionable insights.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Live AI Tagging</p>
              <p className="text-xs text-muted-foreground">Ideas detected in real-time</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Mail className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Auto Email</p>
              <p className="text-xs text-muted-foreground">Summary sent instantly</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Privacy First</p>
              <p className="text-xs text-muted-foreground">Audio deleted after</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Clock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">No Time Limit</p>
              <p className="text-xs text-muted-foreground">Brainstorm as long as needed</p>
            </div>
          </div>
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email">Your Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Your brainstorm summary will be sent here automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={startSession}
            size="lg"
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
          >
            <Brain className="w-6 h-6 mr-2" />
            Start Brainstorm Session
          </Button>

          <div className="flex gap-2">
            {email && validateEmail(email) && (
              <Button
                variant="outline"
                onClick={() => setShowArchive(true)}
                className="flex-1"
              >
                <Archive className="w-4 h-4 mr-2" />
                View Archive
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onClose}
              className={email && validateEmail(email) ? "flex-1" : "w-full"}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
