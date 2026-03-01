// 新幹線全駅リスト（東海道・山陽・九州）
export type Station = {
  id: string;
  name: string;
  line: "tokaido" | "sanyo" | "kyushu";
  // 名古屋からの営業キロ（東海道・山陽）または博多からの距離（九州）
  distFromTokyo?: number; // 東京からの km（参考用）
};

export const STATIONS: Station[] = [
  // 東海道新幹線
  { id: "tokyo", name: "東京", line: "tokaido", distFromTokyo: 0 },
  { id: "shinagawa", name: "品川", line: "tokaido", distFromTokyo: 6.8 },
  { id: "shinyokohama", name: "新横浜", line: "tokaido", distFromTokyo: 28.8 },
  { id: "odawara", name: "小田原", line: "tokaido", distFromTokyo: 83.9 },
  { id: "atami", name: "熱海", line: "tokaido", distFromTokyo: 104.6 },
  { id: "mishima", name: "三島", line: "tokaido", distFromTokyo: 120.7 },
  { id: "shinfuji", name: "新富士", line: "tokaido", distFromTokyo: 146.2 },
  { id: "shizuoka", name: "静岡", line: "tokaido", distFromTokyo: 180.2 },
  { id: "kakegawa", name: "掛川", line: "tokaido", distFromTokyo: 229.3 },
  { id: "hamamatsu", name: "浜松", line: "tokaido", distFromTokyo: 257.1 },
  { id: "toyohashi", name: "豊橋", line: "tokaido", distFromTokyo: 293.6 },
  {
    id: "mikawaanjo",
    name: "三河安城",
    line: "tokaido",
    distFromTokyo: 336.3,
  },
  { id: "nagoya", name: "名古屋", line: "tokaido", distFromTokyo: 366.0 },
  {
    id: "gifuhashima",
    name: "岐阜羽島",
    line: "tokaido",
    distFromTokyo: 396.3,
  },
  { id: "maibara", name: "米原", line: "tokaido", distFromTokyo: 445.9 },
  { id: "kyoto", name: "京都", line: "tokaido", distFromTokyo: 513.6 },
  { id: "shinosaka", name: "新大阪", line: "tokaido", distFromTokyo: 552.6 },
  // 山陽新幹線
  { id: "shinkobe", name: "新神戸", line: "sanyo", distFromTokyo: 588.5 },
  { id: "nishiakashi", name: "西明石", line: "sanyo", distFromTokyo: 617.0 },
  { id: "himeji", name: "姫路", line: "sanyo", distFromTokyo: 644.0 },
  { id: "aioi", name: "相生", line: "sanyo", distFromTokyo: 671.3 },
  { id: "okayama", name: "岡山", line: "sanyo", distFromTokyo: 732.9 },
  { id: "shinkurashiki", name: "新倉敷", line: "sanyo", distFromTokyo: 768.0 },
  { id: "fukuyama", name: "福山", line: "sanyo", distFromTokyo: 800.0 },
  { id: "shinonomichi", name: "新尾道", line: "sanyo", distFromTokyo: 817.0 },
  { id: "mihara", name: "三原", line: "sanyo", distFromTokyo: 839.0 },
  {
    id: "higashihiroshima",
    name: "東広島",
    line: "sanyo",
    distFromTokyo: 869.0,
  },
  { id: "hiroshima", name: "広島", line: "sanyo", distFromTokyo: 894.2 },
  { id: "shiniwakuni", name: "新岩国", line: "sanyo", distFromTokyo: 930.0 },
  { id: "tokuyama", name: "徳山", line: "sanyo", distFromTokyo: 958.0 },
  { id: "shinyamaguchi", name: "新山口", line: "sanyo", distFromTokyo: 996.0 },
  { id: "asa", name: "厚狭", line: "sanyo", distFromTokyo: 1022.0 },
  {
    id: "shinshimonoseki",
    name: "新下関",
    line: "sanyo",
    distFromTokyo: 1039.0,
  },
  { id: "kokura", name: "小倉", line: "sanyo", distFromTokyo: 1061.0 },
  { id: "hakata", name: "博多", line: "sanyo", distFromTokyo: 1069.1 },
  // 九州新幹線
  { id: "shintoso", name: "新鳥栖", line: "kyushu", distFromTokyo: 1090.0 },
  { id: "kurume", name: "久留米", line: "kyushu", distFromTokyo: 1098.0 },
  {
    id: "chikugofunagoya",
    name: "筑後船小屋",
    line: "kyushu",
    distFromTokyo: 1117.0,
  },
  { id: "shinomuta", name: "新大牟田", line: "kyushu", distFromTokyo: 1131.0 },
  { id: "shintamana", name: "新玉名", line: "kyushu", distFromTokyo: 1150.0 },
  { id: "kumamoto", name: "熊本", line: "kyushu", distFromTokyo: 1176.0 },
  {
    id: "shinyatsushiro",
    name: "新八代",
    line: "kyushu",
    distFromTokyo: 1196.0,
  },
  { id: "shinminamata", name: "新水俣", line: "kyushu", distFromTokyo: 1229.0 },
  { id: "izumi", name: "出水", line: "kyushu", distFromTokyo: 1253.0 },
  { id: "sendai", name: "川内", line: "kyushu", distFromTokyo: 1289.0 },
  {
    id: "kagoshimachuo",
    name: "鹿児島中央",
    line: "kyushu",
    distFromTokyo: 1322.0,
  },
];

