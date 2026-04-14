import type { SeasonType } from "./types";
import seasonRangesJson from "./season_ranges.json";
import platKodamaConfigJson from "./plat_kodama_config.json";

interface SeasonRange {
  start: string;
  end: string;
  season: "off" | "peak1" | "peak2";
}

const seasonRanges: SeasonRange[] = seasonRangesJson as SeasonRange[];

/** 日付文字列（YYYY-MM-DD）から季節を判定 */
export function getSeason(dateStr: string): SeasonType {
  for (const range of seasonRanges) {
    if (dateStr >= range.start && dateStr <= range.end) {
      return range.season;
    }
  }
  return "normal";
}

/** 季節に応じた加算額（基本値） */
export function getSeasonalBaseDiff(season: SeasonType): number {
  switch (season) {
    case "off":
      return -200;
    case "normal":
      return 0;
    case "peak1":
      return 200;
    case "peak2":
      return 400;
  }
}

/** 季節バッジ情報 */
export function getSeasonLabel(season: SeasonType): {
  label: string;
  color: string;
  diff: string;
} {
  switch (season) {
    case "off":
      return { label: "閑散期", color: "#4caf50", diff: "-200円" };
    case "normal":
      return { label: "通常期", color: "#2196f3", diff: "±0円" };
    case "peak1":
      return { label: "繁忙期", color: "#ff9800", diff: "+200円" };
    case "peak2":
      return { label: "最繁忙期", color: "#f44336", diff: "+400円" };
  }
}

/** 設定除外日の判定（早特・ぷらっとこだまが利用不可） */
export function isExcludedDate(dateStr: string): boolean {
  const excluded = [
    { start: "2026-04-24", end: "2026-05-06" }, // GW
    { start: "2026-08-07", end: "2026-08-16" }, // お盆
    { start: "2026-09-18", end: "2026-09-23" }, // SW
    { start: "2026-12-25", end: "2027-01-05" }, // 年末年始
  ];
  return excluded.some((p) => dateStr >= p.start && dateStr <= p.end);
}

interface PlatKodamaConfig {
  peak_periods: { start: string; end: string }[];
  holidays: string[];
  valid_until: string;
}

const platKodamaConfig: PlatKodamaConfig =
  platKodamaConfigJson as PlatKodamaConfig;

/** ぷらっとこだまの料金区分を取得 */
export function getPlatKodamaGrade(dateStr: string): "a" | "b" | "c" | "d" {
  // 繁忙期チェック
  for (const period of platKodamaConfig.peak_periods) {
    if (dateStr >= period.start && dateStr <= period.end) {
      return "d";
    }
  }

  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay(); // 0=日, 5=金, 6=土

  // 金曜日
  if (dayOfWeek === 5) return "b";

  // 土日祝
  if (
    dayOfWeek === 0 ||
    dayOfWeek === 6 ||
    platKodamaConfig.holidays.includes(dateStr)
  ) {
    return "c";
  }

  // 月〜木
  return "a";
}

/** ぷらっとこだまの有効期限 */
export function getPlatKodamaValidUntil(): string {
  return platKodamaConfigJson.valid_until;
}

/** ぷらっとこだまの有効期限を過ぎているか */
export function isAfterPlatKodamaValidUntil(dateStr: string): boolean {
  return dateStr > platKodamaConfigJson.valid_until;
}

/** ぷらっとこだまの料金区分ラベル */
export function getPlatKodamaGradeLabel(grade: "a" | "b" | "c" | "d"): string {
  switch (grade) {
    case "a":
      return "A料金";
    case "b":
      return "B料金";
    case "c":
      return "C料金";
    case "d":
      return "D料金";
  }
}
