import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { stories } from "@/lib/market-data";
import { cn } from "@/lib/utils";

export function StoryCards() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Stories
          </div>
          <h3 className="font-display text-2xl mt-1 text-foreground">Worth your attention</h3>
        </div>
      </div>

      <div className="grid gap-3">
        {stories.map((s, i) => {
          const isOpen = open === i;
          return (
            <article
              key={i}
              className={cn(
                "rounded-3xl bg-surface p-7 transition-all",
                isOpen && "shadow-[0_8px_30px_-12px_oklch(0.5_0.02_270/0.12)]",
              )}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-start justify-between gap-6 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span>{s.source}</span>
                    <span>·</span>
                    <span>{s.minutes} min read</span>
                  </div>
                  <h4 className="font-display text-xl mt-2 text-foreground">{s.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{s.excerpt}</p>
                </div>
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground">
                  {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>
              {isOpen && (
                <p className="animate-fade-soft mt-5 max-w-3xl text-[15px] leading-relaxed text-foreground/80">
                  {s.body}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
