import { TrendingUp, TrendingDown, Minus, Loader as Loader2, Zap, Activity } from "lucide-react";
import type { WeeklySummary } from "@/lib/use-weekly-summary";
import { cn } from "@/lib/utils";

function formatPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString([], { maximumFractionDigits: 0 });
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

type Props = {
  summary: WeeklySummary | undefined;
  isLoading: boolean;
};

export function WeeklySummaryCard({ summary, isLoading }: Props) {
  if (isLoading) {
    return (
      <section className="rounded-3xl bg-surface p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading weekly summary…
        </div>
      </section>
    );
  }

  if (!summary || summary.days.length === 0) {
    return (
      <section className="rounded-3xl bg-surface p-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Weekly summary
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Not enough data yet — need 7 days of snapshots to build a weekly summary.
        </p>
      </section>
    );
  }

  const TrendIcon =
    summary.trendDirection === "up" ? TrendingUp :
    summary.trendDirection === "down" ? TrendingDown : Minus;

  const trendColor =
    summary.trendDirection === "up" ? "text-positive" :
    summary.trendDirection === "down" ? "text-negative" : "text-muted-foreground";

  return (
    <section className="rounded-3xl bg-surface p-8">
      <header className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Weekly summary
          </div>
          <div className="text-sm text-muted-foreground mt-1 tabular-nums">
            {formatDate(summary.startDate)} → {formatDate(summary.endDate)}
          </div>
        </div>
        <div className={cn("flex items-center gap-2", trendColor)}>
          <TrendIcon className="h-5 w-5" />
          <span className="text-lg font-medium tabular-nums">
            {summary.netChangePct >= 0 ? "+" : ""}{summary.netChangePct.toFixed(2)}%
          </span>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Start
          </div>
          <div className="mt-1.5 text-base tabular-nums text-foreground">
            ${formatPrice(summary.startPrice)}
          </div>
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            End
          </div>
          <div className="mt-1.5 text-base tabular-nums text-foreground">
            ${formatPrice(summary.endPrice)}
          </div>
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Biggest move
          </div>
          <div className="mt-1.5 text-base tabular-nums text-foreground">
            {summary.biggestMovePct >= 0 ? "+" : ""}{summary.biggestMovePct.toFixed(2)}%
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
            {formatDate(summary.biggestMoveDate)}
          </div>
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Net change
          </div>
          <div
            className={cn(
              "mt-1.5 text-base tabular-nums",
              summary.netChange >= 0 ? "text-positive" : "text-negative",
            )}
          >
            {summary.netChange >= 0 ? "+" : ""}${formatPrice(Math.abs(summary.netChange))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground tabular-nums">{summary.elevatedDays}</span> elevated
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground tabular-nums">{summary.stableDays}</span> stable
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground tabular-nums">{summary.days.length}</span> days captured
        </div>
      </div>
    </section>
  );
}
