import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailSummaryProps {
  summary: string;
  isGenerating: boolean;
}

export const EmailSummary = ({ summary, isGenerating }: EmailSummaryProps) => {
  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!summary || isGenerating) {
      toast({
        title: "No Summary",
        description: "Please generate a summary first",
        variant: "destructive",
      });
      return;
    }

    if (!webhookUrl) {
      toast({
        title: "Webhook Required",
        description: "Please enter your Zapier webhook URL to send emails",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Sending summary via Zapier webhook:", webhookUrl);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          to_email: email,
          subject: `Meeting Summary - ${new Date().toLocaleDateString()}`,
          summary: summary,
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
        }),
      });

      toast({
        title: "Email Sent",
        description: `Summary has been sent to ${email} via Zapier. Check your Zap's history to confirm delivery.`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Email Error",
        description: "Failed to send email. Please check your webhook URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Mail className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Email Summary</h3>
      </div>
      
      <form onSubmit={handleEmailSummary} className="space-y-3">
        <div>
          <Label htmlFor="email" className="text-xs text-muted-foreground">
            Recipient Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm"
          />
        </div>
        
        <div>
          <Label htmlFor="webhook" className="text-xs text-muted-foreground">
            Zapier Webhook URL
          </Label>
          <Input
            id="webhook"
            type="url"
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Create a Zap with a webhook trigger and email action
          </p>
        </div>
        
        <Button 
          type="submit" 
          size="sm" 
          disabled={isLoading || !summary || isGenerating}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-3 h-3 mr-1" />
              Send Summary
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};