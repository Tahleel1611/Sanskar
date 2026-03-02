import { Bell, HelpCircle, Leaf, LogOut, Menu, Settings, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { clearUserData, getUserInitials } from "@/lib/userStorage";
import { supabase } from "@/integrations/supabase/client";
import { ONBOARDING_DONE_KEY } from "@/lib/onboarding";

interface HeaderProps {
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showDesktopNav?: boolean;
}

const menuLinks = [
  { label: "Dashboard", to: "/" },
  { label: "Choices", to: "/activity" },
  { label: "What Went Wrong?", to: "/what-went-wrong" },
  { label: "Community", to: "/community" },
  { label: "Educate", to: "/learn" },
  { label: "Leaderboard", to: "/profile" },
  { label: "Settings", to: "/settings" },
  { label: "Help", to: "/help" },
];

const notifications = [
  "AI detected a commute activity 2m ago",
  "Zero Plastic Day challenge updated",
  "New mission unlocked: Product Scanner",
];

const AI_FEED_PENDING_KEY = "eco_ai_feed_pending";

const Header = ({ showSearch = false, searchValue = "", onSearchChange, showDesktopNav = false }: HeaderProps) => {
  const navigate = useNavigate();
  const [pendingAiCount, setPendingAiCount] = useState(0);

  useEffect(() => {
    const updatePending = () => {
      const raw = localStorage.getItem(AI_FEED_PENDING_KEY) || "0";
      const parsed = Number.parseInt(raw, 10);
      setPendingAiCount(Number.isNaN(parsed) ? 0 : parsed);
    };

    updatePending();
    window.addEventListener("storage", updatePending);
    window.addEventListener("eco-ai-feed-update", updatePending);
    return () => {
      window.removeEventListener("storage", updatePending);
      window.removeEventListener("eco-ai-feed-update", updatePending);
    };
  }, []);

  const unreadCount = notifications.length + pendingAiCount;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      clearUserData();
      localStorage.removeItem(ONBOARDING_DONE_KEY);
      navigate("/", { replace: true });
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 border-b border-border bg-background/80 backdrop-blur-md"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold text-foreground tracking-tight shrink-0">Sanskar</span>
        {showSearch && (
          <input
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search community..."
            className="hidden md:block w-64 rounded-xl bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        )}
      </div>

      <div className="flex items-center gap-3 relative z-10">
        {showDesktopNav && (
          <nav className="hidden lg:flex items-center gap-5 text-sm mr-2">
            {menuLinks.slice(0, 5).map((item) => (
              <Link key={item.label} to={item.to} className="text-muted-foreground hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="View notifications"
              className="relative h-9 w-9 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
            >
              <Bell className="h-4.5 w-4.5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 inline-flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-card border-border z-[60]">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((item) => (
              <DropdownMenuItem key={item} className="text-xs text-muted-foreground py-2 leading-relaxed">
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Profile menu" className="h-9 w-9 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center ring-2 ring-primary/30">
              {getUserInitials()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border z-[60]">
            <DropdownMenuLabel>Profile</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <UserCircle className="h-4 w-4 mr-2" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet>
          <SheetTrigger asChild>
            <button type="button" aria-label="Open menu" className="h-9 w-9 rounded-full hover:bg-muted transition-colors flex items-center justify-center z-20">
              <Menu className="h-4.5 w-4.5 text-muted-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[82%] sm:max-w-sm bg-card border-border z-[80]">
            <SheetTitle>Navigate</SheetTitle>
            <div className="mt-6 space-y-2">
              {menuLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <button type="button" onClick={() => navigate("/help")} className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted inline-flex items-center justify-center gap-2">
                <HelpCircle className="h-4 w-4" /> Help Center
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
};

export default Header;
