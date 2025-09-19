import { useState } from "react";
import { FileText, Download, Mail, Users, CheckCircle, HelpCircle, Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Highlight } from "./HighlightsSidebar";
import { ActionItem } from "./HighlightsSidebar";
import { PersonalActionItem } from "./PersonalDashboard";

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

interface MeetingSummaryProps {
  transcript: TranscriptEntry[];
  highlights: Highlight[];
  actionItems: ActionItem[];
  personalActionItems: PersonalActionItem[];
  meetingDuration: number;
  isVisible: boolean;
  onClose: () => void;
  onExport: (summary: string) => void;
  onEmail: (summary: string) => void;
}

export function MeetingSummary({
  transcript,
  highlights,
  actionItems,
  personalActionItems,
  meetingDuration,
  isVisible,
  onClose,
  onExport,
  onEmail
}: MeetingSummaryProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!isVisible) return null;

  // Extract key decisions from highlights
  const decisions = highlights.filter(h => h.type === 'decision');
  const agreements = highlights.filter(h => h.type === 'agreement');
  const keyDecisions = [...decisions, ...agreements];

  // Extract questions from highlights and transcript
  const questionHighlights = highlights.filter(h => h.type === 'question');
  const transcriptQuestions = transcript.filter(entry => 
    entry.text.includes('?') || 
    entry.text.toLowerCase().match(/\b(what|how|when|where|why|who)\b.*\?/) ||
    entry.text.toLowerCase().includes('question') ||
    entry.text.toLowerCase().includes('unclear')
  );

  // Get unique speakers
  const speakers = [...new Set(transcript.map(entry => entry.speaker))];
  
  // Group action items by person
  const groupedActionItems = [...actionItems, ...personalActionItems].reduce((acc, item) => {
    const person = item.responsiblePerson || 'Unassigned';
    if (!acc[person]) acc[person] = [];
    acc[person].push(item);
    return acc;
  }, {} as Record<string, (ActionItem | PersonalActionItem)[]>);

  // Meeting stats
  const totalEntries = transcript.length;
  const avgWordsPerEntry = transcript.reduce((sum, entry) => sum + entry.text.split(' ').length, 0) / totalEntries || 0;
  const meetingStart = transcript[0]?.timestamp;
  const meetingEnd = transcript[transcript.length - 1]?.timestamp;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const generateSummaryText = () => {
    const date = new Date().toLocaleDateString();
    const time = meetingStart?.toLocaleTimeString() || 'Unknown';
    
    let summary = `# MEETING SUMMARY\n`;
    summary += `**Date:** ${date}\n`;
    summary += `**Time:** ${time}\n`;
    summary += `**Duration:** ${formatDuration(meetingDuration)}\n`;
    summary += `**Participants:** ${speakers.join(', ')}\n`;
    summary += `**Total Exchanges:** ${totalEntries}\n\n`;

    // Key Decisions
    summary += `## 🎯 KEY DECISIONS MADE\n`;
    if (keyDecisions.length > 0) {
      keyDecisions.forEach((decision, index) => {
        summary += `${index + 1}. **${decision.speaker}:** ${decision.text}\n`;
        summary += `   *Time: ${decision.timestamp.toLocaleTimeString()}*\n\n`;
      });
    } else {
      summary += `• No formal decisions were recorded during this meeting\n\n`;
    }

    // Action Items by Person
    summary += `## 📋 ACTION ITEMS BY PERSON\n`;
    if (Object.keys(groupedActionItems).length > 0) {
      Object.entries(groupedActionItems).forEach(([person, items]) => {
        summary += `### ${person}\n`;
        items.forEach((item, index) => {
          const dueDate = 'dueDate' in item && item.dueDate ? ` (Due: ${item.dueDate})` : '';
          const priority = 'priority' in item && item.priority ? ` [${item.priority.toUpperCase()}]` : '';
          summary += `${index + 1}. ${item.taskDescription}${dueDate}${priority}\n`;
        });
        summary += `\n`;
      });
    } else {
      summary += `• No action items were assigned during this meeting\n\n`;
    }

    // Open Questions
    summary += `## ❓ OPEN QUESTIONS & UNRESOLVED ITEMS\n`;
    const openQuestions = [...questionHighlights, ...transcriptQuestions.slice(0, 5)];
    if (openQuestions.length > 0) {
      const uniqueQuestions = openQuestions.filter((question, index, self) => 
        index === self.findIndex(q => q.text === question.text)
      );
      uniqueQuestions.forEach((question, index) => {
        summary += `${index + 1}. **${question.speaker}:** ${question.text}\n`;
        summary += `   *Time: ${question.timestamp.toLocaleTimeString()}*\n\n`;
      });
    } else {
      summary += `• No unresolved questions were identified\n\n`;
    }

    // Meeting Statistics
    summary += `## 📊 MEETING STATISTICS\n`;
    summary += `• **Total speaking time:** ${formatDuration(meetingDuration)}\n`;
    summary += `• **Number of speakers:** ${speakers.length}\n`;
    summary += `• **Total interactions:** ${totalEntries}\n`;
    summary += `• **Average words per comment:** ${Math.round(avgWordsPerEntry)}\n`;
    summary += `• **Key highlights detected:** ${highlights.length}\n`;
    summary += `• **Action items assigned:** ${Object.values(groupedActionItems).flat().length}\n\n`;

    summary += `---\n`;
    summary += `*Summary generated automatically on ${new Date().toLocaleString()}*\n`;
    summary += `*This summary captures the main points for quick reference*`;

    return summary;
  };

  const handleExport = async () => {
    setIsExporting(true);
    const summaryText = generateSummaryText();
    await onExport(summaryText);
    setIsExporting(false);
  };

  const handleEmail = async () => {
    setIsExporting(true);
    const summaryText = generateSummaryText();
    await onEmail(summaryText);
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Meeting Summary</h2>
              <p className="text-sm text-muted-foreground">
                Your complete meeting recap • {formatDuration(meetingDuration)} • {totalEntries} exchanges
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExport} disabled={isExporting} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={handleEmail} disabled={isExporting} variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Email Summary
            </Button>
            <Button onClick={onClose} variant="ghost">Close</Button>
          </div>
        </div>

        {/* Summary Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Meeting Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-700">{speakers.length}</div>
              <div className="text-sm text-muted-foreground">Participants</div>
            </Card>
            <Card className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-700">{keyDecisions.length}</div>
              <div className="text-sm text-muted-foreground">Decisions</div>
            </Card>
            <Card className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-700">
                {Object.values(groupedActionItems).flat().length}
              </div>
              <div className="text-sm text-muted-foreground">Action Items</div>
            </Card>
            <Card className="p-4 text-center">
              <HelpCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-700">
                {questionHighlights.length + Math.min(transcriptQuestions.length, 5)}
              </div>
              <div className="text-sm text-muted-foreground">Open Questions</div>
            </Card>
          </div>

          {/* Key Decisions */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Key Decisions Made
            </h3>
            {keyDecisions.length > 0 ? (
              <div className="space-y-3">
                {keyDecisions.map((decision, index) => (
                  <Card key={decision.id} className="p-4 bg-green-50 border-green-200">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-green-100 text-green-800">{index + 1}</Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 mb-1">{decision.speaker}</p>
                        <p className="text-green-800 leading-relaxed">{decision.text}</p>
                        <p className="text-xs text-green-600 mt-2">
                          {decision.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No formal decisions were recorded during this meeting</p>
              </Card>
            )}
          </div>

          <Separator />

          {/* Action Items by Person */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Action Items by Person
            </h3>
            {Object.keys(groupedActionItems).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(groupedActionItems).map(([person, items]) => (
                  <Card key={person} className="p-4">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {person}
                      <Badge variant="secondary">{items.length}</Badge>
                    </h4>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={item.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-900 leading-relaxed">
                            {item.taskDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {'dueDate' in item && item.dueDate && (
                              <Badge variant="outline" className="text-xs">
                                Due: {item.dueDate instanceof Date ? item.dueDate.toLocaleDateString() : item.dueDate}
                              </Badge>
                            )}
                            {'priority' in item && item.priority && (
                              <Badge 
                                variant={item.priority === 'high' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {item.priority} priority
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No action items were assigned during this meeting</p>
              </Card>
            )}
          </div>

          <Separator />

          {/* Open Questions */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              Open Questions & Unresolved Items
            </h3>
            {questionHighlights.length > 0 || transcriptQuestions.length > 0 ? (
              <div className="space-y-3">
                {[...questionHighlights, ...transcriptQuestions.slice(0, 5)]
                  .filter((question, index, self) => 
                    index === self.findIndex(q => q.text === question.text)
                  )
                  .map((question, index) => (
                    <Card key={`${question.id}-${index}`} className="p-4 bg-purple-50 border-purple-200">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-purple-100 text-purple-800">{index + 1}</Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900 mb-1">{question.speaker}</p>
                          <p className="text-purple-800 leading-relaxed">{question.text}</p>
                          <p className="text-xs text-purple-600 mt-2">
                            {question.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No unresolved questions were identified</p>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-secondary/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Generated on {new Date().toLocaleString()} • 
              {meetingStart && meetingEnd && ` Meeting: ${meetingStart.toLocaleTimeString()} - ${meetingEnd.toLocaleTimeString()}`}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {highlights.length} highlights detected
              </Badge>
              <Badge variant="outline">
                Auto-generated summary
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}