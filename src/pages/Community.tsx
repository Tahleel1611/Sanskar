import Header from "@/components/Header";
import CommunityLeaderboard from "@/components/CommunityLeaderboard";

const Community = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground mt-0.5">See how you compare & join challenges</p>
        </div>
        <CommunityLeaderboard />
      </div>
    </div>
  );
};

export default Community;
