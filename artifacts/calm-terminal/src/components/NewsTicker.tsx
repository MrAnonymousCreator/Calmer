import { news } from "@/lib/market-data";
import { cn } from "@/lib/utils";

const tagTone: Record<string, string> = {
  Momentum: "bg-positive-soft/60 text-positive",
  Volume: "bg-accent/60 text-accent-foreground",
  Risk: "bg-negative-soft/60 text-negative",
  Regulation: "bg-muted text-muted-foreground",
  DeFi: "bg-secondary text-secondary-foreground",
};

export function NewsTicker() {
  const items = [...news, ...news];
  return (
    <div className="overflow-hidden bg-surface/40 backdrop-blur-sm">
      <div className="flex animate-ticker whitespace-nowrap py-3">
        {items.map((n, i) => (
          <div key={i} className="flex items-center gap-3 px-7 text-[13px]">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
                tagTone[n.tag] ?? "bg-muted text-muted-foreground",
              )}
            >
              {n.tag}
            </span>
            <span className="text-foreground/75 font-light">{n.text}</span>
            <span className="text-muted-foreground/40">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}
