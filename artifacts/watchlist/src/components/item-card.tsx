import { WatchlistItem, useUpdateItem, getListItemsQueryKey, getGetRecentItemsQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Film, Tv, MoreVertical } from "lucide-react";
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
        }
      }
    );
  };

  return (
    <Link href={`/item/${item.id}`} className="block group">
      <Card className="h-full overflow-hidden bg-card/30 border-border/40 hover:border-primary/50 transition-colors duration-300 relative">
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
          
          <div className="absolute top-2 left-2 z-10">
            <StatusBadge status={item.status} className="shadow-lg backdrop-blur-md bg-background/80" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <CardContent className={`p-4 ${compact ? 'hidden' : ''}`}>
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-serif text-lg leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            {item.rating && (
              <div className="flex items-center gap-1 shrink-0 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                <Star className="w-3 h-3 fill-current" />
                {item.rating}
              </div>
            )}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <span className="capitalize">{item.type}</span>
            {(item.year || item.genre) && <span className="w-1 h-1 rounded-full bg-border" />}
            {item.year && <span>{item.year}</span>}
            {item.genre && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="truncate">{item.genre}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
