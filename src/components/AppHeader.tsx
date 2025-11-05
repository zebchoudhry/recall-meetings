import { useState } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PrivacySettings } from "@/components/PrivacySettings";
import { PrivacyModeIndicator } from "@/components/PrivacyModeIndicator";
import { FeedbackButton } from "@/components/FeedbackButton";
import recallLogo from "@/assets/recall-logo-new.svg";

export const AppHeader = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="w-full bg-background border-b border-border/50 px-6 py-4 md:px-8 relative">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={recallLogo}
            alt="Recall"
            className="h-16 w-auto object-contain"
          />
        </div>
        
        <button
          onClick={handleLogoClick}
          className="flex-shrink-0 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg opacity-0"
          aria-label="Go to dashboard"
        >
          <img
            src={recallLogo}
            alt="Recall"
            className="h-12 w-auto object-contain"
          />
        </button>

        {/* Privacy Settings */}
        <div className="flex items-center gap-3">
          <PrivacyModeIndicator />
          
          <FeedbackButton />
          
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Storage Settings
                </DialogTitle>
              </DialogHeader>
              <PrivacySettings onModeChange={() => {}} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
};