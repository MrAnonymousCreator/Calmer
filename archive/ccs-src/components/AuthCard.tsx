import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center px-6">
        <Link to="/" className="font-display text-base tracking-tight text-foreground">
          Calm Terminal
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl leading-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:ring-2 focus:ring-ring/40";

export const buttonClass =
  "w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60";
