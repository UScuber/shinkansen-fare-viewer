import type { SplitFareResultData, StationId } from "./types";
import { computeFreeSplitDP } from "./split/freeSeatSplitDP";
import { computeMixedSplitDP } from "./split/mixedSplitSearch";

/** 分割最安値探索 */
export function searchSplitFares(
  from: StationId,
  to: StationId,
  dateStr: string,
  useGakuwari: boolean,
): SplitFareResultData {
  const freeSplit = computeFreeSplitDP(from, to);
  const mixedSplit = computeMixedSplitDP(from, to, dateStr, useGakuwari);

  // 自由席分割と混合分割が同じパターンなら混合のみ表示
  let effectiveFreeSplit = freeSplit;
  if (freeSplit && mixedSplit && isSamePattern(freeSplit, mixedSplit)) {
    effectiveFreeSplit = null;
  }

  return {
    freeSplit: effectiveFreeSplit,
    mixedSplit,
  };
}

function isSamePattern(
  free: NonNullable<SplitFareResultData["freeSplit"]>,
  mixed: NonNullable<SplitFareResultData["mixedSplit"]>,
): boolean {
  if (free.segments.length !== mixed.segments.length) return false;
  return free.segments.every(
    (s, i) =>
      s.from === mixed.segments[i].from && s.to === mixed.segments[i].to,
  );
}
