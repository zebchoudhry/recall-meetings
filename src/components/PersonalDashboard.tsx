import { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, User, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PersonalActionItem {
  id: string;
  taskDescription: string;
  assignedBy: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  transcriptEntryId: string;
  timestamp: Date;
  confidence: number;
}

interface PersonalDashboardProps {
  personalActionItems: PersonalActionItem[];
  userName: string;
  onUserNameChange: (name: string) => void;
  onActionItemUpdate: (id: string, status: PersonalActionItem['status']) => void;
  onViewInTranscript: (transcriptEntryId: string) => void;
}

export function PersonalDashboard({ 
  personalActionItems, 
  userName, 
  onUserNameChange, 
  onActionItemUpdate,
  onViewInTranscript 
}: PersonalDashboardProps) {
  const [isEditingName, setIsEditingName] = useState(!userName);
  const [tempName, setTempName] = useState(userName);

  const handleNameSave = () => {
    if (tempName.trim()) {
      onUserNameChange(tempName.trim());
      setIsEditingName(false);
    }
  };

  const getPriorityColor = (priority: PersonalActionItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: PersonalActionItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const pendingItems = personalActionItems.filter(item => item.status === 'pending');
  const inProgressItems = personalActionItems.filter(item => item.status === 'in-progress');
  const completedItems = personalActionItems.filter(item => item.status === 'completed');

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header with User Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">My Action Items</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-32"
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
                />
                <Button size="sm" onClick={handleNameSave}>Save</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {userName || 'Set your name'}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditingName(true)}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>

        {!userName && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">Set Your Name</span>
            </div>
            <p className="text-sm text-amber-700">
              Set your name above so I can automatically detect when action items are assigned to you during the meeting.
            </p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">{pendingItems.length}</div>
            <div className="text-sm text-orange-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{inProgressItems.length}</div>
            <div className="text-sm text-blue-600">In Progress</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{completedItems.length}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
        </div>

        {/* Action Items List */}
        <div className="space-y-4">
          {personalActionItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No personal action items detected yet</p>
              <p className="text-sm mt-1">Items assigned to you will appear here automatically</p>
            </div>
          ) : (
            personalActionItems
              .sort((a, b) => {
                // Sort by status (pending first), then by timestamp
                const statusOrder = { pending: 0, 'in-progress': 1, completed: 2 };
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                  return statusOrder[a.status] - statusOrder[b.status];
                }
                return b.timestamp.getTime() - a.timestamp.getTime();
              })
              .map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all ${
                    item.status === 'completed' 
                      ? 'bg-green-50 border-green-200 opacity-75' 
                      : 'bg-background border-border hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority} priority
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(item.confidence * 100)}% confidence
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewInTranscript(item.transcriptEntryId)}
                        className="text-xs"
                      >
                        View in transcript
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className={`text-sm leading-relaxed ${
                      item.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}>
                      {item.taskDescription}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Assigned by: {item.assignedBy}</span>
                      <span>{item.timestamp.toLocaleString()}</span>
                      {item.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {item.dueDate}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onActionItemUpdate(item.id, 'in-progress')}
                        >
                          Start
                        </Button>
                      )}
                      {item.status === 'in-progress' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onActionItemUpdate(item.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      {item.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onActionItemUpdate(item.id, 'pending')}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </Card>
  );
}