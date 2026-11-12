import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetItem,
  useUpdateItem,
  useDeleteItem,
  useRefreshItemFromTmdb,
  useGetWatchProviders,
  getGetItemQueryKey,
  getGetWatchProvidersQueryKey,
  WatchlistItemStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  ArrowLeft,
  Star,
  Trash2,
  Calendar,
  Film,
  Tv,
  Clock,
  Edit2,
  RefreshCw,
  Tv2,
  Plus,
  Minus,
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function ItemDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState("");
  const [debouncedNotes, setDebouncedNotes] = useState("");

  const { data: item, isLoading } = useGetItem(id, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: getGetItemQueryKey(id),
    },
  });

  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const refreshItem = useRefreshItemFromTmdb();

  // Watch providers query
  const { data: watchProviders, isLoading: isLoadingProviders } = useGetWatchProviders(
    item?.type ?? "movie",
    item?.tmdbId ?? 0,
    {
      query: {
        queryKey: getGetWatchProvidersQueryKey(item?.type ?? "movie", item?.tmdbId ?? 0),
        enabled: !!item?.tmdbId,
      },
    }
  );

  // Handle note debouncing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNotes(notes), 1000);
    return () => clearTimeout(timer);
  }, [notes]);

  // Init + auto-save guard pattern for notes
  const initializedForId = useRef<number | null>(null);
  const lastSavedNotes = useRef<string | null>("");

  useEffect(() => {
    if (item && initializedForId.current !== id) {
      initializedForId.current = id;
      setNotes(item.notes || "");
      lastSavedNotes.current = item.notes || "";
    }
  }, [item, id]);

  const mutateFnRef = useRef(updateItem.mutate);
  mutateFnRef.current = updateItem.mutate;

  useEffect(() => {
    if (initializedForId.current !== id) return;
    if (debouncedNotes !== lastSavedNotes.current) {
      mutateFnRef.current(
        { id, data: { notes: debouncedNotes } },
        {
          onSuccess: (data) => {
            lastSavedNotes.current = data.notes ?? null;
            queryClient.setQueryData(getGetItemQueryKey(id), data);
          },
        }
      );
    }
  }, [debouncedNotes, id, queryClient]);

  if (isLoading || !item) {
    return <ItemDetailSkeleton />;
  }

  const handleStatusChange = (status: WatchlistItemStatus) => {
    updateItem.mutate(
      { id, data: { status } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetItemQueryKey(id), data);
          toast({ title: "Status updated" });
        },
      }
    );
  };

  const handleRatingChange = (ratingStr: string) => {
    const rating = ratingStr === "none" ? undefined : Number(ratingStr);
    updateItem.mutate(
      { id, data: { rating } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetItemQueryKey(id), data);
          toast({ title: "Rating updated" });
        },
      }
    );
  };

  const handleProgressChange = (season: number, episode: number) => {
    const validSeason = Math.max(1, season);
    const validEpisode = Math.max(0, episode);
    updateItem.mutate(
      {
        id,
        data: {
          seasonProgress: validSeason,
          episodeProgress: validEpisode,
          status: item.status === "want_to_watch" ? "watching" : item.status,
        },
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetItemQueryKey(id), data);
          toast({ title: `Progress updated: S${validSeason} E${validEpisode}` });
        },
      }
    );
  };

  const handleRefresh = () => {
    refreshItem.mutate(
      { id },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetItemQueryKey(id), data);
          toast({ title: "Refreshed from TMDB", description: "Latest metadata updated successfully." });
        },
        onError: (err: any) => {
          toast({
            title: "Refresh failed",
            description: err.message || "Failed to fetch updated data from TMDB.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteItem.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Item deleted" });
          setLocation("/watchlist");
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-500 sm:space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setLocation("/watchlist")}
          className="gap-2 pl-0 text-sm text-muted-foreground hover:text-foreground sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Watchlist
        </Button>

        {item.tmdbId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshItem.isPending}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshItem.isPending ? "animate-spin" : ""}`} />
            Refresh TMDB
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
        {/* Left Column: Poster & Actions */}
        <div className="w-full shrink-0 space-y-6 lg:w-[350px]">
          <div className="mx-auto aspect-[2/3] w-full max-w-[280px] overflow-hidden rounded-lg border border-border/50 bg-muted shadow-2xl relative sm:max-w-[350px] lg:mx-0 lg:max-w-none">
            {item.posterUrl ? (
              <img
                src={item.posterUrl}
                alt={`Poster for ${item.title}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-secondary/20">
                {item.type === "movie" ? <Film className="w-24 h-24" /> : <Tv className="w-24 h-24" />}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">Status</label>
              <Select value={item.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want_to_watch">Want to Watch</SelectItem>
                  <SelectItem value="watching">Watching</SelectItem>
                  <SelectItem value="watched">Watched</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">Rating</label>
              <Select value={item.rating?.toString() || "none"} onValueChange={handleRatingChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Not rated" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not rated</SelectItem>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                    <SelectItem key={r} value={r.toString()}>
                      <div className="flex items-center gap-2">
                        {r} <Star className="w-3 h-3 fill-primary text-primary" />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Series Progress Card */}
          {item.type === "series" && (
            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <Tv2 className="w-4 h-4 text-primary" /> Episode Progress
                </span>
                <span className="text-xs font-mono text-primary font-bold">
                  S{item.seasonProgress || 1} : E{item.episodeProgress ?? 0}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Season</label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      value={item.seasonProgress || 1}
                      onChange={(e) =>
                        handleProgressChange(Number(e.target.value), item.episodeProgress ?? 0)
                      }
                      className="h-8 text-center bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Episode</label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() =>
                        handleProgressChange(item.seasonProgress || 1, (item.episodeProgress ?? 0) - 1)
                      }
                      disabled={(item.episodeProgress ?? 0) <= 0}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={item.episodeProgress ?? 0}
                      onChange={(e) =>
                        handleProgressChange(item.seasonProgress || 1, Number(e.target.value))
                      }
                      className="h-8 text-center bg-background"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() =>
                        handleProgressChange(item.seasonProgress || 1, (item.episodeProgress ?? 0) + 1)
                      }
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Where to Watch Section */}
          {item.tmdbId && (
            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-primary" /> Where to Watch
                </h4>
                {watchProviders?.link && (
                  <a
                    href={watchProviders.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    TMDB <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {isLoadingProviders ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : watchProviders &&
                ((watchProviders.streaming && watchProviders.streaming.length > 0) ||
                  (watchProviders.rent && watchProviders.rent.length > 0) ||
                  (watchProviders.buy && watchProviders.buy.length > 0)) ? (
                <div className="space-y-3">
                  {watchProviders.streaming && watchProviders.streaming.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Stream
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {watchProviders.streaming.map((provider) => (
                          <div
                            key={provider.providerId ?? provider.name}
                            className="flex items-center gap-1.5 bg-background/80 border border-border/60 rounded px-2 py-1 text-xs"
                            title={provider.name}
                          >
                            {provider.logoUrl && (
                              <img
                                src={provider.logoUrl}
                                alt={provider.name}
                                className="w-4 h-4 rounded-sm object-contain"
                              />
                            )}
                            <span className="font-medium text-[11px]">{provider.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {watchProviders.rent && watchProviders.rent.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Rent
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {watchProviders.rent.slice(0, 4).map((provider) => (
                          <div
                            key={provider.providerId ?? provider.name}
                            className="flex items-center gap-1.5 bg-background/60 border border-border/40 rounded px-2 py-1 text-[11px]"
                          >
                            {provider.logoUrl && (
                              <img
                                src={provider.logoUrl}
                                alt={provider.name}
                                className="w-3.5 h-3.5 rounded-sm object-contain"
                              />
                            )}
                            <span>{provider.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No streaming providers listed for this region. Check the TMDB link for more options.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Info & Notes */}
        <div className="min-w-0 flex-1 space-y-6 sm:space-y-8">
          <div>
            <div className="mb-4 flex items-start justify-between gap-3 sm:gap-4">
              <h1 className="min-w-0 flex-1 font-serif text-3xl leading-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                {item.title}
              </h1>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete from watchlist?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove "{item.title}" from your collection. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-muted-foreground font-medium mb-6">
              <StatusBadge status={item.status} />
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <div className="flex items-center gap-1.5">
                {item.type === "movie" ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                <span className="capitalize">{item.type}</span>
              </div>

              {item.year && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{item.year}</span>
                  </div>
                </>
              )}

              {item.rating && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  <div className="flex items-center gap-1.5 text-primary">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{item.rating} / 10</span>
                  </div>
                </>
              )}
            </div>

            {item.genre && (
              <div className="inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm font-medium mb-8">
                {item.genre}
              </div>
            )}
          </div>

          <div className="space-y-8">
            {item.description && (
              <section>
                <h3 className="text-xl font-serif mb-3 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-muted-foreground" />
                  Synopsis
                </h3>
                <p className="rounded-lg border border-border/40 bg-card/20 p-4 text-base leading-relaxed text-muted-foreground sm:p-6 sm:text-lg">
                  {item.description}
                </p>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-serif">Journal Notes</h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {debouncedNotes !== notes ? "Saving..." : "Saved"}
                </span>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your thoughts, reviews, or favorite quotes..."
                className="min-h-[220px] resize-y bg-card/30 border-border/50 p-4 text-base leading-relaxed placeholder:text-muted-foreground/30 focus-visible:ring-primary/20 sm:min-h-[250px] sm:p-6"
              />
            </section>

            <div className="text-sm text-muted-foreground pt-8 border-t border-border/50">
              Added on {format(new Date(item.createdAt), "MMMM d, yyyy")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemDetailSkeleton() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Skeleton className="w-32 h-10" />
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="w-full lg:w-[350px] shrink-0 space-y-6">
          <Skeleton className="aspect-[2/3] rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
        <div className="flex-1 space-y-8">
          <div>
            <Skeleton className="h-16 w-3/4 mb-4" />
            <Skeleton className="h-8 w-1/2 mb-6" />
            <Skeleton className="h-8 w-24 mb-8" />
          </div>
          <div className="space-y-8">
            <section>
              <Skeleton className="h-8 w-32 mb-3" />
              <Skeleton className="h-32 w-full" />
            </section>
            <section>
              <Skeleton className="h-8 w-40 mb-3" />
              <Skeleton className="h-64 w-full" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
