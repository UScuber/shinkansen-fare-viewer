/**
 * URLクエリパラメータのエンコード・デコード
 */

import type { SeatType, TrainType, SegmentConfig } from "../data/types";

/* ===== Query parameter encoding ===== */

const SEAT_TO_CODE: Record<string, string> = {
  reserved: "r",
  green: "g",
  free: "f",
};
const CODE_TO_SEAT: Record<string, SeatType> = {
  r: "reserved",
  g: "green",
  f: "free",
};
const TRAIN_TO_CODE: Record<string, string> = {
  nozomi: "no",
  hikari: "hi",
  kodama: "ko",
  mizuho: "mi",
  sakura: "sa",
  tsubame: "ts",
};
const CODE_TO_TRAIN: Record<string, TrainType> = {
  no: "nozomi",
  hi: "hikari",
  ko: "kodama",
  mi: "mizuho",
  sa: "sakura",
  ts: "tsubame",
};

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function normalizeDateStr(value: string | null): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return toDateInputValue(new Date());
}

export function updateQueryParams(
  fromId: string,
  toId: string,
  dateStr: string,
  viaStations: string[],
  segmentConfigs: SegmentConfig[],
  useGakuwari: boolean,
): void {
  const params = new URLSearchParams();
  if (fromId) params.set("from", fromId);
  if (toId) params.set("to", toId);
  if (dateStr) params.set("date", dateStr);
  if (viaStations.length > 0) {
    params.set("via", viaStations.join(","));
    const seatCodes = segmentConfigs
      .map((c) => SEAT_TO_CODE[c.seatType ?? ""] ?? "r")
      .join(",");
    params.set("s", seatCodes);
    const trainCodes = segmentConfigs
      .map((c) => (c.trainType ? (TRAIN_TO_CODE[c.trainType] ?? "") : ""))
      .join(",");
    if (trainCodes.replace(/,/g, "")) {
      params.set("t", trainCodes);
    }
  } else {
    // フィルタモード: seatType/trainTypeが指定されている場合のみURLに保存
    const config = segmentConfigs[0];
    if (config) {
      if (config.seatType !== null) {
        params.set("s", SEAT_TO_CODE[config.seatType] ?? "");
      }
      if (config.trainType !== null) {
        params.set("t", TRAIN_TO_CODE[config.trainType] ?? "");
      }
    }
  }
  if (useGakuwari) {
    params.set("gaku", "1");
  }
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(null, "", nextUrl);
}

/** Parse initial state from URL query parameters */
export function parseInitialParams(): {
  fromId: string;
  toId: string;
  dateStr: string;
  viaStations: string[];
  segmentConfigs: SegmentConfig[];
  useGakuwari: boolean;
} {
  const params = new URLSearchParams(window.location.search);
  const fromId = params.get("from") ?? "";
  const toId = params.get("to") ?? "";
  const dateStr = normalizeDateStr(params.get("date"));
  const useGakuwari = params.get("gaku") === "1";

  const viaStr = params.get("via") ?? "";
  const viaStations = viaStr ? viaStr.split(",").filter(Boolean) : [];

  const seatStr = params.get("s") ?? "";
  const seatCodes = seatStr ? seatStr.split(",") : [];
  const trainStr = params.get("t") ?? "";
  const trainCodes = trainStr ? trainStr.split(",") : [];

  if (viaStations.length > 0) {
    // 経由駅モード
    const numSegments = viaStations.length + 1;
    const segmentConfigs: SegmentConfig[] = [];
    for (let i = 0; i < numSegments; i++) {
      segmentConfigs.push({
        seatType: CODE_TO_SEAT[seatCodes[i]] ?? "reserved",
        trainType: trainCodes[i]
          ? (CODE_TO_TRAIN[trainCodes[i]] ?? null)
          : null,
      });
    }
    return { fromId, toId, dateStr, viaStations, segmentConfigs, useGakuwari };
  }

  // フィルタモード: sまたはtパラメータがあればフィルタを復元
  const hasFilterParams = seatStr !== "" || trainStr !== "";
  if (hasFilterParams) {
    const seatType: SeatType | null =
      seatCodes[0] && CODE_TO_SEAT[seatCodes[0]]
        ? CODE_TO_SEAT[seatCodes[0]]
        : null;
    const trainType: TrainType | null =
      trainCodes[0] && CODE_TO_TRAIN[trainCodes[0]]
        ? CODE_TO_TRAIN[trainCodes[0]]
        : null;
    return {
      fromId,
      toId,
      dateStr,
      viaStations: [],
      segmentConfigs: [{ seatType, trainType }],
      useGakuwari,
    };
  }

  return {
    fromId,
    toId,
    dateStr,
    viaStations: [],
    segmentConfigs: [{ seatType: null, trainType: null }],
    useGakuwari,
  };
}
