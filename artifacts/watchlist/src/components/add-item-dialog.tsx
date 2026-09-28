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
import { Film, Loader2, Search, Tv } from "lucide-react";

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
       <DialogContent className="max-h-[92dvh] overflow-y-auto border-border bg-card/95 p-4 backdrop-blur-xl sm:max-w-[500px] sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-foreground">Add to Watchlist</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Log a new film or series to track your cinematic journey.
          </DialogDescription>
        </DialogHeader>
         <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
           <div className="flex items-center gap-2 text-sm font-medium text-primary">
             <Search className="h-4 w-4" />
             Find it on TMDB
           </div>
           <Input
             value={tmdbQuery}
             onChange={(event) => setTmdbQuery(event.target.value)}
             placeholder="Search movies and series..."
             className="bg-background"
             data-testid="input-tmdb-search"
           />
           {tmdbQuery.trim().length === 1 && (
             <p className="text-xs text-muted-foreground">Type at least 2 characters to search.</p>
           )}
           {isSearching && (
             <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
               <Loader2 className="h-3.5 w-3.5 animate-spin" />
               Searching TMDB...
             </div>
           )}
           {isSearchError && (
             <p className="py-2 text-xs text-destructive">
               TMDB search is unavailable right now. You can still enter a title manually.
             </p>
           )}
           {!!tmdbResults?.length && (
             <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
               {tmdbResults.map((result) => (
                 <button
                   type="button"
                   key={`${result.type}-${result.id}`}
                   onClick={() => selectTmdbResult(result)}
                   className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-primary/10"
                   data-testid={`tmdb-result-${result.id}`}
                 >
                   <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-secondary">
                     {result.posterUrl ? (
                       <img src={result.posterUrl} alt="" className="h-full w-full object-cover" />
                     ) : (
                       <div className="flex h-full items-center justify-center text-muted-foreground">
                         {result.type === "movie" ? <Film className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
                       </div>
                     )}
                   </div>
                   <div className="min-w-0 flex-1">
                     <p className="truncate text-sm font-medium text-foreground">{result.title}</p>
                     <p className="text-xs capitalize text-muted-foreground">
                       {result.type} {result.year ? `• ${result.year}` : ""}
                     </p>
                   </div>
                   <span className="shrink-0 text-xs font-medium text-primary">Use</span>
                 </button>
               ))}
             </div>
           )}
           {tmdbQuery.trim().length >= 2 && !isSearching && !isSearchError && tmdbResults?.length === 0 && (
             <p className="py-2 text-xs text-muted-foreground">No TMDB matches found.</p>
           )}
         </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Inception" className="bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="series">Series</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="want_to_watch">Want to Watch</SelectItem>
                        <SelectItem value="watching">Watching</SelectItem>
                        <SelectItem value="watched">Watched</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Year (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="2010" type="number" className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Genre (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Sci-Fi" className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="posterUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Poster URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/poster.jpg" className="bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief synopsis..." 
                      className="resize-none bg-background h-20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                className="min-w-[120px] w-full sm:w-auto" 
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
