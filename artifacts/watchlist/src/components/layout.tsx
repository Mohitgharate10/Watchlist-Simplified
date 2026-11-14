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
    <div className="flex min-h-screen flex-col bg-black text-foreground md:flex-row">
      <aside className="sticky top-0 z-30 flex w-full flex-col border-b border-white/[0.08] bg-black md:h-screen md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] md:border-b-0 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm">
              WL
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight text-white leading-tight">Watchlist</h1>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">Personal Archive</span>
            </div>
          </div>

          {/* Quick Add and Auth for mobile header */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-neutral-400 hover:text-white"
                onClick={() => logout()}
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <AuthDialog trigger={<Button size="sm" variant="outline" className="h-8 text-xs border-white/15 bg-black text-white hover:bg-neutral-900">Sign In</Button>} />
            )}
            <AddItemDialog>
              <Button size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 font-medium shadow-sm">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </AddItemDialog>
          </div>
        </div>

        <nav className="flex flex-1 gap-1.5 overflow-x-auto px-3 py-2 sm:px-4 md:flex-col md:overflow-visible md:py-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex min-w-0 flex-1 md:flex-none">
                <Button
                  variant="ghost"
                  className={`h-9 w-full justify-start gap-2.5 px-3 text-xs font-medium sm:text-sm md:h-10 md:px-3 rounded-lg transition-all ${
                    isActive ? "bg-white text-black font-semibold hover:bg-white" : "text-neutral-400 hover:text-white hover:bg-neutral-900/80"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          <div className="hidden md:block pt-2">
            <ImportExportDialog
              trigger={
                <Button variant="ghost" className="h-9 w-full justify-start gap-2.5 px-3 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900/80 rounded-lg">
                  <Download className="w-4 h-4" />
                  Import / Export
                </Button>
              }
            />
          </div>
        </nav>

        {/* User Account & Actions section in sidebar */}
        <div className="p-4 hidden md:flex flex-col gap-2.5 border-t border-white/[0.08]">
          {user ? (
            <div className="flex items-center justify-between rounded-lg bg-[#0a0a0a] p-2 border border-white/[0.08]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-[10px] shrink-0">
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate text-white">{user.username}</p>
                  <p className="text-[10px] font-mono text-neutral-500 truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-neutral-400 hover:text-white shrink-0"
                onClick={() => logout()}
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <AuthDialog
              trigger={
                <Button variant="outline" className="w-full gap-2 text-xs h-9 bg-black text-neutral-300 border-white/10 hover:bg-neutral-900 hover:text-white rounded-lg">
                  <UserIcon className="w-3.5 h-3.5" />
                  Sign In / Register
                </Button>
              }
            />
          )}

          <AddItemDialog>
            <Button className="w-full gap-2 h-9 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded-lg transition-all" data-testid="button-quick-add">
              <Plus className="w-3.5 h-3.5" />
              Quick Add
            </Button>
          </AddItemDialog>
        </div>
      </aside>

      <main className="min-w-0 mx-auto w-full max-w-7xl flex-1 p-3.5 pb-28 sm:p-6 md:p-8 md:pb-12 lg:p-10 bg-black">
        {children}
      </main>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-5 z-40 md:hidden">
        <AddItemDialog>
          <Button
            className="h-10 px-4 rounded-xl shadow-2xl bg-white text-black font-semibold gap-1.5 flex items-center hover:bg-neutral-200 transition-all active:scale-95 text-xs"
            data-testid="button-mobile-add"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </Button>
        </AddItemDialog>
      </div>
    </div>
  );
}
