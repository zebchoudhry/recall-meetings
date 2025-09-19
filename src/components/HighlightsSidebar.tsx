import { useState } from "react";
import { Clock, CheckCircle, AlertCircle, Users, ChevronDown, ChevronRight, ArrowLeft, Play } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface Highlight {
  id: string;
  type: 'decision' | 'update' | 'agreement' | 'action' | 'question';
  text: string;
  speaker: string;
  timestamp: Date;
  transcriptEntryId: string;
  confidence: number;
}

export interface ActionItem {
  id: string;
  responsiblePerson: string;
  taskDescription: string;
  assignedBy: string;
  timestamp: Date;
  transcriptEntryId: string;
  isForCurrentUser: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

interface HighlightsSidebarProps {
  highlights: Highlight[];
  actionItems: ActionItem[];
  transcript: TranscriptEntry[];
  currentUser: string;
  onHighlightClick: (transcriptEntryId: string) => void;
}

const getHighlightIcon = (type: Highlight['type']) => {
  switch (type) {
    case 'decision':
      return CheckCircle;
    case 'update':
      return AlertCircle;
    case 'agreement':
      return Users;
    case 'action':
      return Clock;
    case 'question':
      return AlertCircle;
    default:
      return AlertCircle;
  }
};

const getHighlightColor = (type: Highlight['type']) => {
  switch (type) {
    case 'decision':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'update':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'agreement':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'action':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'question':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function HighlightsSidebar({ highlights, actionItems, transcript, currentUser, onHighlightClick }: HighlightsSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    decisions: true,
    updates: true, 
    agreements: true,
    actions: true,
    questions: false, // Keep questions collapsed by default since they're less important
  });
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleHighlightClick = (highlight: Highlight) => {
    setSelectedHighlight(highlight);
  };

  const handleBackToHighlights = () => {
    setSelectedHighlight(null);
  };

  const getContextEntries = (highlight: Highlight) => {
    // Get 30 seconds of context around the highlight
    const thirtySecondsMs = 30 * 1000;
    const highlightTime = highlight.timestamp.getTime();
    
    return transcript.filter(entry => {
      const entryTime = entry.timestamp.getTime();
      return Math.abs(entryTime - highlightTime) <= thirtySecondsMs;
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const groupedHighlights = highlights.reduce((acc, highlight) => {
    const group = highlight.type + 's'; // 'decision' -> 'decisions'
    if (!acc[group]) acc[group] = [];
    acc[group].push(highlight);
    return acc;
  }, {} as Record<string, Highlight[]>);

  const getGroupLabel = (groupKey: string) => {
    const labels = {
      decisions: 'Decisions',
      updates: 'Important Updates',
      agreements: 'Agreements',
      actions: 'Action Items',
      questions: 'Questions',
    };
    return labels[groupKey as keyof typeof labels] || groupKey;
  };

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-80"}
      collapsible="icon"
      side="right"
    >
      {!collapsed && (
        <div className="p-4 border-b">
          <h2 className="text-section-title text-foreground">Smart Highlights</h2>
          <p className="text-caption mt-1">
            Zone-Out Catch-Up
          </p>
        </div>
      )}

      <SidebarTrigger className="m-2 self-start" />

      <SidebarContent className="p-2">
        {selectedHighlight ? (
          // Context Replay View
          <div className="space-y-4">
            {/* Header with Back Button */}
            <div className="flex items-center gap-2 px-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToHighlights}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Highlights
              </Button>
            </div>

            {/* Context Card */}
            <Card className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <Badge className={getHighlightColor(selectedHighlight.type)}>
                    {selectedHighlight.type.charAt(0).toUpperCase() + selectedHighlight.type.slice(1)}
                  </Badge>
                  <span className="text-sm font-medium">Context Replay</span>
                </div>

                {/* Play Button */}
                <Button variant="outline" size="sm" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Play 1-minute audio
                </Button>

                {/* Context Entries */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <h4 className="text-sm font-medium mb-2">Transcript Context</h4>
                  {getContextEntries(selectedHighlight).map((entry) => {
                    const isHighlightEntry = entry.id === selectedHighlight.transcriptEntryId;
                    const highlightText = selectedHighlight.text.toLowerCase().trim();
                    
                    // Bold the exact highlight within the text
                    const displayText = isHighlightEntry 
                      ? entry.text.replace(
                          new RegExp(`(${highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                          '<strong>$1</strong>'
                        )
                      : entry.text;

                    return (
                      <div
                        key={entry.id}
                        className={`p-2 rounded border text-xs ${
                          isHighlightEntry
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-background border-border'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col">
                            <span className={`font-medium ${
                              isHighlightEntry ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              {entry.speaker}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {entry.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {isHighlightEntry ? (
                              <p 
                                className="leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: displayText }}
                              />
                            ) : (
                              <p className="leading-relaxed">{entry.text}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Context from {selectedHighlight.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          // Highlights List View
          <>
            {/* Your Tasks Section */}
            {actionItems.filter(item => item.isForCurrentUser).length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-2">
                  {!collapsed && (
                    <>
                      <span className="text-subsection-title">⭐ Your Tasks</span>
                      <Badge variant="secondary" className="text-xs">
                        {actionItems.filter(item => item.isForCurrentUser).length}
                      </Badge>
                    </>
                  )}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {actionItems
                      .filter(item => item.isForCurrentUser)
                      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                      .map((actionItem) => (
                        <SidebarMenuItem key={actionItem.id}>
                          <button
                            onClick={() => onHighlightClick(actionItem.transcriptEntryId)}
                            className="w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent/50 bg-orange-100 text-orange-800 border-orange-200"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-lg">⭐</span>
                              {!collapsed && (
                                <div className="flex-1 min-w-0">
                                  <div className="text-caption font-medium mb-1 flex items-center gap-1">
                                    <span>{actionItem.responsiblePerson}</span>
                                    {actionItem.priority === 'high' && <span className="text-red-600">🔥</span>}
                                  </div>
                                  <div className="text-body leading-relaxed font-medium">
                                    {actionItem.taskDescription.length > 60
                                      ? actionItem.taskDescription.substring(0, 60) + '...'
                                      : actionItem.taskDescription}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-caption opacity-75">
                                      {actionItem.timestamp.toLocaleTimeString()}
                                    </span>
                                    <span className="text-caption text-orange-700">
                                      By: {actionItem.assignedBy}
                                    </span>
                                  </div>
                                  {actionItem.dueDate && (
                                    <div className="text-caption text-orange-700 mt-1">
                                      Due: {actionItem.dueDate.toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        </SidebarMenuItem>
                      ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            {Object.entries(groupedHighlights).map(([groupKey, groupHighlights]) => (
              <SidebarGroup key={groupKey}>
                <div className="flex items-center justify-between">
                  <SidebarGroupLabel className="flex items-center gap-2">
                    {!collapsed && (
                      <>
                        <span className="text-subsection-title">{getGroupLabel(groupKey)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {groupHighlights.length}
                        </Badge>
                      </>
                    )}
                  </SidebarGroupLabel>
                  {!collapsed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroup(groupKey)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedGroups[groupKey] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {(collapsed || expandedGroups[groupKey]) && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {groupHighlights
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .map((highlight) => {
                          const Icon = getHighlightIcon(highlight.type);
                          return (
                            <SidebarMenuItem key={highlight.id}>
                              <button
                                onClick={() => handleHighlightClick(highlight)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent/50 ${getHighlightColor(highlight.type)}`}
                              >
                                <div className="flex items-start gap-2">
                                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  {!collapsed && (
                                    <div className="flex-1 min-w-0">
                                      <div className="text-caption font-medium mb-1">
                                        {highlight.speaker}
                                      </div>
                                      <div className="text-body leading-relaxed">
                                        {highlight.text.length > 80
                                          ? highlight.text.substring(0, 80) + '...'
                                          : highlight.text}
                                      </div>
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-caption opacity-75">
                                          {highlight.timestamp.toLocaleTimeString()}
                                        </span>
                                        {highlight.confidence > 0.8 && (
                                          <Badge variant="outline" className="text-caption">
                                            High confidence
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </button>
                            </SidebarMenuItem>
                          );
                        })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            ))}

            {highlights.length === 0 && !collapsed && (
              <div className="p-4 text-center text-muted-foreground content-spacing-sm">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-body">No highlights detected yet</p>
                <p className="text-caption mt-1">Key points will appear here as the meeting progresses</p>
              </div>
            )}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}