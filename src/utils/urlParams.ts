import type { SeatType, SegmentConfig, StationId } from "../data/types";
import { isValidStationId } from "../data/stations";
import { trainTypeFromAbbr, trainTypeToAbbr } from "../data/trainTags";

/** 座席種別のURL略称 */
function seatToAbbr(s: SeatType): string {
  switch (s) {
    case "reserved":
      return "r";
    case "green":
      return "g";
    case "free":
      return "f";
  }
}

function seatFromAbbr(s: string): SeatType | null {
  switch (s) {
    case "r":
      return "reserved";
    case "g":
      return "green";
    case "f":
      return "free";
    default:
      return null;
  }
}

export interface ParsedUrlParams {
  from: StationId;
  to: StationId;
  date: string;
  gakuwari: boolean;
  viaStations: StationId[];
  segmentConfigs: SegmentConfig[];
}

/** URLパラメータを解析 */
export function parseUrlParams(): ParsedUrlParams {
  const params = new URLSearchParams(window.location.search);

  const fromRaw = params.get("from") ?? "tokyo";
  const toRaw = params.get("to") ?? "shinosaka";
  const from: StationId = isValidStationId(fromRaw) ? fromRaw : "tokyo";
  const to: StationId = isValidStationId(toRaw) ? toRaw : "shinosaka";

  const date = params.get("date") ?? new Date().toISOString().slice(0, 10);
  const gakuwari = params.get("gaku") === "1";

  // 経由駅
  const viaRaw = params.get("via") ?? "";
  const viaStations: StationId[] = viaRaw
    ? (viaRaw.split(",").filter((v) => isValidStationId(v)) as StationId[])
    : [];

  // 座席種別・列車名
  const sRaw = params.get("s") ?? "";
  const tRaw = params.get("t") ?? "";
  const seats = sRaw ? sRaw.split(",") : [];
  const trains = tRaw ? tRaw.split(",") : [];

  const numSegments = viaStations.length + 1;
  const segmentConfigs: SegmentConfig[] = [];
  for (let i = 0; i < numSegments; i++) {
    segmentConfigs.push({
      seatType: seats[i] ? seatFromAbbr(seats[i]) : null,
      trainType: trains[i] ? trainTypeFromAbbr(trains[i]) : null,
    });
  }

  return { from, to, date, gakuwari, viaStations, segmentConfigs };
}

/** URLパラメータを更新 */
export function updateUrlParams(state: ParsedUrlParams): void {
  const params = new URLSearchParams();
  params.set("from", state.from);
  params.set("to", state.to);
  params.set("date", state.date);
  if (state.gakuwari) params.set("gaku", "1");
  if (state.viaStations.length > 0) {
    params.set("via", state.viaStations.join(","));
  }

  const seats = state.segmentConfigs
    .map((c) => (c.seatType ? seatToAbbr(c.seatType) : ""))
    .join(",");
  const trains = state.segmentConfigs
    .map((c) => (c.trainType ? trainTypeToAbbr(c.trainType) : ""))
    .join(",");

  // 全て空でなければ設定
  if (seats.replace(/,/g, "")) params.set("s", seats);
  if (trains.replace(/,/g, "")) params.set("t", trains);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}
