import type { CalculatedFares, StationId } from "./types";
import { getFareEntry } from "./allFares";
import {
  getSeason,
  getSeasonalBaseDiff,
  isExcludedDate as checkExcludedDate,
  getPlatKodamaGrade,
  getPlatKodamaGradeLabel,
  isAfterPlatKodamaValidUntil,
} from "./calendar";
import { isCrossRegion } from "./stations";

/** 学割運賃を計算 */
export function calcGakuwariTicketFare(
  ticketFare: number,
  distance: number,
): number {
  if (Math.ceil(distance) >= 101) {
    return Math.floor((ticketFare * 0.8) / 10) * 10;
  }
  return ticketFare;
}

/** メイン料金計算 */
export function calculateAllFares(
  from: StationId,
  to: StationId,
  dateStr: string,
): CalculatedFares | null {
  const entry = getFareEntry(from, to);
  if (!entry) return null;

  const season = getSeason(dateStr);
  const baseDiff = getSeasonalBaseDiff(season);
  const crossRegion = isCrossRegion(from, to);
  const seasonalDiff = crossRegion ? baseDiff * 2 : baseDiff;

  const ticketFare = entry.ticket_fare;
  const gakuwariTicketFare = calcGakuwariTicketFare(ticketFare, entry.distance);

  // 特急料金
  const free = entry.free;
  const hikariReservedBase = entry.hikari_reserved;
  const hikariReserved = hikariReservedBase + seasonalDiff;
  const nozomiAdditional = entry.nozomi_additional;
  const nozomiReserved =
    nozomiAdditional != null
      ? hikariReservedBase + seasonalDiff + nozomiAdditional
      : null;

  const greenCharge = entry.green_charge;
  const hikariGreen =
    greenCharge != null
      ? hikariReservedBase - 530 + greenCharge + seasonalDiff
      : entry.green + seasonalDiff;
  const nozomiGreen =
    nozomiAdditional != null ? hikariGreen + nozomiAdditional : null;

  // SmartEX
  const excluded = checkExcludedDate(dateStr);
  const smartexFree = entry.smartex_free;
  const smartexReserved =
    entry.smartex_reserved != null
      ? entry.smartex_reserved + seasonalDiff
      : null;
  const smartexReservedNozomi =
    entry.smartex_reserved != null && nozomiAdditional != null
      ? entry.smartex_reserved + seasonalDiff + nozomiAdditional
      : null;
  const smartexGreen =
    entry.smartex_green != null ? entry.smartex_green + seasonalDiff : null;
  const smartexGreenNozomi =
    entry.smartex_green != null && nozomiAdditional != null
      ? entry.smartex_green + seasonalDiff + nozomiAdditional
      : null;

  // 早特（設定除外日なら全てnull扱い）
  const hayatoku1 = excluded ? null : entry.smartex_hayatoku1;
  const hayatoku3NozomiGreen = excluded
    ? null
    : entry.smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_green;
  const hayatoku3HikariGreen = excluded
    ? null
    : entry.smartex_hayatoku3_hikari_green;
  const hayatoku3KodamaGreen = excluded
    ? null
    : entry.smartex_hayatoku3_kodama_green;
  const hayatoku7NozomiReserved = excluded
    ? null
    : entry.smartex_hayatoku7_nozomi_mizuho_sakura_tsubame_reserved;
  const hayatoku7HikariReserved = excluded
    ? null
    : entry.smartex_hayatoku7_hikari_kodama_reserved;
  const hayatoku21NozomiReserved = excluded
    ? null
    : entry.smartex_hayatoku21_nozomi_mizuho_sakura_tsubame_reserved;
  const familyHayatoku7HikariReserved = excluded
    ? null
    : entry.smartex_family_hayatoku7_hikari_kodama_reserved;

  // ぷらっとこだま
  let platKodamaReserved: number | null = null;
  let platKodamaGreen: number | null = null;
  let platKodamaLabel = "";
  let platKodamaAfterValidUntil = false;

  if (!excluded) {
    const grade = getPlatKodamaGrade(dateStr);
    platKodamaLabel = getPlatKodamaGradeLabel(grade);
    platKodamaAfterValidUntil = isAfterPlatKodamaValidUntil(dateStr);
    platKodamaReserved = entry[`plat_kodama_reserved_${grade}`];
    platKodamaGreen = entry[`plat_kodama_green_${grade}`];
  }

  return {
    distance: entry.distance,
    ticketFare,
    gakuwariTicketFare,
    free,
    hikariReserved,
    hikariReservedBase,
    nozomiReserved,
    hikariGreen,
    nozomiGreen,
    nozomiAdditional,
    greenCharge,
    seasonalDiff,
    smartexFree,
    smartexReserved,
    smartexReservedNozomi,
    smartexGreen,
    smartexGreenNozomi,
    hayatoku1,
    hayatoku3NozomiGreen,
    hayatoku3HikariGreen,
    hayatoku3KodamaGreen,
    hayatoku7NozomiReserved,
    hayatoku7HikariReserved,
    hayatoku21NozomiReserved,
    familyHayatoku7HikariReserved,
    platKodamaReserved,
    platKodamaGreen,
    platKodamaLabel,
    platKodamaAfterValidUntil,
    isExcludedDate: excluded,
  };
}