export const STATION_IDS = STATIONS.map((s) => s.id);

export function findStation(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}

/**
 * STATIONS配列内の駅インデックスを返す（見つからない場合-1）
 */
export function getStationIndex(id: string): number {
  return STATIONS.findIndex((s) => s.id === id);
}

const HAKATA_INDEX = getStationIndex("hakata");
const SHINOSAKA_INDEX = getStationIndex("shinosaka");

/**
 * 指定した駅IDリストが路線順序通りかどうか検証する
 * 昇順（東京→鹿児島方向）または降順のいずれかであればtrue
 */
export function areStationsInOrder(stationIds: string[]): boolean {
  if (stationIds.length <= 1) return true;
  const indices = stationIds.map(getStationIndex);
  if (indices.some((i) => i === -1)) return false;
  const ascending = indices.every(
    (val, i) => i === 0 || val > indices[i - 1],
  );
  const descending = indices.every(
    (val, i) => i === 0 || val < indices[i - 1],
  );
  return ascending || descending;
}

/**
 * 博多が2駅間に位置するかどうか判定（両端含まない）
 */
export function isHakataBetween(fromId: string, toId: string): boolean {
  const fromIdx = getStationIndex(fromId);
  const toIdx = getStationIndex(toId);
  if (fromIdx === -1 || toIdx === -1) return false;
  const lo = Math.min(fromIdx, toIdx);
  const hi = Math.max(fromIdx, toIdx);
  return HAKATA_INDEX > lo && HAKATA_INDEX < hi;
}

/**
 * 2駅間の駅リストを返す（経由駅候補用）
 * 両端を含まず、常に地理的順序で返す
 */
export function getStationsBetween(
  fromId: string,
  toId: string,
): Station[] {
  const fromIdx = getStationIndex(fromId);
  const toIdx = getStationIndex(toId);
  if (fromIdx === -1 || toIdx === -1) return [];
  const lo = Math.min(fromIdx, toIdx);
  const hi = Math.max(fromIdx, toIdx);
  return STATIONS.slice(lo + 1, hi);
}

import type { TrainType } from "./types";

/**
 * 区間で利用可能な列車リストを返す
 *
 * 仕様:
 * - 東海道内（〜新大阪）: のぞみ、ひかり、こだま
 * - 山陽内（新大阪〜博多）: のぞみ、ひかり、こだま、みずほ、さくら
 * - 九州内（博多〜鹿児島中央）: みずほ、さくら、つばめ
 * - 東海道＋山陽またぎ（新大阪より東京側 ↔ 新大阪より博多側）: のぞみ、ひかり、こだま
 * - 山陽＋九州またぎ: みずほ、さくら
 */
