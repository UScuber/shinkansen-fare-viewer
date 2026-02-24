/**
 * 料金計算ロジック
 */

import { getSeason, SEASON_DIFF } from "./calendar";
import { findStation } from "./stations";

export type PassengerType = "adult" | "child";

export function applyPassenger(
  fare: number | null,
  type: PassengerType,
): number | null {
  if (fare === null) return null;
  if (type === "child") return Math.floor(fare / 2);
  return fare;
}

/**
 * 東海道新幹線の東京～京都の駅かどうか判定（新大阪は含まない）
 */
function isTokaidoUpToKyoto(stationId: string): boolean {
  const station = findStation(stationId);
  if (!station) return false;
  return station.line === "tokaido" && station.id !== "shinosaka";
}

/**
 * 九州新幹線の駅かどうか判定
 */
function isKyushu(stationId: string): boolean {
  const station = findStation(stationId);
  if (!station) return false;
  return station.line === "kyushu";
}

/**
 * 東海道(東京～京都)と九州(新鳥栖～鹿児島中央)をまたぐ区間か判定
 * この場合、季節による加算金額が倍になる
 */
function isCrossRegion(fromId: string, toId: string): boolean {
  return (
    (isTokaidoUpToKyoto(fromId) && isKyushu(toId)) ||
    (isKyushu(fromId) && isTokaidoUpToKyoto(toId))
  );
}

/**
 * 早特・ぷらっとこだまの設定除外日かどうか判定
 */
export function isExcludedDate(date: Date): boolean {
  const ranges = [
    { start: new Date(2026, 3, 24), end: new Date(2026, 4, 6) }, // GW
    { start: new Date(2026, 7, 7), end: new Date(2026, 7, 16) }, // お盆
    { start: new Date(2026, 8, 18), end: new Date(2026, 8, 23) }, // シルバーウィーク
    { start: new Date(2026, 11, 25), end: new Date(2027, 0, 5) }, // 年末年始
  ];
  for (const range of ranges) {
    if (date >= range.start && date <= range.end) {
      return true;
    }
  }
  return false;
}

/**
 * 学割運賃を計算
 * distanceの小数第一位を切り上げた値が101以上の場合、
 * ticket_fareを0.8倍して一の位を切り捨てた値
 */
export function calculateStudentFare(
  distance: number,
  ticketFare: number | null,
): number | null {
  if (ticketFare === null) return null;
  const ceiledDistance = Math.ceil(distance);
  if (ceiledDistance >= 101) {
    return Math.floor((ticketFare * 0.8) / 10) * 10;
  }
  return ticketFare;
}

export function calculateSeasonalDiff(
  fromId: string,
  toId: string,
  date: Date,
): number {
  const season = getSeason(date);
  let seasonalDiff = SEASON_DIFF[season];
  if (isCrossRegion(fromId, toId)) {
    seasonalDiff *= 2;
  }
  return seasonalDiff;
}

export function addSeasonalDiff(
  fare: number | null,
  seasonalDiff: number,
): number | null {
  if (fare === null) return null;
  return fare + seasonalDiff;
}

export function addAdditional(
  fare: number | null,
  additional: number | null,
): number | null {
  if (fare === null || additional === null) return null;
  return fare + additional;
}
