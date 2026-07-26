import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { RequireAuth } from "@/lib/auth/RequireAuth";
import Index from "./pages/Index";
import AppPage from "./pages/App";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PrivacyBanner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <AppPage />
                    </RequireAuth>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
