/**
 * 乗り継ぎ駅・列車指定の料金計算ロジック
 *
 * System A: 通し計算（全区間を通しで計算）
 * System B: 最安組み合わせ（各区間の商品の最安組み合わせ）
 */

import { calculateThroughFare } from "./via/throughCalculation";
import { findCheapestCombination } from "./via/cheapestCombination";
import type { JourneySegment, ViaFareResult } from "./types";

export { validateGreenContiguity } from "./via/validation";

/**
 * 経由駅指定時の料金を計算する
 * @param segments 区間配列（出発→経由1→...→到着）
 * @param date 移動日
 */
export function calculateViaFare(
  segments: JourneySegment[],
  date: Date,
): ViaFareResult | null {
  if (segments.length === 0) return null;

  const overallFrom = segments[0].fromId;
  const overallTo = segments[segments.length - 1].toId;

  // 通し計算 (System A)
  const through = calculateThroughFare(segments, overallFrom, overallTo, date);
  if (!through) return null;

  // 最安組み合わせ (System B)
  // 通し計算結果の特急料金（のぞみなし版 or のぞみあり版のうち安い方）+ 乗車券通し
  const throughTotalOther = through.ticketFare + through.expressFareOther;
  const throughTotalNozomi =
    through.expressFareNozomi !== null
      ? through.ticketFare + through.expressFareNozomi
      : null;
  const throughTotal =
    throughTotalNozomi !== null
      ? Math.min(throughTotalOther, throughTotalNozomi)
      : throughTotalOther;

  const cheapest = findCheapestCombination(segments, date, throughTotal);

  return { through, cheapest };
}
