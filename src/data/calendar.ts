/**
 * 繁忙期カレンダー
 *
 * season:
 *   'peak2'   = 最繁忙期 (+400円)
 *   'peak1'   = 繁忙期   (+200円)
 *   'normal'  = 通常期   (基準)
 *   'off'     = 閑散期   (-200円)
 */

import SEASON_RANGES_DATA from "./season_ranges.json";

export type Season = "peak2" | "peak1" | "normal" | "off";

export const SEASON_DIFF: Record<Season, number> = {
  peak2: 400,
  peak1: 200,
  normal: 0,
  off: -200,
};

/**
 * ローカル日付を "YYYY-MM-DD" 形式の文字列に変換する。
 * toISOString() はUTCに変換するため、JST等では日付がずれる問題を回避する。
 */
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 日付範囲 [start, end] を含む全日付を列挙
function rangeToSeasons(
  ranges: { start: string; end: string; season: Season }[],
): Map<string, Season> {
  const map = new Map<string, Season>();
  for (const r of ranges) {
    // "T00:00:00" を付与してローカル時間として解釈させる
    // （日付のみの文字列はUTCとして解釈されるため）
    const start = new Date(r.start + "T00:00:00");
    const end = new Date(r.end + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      map.set(toLocalDateKey(d), r.season);
    }
  }
  return map;
}

// JSONファイルから読み込んだ繁忙期カレンダー（日付範囲）
// 通常期以外の日程を定義。未定義日は通常期として扱う。
const SEASON_RANGES: { start: string; end: string; season: Season }[] =
  SEASON_RANGES_DATA as {
    start: string;
    end: string;
    season: Season;
  }[];

// ビルド時に展開（ランタイムでのMap生成）
let _seasonMap: Map<string, Season> | null = null;
function getSeasonMap(): Map<string, Season> {
  if (!_seasonMap) {
    _seasonMap = rangeToSeasons(SEASON_RANGES);
  }
  return _seasonMap;
}

/**
 * 指定日の繁忙期区分を返す
 */
export function getSeason(date: Date): Season {
  const key = toLocalDateKey(date);
  return getSeasonMap().get(key) ?? "normal";
}
