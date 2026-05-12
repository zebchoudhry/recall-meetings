import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PrivacySettings } from "@/components/PrivacySettings";
import { PrivacyModeIndicator } from "@/components/PrivacyModeIndicator";
import { FeedbackButton } from "@/components/FeedbackButton";
import { useI18n } from "@/lib/i18n/I18nProvider";

export const AppHeader = () => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="w-full bg-background border-b border-border/50 px-6 py-3 md:px-8">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 transition-all duration-200 hover:opacity-80 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-1 py-1"
          aria-label={t("header.goDashboard")}
        >
          <Brain className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary tracking-tight">
            Recall
          </span>
        </button>

        {/* Privacy Settings */}
        <div className="flex items-center gap-3">
          <PrivacyModeIndicator />
          
          <FeedbackButton />
          
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="h-4 w-4" />
                {t("header.settings")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("header.privacyTitle")}
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