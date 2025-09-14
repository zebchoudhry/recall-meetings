import { Card } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";

interface SummaryPanelProps {
  summary: string;
  isGenerating: boolean;
}

export const SummaryPanel = ({ summary, isGenerating }: SummaryPanelProps) => {
  if (isGenerating) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">AI Summary</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Analyzing conversation...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">AI Summary</h3>
      </div>
      <div className="prose prose-sm max-w-none">
        <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
          {summary}
        </div>
      </div>
    </Card>
  );
};