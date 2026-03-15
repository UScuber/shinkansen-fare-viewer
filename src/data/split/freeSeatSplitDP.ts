/**
 * 自由席特急券の分割DP（全ペア事前計算）
 */

import { getAllFares } from "../allFares";
import type { StationId } from "../stations";
import type { ExpressSegment, FreeSeatSplitResult } from "../splitFareSearch";

/**
 * 全ペア(j, i)について自由席特急券の最安分割を計算
 * dp[j][i] = station j → station i の自由席特急券の最安分割コスト
 * prev[j][i] = 最適パスで station i の直前の駅インデックス
 */
export function computeFreeSplitDP(
  stationIds: StationId[],
  n: number,
): { dp: number[][]; prev: number[][] } {
  // dp[j][i] と prev[j][i] を初期化
  const dp: number[][] = [];
  const prev: number[][] = [];
  for (let j = 0; j < n; j++) {
    dp[j] = new Array<number>(n).fill(Infinity);
    prev[j] = new Array<number>(n).fill(-1);
    dp[j][j] = 0;
  }

  for (let j = 0; j < n; j++) {
    for (let i = j + 1; i < n; i++) {
      for (let m = j; m < i; m++) {
        if (dp[j][m] === Infinity) continue;

        const fareData = getAllFares(stationIds[m], stationIds[i]);
        if (!fareData || fareData.free === null) continue;

        const cost = dp[j][m] + fareData.free;
        if (cost < dp[j][i]) {
          dp[j][i] = cost;
          prev[j][i] = m;
        }
      }
    }
  }

  return { dp, prev };
}

/**
 * 自由席特急券の分割パスを復元
 */
export function reconstructExpressPath(
  stationIds: StationId[],
  freePrev: number[][],
  start: number,
  end: number,
): ExpressSegment[] {
  const segments: ExpressSegment[] = [];
  let idx = end;
  while (idx > start) {
    const m = freePrev[start][idx];
    const fareData = getAllFares(stationIds[m], stationIds[idx]);
    segments.unshift({
      fromId: stationIds[m],
      toId: stationIds[idx],
      expressFare: fareData!.free!,
    });
    idx = m;
  }
  return segments;
}

/**
 * 自由席分割最安値の構築
 */
export function buildFreeSeatSplit(
  stationIds: StationId[],
  n: number,
  throughTicketFare: number,
  throughTotal: number,
  freeDp: number[][],
  freePrev: number[][],
): FreeSeatSplitResult | null {
  const expressTotal = freeDp[0][n - 1];
  if (expressTotal === Infinity) return null;

  const total = throughTicketFare + expressTotal;
  if (total >= throughTotal) return null;

  // 経路復元
  const expressSegments = reconstructExpressPath(
    stationIds,
    freePrev,
    0,
    n - 1,
  );

  // 分割なし（1区間 = 通し）なら表示不要
  if (expressSegments.length <= 1) return null;

  return {
    throughTicketFare,
    expressSegments,
    total,
    savings: throughTotal - total,
  };
}
