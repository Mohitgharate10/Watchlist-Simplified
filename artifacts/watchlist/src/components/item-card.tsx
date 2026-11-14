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
      <Card className="h-full overflow-hidden bg-[#050505] border border-white/[0.08] hover:border-white/20 hover:bg-[#0a0a0a] transition-all duration-200 rounded-xl relative flex flex-col justify-between">
        <div className="absolute right-2 top-2 z-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="secondary" size="icon" className="w-7 h-7 rounded-lg bg-black/80 backdrop-blur-sm border border-white/15 text-neutral-300 hover:text-white">
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-[#0a0a0a] border border-white/15 text-neutral-300">
              <DropdownMenuLabel className="text-neutral-500 text-xs">Set Status</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={(e) => handleStatusChange(e, "want_to_watch")} disabled={item.status === "want_to_watch"} className="text-xs focus:bg-white/10 focus:text-white">
                Want to Watch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleStatusChange(e, "watching")} disabled={item.status === "watching"} className="text-xs focus:bg-white/10 focus:text-white">
                Watching
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleStatusChange(e, "watched")} disabled={item.status === "watched"} className="text-xs focus:bg-white/10 focus:text-white">
                Watched
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <div className="aspect-[16/10] sm:aspect-[2/3] w-full relative bg-black overflow-hidden">
            {item.posterUrl ? (
              <img
                src={item.posterUrl}
                alt={`Poster for ${item.title}`}
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 bg-neutral-950">
                {item.type === "movie" ? <Film className="w-10 h-10 mb-2 opacity-40" /> : <Tv className="w-10 h-10 mb-2 opacity-40" />}
                <span className="font-mono text-xs px-4 text-center text-neutral-500">{item.title}</span>
              </div>
            )}

            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
              {item.rating && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/85 backdrop-blur-md text-white border border-white/15 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current text-white" />
                  {item.rating}
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-neutral-900/90 text-neutral-400 border border-white/10">
                {item.type}
              </span>
            </div>

            <div className="absolute top-2 right-2 z-10 md:group-hover:opacity-0 transition-opacity">
              <StatusBadge status={item.status} className="shadow-lg backdrop-blur-md" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90" />
          </div>

          <CardContent className={`p-3.5 ${compact ? "hidden" : ""}`}>
            <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 font-medium text-sm leading-snug line-clamp-1 text-white group-hover:underline">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-light truncate">
              {item.year && <span>{item.year}</span>}
              {(item.year && item.genre) && <span>•</span>}
              {item.genre && <span className="truncate">{item.genre}</span>}
            </div>

            {/* Season & Episode Progress for Series */}
            {item.type === "series" && (
              <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1.5">
                  <span>S{item.seasonProgress || 1}</span>
                  <span>Ep {item.episodeProgress ?? 0}{item.totalEpisodes ? ` of ${item.totalEpisodes}` : ""}</span>
                </div>
                
                {item.totalEpisodes && item.totalEpisodes > 0 ? (
                  <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden mb-2">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round(((item.episodeProgress ?? 0) / item.totalEpisodes) * 100))}%`,
                      }}
                    />
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-0.5">
                  <StatusBadge status={item.status} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] font-mono bg-white/[0.06] hover:bg-white/15 text-white rounded border border-white/10 active:scale-95 transition"
                    onClick={handleIncrementEpisode}
                    title="Increment episode watched"
                  >
                    <Plus className="w-2.5 h-2.5 mr-1" />
                    +1 Ep
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
