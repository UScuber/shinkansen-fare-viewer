import type { StationId, TrainType } from "./types";

export interface StationInfo {
  id: StationId;
  name: string;
}

/** 全46駅を路線順に定義 */
export const STATIONS: StationInfo[] = [
  // 東海道新幹線（0〜16）
  { id: "tokyo", name: "東京" },
  { id: "shinagawa", name: "品川" },
  { id: "shinyokohama", name: "新横浜" },
  { id: "odawara", name: "小田原" },
  { id: "atami", name: "熱海" },
  { id: "mishima", name: "三島" },
  { id: "shinfuji", name: "新富士" },
  { id: "shizuoka", name: "静岡" },
  { id: "kakegawa", name: "掛川" },
  { id: "hamamatsu", name: "浜松" },
  { id: "toyohashi", name: "豊橋" },
  { id: "mikawaanjo", name: "三河安城" },
  { id: "nagoya", name: "名古屋" },
  { id: "gifuhashima", name: "岐阜羽島" },
  { id: "maibara", name: "米原" },
  { id: "kyoto", name: "京都" },
  { id: "shinosaka", name: "新大阪" },
  // 山陽新幹線（17〜33）
  { id: "shinkobe", name: "新神戸" },
  { id: "nishiakashi", name: "西明石" },
  { id: "himeji", name: "姫路" },
  { id: "aioi", name: "相生" },
  { id: "okayama", name: "岡山" },
  { id: "shinkurashiki", name: "新倉敷" },
  { id: "fukuyama", name: "福山" },
  { id: "shinonomichi", name: "新尾道" },
  { id: "mihara", name: "三原" },
  { id: "higashihiroshima", name: "東広島" },
  { id: "hiroshima", name: "広島" },
  { id: "shiniwakuni", name: "新岩国" },
  { id: "tokuyama", name: "徳山" },
  { id: "shinyamaguchi", name: "新山口" },
  { id: "asa", name: "厚狭" },
  { id: "shinshimonoseki", name: "新下関" },
  { id: "kokura", name: "小倉" },
  // 博多（34）- 山陽と九州の境界
  { id: "hakata", name: "博多" },
  // 九州新幹線（35〜45）
  { id: "shintoso", name: "新鳥栖" },
  { id: "kurume", name: "久留米" },
  { id: "chikugofunagoya", name: "筑後船小屋" },
  { id: "shinomuta", name: "新大牟田" },
  { id: "shinyatsushiro", name: "新八代" },
  { id: "kumamoto", name: "熊本" },
  { id: "shintamana", name: "新玉名" },
  { id: "shinminamata", name: "新水俣" },
  { id: "izumi", name: "出水" },
  { id: "sendai", name: "川内" },
  { id: "kagoshimachuo", name: "鹿児島中央" },
];

/** 駅IDからインデックスを取得するMap */
const stationIndexMap = new Map<StationId, number>(
  STATIONS.map((s, i) => [s.id, i]),
);

/** 駅IDからインデックスを取得 */
export function getStationIndex(id: StationId): number {
  const idx = stationIndexMap.get(id);
  if (idx === undefined) throw new Error(`Unknown station: ${id}`);
  return idx;
}

/** 駅IDから駅名を取得 */
export function getStationName(id: StationId): string {
  const station = STATIONS.find((s) => s.id === id);
  if (!station) throw new Error(`Unknown station: ${id}`);
  return station.name;
}

/** 文字列が有効な駅IDかチェック */
export function isValidStationId(id: string): id is StationId {
  return stationIndexMap.has(id as StationId);
}

/** 路線区分インデックス */
const TOKAIDO_END = 16; // 新大阪
const SANYO_END = 34; // 博多（含む）
// 九州: 35〜45

/** 東海道新幹線の駅かどうか（東京〜京都：0〜15） */
export function isTokaidoStation(id: StationId): boolean {
  const idx = getStationIndex(id);
  return idx <= 15; // 京都まで（新大阪は含まない）
}

/** 九州新幹線の駅かどうか（新鳥栖〜鹿児島中央：35〜45） */
export function isKyushuStation(id: StationId): boolean {
  const idx = getStationIndex(id);
  return idx >= 35;
}

/** 博多駅かどうか */
export function isHakata(id: StationId): boolean {
  return id === "hakata";
}

/** 博多インデックス */
export const HAKATA_INDEX = 34;

/** 東海道駅（東京〜京都）↔ 九州駅（新鳥栖〜鹿児島中央）のまたぎ判定 */
export function isCrossRegion(from: StationId, to: StationId): boolean {
  return (
    (isTokaidoStation(from) && isKyushuStation(to)) ||
    (isKyushuStation(from) && isTokaidoStation(to))
  );
}

