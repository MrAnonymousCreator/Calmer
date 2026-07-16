import { useQuery, queryOptions } from "@tanstack/react-query";
import { assets as fallbackAssets, type Asset } from "./market-data";
import { getMarkets } from "./markets.functions";

async function fetchMarkets(): Promise<Asset[]> {
  const { assets } = await getMarkets();
  return assets;
}

export const marketsQueryOptions = queryOptions({
  queryKey: ["markets"],
  queryFn: fetchMarkets,
  staleTime: 60_000,
  refetchInterval: 60_000,
  retry: 1,
});

export function useMarkets(): { assets: Asset[]; isLive: boolean; isLoading: boolean } {
  const { data, isLoading, isError } = useQuery(marketsQueryOptions);
  if (data && data.length > 0) return { assets: data, isLive: true, isLoading };
  return { assets: fallbackAssets, isLive: false, isLoading: isLoading && !isError };
}
