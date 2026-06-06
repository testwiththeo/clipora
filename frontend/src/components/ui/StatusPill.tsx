import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "error" | "secondary"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "secondary", icon: <Clock size={12} /> },
  importing: { label: "Importing", variant: "warning", icon: <Loader2 size={12} className="animate-spin" /> },
  transcript_ready: { label: "Transcript", variant: "success", icon: <CheckCircle2 size={12} /> },
  analyzing: { label: "Analyzing", variant: "warning", icon: <Loader2 size={12} className="animate-spin" /> },
  ready: { label: "Ready", variant: "success", icon: <CheckCircle2 size={12} /> },
  failed: { label: "Failed", variant: "error", icon: <AlertCircle size={12} /> },
};

interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: "secondary" as const,
    icon: null,
  };

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}
