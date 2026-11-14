import { WatchlistItemStatus } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status, className }: { status: WatchlistItemStatus, className?: string }) {
  const statusConfig = {
    want_to_watch: {
      label: "Plan to Watch",
      className: "bg-neutral-900/90 text-neutral-400 border-neutral-800",
    },
    watching: {
      label: "Watching",
      className: "bg-white text-black font-medium border-white/20",
    },
    watched: {
      label: "Watched",
      className: "bg-neutral-950 text-neutral-500 border-neutral-800",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`text-[10px] font-mono tracking-tight px-2 py-0.5 rounded-md ${config.className} ${className}`}>
      {config.label}
    </Badge>
  );
}
