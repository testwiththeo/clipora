import { cn } from "@/lib/utils";

type ConfidenceLevel = "high" | "medium" | "low";

function scoreToConfidence(score: number): ConfidenceLevel {
  if (score >= 0.5) return "high";
  if (score >= 0.3) return "medium";
  return "low";
}

const confidenceConfig: Record<ConfidenceLevel, { label: string; className: string }> = {
  high: { label: "High", className: "bg-success/10 text-success border-success/20" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning border-warning/20" },
  low: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
};

interface ConfidenceBadgeProps {
  score: number;
  className?: string;
}

export function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  const level = scoreToConfidence(score);
  const config = confidenceConfig[level];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
