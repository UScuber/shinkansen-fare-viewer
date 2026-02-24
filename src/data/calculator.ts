/**
 * 料金計算ロジック
 */

import { getSeason, SEASON_DIFF } from "./calendar";
import { findStation } from "./stations";
import { getAllFares } from "./allFares";
import platKodamaConfig from "./plat_kodama_config.json";

export type PassengerType = "adult" | "child";
export type PlatKodamaPriceClass = "A" | "B" | "C" | "D";

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

/**
 * ぷらっとこだまの料金区分を判定
 * @returns 料金区分（A/B/C/D）、判定できない場合はnull
 */
export function getPlatKodamaPriceClass(
  date: Date,
): PlatKodamaPriceClass | null {
  // 有効期限チェック
  const validUntil = new Date(platKodamaConfig.valid_until);
  if (date > validUntil) {
    return null;
  }

  // 繁忙期チェック
  const dateStr = date.toISOString().split("T")[0];
  for (const period of platKodamaConfig.peak_periods) {
    const start = new Date(period.start);
    const end = new Date(period.end);
    if (date >= start && date <= end) {
      return "D";
    }
  }

  // 祝日チェック
  if (platKodamaConfig.holidays.includes(dateStr)) {
    return "C";
  }

  // 曜日チェック（0=日曜、1=月曜、...、6=土曜）
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // 日曜または土曜
    return "C";
  } else if (dayOfWeek === 5) {
    // 金曜
    return "B";
  } else {
    // 月～木曜
    return "A";
  }
}

/**
 * 全料金計算結果の型定義
 */
export type CalculatedFares = {
  // 基本情報
  distance: number;
  ticketFare: number | null;
  studentFare: number | null;
  studentFareApplicable: boolean;
  platKodamaPriceClass: PlatKodamaPriceClass | null;

  // 特急券（季節加算済み）
  expressNozomiMizuhoReserved: number | null;
  expressOtherReserved: number | null;
  expressNozomiMizuhoGreen: number | null;
  expressOtherGreen: number | null;
  expressFree: number | null;

  // スマートEX（季節加算済み、自由席除く）
  smartexNozomiMizuhoReserved: number | null;
  smartexOtherReserved: number | null;
  smartexNozomiMizuhoGreen: number | null;
  smartexOtherGreen: number | null;
  smartexFree: number | null;

  // EX早特（除外日考慮済み）
  hayatoku1Free: number | null;
  hayatoku3NozomiMizuhoSakuraTsubameGreen: number | null;
  hayatoku3HikariGreen: number | null;
  hayatoku3KodamaGreen: number | null;
  hayatoku7NozomiMizuhoSakuraTsubameReserved: number | null;
  hayatoku7HikariKodamaReserved: number | null;
  hayatoku21NozomiMizuhoSakuraTsubameReserved: number | null;
  familyHayatoku7HikariKodamaReserved: number | null;

  // ぷらっとこだま（除外日考慮済み）
  platKodamaReservedA: number | null;
  platKodamaReservedB: number | null;
  platKodamaReservedC: number | null;
  platKodamaReservedD: number | null;
  platKodamaGreenA: number | null;
  platKodamaGreenB: number | null;
  platKodamaGreenC: number | null;
  platKodamaGreenD: number | null;
};

/**
 * 指定区間・日付の全料金を計算（乗客種別適用前）
 * シーズンによる金額調整、学割計算、特急券計算などをすべて実施
 */
