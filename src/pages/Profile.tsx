import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Shield, Sprout, Trophy, Eye, EyeOff, User as UserIcon } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getUserInitials, saveUserProfile } from "@/lib/userStorage";
import { rewardHistory as mockRewardHistory, leaderboardMock } from "@/lib/mockData";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [privacyLevel, setPrivacyLevel] = useState<"exact" | "rank" | "anonymous">("exact");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [leaderboardTab, setLeaderboardTab] = useState("local");
  const [leaderboardCount, setLeaderboardCount] = useState(6);
  const [rewardCount, setRewardCount] = useState(5);

  const handleSignup = () => {
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields." });
      return;
    }

    saveUserProfile(signupName, signupEmail);
    toast({
      title: "Account created!",
      description: `Welcome, ${signupName}!`,
    });

    setShowSignupModal(false);
    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
  };

  const handleSavePrivacy = () => {
    toast({
      title: "Privacy settings saved",
      description: `Your profile is now ${privacyLevel === "exact" ? "public" : privacyLevel === "rank" ? "semi-private" : "anonymous"}.`,
    });
  };

  const leaderboardData =
    leaderboardTab === "friends"
      ? leaderboardMock.friends
      : leaderboardTab === "local"
        ? leaderboardMock.local
        : leaderboardMock.global;

  const userInitials = getUserInitials();

  const privacyOptions = [
    { value: "exact" as const, label: "Share exact CO₂ reduction", icon: Eye, desc: "Others see your weekly numbers" },
    { value: "rank" as const, label: "Share rank only", icon: EyeOff, desc: "Others see your position, not numbers" },
    { value: "anonymous" as const, label: "Anonymous", icon: Shield, desc: "Participate without being identified" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-lg">
            {userInitials}
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Leaderboard & Profile</h1>
            <p className="text-sm text-muted-foreground">Your stats and community standing</p>
          </div>
        </div>

        <Button className="w-full" onClick={() => setShowSignupModal(true)}>
          Create Account
        </Button>

        <div className="rounded-xl bg-card p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Leaderboard</p>

          <Tabs value={leaderboardTab} onValueChange={setLeaderboardTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="local">Local</TabsTrigger>
              <TabsTrigger value="global">Global</TabsTrigger>
            </TabsList>

            <TabsContent value={leaderboardTab} className="space-y-2 mt-2">
              {leaderboardData.slice(0, leaderboardCount).map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-bold text-foreground w-6">#{entry.rank}</span>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: entry.color }}>
                      {entry.initials}
                    </div>
                    <p className="text-sm font-medium text-foreground">{entry.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{entry.points}</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          {leaderboardCount < leaderboardData.length && (
            <button
              type="button"
              onClick={() => setLeaderboardCount((prev) => prev + 5)}
              className="w-full mt-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Load More
            </button>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card p-4 shadow-card space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gift className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider">Current Points</p>
          </div>
          <p className="text-3xl font-bold text-foreground">3000</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted p-3">
              <Trophy className="h-4 w-4 text-accent mb-1" />
              <p className="text-xs font-semibold text-foreground">Carbon Pro</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <Sprout className="h-4 w-4 text-primary mb-1" />
              <p className="text-xs font-semibold text-foreground">Tree Planter</p>
            </div>
          </div>
        </motion.div>

        <div className="rounded-xl bg-card p-4 shadow-card space-y-2.5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reward History</p>
            {rewardCount < mockRewardHistory.length && (
              <button
                type="button"
                onClick={() => setRewardCount((prev) => prev + 5)}
                className="text-xs font-semibold text-primary hover:opacity-80"
              >
                View All
              </button>
            )}
          </div>
          {mockRewardHistory.slice(0, rewardCount).map((reward) => (
            <div key={reward.date} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
              <div>
                <p className="text-sm text-foreground">{reward.date}</p>
                <p className="text-xs text-muted-foreground">{reward.reason}</p>
              </div>
              <span className="text-xs font-semibold text-primary">+{reward.points}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Community Privacy
          </h3>
          {privacyOptions.map((opt) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              type="button"
              onClick={() => setPrivacyLevel(opt.value)}
              className={`w-full flex items-center gap-3 rounded-xl p-4 text-left transition-all ${
                privacyLevel === opt.value
                  ? "bg-primary/5 ring-1 ring-primary/20"
                  : "bg-card shadow-card"
              }`}
            >
              <opt.icon className={`h-5 w-5 shrink-0 ${privacyLevel === opt.value ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${privacyLevel === opt.value ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 ${
                privacyLevel === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
              }`}>
                {privacyLevel === opt.value && (
                  <div className="h-full w-full rounded-full flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            </motion.button>
          ))}
          <Button className="w-full mt-2" onClick={handleSavePrivacy}>
            Save Privacy Settings
          </Button>
        </div>
      </div>

      {/* Signup Modal */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>Sign up to personalize your eco-journey</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <input
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              type="email"
              placeholder="Email"
              className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <input
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <Button className="w-full" onClick={handleSignup}>
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
