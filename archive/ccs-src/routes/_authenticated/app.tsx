import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WatchlistSidebar } from "@/components/WatchlistSidebar";
import { NewsTicker } from "@/components/NewsTicker";
import { AssetWorkspace } from "@/components/AssetWorkspace";
import { AppTopBar } from "@/components/AppTopBar";
import { IntegratedDisclaimer } from "@/components/IntegratedDisclaimer";
import { useMarkets } from "@/lib/use-markets";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppPage,
  head: () => ({
    meta: [{ title: "Workspace · Calm Terminal" }],
  }),
});

function AppPage() {
  const { assets } = useMarkets();
  const [selectedId, setSelectedId] = useState<string>(assets[0]?.id ?? "bitcoin");
  const selected = assets.find((a) => a.id === selectedId) ?? assets[0];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppTopBar />
      <div className="flex flex-1 min-h-0">
        <WatchlistSidebar selectedId={selected.id} onSelect={(a) => setSelectedId(a.id)} />
        <main className="flex-1 min-w-0 flex flex-col">
          <NewsTicker />
          <div className="flex-1 overflow-y-auto">
            <AssetWorkspace asset={selected} />
            <IntegratedDisclaimer />
          </div>
        </main>
      </div>
    </div>
  );
}

