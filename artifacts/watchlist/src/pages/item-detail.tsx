import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetItem, 
  useUpdateItem, 
  useDeleteItem, 
  getGetItemQueryKey,
  WatchlistItemStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, Star, Trash2, Calendar, Film, Tv, Clock, Edit2 } from "lucide-react";
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
      enabled: !!id,
      queryKey: getGetItemQueryKey(id)
    }
  });

  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

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
          }
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
        }
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
        }
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
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => setLocation("/watchlist")}
        className="gap-2 text-muted-foreground hover:text-foreground pl-0"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Watchlist
      </Button>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Column: Poster & Actions */}
        <div className="w-full lg:w-[350px] shrink-0 space-y-6">
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted border border-border/50 shadow-2xl relative">
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

          <div className="grid grid-cols-2 gap-4">
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
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(r => (
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
        </div>

        {/* Right Column: Info & Notes */}
        <div className="flex-1 space-y-8">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight text-foreground">
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
                <p className="text-muted-foreground leading-relaxed text-lg bg-card/20 p-6 rounded-lg border border-border/40">
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
                className="min-h-[250px] resize-y bg-card/30 border-border/50 text-base leading-relaxed p-6 placeholder:text-muted-foreground/30 focus-visible:ring-primary/20"
              />
            </section>

            <div className="text-sm text-muted-foreground pt-8 border-t border-border/50">
              Added on {format(new Date(item.createdAt), 'MMMM d, yyyy')}
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
