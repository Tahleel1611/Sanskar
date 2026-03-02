import { Link } from "react-router-dom";
import Header from "@/components/Header";

const faqs = [
  { q: "How is my carbon footprint calculated?", a: "We estimate emissions based on transport, food, energy, and consumption actions you log." },
  { q: "Why do I see confidence levels?", a: "Confidence shows how certain the app is about detected activities from sensor and manual data." },
  { q: "Can I edit incorrect activity detections?", a: "Yes. Use the Choices page to confirm, dismiss, or log activities manually." },
];

const Help = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-4 lg:max-w-3xl lg:mx-auto">
        <div>
          <h1 className="text-xl font-bold text-foreground">Help & FAQ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Find guides, troubleshooting tips, and support options.</p>
        </div>

        <section className="rounded-xl bg-card border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Frequently Asked Questions</h2>
          {faqs.map((item) => (
            <div key={item.q} className="rounded-lg bg-muted/50 border border-border p-3">
              <p className="text-sm font-semibold text-foreground">{item.q}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.a}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl bg-card border border-border p-4 space-y-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">How-to Guides</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Log trips and manual activities in Choices.</li>
            <li>Use Product Alternatives to compare eco-friendly swaps.</li>
            <li>Track your progress and rewards in Leaderboard/Profile.</li>
          </ul>
        </section>

        <section className="rounded-xl bg-card border border-border p-4 space-y-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact Support</h2>
          <p className="text-sm text-muted-foreground">Email support@sanskar.app for account and app assistance.</p>
        </section>

        <section className="rounded-xl bg-card border border-border p-4">
          <Link to="/learn" className="text-sm font-semibold text-primary hover:underline">Watch tutorial videos in Educate →</Link>
        </section>
      </div>
    </div>
  );
};

export default Help;
