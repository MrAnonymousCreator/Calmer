import { GitCommit, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { AssetAnalysis, ChangeLogEvent } from "@/lib/analysis";
import { cn } from "@/lib/utils";

function dayLabel(offset: number): string {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  return `${Math.abs(offset)}d ago`;
}

function toneStyles(tone: ChangeLogEvent["tone"]) {
  if (tone === "positive") return { dot: "bg-positive", text: "text-positive" };
  if (tone === "negative") return { dot: "bg-negative", text: "text-negative" };
  return { dot: "bg-foreground/40", text: "text-foreground/70" };
}

export function ChangeLog({ analysis }: { analysis: AssetAnalysis }) {
  const { setup } = analysis;
  const progressPct = Math.round(setup.progress * 100);
  return (
    <section className="rounded-3xl bg-surface p-8">
      <header className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Change log · {setup.kind}
          </div>
          <h3 className="font-display text-xl mt-2 text-foreground max-w-2xl">
            {setup.headline}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Sequence
          </div>
          <div className="text-sm tabular-nums text-foreground/80 mt-1">{progressPct}% complete</div>
        </div>
      </header>

      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/60 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {setup.events.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No structural events registered in the last 7 sessions.
        </p>
      ) : (
        <ol className="relative mt-6 space-y-4 pl-6">
          <span className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
          {setup.events.map((e, i) => {
            const s = toneStyles(e.tone);
            const Icon = e.tone === "positive" ? ArrowUpRight : e.tone === "negative" ? ArrowDownRight : Minus;
            return (
              <li key={i} className="relative">
                <span
                  className={cn(
                    "absolute -left-[19px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface ring-2 ring-border",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                </span>
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", s.text)} />
                    <span className={cn("text-sm font-medium", s.text)}>{e.label}</span>
                  </div>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                    {dayLabel(e.dayOffset)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{e.detail}</p>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
        <GitCommit className="h-3 w-3" />
        Timeline reads oldest → newest across the last 7 daily sessions.
      </div>
    </section>
  );
}
