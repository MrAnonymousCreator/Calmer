import { useGetAnalysis } from "@workspace/api-client-react";
import type { AssetAnalysis } from "./analysis";

export function useAnalysis(id: string, symbol: string) {
  const { data, isLoading, isError } = useGetAnalysis(id, symbol, {
    query: { enabled: !!id && !!symbol, staleTime: 5 * 60_000, refetchInterval: 5 * 60_000, retry: 1 },
  });
  return { analysis: data?.analysis as AssetAnalysis | undefined, isLoading, isError };
}
