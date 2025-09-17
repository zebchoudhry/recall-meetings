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

    setIsLoading(true);
    console.log("📧 Sending summary to:", email);

    try {
      console.log("📡 Making request to send-email function");
      
      const response = await fetch('/functions/v1/send-email', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to_email: email,
          summary: summary,
        }),
      });

      console.log("📡 Email response status:", response.status);
      console.log("📡 Email response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Email response error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("📡 Email response data:", data);

      if (data.error) {
        console.error("❌ Email API returned error:", data.error);
        throw new Error(data.error);
      }

      toast({
        title: "Email Sent! ✉️",
        description: `Summary has been sent to ${email}`,
      });
      
      setEmail(""); // Clear the email field after successful send
    } catch (error) {
      console.error("❌ Error sending email:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Email Error",
        description: `Failed to send email: ${errorMessage}`,
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
            Send summary to
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