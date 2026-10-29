import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateItem,
  useSearchTmdb,
  getListItemsQueryKey,
  getGetRecentItemsQueryKey,
  getGetStatsQueryKey,
  getSearchTmdbQueryKey,
  type TmdbSearchResult,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Check, Film, Loader2, Search, Tv, X } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["movie", "series"]),
  status: z.enum(["want_to_watch", "watching", "watched"]),
  posterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  year: z.coerce.number().min(1888).max(2100).optional().or(z.literal("")),
  genre: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddItemDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [selectedItemTitle, setSelectedItemTitle] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "movie",
      status: "want_to_watch",
      posterUrl: "",
      year: "",
      genre: "",
      description: "",
    },
  });

  const posterWatch = form.watch("posterUrl");

  const createItem = useCreateItem();
  const { data: tmdbResults, isLoading: isSearching, isError: isSearchError } = useSearchTmdb(
    { q: tmdbQuery.trim() },
    {
      query: {
        enabled: open && tmdbQuery.trim().length >= 2,
        queryKey: getSearchTmdbQueryKey({ q: tmdbQuery.trim() }),
      },
    },
  );

  function selectTmdbResult(result: TmdbSearchResult) {
    form.reset({
      title: result.title,
      type: result.type,
      status: "want_to_watch",
      posterUrl: result.posterUrl ?? "",
      year: result.year ?? "",
      genre: result.genre ?? "",
      description: result.description ?? "",
    });
    setSelectedItemTitle(result.title);
    setTmdbQuery("");
  }

  function onSubmit(values: FormValues) {
    createItem.mutate(
      {
        data: {
          title: values.title,
          type: values.type,
          status: values.status,
          posterUrl: values.posterUrl || undefined,
          year: values.year ? Number(values.year) : undefined,
          genre: values.genre || undefined,
          description: values.description || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Added to watchlist",
            description: `${values.title} has been added.`,
          });
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentItemsQueryKey({ limit: 6 }) });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
          setOpen(false);
          setTmdbQuery("");
          setSelectedItemTitle(null);
          form.reset();
        },
        onError: () => {
          toast({
            title: "Failed to add item",
            description: "An unexpected error occurred.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTmdbQuery("");
          setSelectedItemTitle(null);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl max-h-[88vh] overflow-y-auto p-4 sm:p-6 border-border bg-card/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1 pb-1">
          <DialogTitle className="font-serif text-lg sm:text-2xl text-foreground">Add to Watchlist</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Log a new film or series to track your cinematic journey.
          </DialogDescription>
        </DialogHeader>

        {/* TMDB Search Section */}
        <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Search className="h-3.5 w-3.5" />
              Find on TMDB
            </div>
            {selectedItemTitle && (
              <span className="flex items-center gap-1 text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                <Check className="h-3 w-3" /> Auto-filled: {selectedItemTitle}
              </span>
            )}
          </div>

          <div className="relative">
            <Input
              value={tmdbQuery}
              onChange={(event) => setTmdbQuery(event.target.value)}
              placeholder="Search title on TMDB..."
              className="h-9 bg-background/80 text-xs sm:text-sm pr-7"
              data-testid="input-tmdb-search"
            />
            {tmdbQuery && (
              <button
                type="button"
                onClick={() => setTmdbQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {tmdbQuery.trim().length === 1 && (
            <p className="text-[11px] text-muted-foreground">Type at least 2 characters to search.</p>
          )}

          {isSearching && (
            <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching TMDB...
            </div>
          )}

          {isSearchError && (
            <p className="py-1 text-xs text-destructive">
              TMDB search unavailable. You can enter details manually below.
            </p>
          )}

          {!!tmdbResults?.length && (
            <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
              {tmdbResults.map((result) => (
                <button
                  type="button"
                  key={`${result.type}-${result.id}`}
                  onClick={() => selectTmdbResult(result)}
                  className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-primary/10 group"
                  data-testid={`tmdb-result-${result.id}`}
                >
                  <div className="h-11 w-8 shrink-0 overflow-hidden rounded bg-secondary">
                    {result.posterUrl ? (
                      <img src={result.posterUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        {result.type === "movie" ? <Film className="h-3.5 w-3.5" /> : <Tv className="h-3.5 w-3.5" />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {result.title}
                    </p>
                    <p className="text-[11px] capitalize text-muted-foreground">
                      {result.type} {result.year ? `• ${result.year}` : ""} {result.genre ? `• ${result.genre}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    Use
                  </span>
                </button>
              ))}
            </div>
          )}

          {tmdbQuery.trim().length >= 2 && !isSearching && !isSearchError && tmdbResults?.length === 0 && (
            <p className="py-1 text-xs text-muted-foreground">No TMDB matches found.</p>
          )}
        </div>

        {/* Manual Form Entry */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-medium text-foreground">Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Inception" className="h-9 bg-background text-xs sm:text-sm" {...field} />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Quick Properties in 4-column responsive grid on desktop, 2-column on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-medium text-foreground">Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 bg-background text-xs sm:text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="series">Series</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-medium text-foreground">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 bg-background text-xs sm:text-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="want_to_watch">Want to Watch</SelectItem>
                        <SelectItem value="watching">Watching</SelectItem>
                        <SelectItem value="watched">Watched</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-medium text-foreground">Year</FormLabel>
                    <FormControl>
                      <Input placeholder="2024" type="number" className="h-9 bg-background text-xs sm:text-sm" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-medium text-foreground">Genre</FormLabel>
                    <FormControl>
                      <Input placeholder="Sci-Fi, Action" className="h-9 bg-background text-xs sm:text-sm" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Poster URL with live thumbnail */}
            <FormField
              control={form.control}
              name="posterUrl"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-medium text-foreground">Poster URL (Optional)</FormLabel>
                  <div className="flex gap-2 items-center">
                    {posterWatch && (
                      <div className="h-9 w-7 shrink-0 overflow-hidden rounded border border-border bg-secondary">
                        <img
                          src={posterWatch}
                          alt="Poster preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <FormControl>
                      <Input
                        placeholder="https://image.tmdb.org/t/p/w500/..."
                        className="h-9 bg-background text-xs sm:text-sm flex-1"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-medium text-foreground">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief synopsis or personal notes..."
                      className="resize-none bg-background text-xs sm:text-sm h-16 min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-9 px-3 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 px-5 text-xs sm:text-sm font-semibold min-w-[120px] shadow-sm"
                disabled={createItem.isPending}
                data-testid="button-submit-item"
              >
                {createItem.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Entry"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
