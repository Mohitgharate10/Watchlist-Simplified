import { WatchlistItemStatus } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status, className }: { status: WatchlistItemStatus, className?: string }) {
  const statusConfig = {
    want_to_watch: {
      label: "Want to Watch",
      className: "bg-secondary text-secondary-foreground hover:bg-secondary border-transparent",
    },
    watching: {
      label: "Watching",
      className: "bg-primary/20 text-primary hover:bg-primary/30 border-primary/30",
    },
    watched: {
      label: "Watched",
      className: "bg-muted text-muted-foreground hover:bg-muted border-transparent",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`font-medium ${config.className} ${className}`}>
      {config.label}
    </Badge>
  );
}
