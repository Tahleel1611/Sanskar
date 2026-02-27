import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Shield, Eye, EyeOff, User as UserIcon } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const [privacyLevel, setPrivacyLevel] = useState<"exact" | "rank" | "anonymous">("exact");

  const privacyOptions = [
    { value: "exact" as const, label: "Share exact CO₂ reduction", icon: Eye, desc: "Others see your weekly numbers" },
    { value: "rank" as const, label: "Share rank only", icon: EyeOff, desc: "Others see your position, not numbers" },
    { value: "anonymous" as const, label: "Anonymous", icon: Shield, desc: "Participate without being identified" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full gradient-hero flex items-center justify-center">
            <UserIcon className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Guest User</h1>
            <p className="text-sm text-muted-foreground">Sign up to save your progress</p>
          </div>
        </div>

        <Button className="w-full" onClick={() => window.location.href = "/auth"}>
          Create Account
        </Button>

        {/* Privacy Controls */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Community Privacy
          </h3>
          {privacyOptions.map((opt) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
