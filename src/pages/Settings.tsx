import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [gpsConnected, setGpsConnected] = useState(true);
  const [smartPlugConnected, setSmartPlugConnected] = useState(false);
  const [darkTheme, setDarkTheme] = useState(true);

  const saveSettings = () => {
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-4 lg:max-w-3xl lg:mx-auto">
        <div>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your app preferences and connected services.</p>
        </div>

        <section className="rounded-xl bg-card border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Notification Preferences</h2>
          <label className="flex items-center justify-between text-sm text-foreground">
            Enable push notifications
            <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
          </label>
        </section>

        <section className="rounded-xl bg-card border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Units</h2>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setUnit("kg")} className={`rounded-lg py-2 text-sm font-semibold ${unit === "kg" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              kg CO₂
            </button>
            <button type="button" onClick={() => setUnit("lbs")} className={`rounded-lg py-2 text-sm font-semibold ${unit === "lbs" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              lbs CO₂
            </button>
          </div>
        </section>

        <section className="rounded-xl bg-card border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Connected Devices</h2>
          <label className="flex items-center justify-between text-sm text-foreground">
            GPS tracking
            <input type="checkbox" checked={gpsConnected} onChange={(e) => setGpsConnected(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between text-sm text-foreground">
            Smart plug integration
            <input type="checkbox" checked={smartPlugConnected} onChange={(e) => setSmartPlugConnected(e.target.checked)} />
          </label>
        </section>

        <section className="rounded-xl bg-card border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Theme & Display</h2>
          <label className="flex items-center justify-between text-sm text-foreground">
            Dark theme
            <input type="checkbox" checked={darkTheme} onChange={(e) => setDarkTheme(e.target.checked)} />
          </label>
        </section>

        <section className="rounded-xl bg-card border border-border p-4 space-y-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Account Management</h2>
          <p className="text-sm text-muted-foreground">Update profile details, privacy, and sign-in preferences from this section.</p>
        </section>

        <Button className="w-full" onClick={saveSettings}>Save Settings</Button>
      </div>
    </div>
  );
};

export default Settings;
