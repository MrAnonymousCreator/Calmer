import { useMemo } from "react";
import { buildCalendar } from "@/lib/market-data";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function MarketCalendar() {
  const days = useMemo(() => buildCalendar(7), []);
  const positive = days.filter((d) => d.tone === "positive").length;
  const negative = days.filter((d) => d.tone === "negative").length;

  return (
    <section className="mt-8 rounded-3xl bg-surface p-8">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Calendar
          </div>
          <h3 className="font-display text-2xl mt-1 text-foreground">Last 30 days</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Legend className="bg-positive-soft" label={`${positive} up`} />
          <Legend className="bg-negative-soft" label={`${negative} down`} />
          <Legend className="bg-muted" label={`${30 - positive - negative} flat`} />
        </div>
      </div>

      <div className="mt-7 grid grid-cols-7 gap-2">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground pb-1"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => (
          <div
            key={d.date}
            title={`Day ${d.date} · ${d.change > 0 ? "+" : ""}${d.change}%`}
            className={cn(
              "aspect-square rounded-2xl flex items-end justify-end p-2 text-[10px] tabular-nums transition-transform hover:scale-[1.03]",
              d.tone === "positive" && "bg-positive-soft text-positive",
              d.tone === "negative" && "bg-negative-soft text-negative",
              d.tone === "neutral" && "bg-muted text-muted-foreground",
            )}
          >
            {d.date}
          </div>
        ))}
      </div>
    </section>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}
