import { motion } from "framer-motion";
import { TrendingDown, Target, Flame } from "lucide-react";

const stats = [
  { label: "Weekly Avg", value: "8.1 kg", icon: TrendingDown, trend: "↓ 12%" },
  { label: "Streak", value: "7 days", icon: Flame, trend: "🔥" },
  { label: "Monthly Goal", value: "68%", icon: Target, trend: "On track" },
];

const QuickStats = () => {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + 0.1 * i, duration: 0.4 }}
          className="rounded-xl bg-card/90 border border-border p-3 shadow-card text-center"
        >
          <stat.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
          <p className="text-base font-bold text-foreground">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
          <p className="text-[10px] text-primary font-semibold mt-0.5">{stat.trend}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickStats;
