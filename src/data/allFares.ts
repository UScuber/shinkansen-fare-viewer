import type { FareEntry, StationId } from "./types";
import faresJson from "./fares.json";

const fareData = faresJson as FareEntry[];

/** 駅ペアキーを生成（順序を正規化） */
function makeKey(a: StationId, b: StationId): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** 料金データをMapに変換 */
const fareMap = new Map<string, FareEntry>();
for (const entry of fareData) {
  const key = makeKey(entry.start as StationId, entry.end as StationId);
  fareMap.set(key, entry);
}

/** 2駅間の料金データを取得 */
export function getFareEntry(from: StationId, to: StationId): FareEntry | null {
  if (from === to) return null;
  return fareMap.get(makeKey(from, to)) ?? null;
}