/** 2駅間の中間駅リスト（from, toは含まない） */
export function getIntermediateStations(
  from: StationId,
  to: StationId,
): StationInfo[] {
  let fromIdx = getStationIndex(from);
  let toIdx = getStationIndex(to);
  if (fromIdx > toIdx) [fromIdx, toIdx] = [toIdx, fromIdx];
  return STATIONS.slice(fromIdx + 1, toIdx);
}

/** 区間で利用可能な列車のリスト */
export function getAvailableTrains(
  from: StationId,
  to: StationId,
): TrainType[] {
  let fromIdx = getStationIndex(from);
  let toIdx = getStationIndex(to);
  if (fromIdx > toIdx) [fromIdx, toIdx] = [toIdx, fromIdx];

  const inTokaido = fromIdx <= TOKAIDO_END && toIdx <= TOKAIDO_END;
  const inSanyo =
    fromIdx >= TOKAIDO_END &&
    fromIdx <= SANYO_END &&
    toIdx >= TOKAIDO_END &&
    toIdx <= SANYO_END;
  const inKyushu = fromIdx >= SANYO_END && toIdx >= SANYO_END;
  const tokaidoSanyo =
    fromIdx <= TOKAIDO_END && toIdx > TOKAIDO_END && toIdx <= SANYO_END;
  const sanyoKyushu =
    fromIdx >= TOKAIDO_END && fromIdx <= SANYO_END && toIdx > SANYO_END;
  const tokaidoKyushu = fromIdx <= TOKAIDO_END && toIdx > SANYO_END;

  let trains: TrainType[];

  if (inTokaido) {
    trains = ["nozomi", "hikari", "kodama"];
  } else if (inSanyo) {
    trains = ["nozomi", "hikari", "kodama", "mizuho", "sakura"];
  } else if (inKyushu) {
    trains = ["mizuho", "sakura", "tsubame"];
  } else if (tokaidoSanyo || tokaidoKyushu) {
    trains = ["nozomi", "hikari", "kodama"];
  } else if (sanyoKyushu) {
    trains = ["mizuho", "sakura"];
  } else {
    trains = ["nozomi", "hikari", "kodama"];
  }

  // さらに停車駅でフィルタ
  return trains.filter(
    (t) => TRAIN_STOPS[t].includes(from) && TRAIN_STOPS[t].includes(to),
  );
}

/** 列車ごとの停車駅 */
export const TRAIN_STOPS: Record<TrainType, StationId[]> = {
  nozomi: [
    "tokyo",
    "shinagawa",
    "shinyokohama",
    "nagoya",
    "kyoto",
    "shinosaka",
    "shinkobe",
    "nishiakashi",
    "himeji",
    "okayama",
    "fukuyama",
    "hiroshima",
    "tokuyama",
    "shinyamaguchi",
    "kokura",
    "hakata",
  ],
  hikari: STATIONS.filter(
    (s) =>
      getStationIndex(s.id) <= SANYO_END &&
      !["shinfuji", "mikawaanjo", "asa"].includes(s.id),
  ).map((s) => s.id),
  kodama: STATIONS.filter((s) => getStationIndex(s.id) <= SANYO_END).map(
    (s) => s.id,
  ),
  mizuho: [
    "shinosaka",
    "shinkobe",
    "himeji",
    "okayama",
    "fukuyama",
    "hiroshima",
    "shinyamaguchi",
    "kokura",
    "hakata",
    "kumamoto",
    "sendai",
    "kagoshimachuo",
  ],
  sakura: [
    "shinosaka",
    "shinkobe",
    "nishiakashi",
    "himeji",
    "okayama",
    "fukuyama",
    "hiroshima",
    "tokuyama",
    "shinyamaguchi",
    "shinshimonoseki",
    "kokura",
    "hakata",
    "shintoso",
    "kurume",
    "chikugofunagoya",
    "shinomuta",
    "shinyatsushiro",
    "kumamoto",
    "shintamana",
    "shinminamata",
    "izumi",
    "sendai",
    "kagoshimachuo",
  ],
  tsubame: [
    "shinshimonoseki",
    "kokura",
    "hakata",
    "shintoso",
    "kurume",
    "chikugofunagoya",
    "shinomuta",
    "shinyatsushiro",
    "kumamoto",
    "shintamana",
    "shinminamata",
    "izumi",
    "sendai",
    "kagoshimachuo",
  ],
};

/** 駅セレクト用のグループ分け */
export const STATION_GROUPS = [
  {
    label: "東海道新幹線",
    stations: STATIONS.slice(0, TOKAIDO_END + 1),
  },
  {
    label: "山陽新幹線",
    stations: STATIONS.slice(TOKAIDO_END + 1, SANYO_END + 1),
  },
  {
    label: "九州新幹線",
    stations: STATIONS.slice(SANYO_END + 1),
  },
];
