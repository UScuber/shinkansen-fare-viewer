import type {
  CheapestCombinationResult,
  SegmentConfig,
  StationId,
  ViaFareResult,
} from "./types";
import { buildSegments, validateViaOrder } from "./Route";
import { calculateThroughFare } from "./via/throughCalculation";
import { findCheapestCombination } from "./via/cheapestCombination";
import { validateGreenContinuity, validateTrainStops } from "./via/validation";

export interface ViaCalcResult {
  throughFare: ViaFareResult | null;
  cheapest: CheapestCombinationResult | null;
  error: string | null;
}

/** 経由駅指定時の料金計算 */
export function calculateViaFare(
  from: StationId,
  to: StationId,
  viaStations: StationId[],
  configs: SegmentConfig[],
  dateStr: string,
  useGakuwari: boolean,
): ViaCalcResult {
  // バリデーション
  if (!validateViaOrder(from, to, viaStations)) {
    return { throughFare: null, cheapest: null, error: "駅の順序が不正です" };
  }

  const segments = buildSegments(from, to, viaStations);

  const greenError = validateGreenContinuity(configs);
  if (greenError) {
    return { throughFare: null, cheapest: null, error: greenError };
  }

  const trainError = validateTrainStops(segments, configs);
  if (trainError) {
    return { throughFare: null, cheapest: null, error: trainError };
  }

  // 通し計算
  const throughFare = calculateThroughFare(
    from,
    to,
    segments,
    configs,
    dateStr,
  );

  // 最安組み合わせ
  const cheapest = findCheapestCombination(
    from,
    to,
    segments,
    configs,
    dateStr,
    useGakuwari,
  );

  // 通しより安い場合のみ最安を返す
  const effectiveCheapest =
    cheapest &&
    throughFare &&
    cheapest.total <
      (useGakuwari ? throughFare.gakuwariTotal : throughFare.total)
      ? cheapest
      : null;

  return { throughFare, cheapest: effectiveCheapest, error: null };
}
