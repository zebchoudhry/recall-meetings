import { useState, useEffect } from "react";
import { Shield, ShieldOff, Trash2, Database, Info, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { storageManager, StorageSettings } from "@/utils/storageManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PrivacySettingsProps {
  onModeChange?: (enabled: boolean) => void;
}

export const PrivacySettings = ({ onModeChange }: PrivacySettingsProps) => {
  const [settings, setSettings] = useState<StorageSettings>({
    enabled: false,
    maxStorageDays: 30,
    autoDelete: true,
  });
  const [stats, setStats] = useState({
    totalMeetings: 0,
    totalSize: 0,
    oldestMeeting: null as Date | null,
    newestMeeting: null as Date | null,
  });
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    const currentSettings = await storageManager.getSettings();
    setSettings(currentSettings);
  };

  const loadStats = async () => {
    const currentStats = await storageManager.getStorageStats();
    setStats(currentStats);
  };

  const handleModeChange = async (mode: 'privacy' | 'enhanced') => {
    const enabled = mode === 'enhanced';
    
    if (!enabled && stats.totalMeetings > 0) {
      // Switching to privacy mode with existing data
      setShowClearDialog(true);
      return;
    }

    await updateMode(enabled);
  };

  const updateMode = async (enabled: boolean) => {
    try {
      await storageManager.updateSettings({ enabled });
      setSettings(prev => ({ ...prev, enabled }));
      onModeChange?.(enabled);

      toast({
        title: enabled ? "Enhanced Mode Activated" : "Privacy Mode Activated",
        description: enabled 
          ? "Meeting history will now be saved locally on your device"
          : "Meeting data will only exist during your session",
      });

      await loadStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive",
      });
    }
  };

  const handleClearData = async () => {
    try {
      await storageManager.clearAllData();
      await updateMode(false);
      setShowClearDialog(false);
      
      toast({
        title: "Data Cleared",
        description: "All stored meeting data has been deleted",
      });

      await loadStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data",
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Mode
          </CardTitle>
          <CardDescription>
            Choose how Recall handles your meeting data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={settings.enabled ? 'enhanced' : 'privacy'}
            onValueChange={(value) => handleModeChange(value as 'privacy' | 'enhanced')}
          >
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="privacy" id="privacy" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="privacy" className="flex items-center gap-2 font-semibold cursor-pointer">
                  <Lock className="h-4 w-4 text-primary" />
                  Privacy Mode (Default)
                </Label>
                <p className="text-sm text-muted-foreground">
                  No data storage. Transcripts exist only during your session and disappear when you close the tab.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Shield className="h-3 w-3" />
                    Maximum Privacy
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                    No History
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                    No Search
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="enhanced" id="enhanced" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="enhanced" className="flex items-center gap-2 font-semibold cursor-pointer">
                  <Unlock className="h-4 w-4 text-accent" />
                  Enhanced Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Store meetings locally on your device. Search past transcripts, review action items, and use AI chat. Data never leaves your device.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                    <Database className="h-3 w-3" />
                    Local Storage Only
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs">
                    Searchable History
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs">
                    AI Chat
                  </span>
                </div>
              </div>
            </div>
          </RadioGroup>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {settings.enabled ? (
                <>
                  <strong>Your data stays on your device:</strong> Meetings are stored in your browser's local database (IndexedDB). Nothing is uploaded to any server.
                </>
              ) : (
                <>
                  <strong>Zero trace policy:</strong> No data is saved anywhere. Perfect for sensitive discussions and maximum privacy.
                </>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {settings.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Meetings</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalMeetings}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold text-foreground">{formatBytes(stats.totalSize)}</p>
              </div>
            </div>

            {stats.totalMeetings > 0 && (
              <div className="pt-4 border-t border-border">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowClearDialog(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Meeting Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Meeting Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {stats.totalMeetings} stored meetings from your device. This action cannot be undone.
              {!settings.enabled && " You'll also be switched to Privacy Mode."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
