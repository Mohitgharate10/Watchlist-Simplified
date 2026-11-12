import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Film, LayoutDashboard, ListVideo, Plus, LogOut, User as UserIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddItemDialog } from "./add-item-dialog";
import { AuthDialog } from "./auth-dialog";
import { ImportExportDialog } from "./import-export-dialog";
import { useAuth } from "@/lib/auth-context";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/watchlist", label: "Watchlist", icon: ListVideo },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <aside className="sticky top-0 z-30 flex w-full flex-col border-b border-border bg-card/90 backdrop-blur-md md:h-screen md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 md:border-b-0 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <Film className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-xl tracking-wide text-foreground sm:text-2xl">Watchlist</h1>
          </div>

          {/* Quick Add and Auth for mobile header */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => logout()}
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <AuthDialog trigger={<Button size="sm" variant="outline" className="h-8 text-xs">Sign In</Button>} />
            )}
            <AddItemDialog>
              <Button size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-full font-medium shadow-sm">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </AddItemDialog>
          </div>
        </div>

        <nav className="flex flex-1 gap-2 overflow-x-auto px-3 py-2 sm:px-4 md:flex-col md:overflow-visible md:py-0">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex min-w-0 flex-1 md:flex-none">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`h-9 w-full justify-start gap-2 px-3 text-xs font-medium sm:gap-3 sm:text-sm md:h-12 md:px-4 md:text-base ${
                    isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          <div className="hidden md:block pt-2">
            <ImportExportDialog
              trigger={
                <Button variant="ghost" className="h-10 w-full justify-start gap-3 px-4 text-sm text-muted-foreground hover:text-foreground">
                  <Download className="w-4 h-4" />
                  Import / Export
                </Button>
              }
            />
          </div>
        </nav>

        {/* User Account & Actions section in sidebar */}
        <div className="p-4 hidden md:flex flex-col gap-3 border-t border-border/50">
          {user ? (
            <div className="flex items-center justify-between rounded-lg bg-card/60 p-2.5 border border-border/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate text-foreground">{user.username}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => logout()}
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <AuthDialog
              trigger={
                <Button variant="outline" className="w-full gap-2 text-sm h-10 border-dashed">
                  <UserIcon className="w-4 h-4" />
                  Sign In / Register
                </Button>
              }
            />
          )}

          <AddItemDialog>
            <Button className="w-full gap-2 shadow-primary/20 shadow-lg h-11 text-sm font-medium hover:shadow-primary/30 transition-all" data-testid="button-quick-add">
              <Plus className="w-4 h-4" />
              Quick Add
            </Button>
          </AddItemDialog>
        </div>
      </aside>

      <main className="min-w-0 mx-auto w-full max-w-7xl flex-1 p-3.5 pb-28 sm:p-6 md:p-8 md:pb-12 lg:p-12">
        {children}
      </main>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 left-5 z-40 md:hidden">
        <AddItemDialog>
          <Button
            className="h-11 px-4 rounded-full shadow-2xl shadow-primary/30 bg-primary text-primary-foreground font-semibold gap-2 flex items-center hover:bg-primary/90 transition-all active:scale-95"
            data-testid="button-mobile-add"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-semibold">Quick Add</span>
          </Button>
        </AddItemDialog>
      </div>
    </div>
  );
}
