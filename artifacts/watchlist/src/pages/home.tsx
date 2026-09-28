import { useGetStats, useGetRecentItems } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Tv, Eye, CheckCircle2, List, Star } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function Home() {
  const { data: stats, isLoading: isStatsLoading } = useGetStats({
    query: { queryKey: ["getStats"] }
  });
  const { data: recentItems, isLoading: isRecentLoading } = useGetRecentItems(
    { limit: 6 },
    { query: { queryKey: ["getRecentItems", { limit: 6 }] } }
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl md:text-5xl">Overview</h1>
        <p className="text-base text-muted-foreground sm:text-lg">Your cinematic journey at a glance.</p>
      </header>

      <section className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-4">
        <StatCard 
          title="Total Titles" 
          value={isStatsLoading ? null : stats?.total} 
          icon={<Film className="w-4 h-4 text-muted-foreground" />} 
          delay={0}
        />
        <StatCard 
          title="Want to Watch" 
          value={isStatsLoading ? null : stats?.byStatus.want_to_watch} 
          icon={<List className="w-4 h-4 text-muted-foreground" />} 
          delay={0.1}
        />
        <StatCard 
          title="Watching" 
          value={isStatsLoading ? null : stats?.byStatus.watching} 
          icon={<Eye className="w-4 h-4 text-primary" />} 
          delay={0.2}
          highlight
        />
        <StatCard 
          title="Completed" 
          value={isStatsLoading ? null : stats?.byStatus.watched} 
          icon={<CheckCircle2 className="w-4 h-4 text-muted-foreground" />} 
          delay={0.3}
        />
      </section>

      <section className="grid gap-3 sm:gap-4 md:grid-cols-2">
         <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-muted-foreground font-normal">By Format</CardTitle>
            </CardHeader>
             <CardContent className="flex flex-wrap items-center gap-4 sm:gap-8">
              {isStatsLoading ? (
                <Skeleton className="w-full h-12" />
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Film className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-serif">{stats?.byType.movie || 0}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Movies</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Tv className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-serif">{stats?.byType.series || 0}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Series</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
         </Card>

         <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-muted-foreground font-normal">Average Rating</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              {isStatsLoading ? (
                <Skeleton className="w-24 h-12" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <p className="text-4xl font-serif">{stats?.averageRating ? stats.averageRating.toFixed(1) : "—"}</p>
                </>
              )}
            </CardContent>
         </Card>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif">Recently Added</h2>
        </div>

        {isRecentLoading ? (
           <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
            ))}
          </div>
        ) : recentItems?.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-serif mb-2">Your collection is empty</h3>
            <p className="text-muted-foreground">Start adding films and series to your watchlist.</p>
          </div>
        ) : (
           <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {recentItems?.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ItemCard item={item} compact />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon, delay, highlight = false }: { title: string, value: number | null | undefined, icon: React.ReactNode, delay: number, highlight?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className={`h-full ${highlight ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5' : 'bg-card/50 border-border/50'}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {value === undefined || value === null ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className={`text-3xl font-serif ${highlight ? 'text-primary' : 'text-foreground'}`}>
              {value}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
