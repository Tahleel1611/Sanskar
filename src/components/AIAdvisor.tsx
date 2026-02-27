import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ArrowRight, ThumbsUp, Clock, Train, ShoppingBag, Zap, Heart, IndianRupee } from "lucide-react";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  savings: string;
  cost: string;
  health: string;
  category: string;
  icon: typeof Train;
}

const suggestions: Suggestion[] = [
  {
    id: "metro-1",
    title: "Try the metro tomorrow",
    description: "Your 12.4 km commute has a metro stop 5 min walk away — save 2.3 kg CO₂ and ₹120",
    savings: "2.3 kg",
    cost: "Save ₹120",
    health: "15 min walk",
    category: "Transport",
    icon: Train,
  },
  {
    id: "seasonal-1",
    title: "Seasonal produce alert",
    description: "Tomatoes are in season! Switch from imported → local and cut food emissions 40%",
    savings: "1.1 kg",
    cost: "Save ₹30",
    health: "Fresher nutrients",
    category: "Food",
    icon: ShoppingBag,
  },
  {
    id: "unplug-1",
    title: "Unplug idle chargers",
    description: "3 devices on standby detected — unplugging saves 0.4 kg CO₂ daily",
    savings: "0.4 kg",
    cost: "Save ₹8/day",
    health: "",
    category: "Energy",
    icon: Zap,
  },
];

const AIAdvisor = () => {
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const giveFeedback = (id: string, type: "helpful" | "not_now") => {
    setFeedbackGiven((prev) => ({ ...prev, [id]: type }));
    if (type === "not_now") {
      setTimeout(() => setDismissed((prev) => new Set(prev).add(id)), 400);
    }
  };

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

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
        <AnimatePresence>
          {visible.map((tip, i) => {
            const Icon = tip.icon;
            const fb = feedbackGiven[tip.id];
            return (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                className="rounded-xl bg-card p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        {tip.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{tip.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {tip.description}
                    </p>

                    {/* Impact chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                        🌿 {tip.savings}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-accent/10 text-accent-foreground rounded-full px-2 py-0.5">
                        <IndianRupee className="h-2.5 w-2.5" /> {tip.cost}
                      </span>
                      {tip.health && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          <Heart className="h-2.5 w-2.5" /> {tip.health}
                        </span>
                      )}
                    </div>

                    {/* Feedback buttons */}
                    {!fb ? (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => giveFeedback(tip.id, "helpful")}
                          className="flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-3 py-1 hover:bg-primary/20 transition-colors"
                        >
                          <ThumbsUp className="h-3 w-3" /> Helpful
                        </button>
                        <button
                          onClick={() => giveFeedback(tip.id, "not_now")}
                          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted rounded-full px-3 py-1 hover:bg-muted/80 transition-colors"
                        >
                          <Clock className="h-3 w-3" /> Not now
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-primary font-medium mt-2">
                        {fb === "helpful" ? "✓ Thanks! We'll show more like this" : "Noted — we'll suggest this less"}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AIAdvisor;
