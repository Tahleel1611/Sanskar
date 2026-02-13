import { Leaf, Bell, Menu } from "lucide-react";
import { motion } from "framer-motion";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between px-5 py-4"
    >
      <div className="flex items-center gap-2">
        <div className="gradient-hero rounded-lg p-1.5">
          <Leaf className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground tracking-tight">Sanskar</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </motion.header>
  );
};

export default Header;
