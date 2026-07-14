import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/app", label: "Workspace" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppTopBar() {
  const [location] = useLocation();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/60 bg-background px-6">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="font-display text-base tracking-tight text-foreground">
          Calm Terminal
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const isActive = location === item.to;
            return (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
