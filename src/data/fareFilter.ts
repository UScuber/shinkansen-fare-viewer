import type { SeatType, TrainType, FareFilter } from "./types";

/** 商品ID */
export type ProductId =
  // 特急券
  | "expressNozomiMizuhoReserved"
  | "expressOtherReserved"
  | "expressNozomiMizuhoGreen"
  | "expressOtherGreen"
  | "expressFree"
  // スマートEX
  | "smartexNozomiMizuhoReserved"
  | "smartexOtherReserved"
  | "smartexNozomiMizuhoGreen"
  | "smartexOtherGreen"
  | "smartexFree"
  // 早特
  | "hayatoku1Free"
  | "hayatoku3NozomiMizuhoSakuraTsubameGreen"
  | "hayatoku3HikariGreen"
  | "hayatoku3KodamaGreen"
  | "hayatoku7NozomiMizuhoSakuraTsubameReserved"
  | "hayatoku7HikariKodamaReserved"
  | "hayatoku21NozomiMizuhoSakuraTsubameReserved"
  | "familyHayatoku7HikariKodamaReserved"
  // ぷらっとこだま
  | "platKodamaReserved"
  | "platKodamaGreen";

type ProductDef = {
  compatibleTrains: TrainType[] | "all";
  compatibleSeat: SeatType;
};

const PRODUCT_DEFS: Record<ProductId, ProductDef> = {
  // 特急券
  expressNozomiMizuhoReserved: {
    compatibleTrains: ["nozomi", "mizuho"],
    compatibleSeat: "reserved",
  },
  expressOtherReserved: {
    compatibleTrains: ["hikari", "kodama", "sakura", "tsubame"],
    compatibleSeat: "reserved",
  },
  expressNozomiMizuhoGreen: {
    compatibleTrains: ["nozomi", "mizuho"],
    compatibleSeat: "green",
  },
  expressOtherGreen: {
    compatibleTrains: ["hikari", "kodama", "sakura", "tsubame"],
    compatibleSeat: "green",
  },
  expressFree: {
    compatibleTrains: "all",
    compatibleSeat: "free",
  },
  // スマートEX
  smartexNozomiMizuhoReserved: {
    compatibleTrains: ["nozomi", "mizuho"],
    compatibleSeat: "reserved",
  },
  smartexOtherReserved: {
    compatibleTrains: ["hikari", "kodama", "sakura", "tsubame"],
    compatibleSeat: "reserved",
  },
  smartexNozomiMizuhoGreen: {
    compatibleTrains: ["nozomi", "mizuho"],
    compatibleSeat: "green",
  },
  smartexOtherGreen: {
    compatibleTrains: ["hikari", "kodama", "sakura", "tsubame"],
    compatibleSeat: "green",
  },
  smartexFree: {
    compatibleTrains: "all",
    compatibleSeat: "free",
  },
  // 早特
  hayatoku1Free: {
    compatibleTrains: ["hikari", "kodama"],
    compatibleSeat: "free",
  },
  hayatoku3NozomiMizuhoSakuraTsubameGreen: {
    compatibleTrains: ["nozomi", "mizuho", "sakura", "tsubame"],
    compatibleSeat: "green",
  },
  hayatoku3HikariGreen: {
    compatibleTrains: ["hikari"],
    compatibleSeat: "green",
  },
  hayatoku3KodamaGreen: {
    compatibleTrains: ["kodama"],
    compatibleSeat: "green",
  },
  hayatoku7NozomiMizuhoSakuraTsubameReserved: {
    compatibleTrains: ["nozomi", "mizuho", "sakura", "tsubame"],
    compatibleSeat: "reserved",
  },
  hayatoku7HikariKodamaReserved: {
    compatibleTrains: ["hikari", "kodama"],
    compatibleSeat: "reserved",
  },
  hayatoku21NozomiMizuhoSakuraTsubameReserved: {
    compatibleTrains: ["nozomi", "mizuho", "sakura", "tsubame"],
    compatibleSeat: "reserved",
  },
  familyHayatoku7HikariKodamaReserved: {
    compatibleTrains: ["hikari", "kodama"],
    compatibleSeat: "reserved",
  },
  // ぷらっとこだま
  platKodamaReserved: {
    compatibleTrains: ["kodama"],
    compatibleSeat: "reserved",
  },
  platKodamaGreen: {
    compatibleTrains: ["kodama"],
    compatibleSeat: "green",
  },
};

/**
 * フィルタ条件に基づいて商品を表示すべきかを判定する
 */
export function isProductVisible(
  productId: ProductId,
  filter: FareFilter | null,
): boolean {
  if (!filter) return true;
  if (filter.seatType === null && filter.trainType === null) return true;

  const def = PRODUCT_DEFS[productId];

  if (filter.seatType !== null && def.compatibleSeat !== filter.seatType) {
    return false;
  }
  if (filter.trainType !== null) {
    if (
      def.compatibleTrains !== "all" &&
      !def.compatibleTrains.includes(filter.trainType)
    ) {
      return false;
    }
  }
  return true;
}
