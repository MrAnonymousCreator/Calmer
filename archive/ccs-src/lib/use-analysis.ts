import { useQuery, queryOptions } from "@tanstack/react-query";
import { getAssetAnalysis } from "./analysis.functions";
import type { AssetAnalysis } from "./analysis";

export function analysisQueryOptions(id: string, symbol: string) {
  return queryOptions({
    queryKey: ["analysis", id],
    queryFn: async (): Promise<AssetAnalysis> => {
      const { analysis } = await getAssetAnalysis({ data: { id, symbol } });
      return analysis;
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
}

export function useAnalysis(id: string, symbol: string) {
  const { data, isLoading, isError } = useQuery(analysisQueryOptions(id, symbol));
  return { analysis: data, isLoading, isError };
}
