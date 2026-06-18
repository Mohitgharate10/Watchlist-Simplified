import { useState } from "react";
import { useListItems, ListItemsStatus, ListItemsType } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { motion, AnimatePresence } from "framer-motion";

export function WatchlistPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListItemsStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ListItemsType | "all">("all");

  const { data: items, isLoading } = useListItems(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      type: typeFilter === "all" ? undefined : typeFilter,
    },
    { 
      query: { 
        queryKey: ["getListItems", { status: statusFilter === "all" ? undefined : statusFilter, type: typeFilter === "all" ? undefined : typeFilter }] 
      } 
    }
  );

  const filteredItems = items?.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    (item.genre && item.genre.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">Collection</h1>
        <p className="text-muted-foreground text-lg">Browse and manage your cinematic journal.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 rounded-lg bg-card/30 border border-border/50">
        <div className="relative w-full md:w-96 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search titles..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-start sm:items-center">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
            <ToggleGroup 
              type="single" 
              value={statusFilter} 
              onValueChange={(v) => v && setStatusFilter(v as ListItemsStatus | "all")}
              className="justify-start shrink-0 overflow-x-auto max-w-[calc(100vw-3rem)] sm:max-w-none pb-2 sm:pb-0"
            >
              <ToggleGroupItem value="all" className="rounded-full text-xs">All</ToggleGroupItem>
              <ToggleGroupItem value="want_to_watch" className="rounded-full text-xs whitespace-nowrap">Want to Watch</ToggleGroupItem>
              <ToggleGroupItem value="watching" className="rounded-full text-xs">Watching</ToggleGroupItem>
              <ToggleGroupItem value="watched" className="rounded-full text-xs">Watched</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="h-6 w-px bg-border hidden sm:block" />

          <ToggleGroup 
            type="single" 
            value={typeFilter} 
            onValueChange={(v) => v && setTypeFilter(v as ListItemsType | "all")}
            className="shrink-0"
          >
            <ToggleGroupItem value="all" className="rounded-full text-xs">All</ToggleGroupItem>
            <ToggleGroupItem value="movie" className="rounded-full text-xs">Movies</ToggleGroupItem>
            <ToggleGroupItem value="series" className="rounded-full text-xs">Series</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="min-h-[50vh]">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredItems?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif text-foreground mb-2">No items found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            <AnimatePresence>
              {filteredItems?.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ItemCard item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
