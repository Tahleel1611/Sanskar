import { motion } from "framer-motion";
import { Trophy, Users, TrendingDown } from "lucide-react";

const leaders = [
  { name: "Priya S.", score: 4.2, rank: 1, change: -22 },
  { name: "Arjun M.", score: 5.8, rank: 2, change: -15 },
  { name: "You", score: 9.0, rank: 5, change: -12, isUser: true },
  { name: "Meera K.", score: 9.4, rank: 6, change: -8 },
];

const CommunityLeaderboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Community
          </h3>
        </div>
        <span className="text-xs text-primary font-medium cursor-pointer hover:underline">
          View All
        </span>
      </div>

      <div className="rounded-xl bg-card p-4 shadow-card space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <TrendingDown className="h-3.5 w-3.5 text-primary" />
          <span>Your community saved <strong className="text-foreground">487 kg CO₂</strong> this week</span>
        </div>
        
        {leaders.map((user, i) => (
          <motion.div
            key={user.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 + 0.08 * i }}
            className={`flex items-center gap-3 rounded-lg p-2.5 ${
              user.isUser ? "bg-primary/5 ring-1 ring-primary/20" : ""
            }`}
          >
            <span className="text-xs font-bold text-muted-foreground w-5 text-center">
              {user.rank === 1 ? (
                <Trophy className="h-4 w-4 text-accent inline" />
              ) : (
                `#${user.rank}`
              )}
            </span>
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <span className={`text-sm font-medium ${user.isUser ? "text-primary" : "text-foreground"}`}>
                {user.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground">{user.score} kg</span>
              <span className="text-[10px] text-primary ml-1">↓{Math.abs(user.change)}%</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl bg-primary/5 p-3 border border-primary/10">
        <p className="text-xs text-center text-foreground font-medium">
          🌿 Weekly Challenge: <span className="text-primary">Car-Free Week</span>
        </p>
        <p className="text-[10px] text-center text-muted-foreground mt-0.5">
          142 participants · 3 days left
        </p>
      </div>
    </motion.div>
  );
};

export default CommunityLeaderboard;
