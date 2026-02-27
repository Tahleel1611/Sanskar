import { motion } from "framer-motion";
import Header from "@/components/Header";
import CarbonScore from "@/components/CarbonScore";
import QuickStats from "@/components/QuickStats";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import WeeklyChart from "@/components/WeeklyChart";
import AIAdvisor from "@/components/AIAdvisor";
import CommunityLeaderboard from "@/components/CommunityLeaderboard";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero section with background */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        <div className="relative z-10">
          <Header />
          <div className="px-5 pb-6 pt-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-1"
            >
              <p className="text-sm text-muted-foreground">
                Thursday, Feb 13 · <span className="text-primary font-medium">Confidence: High</span>
              </p>
            </motion.div>
            <div className="flex justify-center py-4">
              <CarbonScore score={35} totalKg={9.0} dailyGoal={12} />
            </div>
            <QuickStats />
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="px-5 pb-8 space-y-6">
        <CategoryBreakdown />
        <WeeklyChart />
        <AIAdvisor />
        <CommunityLeaderboard />

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl gradient-hero p-5 text-center"
        >
          <p className="text-primary-foreground font-semibold text-sm">
            🌍 Your impact this month
          </p>
          <p className="text-primary-foreground/80 text-xs mt-1">
            You've saved <strong className="text-primary-foreground">23.4 kg CO₂</strong> — equivalent to planting 2 trees
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
