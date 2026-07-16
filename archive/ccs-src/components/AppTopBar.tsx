import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/app", label: "Workspace" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppTopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border/60 bg-background px-6">
      <div className="flex items-center gap-8">
        <Link to="/dashboard" className="font-display text-base tracking-tight text-foreground">
          Calm Terminal
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-muted text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
