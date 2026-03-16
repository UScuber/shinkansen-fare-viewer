import type { FreeSplitResult, StationId } from "../types";
import { getFareEntry } from "../allFares";
import { STATIONS, getStationIndex } from "../stations";

/** 自由席特急券の分割DPで最安値を探索 */
export function computeFreeSplitDP(
  from: StationId,
  to: StationId,
): FreeSplitResult | null {
  let fromIdx = getStationIndex(from);
  let toIdx = getStationIndex(to);
  const reversed = fromIdx > toIdx;
  if (reversed) [fromIdx, toIdx] = [toIdx, fromIdx];

  const n = toIdx - fromIdx;
  if (n <= 1) return null; // 隣接駅は分割不可

  // 乗車券は通し
  const throughEntry = getFareEntry(from, to);
  if (!throughEntry) return null;
  const ticketFare = throughEntry.ticket_fare;
  const throughFree = throughEntry.free;
  const throughTotal = ticketFare + throughFree;

  // DP
  const dp = new Array<number>(n + 1).fill(Infinity);
  const prev = new Array<number>(n + 1).fill(-1);
  dp[0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      const stationJ = STATIONS[fromIdx + j].id;
      const stationI = STATIONS[fromIdx + i].id;
      const entry = getFareEntry(stationJ, stationI);
      if (!entry) continue;
      const cost = dp[j] + entry.free;
      if (cost < dp[i]) {
        dp[i] = cost;
        prev[i] = j;
      }
    }
  }

  if (dp[n] >= throughFree) return null; // 分割しても安くならない

  // パスを復元
  const segments: { from: StationId; to: StationId; fare: number }[] = [];
  let cur = n;
  while (cur > 0) {
    const p = prev[cur];
    const segFrom = STATIONS[fromIdx + p].id;
    const segTo = STATIONS[fromIdx + cur].id;
    const entry = getFareEntry(segFrom, segTo);
    segments.unshift({
      from: segFrom,
      to: segTo,
      fare: entry!.free,
    });
    cur = p;
  }

  if (segments.length <= 1) return null; // 分割なし

  const total = ticketFare + dp[n];
  const saving = throughTotal - total;
  if (saving <= 0) return null;

  return { ticketFare, segments, total, throughTotal, saving };
}
