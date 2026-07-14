import { useGetMarkets } from "@workspace/api-client-react";
import { assets as fallbackAssets } from "./market-data";
import type { Asset } from "./market-data";

export function useMarkets(): { assets: Asset[]; isLive: boolean; isLoading: boolean } {
  const { data, isLoading, isError } = useGetMarkets({
    query: { staleTime: 60_000, refetchInterval: 60_000, retry: 1 },
  });
  const assets = (data?.assets ?? []) as unknown as Asset[];
  if (assets.length > 0) return { assets, isLive: true, isLoading };
  return { assets: fallbackAssets, isLive: false, isLoading: isLoading && !isError };
}
