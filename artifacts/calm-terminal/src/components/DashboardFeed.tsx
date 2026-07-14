import { Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Minus, Radio } from "lucide-react";
import { useMarkets } from "@/lib/use-markets";
import { spotSetupFromSparkline, classifyBehavior } from "@/lib/analysis";
import { cn } from "@/lib/utils";

export function DashboardFeed() {
  const { assets } = useMarkets();
  const triggers = assets
    .map((a) => {
      const setup = spotSetupFromSparkline(a.sparkline);
      if (!setup) return null;
      return { asset: a, setup, state: classifyBehavior(a.sparkline) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 8);

  return (
    <section className="rounded-3xl bg-surface p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Active setups
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">{triggers.length} triggered</span>
      </div>

      {triggers.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No structural triggers across the tracked universe right now. The market is quiet.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border/60">
          {triggers.map(({ asset, setup, state }) => {
            const Icon =
              setup.tone === "positive" ? ArrowUpRight : setup.tone === "negative" ? ArrowDownRight : Minus;
            const toneText =
              setup.tone === "positive" ? "text-positive" : setup.tone === "negative" ? "text-negative" : "text-foreground/60";
            return (
              <li key={asset.id}>
                <Link
                  href="/app"
                  className="flex items-center justify-between gap-4 py-3.5 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={cn("h-4 w-4 shrink-0", toneText)} />
                    <div className="min-w-0">
                      <div className="text-sm text-foreground truncate">
                        <span className="font-medium">{asset.symbol}</span>{" "}
                        <span className="text-foreground/70">{setup.label.toLowerCase()}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {asset.name} · state: {state}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] tabular-nums shrink-0",
                      asset.change24h >= 0 ? "text-positive" : "text-negative",
                    )}
                  >
                    {asset.change24h >= 0 ? "+" : ""}
                    {asset.change24h.toFixed(2)}%
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
