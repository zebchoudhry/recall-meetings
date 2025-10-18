import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  CheckCircle2,
  Chrome,
  AlertCircle,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import recallHeroLogo from "@/assets/recall-main-logo.png";
import catchMeUpDemo from "@/assets/catch-me-up-demo.png";

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
            Stop Losing Important Details in <span className="text-accent">Every Meeting</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-primary-foreground/90 mb-4 max-w-3xl mx-auto">
            Missed something crucial? Zoned out for a minute? Forgot who said what?
          </p>
          
          <p className="text-2xl sm:text-3xl font-semibold text-accent mb-10 max-w-3xl mx-auto">
            Recall captures everything—so you never have to.
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

      {/* Catch Me Up Demo Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-accent/5 via-background to-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Catch Me Up—Never Miss Key Moments Again
            </h2>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30 p-4 sm:p-8">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted/50">
              <img 
                src={catchMeUpDemo}
                alt="Catch Me Up feature demonstration - showing someone zoning out then instantly getting a recap summary"
                className="w-full h-full object-cover animate-fade-in"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
            </div>
          </div>
          
          <p className="text-center text-lg text-muted-foreground mt-8 max-w-2xl mx-auto">
            See Recall in action. Instantly get caught up when you lose focus.
          </p>
        </div>
      </section>


      {/* Value Outcomes - What You Actually Get */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-muted/50 to-background border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What You Get With Recall
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Turn every conversation into searchable insights, action items, and clarity
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background border border-border rounded-xl p-8 hover:shadow-xl transition-all">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-6">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Perfect Transcripts</h3>
              <p className="text-muted-foreground mb-4">
                Real-time transcription with speaker identification. Search, review, and share every word that was said.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Automatic speaker detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Searchable transcript history</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Export and share instantly</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-background border border-border rounded-xl p-8 hover:shadow-xl transition-all">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 text-success mb-6">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Never Miss Context</h3>
              <p className="text-muted-foreground mb-4">
                Zoned out? Joined late? Get instant 10-minute recaps to catch up without awkward questions.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>One-click "Catch Me Up" summaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Replay any section instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Jump to key moments</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-background border border-border rounded-xl p-8 hover:shadow-xl transition-all">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 text-accent mb-6">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Actionable Insights</h3>
              <p className="text-muted-foreground mb-4">
                Automatically detect action items, questions, and mentions. Know exactly what needs doing and who said what.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>AI-detected action items</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Highlighted Q&A sections</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Personal task dashboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases - Who Is This For */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built for Real Work Scenarios
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">👩‍💼</div>
                <h3 className="text-xl font-bold text-foreground mb-3">Client Meetings</h3>
                <p className="text-muted-foreground mb-4">
                  Focus on building relationships, not frantic note-taking. Recall captures requirements, commitments, and next steps automatically.
                </p>
                <div className="text-sm text-primary font-semibold">
                  → Never forget a client request again
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-success/20 hover:border-success/40 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">🎓</div>
                <h3 className="text-xl font-bold text-foreground mb-3">Lectures & Workshops</h3>
                <p className="text-muted-foreground mb-4">
                  Stop missing key points while taking notes. Get complete transcripts with searchable content and instant recap when you zone out.
                </p>
                <div className="text-sm text-success font-semibold">
                  → Study smarter, not harder
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">🔬</div>
                <h3 className="text-xl font-bold text-foreground mb-3">Research Interviews</h3>
                <p className="text-muted-foreground mb-4">
                  Capture every nuance without the distraction of note-taking. Searchable transcripts make analysis and quote-finding effortless.
                </p>
                <div className="text-sm text-accent font-semibold">
                  → Focus on insights, not documentation
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-accent/5 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how Recall is helping people stay on top of their meetings
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="border-primary/20 hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-5 h-5 fill-amber-400 text-amber-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-lg text-foreground mb-6 leading-relaxed">
                  "This has really helped me out with the endless meetings that I have to be in. I can track my tasks better and I know who will be doing which task and by which deadline. The catch me up button has saved me many times."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    S
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Sofia</p>
                    <p className="text-sm text-muted-foreground">Halifax</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-success/20 hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-5 h-5 fill-amber-400 text-amber-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-lg text-foreground mb-6 leading-relaxed">
                  "During a lecture I knew I was dozing off at the back. The transcript caught me up with all the key notes, deadlines and the really important data. I was lucky, the app recorded my name being mentioned and pointed out something that I missed during a previous lecture."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success font-bold text-lg">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Asif</p>
                    <p className="text-sm text-muted-foreground">Leeds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-accent/20 hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-5 h-5 fill-amber-400 text-amber-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-lg text-foreground mb-6 leading-relaxed">
                  "The company I work for have told me not to use any AI that will hold or store data. This app has helped me and my boss many times and it has satisfied the leadership teams request for privacy. Nothing stored or recorded, no data leakage."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Alex</p>
                    <p className="text-sm text-muted-foreground">Brighouse</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy & Trust - The Recall Difference */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-success/5 via-muted/30 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success mb-8">
              <Lock className="h-10 w-10" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Your Data, Your Device, Your Choice
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Unlike Otter.ai and other tools that require cloud storage, Recall gives you complete control over your privacy with our unique <strong>two-tier privacy system</strong>.
            </p>
          </div>

          {/* Privacy Modes Comparison */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Privacy Mode */}
            <Card className="border-2 border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all bg-gradient-to-br from-background to-primary/5">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                    <Lock className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Privacy Mode</h3>
                    <p className="text-sm text-muted-foreground">Default - Maximum Privacy</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Perfect for sensitive meetings. <strong>Zero trace policy</strong> means transcripts disappear when you close your browser. Nothing stored, nothing tracked, nothing uploaded.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Session-only storage</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">No browser history</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Zero data footprint</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Perfect for compliance & NDAs</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    <strong>Use when:</strong> Discussing confidential information, interviewing candidates, or when your organization requires zero data retention.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Mode */}
            <Card className="border-2 border-accent/20 hover:border-accent/40 hover:shadow-xl transition-all bg-gradient-to-br from-background to-accent/5">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 text-accent">
                    <Shield className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Enhanced Mode</h3>
                    <p className="text-sm text-muted-foreground">Opt-in - Still Private</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Get search, history, and AI features while keeping <strong>100% local storage</strong>. All data stays on your device using encrypted browser storage (IndexedDB).
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Search across past meetings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">AI chat with transcript history</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Meeting analytics & insights</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Still zero cloud uploads</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    <strong>Use when:</strong> You want power-user features like search and AI insights, but still need your data to stay on your device only.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How We're Different */}
          <div className="bg-background border border-border rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              How Recall Protects Your Privacy
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  What We Do
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ Process everything in your browser</li>
                  <li>✅ Use encrypted local storage (if you enable it)</li>
                  <li>✅ Give you one-click data deletion</li>
                  <li>✅ Let you switch modes per meeting</li>
                  <li>✅ Open about what data exists where</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  What We Don't Do
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>❌ Never upload audio to servers</li>
                  <li>❌ Never train AI models on your data</li>
                  <li>❌ Never share data with third parties</li>
                  <li>❌ Never require cloud accounts</li>
                  <li>❌ Never track your behavior</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-foreground">
                <strong>Built for compliance:</strong> Whether you're bound by GDPR, HIPAA, attorney-client privilege, or corporate NDAs, Recall's privacy-first architecture means your data stays exactly where you want it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Browser Compatibility Notice */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-amber-50 dark:bg-amber-950/20 border-y border-amber-200 dark:border-amber-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Chrome className="h-8 w-8" />
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                Browser Compatibility
              </h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="text-lg">
                  Recall uses the <strong>Web Speech Recognition API</strong> for real-time transcription. This technology requires a Chromium-based browser.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <h3 className="font-semibold text-success mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Supported Browsers
                    </h3>
                    <ul className="space-y-1 text-sm">
                      <li>✅ Google Chrome (recommended)</li>
                      <li>✅ Microsoft Edge</li>
                      <li>✅ Brave</li>
                      <li>✅ Opera</li>
                    </ul>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4 border border-destructive/30">
                    <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Not Supported
                    </h3>
                    <ul className="space-y-1 text-sm">
                      <li>❌ Firefox</li>
                      <li>❌ Safari (limited support)</li>
                    </ul>
                    <p className="text-xs mt-2 text-muted-foreground italic">
                      Firefox does not support the Web Speech Recognition API, which is essential for real-time transcription.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
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


      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need to know about privacy, security, and how Recall works
          </p>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Is my meeting data stored anywhere?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No. Recall processes everything in your browser using the Web Speech API. No audio is ever uploaded to our servers. Once you send the email summary and close your browser, all meeting data is permanently deleted. We genuinely cannot access your meetings because we never receive them in the first place.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What encryption do you use?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All data in transit uses industry-standard TLS (Transport Layer Security) encryption, the same technology banks use. However, since we don't store any meeting data on servers, there's no "data at rest" to encrypt. Your meetings stay in your browser's memory and are never transmitted to external servers except when you choose to email the summary.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can RecallMeetings staff access my meetings?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely not. We have zero-knowledge architecture—your meetings are processed entirely in your browser. We don't have servers storing transcripts, we don't have databases with your conversations, and we don't have any technical means to access your meeting content. This isn't just policy; it's how the technology works.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Do you track or analyze my meetings for advertising?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Never. There is zero tracking, zero analytics, and zero behavioral profiling during your meetings. We don't sell data to advertisers, we don't train AI models on your conversations, and we don't monetize your content in any way. Recall is ad-free by design.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What happens to my data after I email the summary?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The moment you send the email summary, all meeting data is immediately and permanently deleted from our systems. You'll receive a confirmation message stating this. The only copy of your meeting summary exists in the email you received—nowhere else.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                How does Recall make money if it's free and has no ads?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently, Recall is in early access and completely free as we gather feedback and improve the product. In the future, we may introduce premium features for power users, but the core privacy-first transcription will always remain accessible. We will never compromise on privacy to monetize.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Which browsers and devices are supported?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Recall works best on desktop browsers that support the Web Speech API: Google Chrome, Microsoft Edge, and Safari. Mobile support varies, but Chrome on Android works well. Firefox doesn't currently support the Web Speech API, so it won't work there yet.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can I use Recall for virtual meetings (Zoom, Teams, etc.)?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Recall captures audio from your microphone, so it works for in-person meetings, phone calls, and virtual meetings. Just make sure to select the correct audio input (your microphone) in your browser settings and ensure you have permission to record the meeting.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                How accurate is the transcription?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Transcription accuracy depends on the Web Speech API (built into your browser) and factors like audio quality, accents, and background noise. In good conditions, accuracy is typically 85-95%. Clear audio with minimal background noise produces the best results.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Do you use my meeting data to train AI models?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No, never. We don't store your meetings, so we can't use them for anything—including AI training. Your conversations are yours alone. We have no interest in, and no technical capability to, use your data for model training or any other purpose.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Is there a limit on meeting length?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently, there are no hard limits on meeting length. However, very long meetings (3+ hours) may impact browser performance since everything is processed locally. For best results, we recommend meetings under 2 hours or breaking longer sessions into segments.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can I save or export the full transcript?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can download the full transcript as a text file using the export button. However, remember that once you close or refresh the browser, all data is lost. Make sure to export or email your summary before ending your session.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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