import { Calendar, Loader as Loader2 } from "lucide-react";
import type { DailySnapshot } from "@/lib/use-snapshots";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function formatPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString([], { maximumFractionDigits: 0 });
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

const SETUP_TONE: Record<string, string> = {
  Breakout: "text-positive",
  "Trend Failure": "text-negative",
  "Clean Retest": "text-positive",
  Compression: "text-muted-foreground",
};

type Props = {
  snapshots: DailySnapshot[];
  isLoading: boolean;
};

export function DailyTimeline({ snapshots, isLoading }: Props) {
  if (isLoading) {
    return (
      <section className="rounded-3xl bg-surface p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading daily snapshots…
        </div>
      </section>
    );
  }

  if (snapshots.length === 0) {
    return (
      <section className="rounded-3xl bg-surface p-8">
        <header className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Daily timeline
          </div>
        </header>
        <p className="mt-4 text-sm text-muted-foreground">
          No snapshots have been captured yet. The daily capture job runs at 00:00 UTC.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-surface p-8">
      <header className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Daily timeline
        </div>
      </header>

      <div className="mt-6 space-y-1">
        {snapshots.map((s, i) => {
          const prev = i < snapshots.length - 1 ? snapshots[i + 1] : null;
          const dayChange = prev ? ((s.close - prev.close) / prev.close) * 100 : 0;
          const elevated = s.volatilityState === "elevated";

          return (
            <div
              key={s.date}
              className="group flex items-start gap-4 rounded-2xl px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex flex-col items-center pt-1 shrink-0 w-20">
                <div className="text-xs font-medium text-foreground tabular-nums">
                  {formatDate(s.date)}
                </div>
                <div
                  className={cn(
                    "mt-1 h-1.5 w-1.5 rounded-full",
                    elevated ? "bg-warning" : "bg-muted-foreground/40",
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    ${formatPrice(s.close)}
                  </span>
                  {prev && (
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        dayChange >= 0 ? "text-positive" : "text-negative",
                      )}
                    >
                      {dayChange >= 0 ? "+" : ""}{dayChange.toFixed(2)}%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    RSI {s.rsi.toFixed(0)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {s.truthProse}
                </p>
              </div>

              <div className="shrink-0 pt-1">
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-[0.12em]",
                    SETUP_TONE[s.setupKind] ?? "text-muted-foreground",
                  )}
                >
                  {s.setupKind}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
