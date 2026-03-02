import { Home, MapPin, Users, BookOpen, User, ScanSearch, Camera } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const tabs = [
  { to: "/activity", icon: MapPin, label: "Choices" },
  { to: "/carbon-lens", icon: ScanSearch, label: "Lens" },
  { to: "/carbon-lens/scanner", icon: Camera, label: "Scanner" },
  { to: "/community", icon: Users, label: "Community" },
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/learn", icon: BookOpen, label: "Educate" },
  { to: "/profile", icon: User, label: "Leaderboard" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="max-w-3xl mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground transition-all"
            activeClassName="text-primary bg-primary/15 shadow-card"
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
