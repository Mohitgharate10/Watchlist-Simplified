import { useGetStats, useGetRecentItems } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Tv, Eye, CheckCircle2, List, Star, ShieldCheck, Sparkles } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthDialog } from "@/components/auth-dialog";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export function Home() {
  const { user } = useAuth();

  const { data: stats, isLoading: isStatsLoading } = useGetStats({
    query: {
      enabled: !!user,
      queryKey: ["getStats"],
    },
  });

  const { data: recentItems, isLoading: isRecentLoading } = useGetRecentItems(
    { limit: 6 },
    {
      query: {
        enabled: !!user,
        queryKey: ["getRecentItems", { limit: 6 }],
      },
    }
  );

  if (!user) {
    return (
      <div className="space-y-8 sm:space-y-12 max-w-4xl mx-auto py-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-white/10 text-xs font-mono text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-white" /> Private & Synchronized Cinema Archive
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-white font-bold tracking-tight">
            Track Every Film & Series
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
            Your personalized cinematic journal. Log what you want to watch, track episode progress, discover streaming availability, and organize your favorite titles.
          </p>
          <div className="pt-2">
            <AuthDialog
              trigger={
                <Button size="lg" className="px-8 font-semibold bg-white text-black hover:bg-neutral-200 h-11 text-sm rounded-xl shadow-xl shadow-white/5 transition-all">
                  Get Started — Free
                </Button>
              }
            />
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Card className="bg-[#050505] border-white/[0.08] hover:border-white/20 transition-all rounded-xl">
            <CardHeader className="pb-2">
              <Film className="w-5 h-5 text-white mb-1" />
              <CardTitle className="text-sm font-semibold text-white">TMDB Powered</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-neutral-400 leading-relaxed font-light">
              Auto-fill posters, release years, synopsis, and genres with instant TMDB metadata lookup.
            </CardContent>
          </Card>

          <Card className="bg-[#050505] border-white/[0.08] hover:border-white/20 transition-all rounded-xl">
            <CardHeader className="pb-2">
              <Tv className="w-5 h-5 text-white mb-1" />
              <CardTitle className="text-sm font-semibold text-white">Series Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-neutral-400 leading-relaxed font-light">
              Track season and episode progress with 1-click episode counters and status updates.
            </CardContent>
          </Card>

          <Card className="bg-[#050505] border-white/[0.08] hover:border-white/20 transition-all rounded-xl">
            <CardHeader className="pb-2">
              <ShieldCheck className="w-5 h-5 text-white mb-1" />
              <CardTitle className="text-sm font-semibold text-white">Private & Isolated</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-neutral-400 leading-relaxed font-light">
              Your collection is strictly private to your account with backup import and export support.
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="space-y-1 pb-4 border-b border-white/[0.06]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Welcome back, {user.username}
        </h1>
        <p className="text-xs text-neutral-500 font-mono">Your cinema collection at a glance.</p>
      </header>

      <section className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-4">
        <StatCard
          title="Total Titles"
          value={isStatsLoading ? null : stats?.total}
          icon={<Film className="w-4 h-4 text-neutral-500" />}
          delay={0}
        />
        <StatCard
          title="Plan to Watch"
          value={isStatsLoading ? null : stats?.byStatus.want_to_watch}
          icon={<List className="w-4 h-4 text-neutral-500" />}
          delay={0.1}
        />
        <StatCard
          title="Watching"
          value={isStatsLoading ? null : stats?.byStatus.watching}
          icon={<Eye className="w-4 h-4 text-white" />}
          delay={0.2}
          highlight
        />
        <StatCard
          title="Completed"
          value={isStatsLoading ? null : stats?.byStatus.watched}
          icon={<CheckCircle2 className="w-4 h-4 text-neutral-500" />}
          delay={0.3}
        />
      </section>

      <section className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card className="bg-[#050505] border-white/[0.08] rounded-xl p-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-medium">By Format</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6 sm:gap-10 pt-2">
            {isStatsLoading ? (
              <Skeleton className="w-full h-12 bg-neutral-900" />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center">
                    <Film className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-mono text-white">{stats?.byType.movie || 0}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Movies</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center">
                    <Tv className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-mono text-white">{stats?.byType.series || 0}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Series</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#050505] border-white/[0.08] rounded-xl p-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            {isStatsLoading ? (
              <Skeleton className="w-24 h-12 bg-neutral-900" />
            ) : (
              <>
                <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center text-white">
                  <Star className="w-4 h-4 fill-current text-white" />
                </div>
                <p className="text-2xl font-bold font-mono text-white">{stats?.averageRating ? stats.averageRating.toFixed(1) : "—"}</p>
                <span className="text-xs text-neutral-500 font-mono">/ 10</span>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold tracking-tight text-white">Recently Added</h2>
        </div>

        {isRecentLoading ? (
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl bg-neutral-900" />
            ))}
          </div>
        ) : recentItems?.length === 0 ? (
          <div className="text-center py-16 border border-white/[0.08] rounded-xl bg-[#050505]">
            <Film className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">Your collection is empty</h3>
            <p className="text-xs text-neutral-500">Start adding films and series to your watchlist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {recentItems?.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
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

function StatCard({
  title,
  value,
  icon,
  delay,
  highlight = false,
}: {
  title: string;
  value: number | null | undefined;
  icon: React.ReactNode;
  delay: number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
    >
      <Card
        className={`h-full rounded-xl transition-all ${
          highlight
            ? "bg-[#0c0c0c] border-white/20 shadow-md"
            : "bg-[#050505] border-white/[0.08] hover:border-white/15"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {value === undefined || value === null ? (
            <Skeleton className="h-7 w-14 bg-neutral-900" />
          ) : (
            <div className="text-2xl font-bold font-mono tracking-tight text-white">
              {value}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
