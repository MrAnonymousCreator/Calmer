import { useGetChart } from "@workspace/api-client-react";

export type ChartPoint = { t: number; p: number };
export type ChartData = {
  id: string;
  range: string;
  points: ChartPoint[];
  low: number;
  high: number;
};

export function useChart(id: string, range: string) {
  const { data, isLoading, isError } = useGetChart(id, range, {
    query: {
      enabled: !!id && !!range,
      staleTime: 60_000,
      refetchInterval: 60_000,
      retry: 1,
    },
  });
  return {
    chart: data as ChartData | undefined,
    isLoading,
    isError,
  };
}
