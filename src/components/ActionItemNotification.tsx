import { useEffect, useState } from "react";
import { AlertTriangle, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PersonalActionItem {
  id: string;
  taskDescription: string;
  assignedBy: string;
  timestamp: Date;
}

interface ActionItemNotificationProps {
  actionItem: PersonalActionItem | null;
  isVisible: boolean;
  onDismiss: () => void;
  onViewDashboard: () => void;
}

export function ActionItemNotification({ 
  actionItem, 
  isVisible, 
  onDismiss, 
  onViewDashboard 
}: ActionItemNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible && actionItem) {
      setIsAnimating(true);
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, actionItem]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  if (!isVisible || !actionItem) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className={`max-w-sm shadow-lg border-orange-200 bg-orange-50 transition-all duration-300 ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-800">New Action Item</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDismiss}
              className="h-6 w-6 text-orange-600 hover:text-orange-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-orange-700 leading-relaxed">
                <strong>You've been assigned:</strong>
              </p>
              <p className="text-sm text-orange-800 font-medium mt-1">
                {actionItem.taskDescription}
              </p>
            </div>

            <div className="text-xs text-orange-600">
              <p>Assigned by: {actionItem.assignedBy}</p>
              <p>Time: {actionItem.timestamp.toLocaleTimeString()}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button 
                size="sm" 
                variant="default"
                onClick={() => {
                  onViewDashboard();
                  handleDismiss();
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                View Dashboard
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="text-orange-600 hover:text-orange-800"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}