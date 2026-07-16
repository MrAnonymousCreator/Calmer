import { useGetWeeklySummary } from "@workspace/api-client-react";

export type WeeklySummary = {
  assetId: string;
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  netChange: number;
  netChangePct: number;
  biggestMoveDate: string;
  biggestMovePct: number;
  elevatedDays: number;
  stableDays: number;
  trendDirection: "up" | "down" | "flat";
  days: {
    date: string;
    symbol: string;
    close: number;
    rsi: number;
    trendState: string;
    volatilityState: string;
    truthProse: string;
    setupKind: string;
    capturedAt: string;
  }[];
};

export function useWeeklySummary(assetId: string) {
  const { data, isLoading, isError } = useGetWeeklySummary(assetId, {
    query: {
      enabled: !!assetId,
      staleTime: 5 * 60_000,
      retry: 1,
    },
  });
  return {
    summary: data as WeeklySummary | undefined,
    isLoading,
    isError,
  };
}
