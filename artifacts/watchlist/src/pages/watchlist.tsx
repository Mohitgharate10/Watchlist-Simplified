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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-white/[0.06]">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Collection</h1>
          <p className="text-xs text-neutral-500 font-mono">
            {total > 0 ? `${total} titles in your personal archive` : "Manage and track your personal archive."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportExportDialog />
        </div>
      </header>

      {/* Controls: Search, Sort & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#050505] p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full shrink-0 md:w-80 lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <Input
              placeholder="Search by title, genre, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-[#0a0a0a] border-white/10 text-xs text-white placeholder-neutral-500 rounded-lg focus-visible:ring-1 focus-visible:ring-white/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <Select
              value={sortKey}
              onValueChange={(val) => {
                setSortKey(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-white/10 text-xs text-neutral-300 rounded-lg">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border border-white/15 text-neutral-300 text-xs">
                <SelectItem value="updatedAt-desc" className="focus:bg-white/10 focus:text-white">Recently Updated</SelectItem>
                <SelectItem value="createdAt-desc" className="focus:bg-white/10 focus:text-white">Recently Added</SelectItem>
                <SelectItem value="title-asc" className="focus:bg-white/10 focus:text-white">Title (A - Z)</SelectItem>
                <SelectItem value="title-desc" className="focus:bg-white/10 focus:text-white">Title (Z - A)</SelectItem>
                <SelectItem value="rating-desc" className="focus:bg-white/10 focus:text-white">Highest Rating</SelectItem>
                <SelectItem value="year-desc" className="focus:bg-white/10 focus:text-white">Release Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 border-t border-white/[0.06] pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
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
              <ToggleGroupItem value="all" className="rounded-lg text-xs px-2.5 py-1 text-neutral-400 data-[state=on]:bg-white data-[state=on]:text-black data-[state=on]:font-semibold">All</ToggleGroupItem>
              <ToggleGroupItem value="want_to_watch" className="rounded-lg text-xs px-2.5 py-1 text-neutral-400 whitespace-nowrap data-[state=on]:bg-white data-[state=on]:text-black data-[state=on]:font-semibold">Plan to Watch</ToggleGroupItem>
              <ToggleGroupItem value="watching" className="rounded-lg text-xs px-2.5 py-1 text-neutral-400 data-[state=on]:bg-white data-[state=on]:text-black data-[state=on]:font-semibold">Watching</ToggleGroupItem>
              <ToggleGroupItem value="watched" className="rounded-lg text-xs px-2.5 py-1 text-neutral-400 data-[state=on]:bg-white data-[state=on]:text-black data-[state=on]:font-semibold">Watched</ToggleGroupItem>
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
            <ToggleGroupItem value="all" className="rounded-lg text-xs px-2.5 py-1 text-neutral-400 data-[state=on]:bg-white data-[state=on]:text-black data-[state=on]:font-semibold">All Types</ToggleGroupItem>
            <ToggleGroupItem value="movie" className="rounded-lg text-xs px-2.5 py-1 text-neutral-400 data-[state=on]:bg-white data-[state=on]:text-black data-[state=on]:font-semibold">Movies</ToggleGroupItem>
            <ToggleGroupItem value="series" className="rounded-lg text-xs px-2.5 py-1 text-neutral-400 data-[state=on]:bg-white data-[state=on]:text-black data-[state=on]:font-semibold">Series</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Grid of Items */}
      <div className="min-h-[50vh]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3 bg-[#050505] p-3 rounded-xl border border-white/[0.08]">
                <Skeleton className="aspect-[2/3] w-full rounded-lg bg-neutral-900" />
                <Skeleton className="h-4 w-3/4 bg-neutral-900" />
                <Skeleton className="h-3 w-1/2 bg-neutral-900" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-neutral-500 bg-[#050505] border border-white/[0.08] rounded-2xl">
            <div className="w-14 h-14 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center mb-4 text-neutral-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No items found</h3>
            <p className="text-xs text-neutral-500 max-w-sm">Try adjusting your search query or status filter to find what you're looking for.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
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
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <p className="text-xs font-mono text-neutral-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="gap-1 h-8 text-xs bg-[#080808] border-white/10 text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="text-xs font-mono text-neutral-400 px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="gap-1 h-8 text-xs bg-[#080808] border-white/10 text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg"
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
