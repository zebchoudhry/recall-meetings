import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import recallLogo from "@/assets/recall-logo-new.svg";

export const AppHeader = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="w-full bg-background border-b border-border/50 px-6 py-4 md:px-8 relative">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={recallLogo}
            alt="Recall"
            className="h-16 w-auto object-contain"
          />
        </div>
        
        <button
          onClick={handleLogoClick}
          className="flex-shrink-0 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg opacity-0"
          aria-label="Go to dashboard"
        >
          <img
            src={recallLogo}
            alt="Recall"
            className="h-12 w-auto object-contain"
          />
        </button>

        {/* Header actions can be added here later */}
        <div className="flex items-center gap-4">
          {/* Future: User menu, settings, etc. */}
        </div>
      </div>
    </header>
  );
};