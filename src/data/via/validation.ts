import type { SegmentConfig, StationId, TrainType } from "../types";
import {
  getStationIndex,
  getStationName,
  TRAIN_STOPS,
  HAKATA_INDEX,
} from "../stations";

/** グリーン車が連続しているか検証 */
export function validateGreenContinuity(
  configs: SegmentConfig[],
): string | null {
  let firstGreen = -1;
  let lastGreen = -1;
  for (let i = 0; i < configs.length; i++) {
    if (configs[i].seatType === "green") {
      if (firstGreen === -1) firstGreen = i;
      lastGreen = i;
    }
  }
  if (firstGreen === -1) return null; // グリーン車なし

  for (let i = firstGreen; i <= lastGreen; i++) {
    if (configs[i].seatType !== "green") {
      return "グリーン車は連続する区間で指定してください（分離不可）";
    }
  }
  return null;
}

/** 列車の停車駅バリデーション */
export function validateTrainStops(
  segments: { from: StationId; to: StationId }[],
  configs: SegmentConfig[],
): string | null {
  for (let i = 0; i < segments.length; i++) {
    const train = configs[i]?.trainType;
    if (!train) continue;

    const stops = TRAIN_STOPS[train];
    const fromName = getStationName(segments[i].from);
    const toName = getStationName(segments[i].to);

    if (!stops.includes(segments[i].from)) {
      return `「${getTrainDisplayName(train)}」は ${fromName} に停車しません。`;
    }
    if (!stops.includes(segments[i].to)) {
      return `「${getTrainDisplayName(train)}」は ${toName} に停車しません。`;
    }
  }
  return null;
}

function getTrainDisplayName(t: TrainType): string {
  const names: Record<TrainType, string> = {
    nozomi: "のぞみ",
    hikari: "ひかり",
    kodama: "こだま",
    mizuho: "みずほ",
    sakura: "さくら",
    tsubame: "つばめ",
  };
  return names[t];
}

/** 博多分割レベル1に該当するか判定 */
export function needsLevel1Split(from: StationId, to: StationId): boolean {
  let fromIdx = getStationIndex(from);
  let toIdx = getStationIndex(to);
  if (fromIdx > toIdx) [fromIdx, toIdx] = [toIdx, fromIdx];
  // 東海道（0〜15）↔ 九州（35〜45）
  return fromIdx <= 15 && toIdx >= 35;
}

/** 博多をまたぐかどうか */
export function crossesHakata(from: StationId, to: StationId): boolean {
  let fromIdx = getStationIndex(from);
  let toIdx = getStationIndex(to);
  if (fromIdx > toIdx) [fromIdx, toIdx] = [toIdx, fromIdx];
  return fromIdx < HAKATA_INDEX && toIdx > HAKATA_INDEX;
}