export function calculateAllFares(
  fromId: string,
  toId: string,
  date: Date,
): CalculatedFares | null {
  const fareData = getAllFares(fromId, toId);
  if (!fareData) {
    return null;
  }

  const seasonalDiff = calculateSeasonalDiff(fromId, toId, date);
  const excluded = isExcludedDate(date);
  const isAfter2026Apr = date >= new Date(2026, 3, 1);
  const platKodamaPriceClass = getPlatKodamaPriceClass(date);

  // 基本情報
  const distance = fareData.distance;
  const ticketFare = fareData.ticket_fare;
  const studentFare = calculateStudentFare(distance, ticketFare);
  const studentFareApplicable = Math.ceil(distance) >= 101;

  // 特急券（季節加算適用）
  const hikariReservedWithSeason = addSeasonalDiff(
    fareData.hikari_reserved,
    seasonalDiff,
  );
  const greenWithSeason = addSeasonalDiff(fareData.green, seasonalDiff);

  const expressNozomiMizuhoReserved = addAdditional(
    hikariReservedWithSeason,
    fareData.nozomi_additional,
  );
  const expressOtherReserved = hikariReservedWithSeason;
  const expressNozomiMizuhoGreen = addAdditional(
    greenWithSeason,
    fareData.nozomi_additional,
  );
  const expressOtherGreen = greenWithSeason;
  const expressFree = fareData.free;

  // スマートEX（指定席・グリーンは季節加算適用、自由席は適用なし）
  const smartexReservedWithSeason = addSeasonalDiff(
    fareData.smartex_reserved,
    seasonalDiff,
  );
  const smartexGreenWithSeason = addSeasonalDiff(
    fareData.smartex_green,
    seasonalDiff,
  );

  const smartexNozomiMizuhoReserved = addAdditional(
    smartexReservedWithSeason,
    fareData.nozomi_additional,
  );
  const smartexOtherReserved = smartexReservedWithSeason;
  const smartexNozomiMizuhoGreen = addAdditional(
    smartexGreenWithSeason,
    fareData.nozomi_additional,
  );
  const smartexOtherGreen = smartexGreenWithSeason;
  const smartexFree = fareData.smartex_free;

  // EX早特（除外日の場合null）
  const hayatoku1Base = isAfter2026Apr
    ? fareData.smartex_hayatoku1_2026_apr
    : fareData.smartex_hayatoku1;

  const hayatoku1Free = excluded ? null : hayatoku1Base;
  const hayatoku3NozomiMizuhoSakuraTsubameGreen = excluded
    ? null
    : fareData.smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_green;
  const hayatoku3HikariGreen = excluded
    ? null
    : fareData.smartex_hayatoku3_hikari_green;
  const hayatoku3KodamaGreen = excluded
    ? null
    : fareData.smartex_hayatoku3_kodama_green;
  const hayatoku7NozomiMizuhoSakuraTsubameReserved = excluded
    ? null
    : fareData.smartex_hayatoku7_nozomi_mizuho_sakura_tsubame_reserved;
  const hayatoku7HikariKodamaReserved = excluded
    ? null
    : fareData.smartex_hayatoku7_hikari_kodama_reserved;
  const hayatoku21NozomiMizuhoSakuraTsubameReserved = excluded
    ? null
    : fareData.smartex_hayatoku21_nozomi_mizuho_sakura_tsubame_reserved;
  const familyHayatoku7HikariKodamaReserved = excluded
    ? null
    : fareData.smartex_family_hayatoku7_hikari_kodama_reserved;

  // ぷらっとこだま（除外日の場合null）
  const platKodamaReservedA = excluded ? null : fareData.plat_kodama_reserved_a;
  const platKodamaReservedB = excluded ? null : fareData.plat_kodama_reserved_b;
  const platKodamaReservedC = excluded ? null : fareData.plat_kodama_reserved_c;
  const platKodamaReservedD = excluded ? null : fareData.plat_kodama_reserved_d;
  const platKodamaGreenA = excluded ? null : fareData.plat_kodama_green_a;
  const platKodamaGreenB = excluded ? null : fareData.plat_kodama_green_b;
  const platKodamaGreenC = excluded ? null : fareData.plat_kodama_green_c;
  const platKodamaGreenD = excluded ? null : fareData.plat_kodama_green_d;

  return {
    distance,
    ticketFare,
    studentFare,
    studentFareApplicable,
    platKodamaPriceClass,
    expressNozomiMizuhoReserved,
    expressOtherReserved,
    expressNozomiMizuhoGreen,
    expressOtherGreen,
    expressFree,
    smartexNozomiMizuhoReserved,
    smartexOtherReserved,
    smartexNozomiMizuhoGreen,
    smartexOtherGreen,
    smartexFree,
    hayatoku1Free,
    hayatoku3NozomiMizuhoSakuraTsubameGreen,
    hayatoku3HikariGreen,
    hayatoku3KodamaGreen,
    hayatoku7NozomiMizuhoSakuraTsubameReserved,
    hayatoku7HikariKodamaReserved,
    hayatoku21NozomiMizuhoSakuraTsubameReserved,
    familyHayatoku7HikariKodamaReserved,
    platKodamaReservedA,
    platKodamaReservedB,
    platKodamaReservedC,
    platKodamaReservedD,
    platKodamaGreenA,
    platKodamaGreenB,
    platKodamaGreenC,
    platKodamaGreenD,
  };
}
