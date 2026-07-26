import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Brain, Mail } from "lucide-react";

function safeNext(raw: string | null): string {
  if (!raw) return "/app";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/app";
  return raw;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session, loading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (!loading && session) navigate(next, { replace: true });
  }, [loading, session, navigate, next]);

  const validate = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalised = email.trim().toLowerCase();
    if (!validate(normalised)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const redirectTo = `${window.location.origin}${next}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalised,
      options: { emailRedirectTo: redirectTo },
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Could not send link",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
            <Brain className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Sign in to Recall</h1>
          <p className="text-muted-foreground text-sm mt-2">
            We'll email you a secure sign-in link. No password required.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              We've sent a sign-in link. Click it on this device to continue.
            </p>
            <Button variant="ghost" onClick={() => setSent(false)} className="mt-2">
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
                className="h-12"
              />
            </div>
            <Button type="submit" size="lg" disabled={submitting} className="w-full h-12">
              {submitting ? "Sending…" : "Send sign-in link"}
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AuthPage;