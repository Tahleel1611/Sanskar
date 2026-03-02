import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { challenges, leaderboardMock, successStories } from "@/lib/mockData";
import { getUserName } from "@/lib/userStorage";
import { useToast } from "@/hooks/use-toast";

type LeaderboardTab = "friends" | "local" | "global";

const recentParticipants = ["Anit", "Ravi", "Priya", "Meera", "Arjun"];

const CommunityPage = () => {
  const { toast } = useToast();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeChallenges, setActiveChallenges] = useState(challenges);
  const [stories, setStories] = useState(successStories);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<string[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>("friends");
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [newChallengeName, setNewChallengeName] = useState("");
  const [newChallengeDesc, setNewChallengeDesc] = useState("");
  const [newChallengeDuration, setNewChallengeDuration] = useState("7");
  const [newChallengeCategory, setNewChallengeCategory] = useState("Transport");

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(handle);
  }, [searchText]);

  const filteredChallenges = useMemo(() => {
    if (!debouncedSearch) return activeChallenges;
    return activeChallenges.filter((challenge) =>
      `${challenge.title} ${challenge.description}`.toLowerCase().includes(debouncedSearch),
    );
  }, [activeChallenges, debouncedSearch]);

  const filteredStories = useMemo(() => {
    if (!debouncedSearch) return stories;
    return stories.filter((story) =>
      `${story.author} ${story.story}`.toLowerCase().includes(debouncedSearch),
    );
  }, [stories, debouncedSearch]);

  const selectedChallenge = activeChallenges.find((challenge) => challenge.id === selectedChallengeId) || null;
  const userName = getUserName();

  const leaderboardData = leaderboardMock[leaderboardTab];
  const hasCurrentUser = leaderboardData.some((entry) => entry.name.toLowerCase().includes(userName.toLowerCase()));
  const leaderboardWithUser = hasCurrentUser
    ? leaderboardData
    : [...leaderboardData, { rank: leaderboardData.length + 1, name: `${userName} (You)`, initials: "YU", points: 1320, color: "#16a34a" }];

  const toggleJoinChallenge = (challengeId: string) => {
    setJoinedChallengeIds((prev) =>
      prev.includes(challengeId) ? prev.filter((id) => id !== challengeId) : [...prev, challengeId],
    );
  };

  const createChallenge = () => {
    if (!newChallengeName.trim() || !newChallengeDesc.trim() || Number(newChallengeDuration) <= 0) {
      toast({ title: "Missing details", description: "Please fill challenge name, description, and valid duration." });
      return;
    }

    const challenge = {
      id: `custom-${Date.now()}`,
      title: newChallengeName.trim(),
      description: `${newChallengeDesc.trim()} (${newChallengeCategory})`,
      duration: `${newChallengeDuration} days`,
      participants: 1,
      progress: 0,
      image: "🌱",
    };

    setActiveChallenges((prev) => [challenge, ...prev]);
    setShowCreateChallenge(false);
    setNewChallengeName("");
    setNewChallengeDesc("");
    setNewChallengeDuration("7");
    setNewChallengeCategory("Transport");
    toast({ title: "Challenge created", description: "Your new challenge is now live." });
  };

  const toggleLikeStory = (storyId: string) => {
    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId
          ? { ...story, liked: !story.liked, likes: story.liked ? story.likes - 1 : story.likes + 1 }
          : story,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showSearch searchValue={searchText} onSearchChange={setSearchText} />

      <div className="px-5 py-4 space-y-6 lg:max-w-6xl lg:mx-auto">
        <section>
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground">Join challenges and track progress with others.</p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Active Challenges</h2>
            <Button size="sm" onClick={() => setShowCreateChallenge(true)}>Create Challenge</Button>
          </div>
          {filteredChallenges.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No results found.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filteredChallenges.slice(0, 4).map((challenge) => (
              <Card key={challenge.id} className="cursor-pointer" onClick={() => setSelectedChallengeId(challenge.id)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{challenge.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {challenge.duration} • {challenge.participants} participants • {challenge.progress}% complete
                  </p>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Success Stories</h2>
          {filteredStories.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No results found.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
            {filteredStories.slice(0, 4).map((story) => (
              <Card key={story.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{story.author}</p>
                    <p className="text-xs text-muted-foreground">{story.date}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{story.story}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button type="button" onClick={() => toggleLikeStory(story.id)} className="rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">
                      {story.liked ? "Liked" : "Like"} ({story.likes})
                    </button>
                    <button type="button" onClick={() => toast({ title: "Shared", description: "Story shared with your community." })} className="rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">
                      Share
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Leaderboard</h2>
          <Tabs value={leaderboardTab} onValueChange={(value) => setLeaderboardTab(value as LeaderboardTab)} className="w-full">
            <TabsList>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="local">Local</TabsTrigger>
              <TabsTrigger value="global">Global</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="mt-3 space-y-2">
              {leaderboardWithUser.slice(0, 5).map((entry) => (
                <Card key={`friends-${entry.rank}`}>
                  <CardContent className={`py-3 flex items-center justify-between ${entry.name.includes("(You)") ? "bg-primary/10" : ""}`}>
                    <p className="text-sm text-foreground">#{entry.rank} {entry.name}</p>
                    <p className="text-sm font-semibold text-primary">{entry.points} pts</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="local" className="mt-3 space-y-2">
              {leaderboardWithUser.slice(0, 5).map((entry) => (
                <Card key={`local-${entry.rank}`}>
                  <CardContent className={`py-3 flex items-center justify-between ${entry.name.includes("(You)") ? "bg-primary/10" : ""}`}>
                    <p className="text-sm text-foreground">#{entry.rank} {entry.name}</p>
                    <p className="text-sm font-semibold text-primary">{entry.points} pts</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="global" className="mt-3 space-y-2">
              {leaderboardWithUser.slice(0, 5).map((entry) => (
                <Card key={`global-${entry.rank}`}>
                  <CardContent className={`py-3 flex items-center justify-between ${entry.name.includes("(You)") ? "bg-primary/10" : ""}`}>
                    <p className="text-sm text-foreground">#{entry.rank} {entry.name}</p>
                    <p className="text-sm font-semibold text-primary">{entry.points} pts</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <Dialog open={!!selectedChallenge} onOpenChange={(open) => !open && setSelectedChallengeId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedChallenge?.title}</DialogTitle>
            <DialogDescription>{selectedChallenge?.duration}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{selectedChallenge?.description}</p>
            <div className="rounded-lg bg-muted h-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${selectedChallenge?.progress ?? 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Participants: {selectedChallenge?.participants}</p>
            <div className="rounded-lg border border-border p-2">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Recent participants</p>
              <p className="text-xs text-foreground">{recentParticipants.join(", ")}</p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!selectedChallenge) return;
                toggleJoinChallenge(selectedChallenge.id);
                toast({
                  title: joinedChallengeIds.includes(selectedChallenge.id) ? "Challenge left" : "Challenge joined",
                  description: selectedChallenge.title,
                });
              }}
            >
              {selectedChallenge && joinedChallengeIds.includes(selectedChallenge.id) ? "Leave Challenge" : "Join Challenge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Challenge</DialogTitle>
            <DialogDescription>Start a new eco challenge for your community.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input value={newChallengeName} onChange={(e) => setNewChallengeName(e.target.value)} placeholder="Challenge name" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" />
            <textarea value={newChallengeDesc} onChange={(e) => setNewChallengeDesc(e.target.value)} placeholder="Description" className="w-full min-h-[90px] rounded-lg border border-border bg-muted px-3 py-2 text-sm" />
            <input value={newChallengeDuration} onChange={(e) => setNewChallengeDuration(e.target.value)} type="number" min="1" placeholder="Duration in days" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" />
            <select value={newChallengeCategory} onChange={(e) => setNewChallengeCategory(e.target.value)} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm">
              <option>Transport</option>
              <option>Food</option>
              <option>Energy</option>
              <option>Goods</option>
            </select>
            <Button className="w-full" onClick={createChallenge}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityPage;
