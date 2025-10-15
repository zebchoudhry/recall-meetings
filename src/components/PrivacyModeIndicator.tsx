import { useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { storageManager } from "@/utils/storageManager";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const PrivacyModeIndicator = () => {
  const [isEnhanced, setIsEnhanced] = useState(false);

  useEffect(() => {
    const checkMode = async () => {
      const settings = await storageManager.getSettings();
      setIsEnhanced(settings.enabled);
    };
    checkMode();

    // Check every 2 seconds for mode changes
    const interval = setInterval(checkMode, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant={isEnhanced ? "default" : "outline"}
          className={`gap-1.5 cursor-help ${
            isEnhanced 
              ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20' 
              : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
          }`}
        >
          {isEnhanced ? (
            <>
              <Unlock className="h-3 w-3" />
              Enhanced Mode
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              Privacy Mode
            </>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {isEnhanced ? (
          <p className="text-sm">
            <strong>Enhanced Mode Active:</strong> Meetings are saved locally on your device. Search and AI features available.
          </p>
        ) : (
          <p className="text-sm">
            <strong>Privacy Mode Active:</strong> No data saved. Transcript exists only during this session.
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
