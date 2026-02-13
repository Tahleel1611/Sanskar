import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CarbonScoreProps {
  score: number; // 0-100, lower is better
  totalKg: number;
  dailyGoal: number;
}

const CarbonScore = ({ score, totalKg, dailyGoal }: CarbonScoreProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(totalKg / dailyGoal, 1.3);
  const offset = circumference - progress * circumference;

  const getScoreColor = () => {
    if (score <= 40) return "hsl(var(--score-good))";
    if (score <= 70) return "hsl(var(--score-ok))";
    return "hsl(var(--score-bad))";
  };

  const getLabel = () => {
    if (score <= 40) return "Excellent";
    if (score <= 70) return "Good";
    return "Needs Work";
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {totalKg.toFixed(1)}
          </motion.span>
          <span className="text-xs text-muted-foreground font-medium">kg CO₂ today</span>
        </div>
      </div>
      <div className="text-center">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: `${getScoreColor()}20`,
            color: getScoreColor(),
          }}
        >
          {getLabel()} · Score {animatedScore}/100
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          Goal: {dailyGoal} kg CO₂/day
        </p>
      </div>
    </motion.div>
  );
};

export default CarbonScore;
