import { useState } from "react";
import { ChevronLeft, ScanLine, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

const products = [
  { id: 1, category: "Cola", current: "Cola Bottle", alternative: "Fresh Lime Soda", reduction: "-48% CO₂" },
  { id: 2, category: "Packaged", current: "Packaged Chips", alternative: "Roasted Makhana", reduction: "-33% CO₂" },
  { id: 3, category: "Imported", current: "Imported Apple", alternative: "Local Guava", reduction: "-41% CO₂" },
  { id: 4, category: "Plastic", current: "Plastic Water Bottle", alternative: "Refill Steel Bottle", reduction: "-72% CO₂" },
  { id: 5, category: "Cola", current: "Soda Can", alternative: "Coconut Water", reduction: "-55% CO₂" },
  { id: 6, category: "Packaged", current: "Instant Noodles", alternative: "Homemade Pasta", reduction: "-40% CO₂" },
  { id: 7, category: "Imported", current: "Imported Orange", alternative: "Local Orange", reduction: "-38% CO₂" },
  { id: 8, category: "Plastic", current: "Plastic Bag", alternative: "Cloth Bag", reduction: "-90% CO₂" },
];

const categories = ["All", "Cola", "Packaged", "Imported", "Plastic"];

const AlternativeChooser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [index, setIndex] = useState(0);

  const filteredProducts =
    selectedCategory === "All" ? products : products.filter((p) => p.category === selectedCategory);

  const current = filteredProducts[index];

  const next = () => {
    setIndex((prev) => (prev + 1) % filteredProducts.length);
  };

  const previous = () => {
    setIndex((prev) => (prev === 0 ? filteredProducts.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;

    const handleTouchEnd = (e: React.TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) next();
      if (endX - startX > 50) previous();
      document.removeEventListener("touchend", handleTouchEnd as any);
    };

    document.addEventListener("touchend", handleTouchEnd as any);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Product Alternatives</h1>
            <p className="text-sm text-muted-foreground">Eco-friendly swaps for everyday products</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="rounded-xl bg-card border border-border p-2 flex items-center gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category);
                setIndex(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Card with Animated Scan Border */}
        <div className="rounded-xl bg-card p-4 shadow-card space-y-4" onTouchStart={handleTouchStart}>
          <div className="relative h-64 rounded-xl border-2 border-dashed border-primary overflow-hidden bg-muted/60 flex items-center justify-center">
            {/* Animated scan border */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-transparent opacity-0 animate-pulse" />

            {/* Animated corner brackets */}
            <div className="absolute inset-0">
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary" />

              {/* Scanning line animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse" style={{ animationDuration: "2s" }} />
            </div>

            <div className="text-center relative z-10">
              <ScanLine className="h-12 w-12 text-primary mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-foreground">{current.current}</p>
              <p className="text-xs text-muted-foreground mt-1">Point camera at barcode</p>
            </div>
          </div>

          {/* Alternative Card */}
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eco-Friendly Alternative</p>
            <p className="text-lg font-semibold text-foreground">{current.alternative}</p>
            <p className="text-sm text-primary font-bold">{current.reduction} Emissions</p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={previous}
              className="flex-1 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={next}
              className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Product Indicator Dots */}
          <div className="grid grid-cols-4 gap-2">
            {filteredProducts.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className={`h-10 rounded-md text-[10px] px-1.5 transition-colors font-medium truncate ${
                  itemIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {item.current.split(" ")[0]}
              </button>
            ))}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {index + 1} / {filteredProducts.length} • Swipe left/right or use buttons • {filteredProducts.length} alternatives available
          </p>
        </div>
      </div>
    </div>
  );
};


export default AlternativeChooser;
