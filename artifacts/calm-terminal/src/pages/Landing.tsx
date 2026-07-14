import { Link } from "wouter";
import { ArrowUpRight, Activity, GitCompare, Gauge, Layers, BarChart3, Crosshair } from "lucide-react";

const SIGNALS = [
  { icon: Gauge, label: "Trend", body: "Direction of the market." },
  { icon: Activity, label: "Momentum", body: "Strength and acceleration of movement." },
  { icon: BarChart3, label: "Volume", body: "Participation vs normal activity." },
  { icon: Layers, label: "Volatility", body: "Stability or expansion of price action." },
  { icon: Crosshair, label: "Position", body: "Where price sits within its recent range." },
];

const ROADMAP = [
  "Portfolio intelligence layer",
  "Daily market summaries",
  "Historical change tracking",
  "Smart alerts (\"something changed\")",
  "Multi-asset comparison view",
  "Mobile app",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-lg tracking-tight text-foreground">
          Calm Terminal
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/app"
            className="rounded-full px-3.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            Workspace
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Open app
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-4xl px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          A market interpretation layer
        </div>
        <h1 className="font-display text-[3.25rem] leading-[1.05] mt-6 text-foreground sm:text-[4.5rem]">
          Understand crypto markets in 30 seconds.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Calm Terminal transforms raw price data into clear, readable market intelligence —
          so you don't have to manually analyse charts, indicators, and noise.
          Instead of more data, it tells you <em className="not-italic text-foreground">what changed,
          what matters, and what it means</em>.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Open app
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center rounded-full px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Explore the workspace
          </Link>
        </div>
      </section>

      {/* Before / After */}
      <section className="mx-auto w-full max-w-5xl px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] bg-muted/60 p-8">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Most tools show you
            </div>
            <pre className="mt-5 font-mono text-sm leading-relaxed text-foreground/70">{`BTC: +2.1%
RSI: 63
Volume: +18%
MACD: bullish cross
24h range: 70,120 – 71,540`}</pre>
            <p className="mt-5 text-xs text-muted-foreground">
              Six numbers. No answer.
            </p>
          </div>
          <div className="rounded-[28px] bg-surface p-8 shadow-[0_24px_60px_-30px_oklch(0.3_0.02_270/0.25)]">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Calm Terminal says
              </span>
            </div>
            <p className="font-display text-[1.4rem] leading-[1.45] mt-5 text-foreground">
              Bitcoin remains in an established uptrend. Momentum is positive but has slowed over
              the past week. Volume is slightly above average, suggesting moderate participation.
              No significant change in market structure.
            </p>
          </div>
        </div>
      </section>

      {/* Truth Engine */}
      <section className="mx-auto mt-28 w-full max-w-5xl px-6">
        <div className="max-w-2xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            The Truth Engine
          </div>
          <h2 className="font-display text-[2.5rem] leading-[1.1] mt-3 text-foreground">
            Five signals. One readable sentence.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            At the core of Calm Terminal is the Truth Engine. It evaluates five dimensions of every
            asset and composes them into a single plain-language interpretation.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SIGNALS.map((s) => (
            <div key={s.label} className="rounded-3xl bg-surface p-6">
              <s.icon className="h-5 w-5 text-foreground/60" />
              <div className="font-display text-lg mt-4 text-foreground">{s.label}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Change Detection */}
      <section className="mx-auto mt-28 w-full max-w-5xl px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <GitCompare className="h-3.5 w-3.5" />
              Change detection
            </div>
            <h2 className="font-display text-[2.5rem] leading-[1.1] mt-3 text-foreground">
              What changed — not just what is.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Calm Terminal highlights structural shifts, not just current state.
              You see when something matters, the moment it matters.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-3xl bg-surface p-6">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Today
              </div>
              <p className="font-display text-lg mt-2 text-foreground leading-snug">
                Momentum has weakened for the third consecutive day, despite price holding steady.
              </p>
            </div>
            <div className="rounded-3xl bg-surface p-6">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                This week
              </div>
              <p className="font-display text-lg mt-2 text-foreground leading-snug">
                For the first time in 30 days, Bitcoin has moved below its short-term trend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto mt-28 w-full max-w-5xl px-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Features
        </div>
        <h2 className="font-display text-[2.5rem] leading-[1.1] mt-3 text-foreground">
          Quiet by design.
        </h2>
        <ul className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {[
            ["Real-time market data", "Live prices and 7d sparklines via CoinGecko."],
            ["Natural-language summaries", "Every asset interpreted in one sentence."],
            ["Change detection", "Surfaces shifts between time periods, not noise."],
            ["Minimal interface", "No flashing tickers. No casino lights."],
            ["Portfolio interpretation", "Coming soon — your holdings, in one read."],
            ["Watchlist insights", "Coming soon — proactive change alerts."],
          ].map(([t, b]) => (
            <li key={t} className="border-t border-border/70 pt-5">
              <div className="font-display text-lg text-foreground">{t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Philosophy */}
      <section className="mx-auto mt-28 w-full max-w-3xl px-6 text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Philosophy
        </div>
        <p className="font-display text-[2.25rem] leading-[1.25] mt-6 text-foreground">
          “Most traders don't need more data. They need better interpretation.”
        </p>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          We reduce cognitive load so you can make decisions faster, with less emotional
          interference.
        </p>
      </section>

      {/* Roadmap */}
      <section className="mx-auto mt-28 w-full max-w-5xl px-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Roadmap
        </div>
        <h2 className="font-display text-[2.5rem] leading-[1.1] mt-3 text-foreground">
          What's coming.
        </h2>
        <ul className="mt-8 divide-y divide-border/60 rounded-3xl bg-surface px-6">
          {ROADMAP.map((item) => (
            <li key={item} className="flex items-center justify-between py-4">
              <span className="text-sm text-foreground">{item}</span>
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Planned
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Positioning */}
      <section className="mx-auto mt-28 w-full max-w-3xl px-6 text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Positioning
        </div>
        <div className="mt-6 space-y-3 font-display text-2xl leading-snug">
          <p className="text-muted-foreground line-through">Not a trading platform.</p>
          <p className="text-muted-foreground line-through">Not a charting tool.</p>
          <p className="text-foreground">A market interpretation layer.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-28 w-full max-w-3xl px-6 pb-24 text-center">
        <h2 className="font-display text-[2.5rem] leading-[1.1] text-foreground">
          Read the market without the noise.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Free during preview. No account required.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Open app
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-border/60 px-6 py-8 text-xs text-muted-foreground">
        <span className="font-display text-sm text-foreground">Calm Terminal</span>
        <span>© {new Date().getFullYear()} · A market interpretation layer</span>
      </footer>
    </div>
  );
}
