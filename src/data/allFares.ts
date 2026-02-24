/**
 * 全運賃データの取得
 * fares.jsonから全項目を読み込み
 */

import FARES_DATA from "./fares.json";

export type AllFaresEntry = {
  start: string;
  end: string;
  hikari_reserved: number | null;
  green: number | null;
  free: number | null;
  nozomi_additional: number | null;
  distance: number;
  ticket_fare: number | null;
  smartex_free: number | null;
  smartex_reserved: number | null;
  smartex_green: number | null;
  smartex_hayatoku1: number | null;
  smartex_hayatoku1_2026_apr: number | null;
  smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_green: number | null;
  smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_reserved: number | null;
  smartex_hayatoku3_hikari_green: number | null;
  smartex_hayatoku3_kodama_green: number | null;
  smartex_hayatoku7_nozomi_mizuho_sakura_tsubame_reserved: number | null;
  smartex_hayatoku7_hikari_kodama_reserved: number | null;
  smartex_hayatoku21_nozomi_mizuho_sakura_tsubame_reserved: number | null;
  smartex_family_hayatoku7_hikari_kodama_reserved: number | null;
  plat_kodama_reserved_a: number | null;
  plat_kodama_reserved_b: number | null;
  plat_kodama_reserved_c: number | null;
  plat_kodama_reserved_d: number | null;
  plat_kodama_green_a: number | null;
  plat_kodama_green_b: number | null;
  plat_kodama_green_c: number | null;
  plat_kodama_green_d: number | null;
};

// JSONデータをMapに変換（双方向）
const fareMap = new Map<string, AllFaresEntry>();

(FARES_DATA as AllFaresEntry[]).forEach((entry) => {
  const key1 = `${entry.start}_${entry.end}`;
  const key2 = `${entry.end}_${entry.start}`;
  fareMap.set(key1, entry);
  fareMap.set(key2, entry);
});

/**
 * 駅IDから全運賃データを取得
 * @param from 出発駅ID
 * @param to 到着駅ID
 */
export function getAllFares(from: string, to: string): AllFaresEntry | null {
  const key = `${from}_${to}`;
  return fareMap.get(key) || null;
}
