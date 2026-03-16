import type { FareFilter, SeatType, TrainType } from "./types";

/** 商品定義 */
interface ProductDef {
  id: string;
  seats: SeatType[];
  trains: TrainType[] | "all";
}

/** 各商品のフィルタリング用定義 */
const PRODUCT_DEFS: ProductDef[] = [
  // 通常きっぷ
  { id: "express_free", seats: ["free"], trains: "all" },
  {
    id: "express_hikari_reserved",
    seats: ["reserved"],
    trains: ["hikari", "kodama", "sakura", "tsubame"],
  },
  {
    id: "express_nozomi_reserved",
    seats: ["reserved"],
    trains: ["nozomi", "mizuho"],
  },
  {
    id: "express_hikari_green",
    seats: ["green"],
    trains: ["hikari", "kodama", "sakura", "tsubame"],
  },
  {
    id: "express_nozomi_green",
    seats: ["green"],
    trains: ["nozomi", "mizuho"],
  },
  // 通常きっぷ合計
  { id: "total_free", seats: ["free"], trains: "all" },
  {
    id: "total_hikari_reserved",
    seats: ["reserved"],
    trains: ["hikari", "kodama", "sakura", "tsubame"],
  },
  {
    id: "total_nozomi_reserved",
    seats: ["reserved"],
    trains: ["nozomi", "mizuho"],
  },
  {
    id: "total_hikari_green",
    seats: ["green"],
    trains: ["hikari", "kodama", "sakura", "tsubame"],
  },
  { id: "total_nozomi_green", seats: ["green"], trains: ["nozomi", "mizuho"] },
  // SmartEX
  { id: "smartex_free", seats: ["free"], trains: "all" },
  {
    id: "smartex_reserved",
    seats: ["reserved"],
    trains: ["hikari", "kodama", "sakura", "tsubame"],
  },
  {
    id: "smartex_reserved_nozomi",
    seats: ["reserved"],
    trains: ["nozomi", "mizuho"],
  },
  {
    id: "smartex_green",
    seats: ["green"],
    trains: ["hikari", "kodama", "sakura", "tsubame"],
  },
  {
    id: "smartex_green_nozomi",
    seats: ["green"],
    trains: ["nozomi", "mizuho"],
  },
  // 早特
  { id: "hayatoku1", seats: ["free"], trains: ["hikari", "kodama"] },
  {
    id: "hayatoku3_nozomi_green",
    seats: ["green"],
    trains: ["nozomi", "mizuho", "sakura", "tsubame"],
  },
  { id: "hayatoku3_hikari_green", seats: ["green"], trains: ["hikari"] },
  { id: "hayatoku3_kodama_green", seats: ["green"], trains: ["kodama"] },
  {
    id: "hayatoku7_nozomi_reserved",
    seats: ["reserved"],
    trains: ["nozomi", "mizuho", "sakura", "tsubame"],
  },
  {
    id: "hayatoku7_hikari_reserved",
    seats: ["reserved"],
    trains: ["hikari", "kodama"],
  },
  {
    id: "hayatoku21_nozomi_reserved",
    seats: ["reserved"],
    trains: ["nozomi", "mizuho", "sakura", "tsubame"],
  },
  {
    id: "family_hayatoku7_hikari_reserved",
    seats: ["reserved"],
    trains: ["hikari", "kodama"],
  },
  // ぷらっとこだま
  { id: "plat_kodama_reserved", seats: ["reserved"], trains: ["kodama"] },
  { id: "plat_kodama_green", seats: ["green"], trains: ["kodama"] },
];

const productMap = new Map<string, ProductDef>(
  PRODUCT_DEFS.map((p) => [p.id, p]),
);

/** 商品がフィルタ条件に一致するか判定 */
export function isProductVisible(
  productId: string,
  filter: FareFilter,
): boolean {
  const def = productMap.get(productId);
  if (!def) return true;

  // 座席種別フィルタ
  if (filter.seatType && !def.seats.includes(filter.seatType)) {
    return false;
  }

  // 列車名フィルタ
  if (filter.trainType && def.trains !== "all") {
    if (!def.trains.includes(filter.trainType)) {
      return false;
    }
  }

  return true;
}
