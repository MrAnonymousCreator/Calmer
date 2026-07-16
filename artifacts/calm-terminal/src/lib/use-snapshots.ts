import { useGetSnapshots } from "@workspace/api-client-react";

export type DailySnapshot = {
  date: string;
  symbol: string;
  close: number;
  rsi: number;
  trendState: string;
  volatilityState: string;
  truthProse: string;
  setupKind: string;
  capturedAt: string;
};

export function useSnapshots(assetId: string, limit = 30) {
  const { data, isLoading, isError } = useGetSnapshots(assetId, limit, {
    query: {
      enabled: !!assetId,
      staleTime: 5 * 60_000,
      retry: 1,
    },
  });
  return {
    snapshots: (data?.snapshots as DailySnapshot[]) ?? [],
    isLoading,
    isError,
  };
}
