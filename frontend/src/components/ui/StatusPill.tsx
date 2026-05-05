import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    color: "bg-content-muted/10 text-content-muted",
    icon: <Clock size={12} />,
  },
  importing: {
    label: "Importing",
    color: "bg-accent-muted/30 text-accent",
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  transcript_ready: {
    label: "Transcript",
    color: "bg-status-success/10 text-status-success",
    icon: <CheckCircle2 size={12} />,
  },
  analyzing: {
    label: "Analyzing",
    color: "bg-accent-muted/30 text-accent",
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  ready: {
    label: "Ready",
    color: "bg-status-success/10 text-status-success",
    icon: <CheckCircle2 size={12} />,
  },
  failed: {
    label: "Failed",
    color: "bg-status-error/10 text-status-error",
    icon: <AlertCircle size={12} />,
  },
};

interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const config = statusConfig[status] ?? {
    label: status,
    color: "bg-content-muted/10 text-content-muted",
    icon: null,
  };

  return (
    <span className={`status-pill ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
