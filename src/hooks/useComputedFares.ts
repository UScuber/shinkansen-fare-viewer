import { useMemo } from "react";
import type {
  CalculatedFares,
  FareFilter,
  SegmentConfig,
  SplitFareResultData,
  StationId,
} from "../data/types";
import { calculateAllFares } from "../data/calculator";
import { calculateViaFare, type ViaCalcResult } from "../data/viaCalculator";
import { searchSplitFares } from "../data/splitFareSearch";

interface ComputedFaresResult {
  fares: CalculatedFares | null;
  viaResult: ViaCalcResult | null;
  splitResult: SplitFareResultData | null;
  filter: FareFilter;
}

export function useComputedFares(
  from: StationId,
  to: StationId,
  dateStr: string,
  useGakuwari: boolean,
  viaStations: StationId[],
  segmentConfigs: SegmentConfig[],
): ComputedFaresResult {
  const filter: FareFilter = useMemo(() => {
    const firstConfig = segmentConfigs[0] ?? {
      seatType: null,
      trainType: null,
    };
    return {
      seatType: firstConfig.seatType,
      trainType: firstConfig.trainType,
    };
  }, [segmentConfigs]);

  const fares = useMemo(() => {
    if (from === to) return null;
    return calculateAllFares(from, to, dateStr);
  }, [from, to, dateStr]);

  const viaResult = useMemo(() => {
    if (viaStations.length === 0) return null;
    if (from === to) return null;
    return calculateViaFare(
      from,
      to,
      viaStations,
      segmentConfigs,
      dateStr,
      useGakuwari,
    );
  }, [from, to, viaStations, segmentConfigs, dateStr, useGakuwari]);

  const splitResult = useMemo(() => {
    if (viaStations.length > 0) return null;
    if (from === to) return null;
    return searchSplitFares(from, to, dateStr, useGakuwari);
  }, [from, to, dateStr, useGakuwari, viaStations.length]);

  return { fares, viaResult, splitResult, filter };
}
