/**
 * 料金計算ロジックのカスタムフック
 * 入力（駅・日付・設定）から計算結果を導出する
 */

import { useMemo } from "react";
import { calculateAllFares } from "../data/calculator";
import type { CalculatedFares } from "../data/calculator";
import {
  searchSplitFares,
  type SplitSearchResult,
} from "../data/splitFareSearch";
import {
  calculateViaFare,
  validateGreenContiguity,
} from "../data/viaCalculator";
import { toStationId } from "../data/stations";
import type {
  SegmentConfig,
  JourneySegment,
  FareFilter,
  ViaFareResult,
} from "../data/types";

export type ComputedFaresResult = {
  fares: CalculatedFares | null;
  viaResult: ViaFareResult | null;
  splitResult: SplitSearchResult | null;
  computeError: string | null;
  date: Date;
};

export function useComputedFares(
  fromId: string,
  toId: string,
  dateStr: string,
  viaStations: string[],
  segmentConfigs: SegmentConfig[],
  fareFilter: FareFilter | null,
  validationMessage: string | null,
): ComputedFaresResult {
  const hasViaStations = viaStations.length > 0;

  const date = useMemo(() => {
    const [y, mo, d] = dateStr.split("-").map(Number);
    return new Date(y, mo - 1, d);
  }, [dateStr]);

  const { fares, viaResult, splitResult, computeError } = useMemo<{
    fares: CalculatedFares | null;
    viaResult: ViaFareResult | null;
    splitResult: SplitSearchResult | null;
    computeError: string | null;
  }>(() => {
    if (validationMessage) {
      return {
        fares: null,
        viaResult: null,
        splitResult: null,
        computeError: null,
      };
    }

    if (hasViaStations) {
      // 経由駅あり
      const allStops = [fromId, ...viaStations, toId];
      const segments: JourneySegment[] = [];
      for (let i = 0; i < allStops.length - 1; i++) {
        const f = toStationId(allStops[i]);
        const t = toStationId(allStops[i + 1]);
        if (!f || !t) continue;
        segments.push({
          fromId: f,
          toId: t,
          seatType: segmentConfigs[i]?.seatType ?? "reserved",
          trainType: segmentConfigs[i]?.trainType ?? null,
        });
      }

      // グリーン車の連続性チェック（エラーはDetailedSettings内で表示）
      if (!validateGreenContiguity(segments)) {
        return {
          fares: null,
          viaResult: null,
          splitResult: null,
          computeError: null,
        };
      }

      const result = calculateViaFare(segments, date);
      if (!result) {
        return {
          fares: null,
          viaResult: null,
          splitResult: null,
          computeError: "この区間の料金データが見つかりませんでした。",
        };
      }
      return {
        fares: null,
        viaResult: result,
        splitResult: null,
        computeError: null,
      };
    } else {
      // 経由駅なし
      const from = toStationId(fromId);
      const to = toStationId(toId);
      if (!from || !to) {
        return {
          fares: null,
          viaResult: null,
          splitResult: null,
          computeError: "この区間の料金データが見つかりませんでした。",
        };
      }
      const result = calculateAllFares(from, to, date);
      if (!result) {
        return {
          fares: null,
          viaResult: null,
          splitResult: null,
          computeError: "この区間の料金データが見つかりませんでした。",
        };
      }
      // 分割最安値の自動探索
      const split = searchSplitFares(from, to, date, fareFilter);
      return {
        fares: result,
        viaResult: null,
        splitResult: split,
        computeError: null,
      };
    }
  }, [
    fromId,
    toId,
    date,
    viaStations,
    segmentConfigs,
    hasViaStations,
    validationMessage,
    fareFilter,
  ]);

  return { fares, viaResult, splitResult, computeError, date };
}
