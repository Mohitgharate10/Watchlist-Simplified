import { WatchlistItem, useUpdateItem, getListItemsQueryKey, getGetRecentItemsQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Film, Tv, MoreVertical, Plus } from "lucide-react";
import { StatusBadge } from "./status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

interface ItemCardProps {
  item: WatchlistItem;
  compact?: boolean;
}

export function ItemCard({ item, compact = false }: ItemCardProps) {
  const queryClient = useQueryClient();
  const updateItem = useUpdateItem();

  const handleStatusChange = (e: React.MouseEvent, status: "want_to_watch" | "watching" | "watched") => {
    e.preventDefault();
    e.stopPropagation();

    updateItem.mutate(
      { id: item.id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentItemsQueryKey({ limit: 6 }) });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        },
      }
    );
  };

  const handleIncrementEpisode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextEp = (item.episodeProgress ?? 0) + 1;
    updateItem.mutate(
      {
        id: item.id,
        data: {
          episodeProgress: nextEp,
          status: item.status === "want_to_watch" ? "watching" : item.status,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentItemsQueryKey({ limit: 6 }) });
        },
      }
    );
  };

  return (
    <Link href={`/item/${item.id}`} className="block group">
      <Card className="h-full overflow-hidden bg-card/30 border-border/40 hover:border-primary/50 transition-colors duration-300 relative">
        <div className="absolute right-2 top-2 z-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border">
                <MoreVertical className="w-4 h-4 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => handleStatusChange(e, "want_to_watch")} disabled={item.status === "want_to_watch"}>
                Want to Watch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleStatusChange(e, "watching")} disabled={item.status === "watching"}>
                Watching
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleStatusChange(e, "watched")} disabled={item.status === "watched"}>
                Watched
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="aspect-[2/3] w-full relative bg-muted overflow-hidden">
          {item.posterUrl ? (
            <img
              src={item.posterUrl}
              alt={`Poster for ${item.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 bg-secondary/30">
              {item.type === "movie" ? <Film className="w-12 h-12 mb-2" /> : <Tv className="w-12 h-12 mb-2" />}
              <span className="font-serif text-sm px-4 text-center">{item.title}</span>
            </div>
          )}

          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5 items-start">
            <StatusBadge status={item.status} className="shadow-lg backdrop-blur-md bg-background/80" />
            {item.type === "series" && (
              <span className="rounded-md bg-background/90 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-primary border border-border/40 shadow-sm">
                S{item.seasonProgress || 1} · Ep {item.episodeProgress ?? 0}
              </span>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <CardContent className={`p-4 ${compact ? "hidden" : ""}`}>
          <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 font-serif text-base leading-tight line-clamp-2 text-foreground transition-colors group-hover:text-primary sm:text-lg">
              {item.title}
            </h3>
            {item.rating && (
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary sm:px-2 sm:text-xs">
                <Star className="w-3 h-3 fill-current" />
                {item.rating}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate text-xs sm:text-sm">
              <span className="capitalize">{item.type}</span>
              {(item.year || item.genre) && <span className="w-1 h-1 rounded-full bg-border" />}
              {item.year && <span>{item.year}</span>}
              {item.genre && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="truncate max-w-[120px]">{item.genre}</span>
                </>
              )}
            </div>

            {item.type === "series" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px] font-medium text-primary hover:text-primary hover:bg-primary/10 rounded"
                onClick={handleIncrementEpisode}
                title="Increment episode watched"
              >
                <Plus className="w-3 h-3 mr-0.5" />
                Ep
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
