import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { challenges, leaderboardMock, successStories } from "@/lib/mockData";

const CommunityPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showSearch />

      <div className="px-5 py-4 space-y-6 lg:max-w-6xl lg:mx-auto">
        <section>
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground">Join challenges and track progress with others.</p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Active Challenges</h2>
            <Button size="sm">Create Challenge</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {challenges.slice(0, 4).map((challenge) => (
              <Card key={challenge.id}>
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
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Success Stories</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {successStories.slice(0, 4).map((story) => (
              <Card key={story.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{story.author}</p>
                    <p className="text-xs text-muted-foreground">{story.date}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{story.story}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Leaderboard</h2>
          <Tabs defaultValue="friends" className="w-full">
            <TabsList>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="local">Local</TabsTrigger>
              <TabsTrigger value="global">Global</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="mt-3 space-y-2">
              {leaderboardMock.friends.slice(0, 5).map((entry) => (
                <Card key={`friends-${entry.rank}`}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <p className="text-sm text-foreground">#{entry.rank} {entry.name}</p>
                    <p className="text-sm font-semibold text-primary">{entry.points} pts</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="local" className="mt-3 space-y-2">
              {leaderboardMock.local.slice(0, 5).map((entry) => (
                <Card key={`local-${entry.rank}`}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <p className="text-sm text-foreground">#{entry.rank} {entry.name}</p>
                    <p className="text-sm font-semibold text-primary">{entry.points} pts</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="global" className="mt-3 space-y-2">
              {leaderboardMock.global.slice(0, 5).map((entry) => (
                <Card key={`global-${entry.rank}`}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <p className="text-sm text-foreground">#{entry.rank} {entry.name}</p>
                    <p className="text-sm font-semibold text-primary">{entry.points} pts</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
};

export default CommunityPage;
