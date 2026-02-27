import { motion } from "framer-motion";
import { Camera, Star, Award, ChevronRight } from "lucide-react";
import Header from "@/components/Header";

const missions = [
  { id: "snack", title: "Snack Detective", desc: "Scan 3 snacks and find the lowest-carbon option", points: 50, badge: "🕵️", progress: 1, total: 3 },
  { id: "drink", title: "Drink Swap", desc: "Compare cola vs water vs juice footprints", points: 30, badge: "🥤", progress: 0, total: 3 },
  { id: "kitchen", title: "Kitchen Explorer", desc: "Scan 5 items in your kitchen to learn their impact", points: 75, badge: "👨‍🍳", progress: 0, total: 5 },
];

const Learn = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Learn</h1>
          <p className="text-sm text-muted-foreground mt-0.5">AR missions & climate education</p>
        </div>

        {/* AR Scanner CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-xl gradient-hero p-5 flex items-center gap-4 text-left"
        >
          <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Camera className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-primary-foreground font-semibold text-sm">Scan a Product</p>
            <p className="text-primary-foreground/70 text-xs mt-0.5">Point your camera at any food item to see its carbon footprint</p>
          </div>
          <ChevronRight className="h-5 w-5 text-primary-foreground/50 shrink-0" />
        </motion.button>

        {/* Missions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Missions</h3>
          </div>
          {missions.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="rounded-xl bg-card p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{m.badge}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(m.progress / m.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{m.progress}/{m.total}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-accent shrink-0">
                  <Award className="h-3.5 w-3.5" />
                  {m.points}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Learn;
