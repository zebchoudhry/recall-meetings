import { useState } from "react";
import { Clock, CheckCircle, AlertCircle, Users, ChevronDown, ChevronRight } from "lucide-react";
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

export interface Highlight {
  id: string;
  type: 'decision' | 'update' | 'agreement' | 'action' | 'question';
  text: string;
  speaker: string;
  timestamp: Date;
  transcriptEntryId: string;
  confidence: number;
}

interface HighlightsSidebarProps {
  highlights: Highlight[];
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

export function HighlightsSidebar({ highlights, onHighlightClick }: HighlightsSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    decisions: true,
    updates: true,
    agreements: true,
    actions: true,
    questions: true,
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
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
          <h2 className="font-semibold text-lg text-foreground">Key Highlights</h2>
          <p className="text-sm text-muted-foreground">
            Auto-detected important moments
          </p>
        </div>
      )}

      <SidebarTrigger className="m-2 self-start" />

      <SidebarContent className="p-2">
        {Object.entries(groupedHighlights).map(([groupKey, groupHighlights]) => (
          <SidebarGroup key={groupKey}>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="flex items-center gap-2">
                {!collapsed && (
                  <>
                    <span>{getGroupLabel(groupKey)}</span>
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
                            onClick={() => onHighlightClick(highlight.transcriptEntryId)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent/50 ${getHighlightColor(highlight.type)}`}
                          >
                            <div className="flex items-start gap-2">
                              <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              {!collapsed && (
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium mb-1">
                                    {highlight.speaker}
                                  </div>
                                  <div className="text-sm leading-relaxed">
                                    {highlight.text.length > 80
                                      ? highlight.text.substring(0, 80) + '...'
                                      : highlight.text}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs opacity-75">
                                      {highlight.timestamp.toLocaleTimeString()}
                                    </span>
                                    {highlight.confidence > 0.8 && (
                                      <Badge variant="outline" className="text-xs">
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
          <div className="p-4 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No highlights detected yet</p>
            <p className="text-xs mt-1">Key points will appear here as the meeting progresses</p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}