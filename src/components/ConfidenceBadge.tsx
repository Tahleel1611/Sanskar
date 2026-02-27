import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  level: "high" | "medium" | "low";
  reason?: string;
  onClick?: () => void;
}

const config = {
  high: { dot: "bg-primary", label: "High", bg: "bg-primary/10 text-primary" },
  medium: { dot: "bg-accent", label: "Med", bg: "bg-accent/10 text-accent-foreground" },
  low: { dot: "bg-destructive", label: "Low", bg: "bg-destructive/10 text-destructive" },
};

const ConfidenceBadge = ({ level, reason, onClick }: ConfidenceBadgeProps) => {
  const c = config[level];
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
        c.bg,
        onClick && "cursor-pointer hover:opacity-80"
      )}
      title={reason}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </button>
  );
};

export default ConfidenceBadge;
