import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mic, 
  Clock, 
  MessageCircle, 
  Bell, 
  Users, 
  RotateCcw, 
  Mail, 
  LayoutDashboard,
  Lock,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import recallHeroLogo from "@/assets/recall-main-logo.png";

const Landing = () => {
  const scrollToFeatures = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-primary py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-full bg-accent/20 border border-accent/40 backdrop-blur-sm">
            <span className="text-sm font-semibold text-primary-foreground">
              Early Access — Free for a Limited Time
            </span>
          </div>
          
          <div className="flex justify-center mb-6">
            <img 
              src={recallHeroLogo} 
              alt="Recall Logo" 
              className="h-48 sm:h-60 lg:h-72 w-auto object-contain drop-shadow-2xl"
            />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 tracking-tight">
            Never Miss the Gem in the <span className="text-accent">Waffle</span> Again.
          </h1>
          
          <p className="text-xl sm:text-2xl text-primary-foreground/90 mb-10 max-w-3xl mx-auto">
            Meet <span className="font-semibold">Recall</span> — your AI meeting memory. It transcribes, summarises, and even catches you up when you zone out.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
              <Link to="/app">Try Recall Free</Link>
            </Button>
            
            <Button 
              onClick={scrollToFeatures}
              variant="outline" 
              size="lg" 
              className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 px-8 py-6 text-lg backdrop-blur-sm"
            >
              See How It Works
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Start your meeting</h3>
              <p className="text-muted-foreground">
                Recall transcribes everything in real-time — no setup, no hassle.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Stay focused</h3>
              <p className="text-muted-foreground">
                Recall highlights questions, answers, and action items so you don't lose track.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent-foreground mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Catch up anytime</h3>
              <p className="text-muted-foreground">
                Zoned out? Just click <span className="font-semibold">Catch Me Up</span> to get a 10-minute recap and jump back in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-16">
            Key Features
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Mic className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Real-time transcription</h3>
                <p className="text-sm text-muted-foreground">No audio is ever stored</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Clock className="h-10 w-10 text-success mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Catch Me Up</h3>
                <p className="text-sm text-muted-foreground">Instant recap of the last 10 minutes</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <MessageCircle className="h-10 w-10 text-accent mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Q&A Highlights</h3>
                <p className="text-sm text-muted-foreground">Questions & answers auto-highlighted</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Bell className="h-10 w-10 text-info mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Action Alerts</h3>
                <p className="text-sm text-muted-foreground">Know when you're mentioned or assigned</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Rename Speakers</h3>
                <p className="text-sm text-muted-foreground">One click for cleaner transcripts</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <RotateCcw className="h-10 w-10 text-success mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Replay Sections</h3>
                <p className="text-sm text-muted-foreground">No scrubbing through hours of waffle</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Mail className="h-10 w-10 text-accent mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Email Recaps</h3>
                <p className="text-sm text-muted-foreground">Automatic summaries sent to you</p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <LayoutDashboard className="h-10 w-10 text-info mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Personal Dashboard</h3>
                <p className="text-sm text-muted-foreground">Track all meetings in one place</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy & Trust */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success mb-8">
            <Lock className="h-10 w-10" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Your data stays yours.
          </h2>
          
          <div className="space-y-4 text-lg text-muted-foreground mb-8">
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              <span>No audio or meeting data is stored beyond generating the email summary.</span>
            </p>
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              <span>No tracking, analytics, or behavioral profiling during meetings.</span>
            </p>
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              <span>Zero advertisements—your conversations remain private.</span>
            </p>
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              <span>You stay in control, always.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary-glow to-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
            Try Recall Free — No Paywall, No Lock-In.
          </h2>
          
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all">
            <Link to="/app">Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/50 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © Recall Meetings — All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;