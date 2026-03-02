import { useState } from "react";
import Header from "@/components/Header";

const CarbonScanner = () => {
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="px-5 space-y-4 lg:max-w-5xl lg:mx-auto">
        <section className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">🔍 AI Carbon Scanner</h1>
          <p className="text-sm text-muted-foreground">Scan any product to get its full CO₂ lifecycle report</p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-3 shadow-card" style={{ boxShadow: "0 0 20px rgba(34,197,94,0.2)" }}>
          <div className="relative w-full overflow-hidden rounded-xl" style={{ height: "calc(100vh - 120px)" }}>
            {isFrameLoading && (
              <div className="absolute inset-0 z-10 animate-pulse rounded-xl border border-border bg-muted/60" />
            )}
            <iframe
              src="https://sanskar-image-analysis.vercel.app"
              title="Sanskar AI Carbon Intelligence Scanner"
              className="w-full h-full rounded-xl"
              style={{ border: "none" }}
              allow="camera; microphone"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              onLoad={() => setIsFrameLoading(false)}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default CarbonScanner;
