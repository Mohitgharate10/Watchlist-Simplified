import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Film, LayoutDashboard, ListVideo, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddItemDialog } from "./add-item-dialog";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/watchlist", label: "Watchlist", icon: ListVideo },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <aside className="sticky top-0 z-10 flex w-full flex-col border-b border-border bg-card/50 backdrop-blur md:h-screen md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-4 py-4 sm:p-6">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
            <Film className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-xl tracking-wide text-foreground sm:text-2xl">Watchlist</h1>
        </div>

        <nav className="flex flex-1 gap-2 overflow-x-auto px-3 pb-3 sm:px-4 md:flex-col md:overflow-visible md:pb-0">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex min-w-0 flex-1 md:flex-none">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`h-10 w-full justify-start gap-2 px-3 text-sm font-medium sm:gap-3 sm:text-base md:h-12 md:px-4 ${
                    isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 hidden md:block">
          <AddItemDialog>
            <Button className="w-full gap-2 shadow-primary/20 shadow-lg h-12 text-base" data-testid="button-quick-add">
              <Plus className="w-5 h-5" />
              Quick Add
            </Button>
          </AddItemDialog>
        </div>
      </aside>

      <main className="min-w-0 mx-auto w-full max-w-7xl flex-1 p-4 pb-24 sm:p-6 md:p-8 md:pb-12 lg:p-12">
        {children}
      </main>

      {/* Mobile fab */}
      <div className="fixed bottom-6 right-24 z-50 md:hidden">
        <AddItemDialog>
          <Button size="icon" className="w-14 h-14 rounded-full shadow-primary/30 shadow-xl" data-testid="button-mobile-add">
            <Plus className="w-6 h-6" />
          </Button>
        </AddItemDialog>
      </div>
    </div>
  );
}
