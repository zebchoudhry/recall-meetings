import { useState } from "react";
import { FileDown, CheckCircle, Users, HelpCircle, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Highlight, ActionItem } from "./HighlightsSidebar";

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

interface OpenQuestion {
  id: string;
  question: string;
  speaker: string;
  timestamp: Date;
  transcriptEntryId: string;
}

interface CheatSheetProps {
  transcript: TranscriptEntry[];
  highlights: Highlight[];
  actionItems: ActionItem[];
  currentUser: string;
  meetingDuration: string;
  meetingStartTime: Date;
  isVisible: boolean;
  onClose: () => void;
}

export function CheatSheet({ 
  transcript, 
  highlights, 
  actionItems, 
  currentUser, 
  meetingDuration, 
  meetingStartTime,
  isVisible, 
  onClose 
}: CheatSheetProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  if (!isVisible) return null;

  // Extract decisions from highlights
  const decisions = highlights.filter(h => h.type === 'decision');

  // Group action items by responsible person
  const groupedActionItems = actionItems.reduce((acc, item) => {
    const person = item.responsiblePerson;
    if (!acc[person]) acc[person] = [];
    acc[person].push(item);
    return acc;
  }, {} as Record<string, ActionItem[]>);

  // Detect open questions (questions not followed by answers)
  const detectOpenQuestions = (): OpenQuestion[] => {
    const questions: OpenQuestion[] = [];
    
    transcript.forEach((entry, index) => {
      const text = entry.text.toLowerCase();
      
      // Detect questions
      const questionPatterns = [
        /\?$/,
        /(?:what|how|when|where|why|who|which|can|could|should|would|will|do|does|did|is|are|was|were) (?:you|we|they|he|she|it)/i,
        /(?:question|concern|wondering|curious)/i,
      ];

      if (questionPatterns.some(pattern => pattern.test(entry.text))) {
        // Check if this question was answered in the next few entries
        const nextEntries = transcript.slice(index + 1, index + 4); // Check next 3 entries
        const hasAnswer = nextEntries.some(nextEntry => {
          const nextText = nextEntry.text.toLowerCase();
          return (
            nextText.includes('yes') || 
            nextText.includes('no') || 
            nextText.includes('answer') ||
            nextText.includes('think') ||
            nextText.includes('believe') ||
            nextText.length > 20 // Substantial response
          ) && nextEntry.speaker !== entry.speaker; // Different speaker responding
        });

        if (!hasAnswer) {
          questions.push({
            id: `question_${entry.id}`,
            question: entry.text,
            speaker: entry.speaker,
            timestamp: entry.timestamp,
            transcriptEntryId: entry.id
          });
        }
      }
    });

    return questions;
  };

  const openQuestions = detectOpenQuestions();

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Meeting Cheat Sheet</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 15px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .item { margin-bottom: 8px; padding: 8px; background: #f9f9f9; border-radius: 4px; }
            .speaker { font-weight: bold; color: #666; }
            .time { color: #888; font-size: 12px; }
            .priority-high { border-left: 4px solid #ef4444; }
            .priority-medium { border-left: 4px solid #f59e0b; }
            .priority-low { border-left: 4px solid #10b981; }
            .user-task { background: #fef3cd; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Meeting Cheat Sheet</h1>
            <p>Duration: ${meetingDuration} | Date: ${meetingStartTime.toLocaleDateString()}</p>
          </div>

          <div class="section">
            <div class="section-title">🎯 Decisions Made (${decisions.length})</div>
            ${decisions.length === 0 ? '<p>No decisions recorded.</p>' : 
              decisions.map(decision => `
                <div class="item">
                  <div class="speaker">${decision.speaker}</div>
                  <div>${decision.text}</div>
                  <div class="time">${decision.timestamp.toLocaleTimeString()}</div>
                </div>
              `).join('')
            }
          </div>

          <div class="section">
            <div class="section-title">📋 Action Items (${actionItems.length})</div>
            ${Object.keys(groupedActionItems).length === 0 ? '<p>No action items recorded.</p>' : 
              Object.entries(groupedActionItems)
                .sort(([a], [b]) => a === currentUser ? -1 : b === currentUser ? 1 : 0)
                .map(([person, items]) => `
                  <h4>${person}${person === currentUser ? ' (You)' : ''}</h4>
                  ${items.map(item => `
                    <div class="item ${item.isForCurrentUser ? 'user-task' : ''} ${item.priority ? 'priority-' + item.priority : ''}">
                      <div>${item.taskDescription}</div>
                      <div class="time">Assigned by: ${item.assignedBy} | ${item.timestamp.toLocaleTimeString()}</div>
                      ${item.dueDate ? `<div class="time">Due: ${item.dueDate.toLocaleDateString()}</div>` : ''}
                    </div>
                  `).join('')}
                `).join('')
            }
          </div>

          <div class="section">
            <div class="section-title">❓ Open Questions (${openQuestions.length})</div>
            ${openQuestions.length === 0 ? '<p>No open questions.</p>' : 
              openQuestions.map(question => `
                <div class="item">
                  <div class="speaker">${question.speaker}</div>
                  <div>${question.question}</div>
                  <div class="time">${question.timestamp.toLocaleTimeString()}</div>
                </div>
              `).join('')
            }
          </div>
        </body>
        </html>
      `;

      // Create and download PDF using print functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Trigger print dialog which can save as PDF
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast({
        title: "PDF Generated",
        description: "Your cheat sheet is ready for download!",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Meeting Cheat Sheet</h2>
            <p className="text-sm text-muted-foreground">
              Duration: {meetingDuration} • {meetingStartTime.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Decisions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Decisions Made</h3>
              <Badge variant="secondary">{decisions.length}</Badge>
            </div>
            
            {decisions.length === 0 ? (
              <p className="text-muted-foreground">No decisions were recorded during this meeting.</p>
            ) : (
              <div className="space-y-3">
                {decisions.map((decision) => (
                  <Card key={decision.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium mb-1">{decision.speaker}</p>
                        <p className="text-sm leading-relaxed">{decision.text}</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4">
                        {decision.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Action Items Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Action Items</h3>
              <Badge variant="secondary">{actionItems.length}</Badge>
            </div>

            {Object.keys(groupedActionItems).length === 0 ? (
              <p className="text-muted-foreground">No action items were recorded during this meeting.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedActionItems)
                  .sort(([a], [b]) => a === currentUser ? -1 : b === currentUser ? 1 : 0)
                  .map(([person, items]) => (
                    <div key={person} className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        {person === currentUser && <span>⭐</span>}
                        {person}
                        {person === currentUser && <span className="text-sm text-muted-foreground">(Your Tasks)</span>}
                        <Badge variant="outline" className="text-xs">{items.length}</Badge>
                      </h4>
                      
                      <div className="space-y-2 ml-4">
                        {items.map((item) => (
                          <Card 
                            key={item.id} 
                            className={`p-3 ${item.isForCurrentUser ? 'bg-orange-50 border-orange-200' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm leading-relaxed">{item.taskDescription}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    By: {item.assignedBy}
                                  </span>
                                  {item.priority && (
                                    <Badge 
                                      variant={item.priority === 'high' ? 'destructive' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {item.priority} priority
                                    </Badge>
                                  )}
                                  {item.dueDate && (
                                    <Badge variant="outline" className="text-xs">
                                      Due: {item.dueDate.toLocaleDateString()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground ml-4">
                                {item.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Open Questions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-semibold">Open Questions</h3>
              <Badge variant="secondary">{openQuestions.length}</Badge>
            </div>

            {openQuestions.length === 0 ? (
              <p className="text-muted-foreground">All questions were answered during this meeting.</p>
            ) : (
              <div className="space-y-3">
                {openQuestions.map((question) => (
                  <Card key={question.id} className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium mb-1">{question.speaker}</p>
                        <p className="text-sm leading-relaxed">{question.question}</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4">
                        {question.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-secondary/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Generated at {new Date().toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Meeting Duration: {meetingDuration}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}