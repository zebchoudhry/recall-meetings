import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import recallLogo from "@/assets/recall-logo.svg";

export const AppHeader = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="w-full bg-background border-b border-border/50 px-6 py-4 md:px-8">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex-shrink-0 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg"
          aria-label="Go to dashboard"
        >
          <img
            src={recallLogo}
            alt="Recall"
            className={`
              h-auto object-contain transition-all duration-200
              w-32 md:w-40 lg:w-48 xl:w-56
              ${theme === 'dark' ? 'filter brightness-0 invert' : ''}
            `}
            style={{
              minWidth: '128px', // Minimum clear space 
              padding: '8px', // Additional clear space around logo
              maxHeight: '80px' // Allow taller logo
            }}
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