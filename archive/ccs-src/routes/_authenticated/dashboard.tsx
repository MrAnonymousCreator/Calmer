import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity, Newspaper } from "lucide-react";
import { AppTopBar } from "@/components/AppTopBar";
import { Sparkline } from "@/components/Sparkline";
import { DashboardFeed } from "@/components/DashboardFeed";
import { IntegratedDisclaimer } from "@/components/IntegratedDisclaimer";
import { news, formatPrice, formatBig, type Asset } from "@/lib/market-data";
import { useMarkets } from "@/lib/use-markets";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard · Calm Terminal" }] }),
});

function DashboardPage() {
  const { assets, isLive } = useMarkets();
  const movers = [...assets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 4);
  const gainers = [...assets].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  const losers = [...assets].sort((a, b) => a.change24h - b.change24h).slice(0, 5);
  const totalMcap = assets.reduce((s, a) => s + a.marketCap, 0);
  const totalVol = assets.reduce((s, a) => s + a.volume, 0);
  const avgChange = assets.reduce((s, a) => s + a.change24h, 0) / assets.length;
  const greeting = greet();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppTopBar />
      <main className="mx-auto w-full max-w-6xl px-10 py-12">
        <header className="flex items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  isLive ? "bg-positive" : "bg-muted-foreground/40",
                )}
              />
              {greeting} · {isLive ? "Live market data" : "Sample data"}
            </div>
            <h1 className="font-display text-[2.75rem] leading-[1.05] mt-2 text-foreground">
              Welcome back.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              The market is open and quiet enough to think. Here's what changed since you stepped away.
            </p>
          </div>
          <Link
            to="/app"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Open workspace
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        {/* Summary tiles */}
        <section className="mt-10 grid gap-3 md:grid-cols-3">
          <Tile label="Market cap" value={formatBig(totalMcap)} hint="Tracked universe" icon={<TrendingUp className="h-3.5 w-3.5" />} />
          <Tile label="24h volume" value={formatBig(totalVol)} hint="Last 24 hours" icon={<Activity className="h-3.5 w-3.5" />} />
          <Tile
            label="Average change"
            value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
            hint="Across watchlist"
            tone={avgChange >= 0 ? "positive" : "negative"}
          />
        </section>

        {/* Movers */}
        <section className="mt-6 rounded-3xl bg-surface p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Today's movers
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Largest absolute moves across your watchlist
              </div>
            </div>
            <Link to="/app" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {movers.map((a) => (
              <Link
                key={a.id}
                to="/app"
                className="group rounded-2xl bg-background p-5 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {a.symbol}
                    </div>
                    <div className="mt-1 font-display text-lg text-foreground">{a.name}</div>
                  </div>
                  <Sparkline data={a.sparkline} positive={a.change24h >= 0} width={64} height={24} />
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="tabular-nums text-foreground">${formatPrice(a.price)}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs tabular-nums",
                      a.change24h >= 0 ? "text-positive" : "text-negative",
                    )}
                  >
                    {a.change24h >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {a.change24h >= 0 ? "+" : ""}
                    {a.change24h.toFixed(2)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Active setups (structural triggers, not headlines) */}
        <section className="mt-6">
          <DashboardFeed />
        </section>

        {/* Gainers / Losers */}
        <section className="mt-6 grid gap-3 md:grid-cols-2">
          <Leaderboard title="Leading" tone="positive" items={gainers} />
          <Leaderboard title="Lagging" tone="negative" items={losers} />
        </section>

        {/* Feed */}
        <section className="mt-6 rounded-3xl bg-surface p-8">
          <div className="flex items-center gap-2">

            <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Signal feed
            </div>
          </div>
          <ul className="mt-5 divide-y divide-border/60">
            {news.slice(0, 6).map((n, i) => (
              <li key={i} className="flex items-start gap-4 py-3">
                <span className="mt-0.5 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70">
                  {n.tag}
                </span>
                <span className="text-sm text-foreground/80">{n.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <IntegratedDisclaimer />
    </div>
  );
}


function Tile({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "positive" | "negative";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-surface p-6">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-3 font-display text-3xl tabular-nums",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
          !tone && "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Leaderboard({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "positive" | "negative";
  items: Asset[];
}) {
  return (
    <div className="rounded-3xl bg-surface p-8">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full",
            tone === "positive" ? "bg-positive" : "bg-negative",
          )}
        />
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((a) => (
          <li key={a.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="text-[11px] tabular-nums text-muted-foreground w-10">{a.symbol}</span>
              <span className="text-foreground">{a.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="tabular-nums text-foreground/70">${formatPrice(a.price)}</span>
              <span
                className={cn(
                  "tabular-nums w-16 text-right",
                  a.change24h >= 0 ? "text-positive" : "text-negative",
                )}
              >
                {a.change24h >= 0 ? "+" : ""}
                {a.change24h.toFixed(2)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function greet(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
