import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Car, Train, Bike, Footprints, Check, X, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface Trip {
  id: string;
  mode: string;
  icon: typeof Car;
  distance: number;
  co2: number;
  confidence: "high" | "medium" | "low";
  confidenceReason: string;
  time: string;
  confirmed: boolean;
}

const modeIcons: Record<string, typeof Car> = { car: Car, train: Train, bike: Bike, walk: Footprints };
const emissionFactors: Record<string, number> = { car: 0.21, train: 0.041, bike: 0, walk: 0 };

const mockTrips: Trip[] = [
  { id: "1", mode: "car", icon: Car, distance: 12.4, co2: 2.6, confidence: "high", confidenceReason: "GPS tracked + user confirmed", time: "8:15 AM", confirmed: true },
  { id: "2", mode: "train", icon: Train, distance: 8.0, co2: 0.33, confidence: "medium", confidenceReason: "GPS only — mode inferred from speed", time: "12:30 PM", confirmed: false },
  { id: "3", mode: "car", icon: Car, distance: 5.2, co2: 1.09, confidence: "low", confidenceReason: "Estimated from calendar event location", time: "3:45 PM", confirmed: false },
];

const Activity = () => {
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [explainTrip, setExplainTrip] = useState<Trip | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMode, setNewMode] = useState("car");
  const [newDistance, setNewDistance] = useState("");

  const confirmTrip = (id: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, confirmed: true, confidence: "high" as const, confidenceReason: "GPS + user confirmed" } : t
      )
    );
  };

  const dismissTrip = (id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const addTrip = () => {
    if (!newDistance) return;
    const dist = parseFloat(newDistance);
    const co2 = dist * emissionFactors[newMode];
    const trip: Trip = {
      id: Date.now().toString(),
      mode: newMode,
      icon: modeIcons[newMode],
      distance: dist,
      co2: parseFloat(co2.toFixed(2)),
      confidence: "high",
      confidenceReason: "Manually entered by user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confirmed: true,
    };
    setTrips((prev) => [trip, ...prev]);
    setShowAddForm(false);
    setNewDistance("");
  };

  const todayCo2 = trips.reduce((sum, t) => sum + t.co2, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-4">
        {/* Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl gradient-hero p-4">
          <p className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">Today's Transport</p>
          <p className="text-primary-foreground text-2xl font-bold mt-1">{todayCo2.toFixed(1)} kg CO₂</p>
          <p className="text-primary-foreground/70 text-xs mt-0.5">
            {trips.length} trips · {trips.filter((t) => !t.confirmed).length} pending confirmation
          </p>
        </motion.div>

        {/* Add trip */}
        <AnimatePresence>
          {showAddForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-card p-4 shadow-card space-y-3"
            >
              <p className="text-sm font-semibold text-foreground">Log a trip</p>
              <div className="flex gap-2">
                {Object.entries(modeIcons).map(([mode, Icon]) => (
                  <button
                    key={mode}
                    onClick={() => setNewMode(mode)}
                    className={`flex-1 flex flex-col items-center gap-1 rounded-lg p-2.5 text-xs font-medium transition-colors ${
                      newMode === mode ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {mode}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Distance (km)"
                value={newDistance}
                onChange={(e) => setNewDistance(e.target.value)}
                className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <Button onClick={addTrip} size="sm" className="flex-1">Add Trip</Button>
                <Button onClick={() => setShowAddForm(false)} size="sm" variant="ghost">Cancel</Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-3 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
            >
              <Plus className="h-4 w-4" /> Log a trip
            </motion.button>
          )}
        </AnimatePresence>

        {/* Trip list */}
        <div className="space-y-2.5">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today's Trips</p>
          {trips.map((trip, i) => {
            const Icon = trip.icon;
            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="rounded-xl bg-card p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-transport/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-transport" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground capitalize">{trip.mode}</span>
                      <ConfidenceBadge
                        level={trip.confidence}
                        reason={trip.confidenceReason}
                        onClick={() => setExplainTrip(trip)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {trip.distance} km · {trip.time}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{trip.co2} kg</p>
                    <p className="text-[10px] text-muted-foreground">CO₂</p>
                  </div>
                </div>

                {!trip.confirmed && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => confirmTrip(trip.id)}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Confirm
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => dismissTrip(trip.id)}>
                      <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Explain my number sheet */}
      <Sheet open={!!explainTrip} onOpenChange={() => setExplainTrip(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>How we calculated this</SheetTitle>
            <SheetDescription>Breakdown of the emission estimate</SheetDescription>
          </SheetHeader>
          {explainTrip && (
            <div className="space-y-4 mt-4">
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium text-foreground">{explainTrip.distance} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Emission factor ({explainTrip.mode})</span>
                  <span className="font-medium text-foreground">{emissionFactors[explainTrip.mode]} kg/km</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                  <span className="text-foreground">Total CO₂</span>
                  <span className="text-primary">{explainTrip.co2} kg</span>
                </div>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs font-semibold text-foreground mb-1">Confidence: {explainTrip.confidence}</p>
                <p className="text-xs text-muted-foreground">{explainTrip.confidenceReason}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Source: DEFRA 2024 emission factors · Updated monthly
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Activity;
