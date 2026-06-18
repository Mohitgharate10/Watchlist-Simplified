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
    <div className="flex min-h-screen bg-background text-foreground flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/50 backdrop-blur flex flex-col z-10 sticky top-0 md:h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
            <Film className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-2xl tracking-wide text-foreground">Watchlist</h1>
        </div>

        <nav className="flex-1 px-4 pb-4 md:pb-0 overflow-x-auto md:overflow-visible flex md:flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex-shrink-0">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 text-base font-medium h-12 ${
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

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile fab */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <AddItemDialog>
          <Button size="icon" className="w-14 h-14 rounded-full shadow-primary/30 shadow-xl" data-testid="button-mobile-add">
            <Plus className="w-6 h-6" />
          </Button>
        </AddItemDialog>
      </div>
    </div>
  );
}
