import { useState } from "react";
import { useListItems, ListItemsStatus, ListItemsType } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImportExportDialog } from "@/components/import-export-dialog";
import { AuthDialog } from "@/components/auth-dialog";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

export function WatchlistPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListItemsStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ListItemsType | "all">("all");
  const [sortKey, setSortKey] = useState<string>("updatedAt-desc");
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const [sortBy, sortOrder] = sortKey.split("-") as [
    "updatedAt" | "createdAt" | "title" | "year" | "rating",
    "asc" | "desc",
  ];

  const { data, isLoading } = useListItems(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      type: typeFilter === "all" ? undefined : typeFilter,
      search: search.trim() ? search.trim() : undefined,
      sortBy,
      sortOrder,
      page,
      pageSize,
    },
    {
      query: {
        enabled: !!user,
        queryKey: [
          "getListItems",
          {
            status: statusFilter === "all" ? undefined : statusFilter,
            type: typeFilter === "all" ? undefined : typeFilter,
            search: search.trim() ? search.trim() : undefined,
            sortBy,
            sortOrder,
            page,
            pageSize,
          },
        ],
      },
    }
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleFilterChange = () => {
    setPage(1);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5 text-primary shadow-lg shadow-primary/10">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium mb-3 text-foreground">
          Private Watchlist Collection
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
          Your collection is private and synchronized to your personal account. Sign in or register to browse, search, and manage your watchlist.
        </p>
        <AuthDialog
          trigger={
            <Button size="lg" className="px-6 font-medium shadow-lg shadow-primary/20">
              Sign In / Create Account
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl md:text-5xl">Collection</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {total > 0 ? `${total} titles in your cinematic journal` : "Browse and manage your cinematic journal."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportExportDialog />
        </div>
      </header>

      {/* Controls: Search, Sort & Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/30 p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full shrink-0 md:w-80 lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, genre, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-background/50 border-border"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select
              value={sortKey}
              onValueChange={(val) => {
                setSortKey(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] bg-background/50 text-xs sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                <SelectItem value="createdAt-desc">Recently Added</SelectItem>
                <SelectItem value="title-asc">Title (A - Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z - A)</SelectItem>
                <SelectItem value="rating-desc">Highest Rating</SelectItem>
                <SelectItem value="year-desc">Release Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 border-t border-border/30 pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={(v) => {
                if (v) {
                  setStatusFilter(v as ListItemsStatus | "all");
                  handleFilterChange();
                }
              }}
              className="min-w-0 flex-1 justify-start overflow-x-auto pb-1"
            >
              <ToggleGroupItem value="all" className="rounded-full text-xs">All</ToggleGroupItem>
              <ToggleGroupItem value="want_to_watch" className="rounded-full text-xs whitespace-nowrap">Want to Watch</ToggleGroupItem>
              <ToggleGroupItem value="watching" className="rounded-full text-xs">Watching</ToggleGroupItem>
              <ToggleGroupItem value="watched" className="rounded-full text-xs">Watched</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <ToggleGroup
            type="single"
            value={typeFilter}
            onValueChange={(v) => {
              if (v) {
                setTypeFilter(v as ListItemsType | "all");
                handleFilterChange();
              }
            }}
            className="shrink-0 self-start md:self-auto"
          >
            <ToggleGroupItem value="all" className="rounded-full text-xs">All Types</ToggleGroupItem>
            <ToggleGroupItem value="movie" className="rounded-full text-xs">Movies</ToggleGroupItem>
            <ToggleGroupItem value="series" className="rounded-full text-xs">Series</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Grid of Items */}
      <div className="min-h-[50vh]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif text-foreground mb-2">No items found</h3>
            <p>Try adjusting your search query or status filter to find what you're looking for.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            <AnimatePresence>
              {items.map((item) => (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="gap-1 h-8 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="text-xs font-medium px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="gap-1 h-8 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
