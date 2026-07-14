import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopBar } from "@/components/AppTopBar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · Calm Terminal" }] }),
});

function SettingsPage() {
  const [calmMode, setCalmMode] = useState(true);
  const [digest, setDigest] = useState(true);
  const [sounds, setSounds] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppTopBar />
      <main className="mx-auto w-full max-w-3xl px-10 py-12">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Settings
        </div>
        <h1 className="font-display text-[2.5rem] leading-[1.05] mt-2 text-foreground">
          Your workspace
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Quiet defaults. Adjust how Calm Terminal speaks to you.
        </p>

        <section className="mt-10 rounded-3xl bg-surface p-8">
          <SectionTitle>Preferences</SectionTitle>
          <Toggle
            label="Calm mode"
            hint="Soften animations and reduce visual noise."
            checked={calmMode}
            onChange={setCalmMode}
          />
          <Toggle
            label="Daily digest"
            hint="A single quiet email each morning."
            checked={digest}
            onChange={setDigest}
          />
          <Toggle
            label="Signal sounds"
            hint="Audible chime on major signal shifts."
            checked={sounds}
            onChange={setSounds}
          />
        </section>

        <section className="mt-6 rounded-3xl bg-surface p-8">
          <SectionTitle>About</SectionTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Calm Terminal translates raw crypto market data into plain-language truth statements.
            No alarms. No noise. Just the picture as it is.
          </p>
        </section>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border/60 py-4 last:border-0">
      <div>
        <div className="text-sm text-foreground">{label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-foreground" : "bg-muted",
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
