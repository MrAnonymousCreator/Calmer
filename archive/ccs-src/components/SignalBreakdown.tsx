import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { SignalReading } from "@/lib/market-data";
import { cn } from "@/lib/utils";

export function SignalBreakdown({ signals }: { signals: SignalReading[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mt-8 rounded-3xl bg-surface p-8">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Signal breakdown
          </div>
          <h3 className="font-display text-2xl mt-1 text-foreground">
            Five readings, in plain language
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Tap a row to expand</span>
      </div>

      <ul className="mt-6 -mx-2">
        {signals.map((s, i) => {
          const isOpen = open === i;
          const toneText =
            s.tone === "positive"
              ? "text-positive"
              : s.tone === "negative"
                ? "text-negative"
                : "text-foreground/70";
          return (
            <li key={s.key} className="border-t border-border/40 first:border-t-0">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className={cn(
                  "grid w-full grid-cols-[120px_1fr_140px_24px] items-center px-3 py-3.5 text-left text-sm rounded-xl transition-colors",
                  "hover:bg-muted/50",
                )}
              >
                <span className="text-muted-foreground">{s.label}</span>
                <span className="text-foreground">{s.sentence}</span>
                <span className={cn("tabular-nums text-right pr-2", toneText)}>{s.state}</span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
              </button>
              {isOpen && (
                <div className="animate-fade-soft px-3 pb-5 pt-1">
                  <p className="max-w-2xl text-[14px] leading-relaxed text-foreground/75">
                    {s.meaning}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
                    {s.value}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
