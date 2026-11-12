import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileUp, Loader2 } from "lucide-react";
import { useImportWatchlist, WatchlistItemInput, WatchlistItemInputType, WatchlistItemInputStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function ImportExportDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const importMutation = useImportWatchlist();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/watchlist/export", { headers });
      if (!res.ok) throw new Error("Failed to export watchlist");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watchlist-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export downloaded", description: "Your watchlist has been saved." });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message || "Failed to download export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      if (!Array.isArray(items)) {
        throw new Error("Invalid format: expected a JSON array of watchlist items.");
      }

      // Map items to match WatchlistItemInput
      const payload: WatchlistItemInput[] = items.map((item: any) => ({
        title: item.title,
        type: (item.type === "series" ? "series" : "movie") as WatchlistItemInputType,
        genre: item.genre || undefined,
        year: item.year || undefined,
        posterUrl: item.posterUrl || undefined,
        description: item.description || undefined,
        status: (item.status === "watching" || item.status === "watched" ? item.status : "want_to_watch") as WatchlistItemInputStatus,
        rating: item.rating || undefined,
        notes: item.notes || undefined,
        tmdbId: item.tmdbId || undefined,
        seasonProgress: item.seasonProgress || (item.type === "series" ? 1 : 0),
        episodeProgress: item.episodeProgress || 0,
        totalSeasons: item.totalSeasons || undefined,
        totalEpisodes: item.totalEpisodes || undefined,
      }));

      const result = await importMutation.mutateAsync({ data: payload });
      await queryClient.invalidateQueries();

      toast({
        title: "Import complete",
        description: `Imported ${result.imported} titles. ${result.skipped} existing titles skipped.`,
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: err.message || "Could not parse or import the file.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Import / Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Import & Export</DialogTitle>
          <DialogDescription>
            Backup your watchlist or import from a previous JSON export.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-3">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              <h4 className="font-medium text-foreground">Export Collection</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Download your full watchlist collection including notes, ratings, and series progress as a JSON file.
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="secondary"
              className="w-full gap-2"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? "Exporting..." : "Download JSON"}
            </Button>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <h4 className="font-medium text-foreground">Import Collection</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Restore or merge items from a previous JSON file. Duplicate titles will be safely skipped.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full gap-2"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              {isImporting ? "Importing..." : "Select JSON File"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
