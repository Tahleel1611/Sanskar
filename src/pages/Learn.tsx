import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Play, Trophy, Trees, Droplets, Zap, Lock, X } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { badges } from "@/lib/mockData";
import heroBg from "@/assets/hero-bg.jpg";

const missions = [
  {
    id: "nature",
    title: "Nature Interaction",
    desc: "Go outside and find the hidden nature secrets glowing in your backyard.",
    level: "Level 1",
    progress: "15% Complete",
    progressWidth: "15%",
  },
  {
    id: "molecule",
    title: "Carbon Molecule Hunter",
    desc: "Catch the floating carbon molecules before they escape into the atmosphere!",
    level: "Level 1",
    progress: "Not Started",
    progressWidth: "0%",
  },
];

const Learn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<(typeof missions)[0] | null>(null);
  const [showMissionDetail, setShowMissionDetail] = useState(false);

  const handleMissionClick = (mission: typeof missions[0]) => {
    setSelectedMission(mission);
    setShowMissionDetail(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-6 lg:max-w-6xl lg:mx-auto">
        <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-card/70 p-6 lg:p-7 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          <div className="relative z-10 grid lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-7">
              <p className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary uppercase tracking-wider">
                New Adventure
              </p>
              <h1 className="mt-3 text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
                Ready for your next mission, <span className="text-primary">Eco-Hero?</span>
              </h1>
              <p className="text-muted-foreground mt-3 max-w-xl">
                Explore the world around you with AR magic! Find hidden carbon molecules and save the planet one scan at a time.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => navigate("/alternatives")} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Start Exploring</button>
                <button type="button" onClick={() => setShowTutorialModal(true)} className="rounded-full bg-muted px-5 py-2.5 text-sm font-bold text-foreground inline-flex items-center gap-2"><Play className="h-4 w-4" /> Watch Tutorial</button>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border bg-card p-2 shadow-elevated max-w-[270px] ml-auto">
                <img src={heroBg} alt="Mission preview" className="h-48 w-full object-cover rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Active AR Missions</h2>
            <button
              type="button"
              onClick={() => toast({ title: "All Missions", description: "Full missions list coming soon!" })}
              className="text-sm font-bold text-primary inline-flex items-center"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {missions.map((mission, i) => (
              <motion.button
                key={mission.id}
                onClick={() => handleMissionClick(mission)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i }}
                className="rounded-2xl border border-border bg-card p-3 shadow-card text-left hover:border-primary/40 transition-colors"
              >
                <div className="rounded-xl h-36 bg-gradient-to-br from-muted to-card overflow-hidden" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="mt-3">
                  <p className="text-lg font-semibold text-foreground">{mission.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[38px]">{mission.desc}</p>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: mission.progressWidth }} /></div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{mission.level}</span>
                  <span>{mission.progress}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-4 shadow-card">
            <button
              type="button"
              onClick={() => toast({ title: "Family Management", description: "Family features coming soon!" })}
              className="w-full text-left hover:opacity-80 transition-opacity"
            >
              <h3 className="text-2xl font-bold text-foreground mb-4">Family Progress</h3>
              <div className="space-y-2.5">
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Badges Earned</p>
                  <p className="text-3xl font-bold text-foreground">12</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Missions Complete</p>
                  <p className="text-3xl font-bold text-foreground">8</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Eco-Points</p>
                  <p className="text-3xl font-bold text-foreground">450</p>
                </div>
              </div>
            </button>
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground inline-flex items-center gap-2"><Trophy className="h-5 w-5 text-accent" /> Badge Collection</h3>
              <button
                type="button"
                onClick={() => toast({ title: "Trophy Room", description: "Viewing all earned and locked badges!" })}
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                View Trophy Room
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {badges.slice(0, 4).map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    badge.locked
                      ? "border border-dashed border-border bg-background/50 hover:bg-muted/50"
                      : "border border-primary/40 bg-primary/10 hover:bg-primary/20"
                  }`}
                  onClick={() => {
                    if (badge.locked) {
                      toast({
                        title: badge.name,
                        description: `To unlock: ${badge.requirement}`,
                      });
                    } else {
                      toast({
                        title: badge.name,
                        description: badge.description,
                      });
                    }
                  }}
                >
                  <div
                    className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center text-xl ${
                      badge.locked ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {badge.locked ? <Lock className="h-5 w-5" /> : badge.icon}
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-2">{badge.name}</p>
                  <p className="text-[11px] text-muted-foreground">{badge.locked ? "Locked" : "Unlocked"}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const firstIncompleteMission = missions.find((m) => m.progressWidth !== "100%");
                setSelectedMission(firstIncompleteMission || missions[0]);
                setShowMissionDetail(true);
              }}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Continue Missions <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Video Modal */}
      <Dialog open={showTutorialModal} onOpenChange={setShowTutorialModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AR Tutorial Video</DialogTitle>
            <DialogDescription>Learn how to use the Product Scanner</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl overflow-hidden bg-black aspect-video">
            <iframe
              className="h-[300px] w-full"
              src="https://www.youtube.com/embed/2dERIze1bVo"
              title="AR Product Scanner Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mission Detail Sheet */}
      <Sheet open={showMissionDetail} onOpenChange={setShowMissionDetail}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-xl">{selectedMission?.title}</SheetTitle>
            <SheetDescription>{selectedMission?.level}</SheetDescription>
          </SheetHeader>
          {selectedMission && (
            <div className="space-y-4 mt-4">
              <div className="rounded-xl h-40 bg-gradient-to-br from-muted to-card overflow-hidden" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover" }} />

              <div>
                <h3 className="font-semibold text-foreground mb-2">About This Mission</h3>
                <p className="text-sm text-muted-foreground">{selectedMission.desc}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Progress</h3>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: selectedMission.progressWidth }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedMission.progress} • Rewards: 150 Eco-Points
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="font-semibold text-foreground">Instructions</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Enable AR mode</li>
                  <li>Point camera at target</li>
                  <li>Scan to reveal data</li>
                  <li>Complete the task</li>
                </ol>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  toast({ title: "Mission started!", description: `Get ready for ${selectedMission.title}` });
                  setShowMissionDetail(false);
                }}
              >
                Start / Resume Mission
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Learn;
