import { Home, MapPin, Users, BookOpen, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/activity", icon: MapPin, label: "Activity" },
  { to: "/community", icon: Users, label: "Community" },
  { to: "/learn", icon: BookOpen, label: "Learn" },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground transition-colors"
            activeClassName="text-primary bg-primary/10"
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
