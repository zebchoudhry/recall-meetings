import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const PrivacyBanner = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="container flex items-center justify-center py-2 px-4">
        <Dialog>
          <DialogTrigger asChild>
            <button className="transition-transform hover:scale-105">
              <Badge 
                variant="default"
                className="gap-1.5 px-3 py-1.5 bg-success/20 text-success border-success/30 hover:bg-success/30 cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5 fill-success" />
                <span className="font-bold">No Data Stored • Privacy Guaranteed</span>
              </Badge>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                Your Privacy is Guaranteed
              </DialogTitle>
              <DialogDescription className="text-left space-y-4 pt-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Privacy Mode (Default)</h3>
                  <p>
                    By default, Recall operates in Privacy Mode. This means:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                    <li>Transcripts exist only in your browser's memory during the session</li>
                    <li>Nothing is saved to disk or sent to any server</li>
                    <li>When you close the tab, all data is permanently gone</li>
                    <li>Zero-trace policy - no cookies, no analytics, no tracking</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Enhanced Mode (Optional)</h3>
                  <p>
                    You can optionally enable Enhanced Mode in settings to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                    <li>Save meetings locally on your device using encrypted IndexedDB</li>
                    <li>Access AI-powered features like summaries and action items</li>
                    <li>Search through past meeting transcripts</li>
                    <li>All data stays on your device - never uploaded to any server</li>
                  </ul>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium text-foreground">
                    Unlike other tools (Otter.ai, Fireflies, etc.), Recall gives you complete control. 
                    Your conversations are yours alone.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