export function getAvailableTrains(
  fromId: string,
  toId: string,
): TrainType[] {
  const fromIdx = getStationIndex(fromId);
  const toIdx = getStationIndex(toId);
  if (fromIdx === -1 || toIdx === -1) return [];

  const lo = Math.min(fromIdx, toIdx);
  const hi = Math.max(fromIdx, toIdx);

  // 区間がどの範囲にまたがるか判定
  // 新大阪は東海道と山陽の両方に属する。位置的に:
  //   東海道のみ: hi <= SHINOSAKA_INDEX
  //   山陽のみ: lo >= SHINOSAKA_INDEX && hi <= HAKATA_INDEX
  //   九州のみ: lo >= HAKATA_INDEX
  //   東海道+山陽またぎ: lo < SHINOSAKA_INDEX && hi > SHINOSAKA_INDEX && hi <= HAKATA_INDEX
  //   山陽+九州またぎ: lo >= SHINOSAKA_INDEX && lo < HAKATA_INDEX && hi > HAKATA_INDEX
  //   (lo < SHINOSAKA_INDEX && hi > HAKATA_INDEX は東海道+九州の直接またぎ。通常は単一区間にならない)

  const inTokaidoOnly = hi <= SHINOSAKA_INDEX;
  const inSanyoOnly = lo >= SHINOSAKA_INDEX && hi <= HAKATA_INDEX;
  const inKyushuOnly = lo >= HAKATA_INDEX;
  const crossTokaidoSanyo =
    lo < SHINOSAKA_INDEX && hi > SHINOSAKA_INDEX && hi <= HAKATA_INDEX;
  const crossSanyoKyushu =
    lo >= SHINOSAKA_INDEX && lo < HAKATA_INDEX && hi > HAKATA_INDEX;

  if (inTokaidoOnly) {
    return ["nozomi", "hikari", "kodama"];
  }
  if (inSanyoOnly) {
    return ["nozomi", "hikari", "kodama", "mizuho", "sakura"];
  }
  if (inKyushuOnly) {
    return ["mizuho", "sakura", "tsubame"];
  }
  if (crossTokaidoSanyo) {
    return ["nozomi", "hikari", "kodama"];
  }
  if (crossSanyoKyushu) {
    return ["mizuho", "sakura"];
  }

  // 東海道+九州をまたぐ場合（通常は単一区間にならないが安全のため）
  return [];
}

/**
 * 区間で利用可能な列車リストを返す（停車駅フィルタリング済み）
 *
 * エリアベースの `getAvailableTrains` に加え、
 * 両端駅に実際に停車する列車だけに絞り込む。
 */
export function getAvailableTrainsFiltered(
  fromId: string,
  toId: string,
): TrainType[] {
  const areaTrains = getAvailableTrains(fromId, toId);
  return areaTrains.filter(
    (t) => doesTrainStopAt(t, fromId) && doesTrainStopAt(t, toId),
  );
}

/**
 * 各列車の停車駅リスト
 */
const TRAIN_STOPS: Record<TrainType, Set<string>> = {
  nozomi: new Set([
    "tokyo", "shinagawa", "shinyokohama", "nagoya", "kyoto", "shinosaka",
    "shinkobe", "okayama", "hiroshima", "kokura", "hakata",
    "nishiakashi", "himeji", "fukuyama", "tokuyama", "shinyamaguchi",
  ]),
  hikari: new Set(
    // 東京〜博多の全駅から新富士・三河安城・厚狭を除く
    STATIONS
      .filter((s) => {
        const idx = STATIONS.indexOf(s);
        return idx <= HAKATA_INDEX;
      })
      .map((s) => s.id)
      .filter((id) => !["shinfuji", "mikawaanjo", "asa"].includes(id)),
  ),
  kodama: new Set(
    // 東京〜博多の全駅
    STATIONS.filter((_, idx) => idx <= HAKATA_INDEX).map((s) => s.id),
  ),
  mizuho: new Set([
    "shinosaka", "shinkobe", "himeji", "okayama", "fukuyama", "hiroshima",
    "shinyamaguchi", "kokura", "hakata", "kumamoto", "sendai", "kagoshimachuo",
  ]),
  sakura: new Set([
    // 山陽区間の停車駅
    "shinosaka", "shinkobe", "nishiakashi", "himeji", "okayama", "fukuyama",
    "hiroshima", "tokuyama", "shinyamaguchi", "shinshimonoseki", "kokura",
    // 博多〜鹿児島中央の全駅
    ...STATIONS
      .filter((_, idx) => idx >= HAKATA_INDEX)
      .map((s) => s.id),
  ]),
  tsubame: new Set(
    // 新下関〜鹿児島中央の全駅
    STATIONS
      .filter((_, idx) => idx >= STATIONS.findIndex((s) => s.id === "shinshimonoseki"))
      .map((s) => s.id),
  ),
};

/**
 * 指定した列車が指定した駅に停車するか判定
 */
export function doesTrainStopAt(trainType: TrainType, stationId: string): boolean {
  return TRAIN_STOPS[trainType]?.has(stationId) ?? false;
}

/**
 * 列車がのぞみ/みずほグループかどうか判定
 */
export function isNozomiMizuho(trainType: TrainType | null): boolean {
  return trainType === "nozomi" || trainType === "mizuho";
}
