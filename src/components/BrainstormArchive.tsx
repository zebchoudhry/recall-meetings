import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Download, 
  Search,
  Loader2,
  ArrowLeft,
  Lightbulb,
  CheckCircle,
  Target,
  Star
} from "lucide-react";
import { format } from "date-fns";

interface BrainstormSessionData {
  id: string;
  user_email: string | null;
  transcript: string;
  summary: string | null;
  key_ideas: string[];
  actions: string[];
  decisions: string[];
  final_idea: string | null;
  duration_seconds: number;
  created_at: string;
}

interface BrainstormArchiveProps {
  userEmail: string;
  onBack: () => void;
}

export const BrainstormArchive = ({ userEmail, onBack }: BrainstormArchiveProps) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<BrainstormSessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<BrainstormSessionData | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [userEmail]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("brainstorm_sessions")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to ensure arrays are properly typed
      const transformedData: BrainstormSessionData[] = (data || []).map(session => ({
        ...session,
        key_ideas: Array.isArray(session.key_ideas) ? (session.key_ideas as string[]) : [],
        actions: Array.isArray(session.actions) ? (session.actions as string[]) : [],
        decisions: Array.isArray(session.decisions) ? (session.decisions as string[]) : [],
      }));

      setSessions(transformedData);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load brainstorm sessions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTranscript = (session: BrainstormSessionData) => {
    const content = `
BRAINSTORM SESSION
==================
Date: ${format(new Date(session.created_at), "PPpp")}
Duration: ${formatDuration(session.duration_seconds)}

FINAL BEST IDEA
---------------
${session.final_idea || "N/A"}

EXECUTIVE SUMMARY
-----------------
${session.summary || "N/A"}

KEY IDEAS
---------
${session.key_ideas.map((idea, i) => `${i + 1}. ${idea}`).join("\n") || "None"}

ACTION ITEMS
------------
${session.actions.map((action, i) => `${i + 1}. ${action}`).join("\n") || "None"}

DECISIONS
---------
${session.decisions.map((decision, i) => `${i + 1}. ${decision}`).join("\n") || "None"}

FULL TRANSCRIPT
---------------
${session.transcript}
`.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brainstorm-${format(new Date(session.created_at), "yyyy-MM-dd-HHmm")}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Transcript saved to your device.",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const filteredSessions = sessions.filter(session =>
    session.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.final_idea?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedSession) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold">Brainstorm Session</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(selectedSession.created_at), "PPpp")} • {formatDuration(selectedSession.duration_seconds)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadTranscript(selectedSession)}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Final Idea */}
            {selectedSession.final_idea && (
              <Card className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">Final Best Idea</h3>
                </div>
                <p className="text-lg font-medium">{selectedSession.final_idea}</p>
              </Card>
            )}

            {/* Summary */}
            {selectedSession.summary && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Executive Summary</h3>
                <p className="text-muted-foreground">{selectedSession.summary}</p>
              </Card>
            )}

            {/* Key Ideas */}
            {selectedSession.key_ideas.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold">Key Ideas</h3>
                </div>
                <ul className="space-y-2">
                  {selectedSession.key_ideas.map((idea, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Actions */}
            {selectedSession.actions.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold">Action Items</h3>
                </div>
                <ul className="space-y-2">
                  {selectedSession.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Decisions */}
            {selectedSession.decisions.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold">Decisions Made</h3>
                </div>
                <ul className="space-y-2">
                  {selectedSession.decisions.map((decision, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Full Transcript */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Full Transcript</h3>
              <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm">{selectedSession.transcript}</p>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Brainstorm Archive
          </h2>
          <p className="text-sm text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? "No sessions match your search."
                : "Start a brainstorm session to see it here."}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(session.created_at), "PPp")}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(session.duration_seconds)}</span>
                    </div>
                    
                    {session.final_idea && (
                      <p className="font-medium text-primary line-clamp-1 mb-1">
                        💡 {session.final_idea}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {session.summary || session.transcript.substring(0, 150) + "..."}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {session.key_ideas.length > 0 && (
                        <span>{session.key_ideas.length} ideas</span>
                      )}
                      {session.actions.length > 0 && (
                        <span>{session.actions.length} actions</span>
                      )}
                      {session.decisions.length > 0 && (
                        <span>{session.decisions.length} decisions</span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
