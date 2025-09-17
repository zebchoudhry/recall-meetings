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
    console.log("📧 Preparing email for:", email);

    try {
      // Create email content
      const subject = "Meeting Summary - " + new Date().toLocaleDateString();
      const body = `Dear Recipient,

Please find below the meeting summary you requested:

${summary}

Best regards,
Meeting Transcription Assistant

---
This summary was generated automatically from the recorded conversation.`;

      // Use mailto to open user's default email client
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open email client
      window.open(mailtoLink, '_blank');
      
      toast({
        title: "Email Ready! ✉️",
        description: `Email client opened. Send the pre-filled email to ${email}`,
      });
      
      setEmail(""); // Clear the email field
    } catch (error) {
      console.error("❌ Error preparing email:", error);
      
      toast({
        title: "Email Error",
        description: "Failed to prepare email. Please try again.",
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