import type { StationId } from "./types";
import { getStationIndex, STATIONS } from "./stations";

/** 2駅間のルート上の全駅インデックスを取得（from, to含む） */
export function getRouteStationIndices(
  from: StationId,
  to: StationId,
): number[] {
  let fromIdx = getStationIndex(from);
  let toIdx = getStationIndex(to);
  if (fromIdx > toIdx) [fromIdx, toIdx] = [toIdx, fromIdx];
  const indices: number[] = [];
  for (let i = fromIdx; i <= toIdx; i++) {
    indices.push(i);
  }
  return indices;
}

/** ルート上の全駅IDを取得 */
export function getRouteStations(from: StationId, to: StationId): StationId[] {
  return getRouteStationIndices(from, to).map((i) => STATIONS[i].id);
}

/** 経由駅が正しい順序か検証 */
export function validateViaOrder(
  from: StationId,
  to: StationId,
  viaStations: StationId[],
): boolean {
  const fromIdx = getStationIndex(from);
  const toIdx = getStationIndex(to);
  const forward = fromIdx < toIdx;

  const allStations = [from, ...viaStations, to];
  for (let i = 0; i < allStations.length - 1; i++) {
    const a = getStationIndex(allStations[i]);
    const b = getStationIndex(allStations[i + 1]);
    if (forward ? a >= b : a <= b) return false;
  }
  return true;
}

/** 区間リストを生成 */
export function buildSegments(
  from: StationId,
  to: StationId,
  viaStations: StationId[],
): { from: StationId; to: StationId }[] {
  const allStations = [from, ...viaStations, to];
  const segments: { from: StationId; to: StationId }[] = [];
  for (let i = 0; i < allStations.length - 1; i++) {
    segments.push({ from: allStations[i], to: allStations[i + 1] });
  }
  return segments;
}
