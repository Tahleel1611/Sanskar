import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";

const tips = [
  {
    title: "Try the metro today",
    description: "Your usual route has a metro stop 5 min away — saves 2.3 kg CO₂ and ₹120",
    savings: "2.3 kg",
    category: "Transport",
  },
  {
    title: "Seasonal produce alert",
    description: "Tomatoes are in season! Switch from imported → local and cut food emissions 40%",
    savings: "1.1 kg",
    category: "Food",
  },
  {
    title: "Unplug idle chargers",
    description: "3 devices on standby detected — unplugging saves 0.4 kg CO₂ daily",
    savings: "0.4 kg",
    category: "Energy",
  },
];

const AIAdvisor = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          AI Advisor
        </h3>
      </div>
      <div className="space-y-2.5">
        {tips.map((tip, i) => (
          <motion.div
            key={tip.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + 0.1 * i, duration: 0.4 }}
            className="group rounded-xl bg-card p-4 shadow-card cursor-pointer hover:shadow-elevated transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    {tip.category}
                  </span>
                  <span className="text-[10px] font-semibold text-primary">
                    Save {tip.savings}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground">{tip.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {tip.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AIAdvisor;
