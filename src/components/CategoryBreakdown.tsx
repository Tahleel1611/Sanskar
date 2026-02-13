import { Car, Utensils, Zap, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  {
    name: "Transport",
    icon: Car,
    value: 3.2,
    unit: "kg CO₂",
    change: -12,
    colorClass: "bg-transport/10 text-transport",
    barColor: "bg-transport",
  },
  {
    name: "Food & Diet",
    icon: Utensils,
    value: 2.8,
    unit: "kg CO₂",
    change: -5,
    colorClass: "bg-food/10 text-food",
    barColor: "bg-food",
  },
  {
    name: "Energy",
    icon: Zap,
    value: 1.9,
    unit: "kg CO₂",
    change: -18,
    colorClass: "bg-energy/10 text-energy",
    barColor: "bg-energy",
  },
  {
    name: "Consumption",
    icon: ShoppingBag,
    value: 1.1,
    unit: "kg CO₂",
    change: 3,
    colorClass: "bg-consumption/10 text-consumption",
    barColor: "bg-consumption",
  },
];

const maxValue = 5;

const CategoryBreakdown = () => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Category Breakdown
      </h3>
      <div className="grid gap-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.4 }}
            className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card"
          >
            <div className={`rounded-lg p-2.5 ${cat.colorClass}`}>
              <cat.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {cat.value} {cat.unit}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      cat.change <= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {cat.change <= 0 ? "↓" : "↑"} {Math.abs(cat.change)}%
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(cat.value / maxValue) * 100}%` }}
                  transition={{ delay: 0.2 + 0.1 * i, duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${cat.barColor}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
