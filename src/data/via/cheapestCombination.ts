/**
 * 最安組み合わせ（System B）
 * 各区間の利用可能商品を列挙し、最安組み合わせを算出
 */

import { getAllFares, type AllFaresEntry } from "../allFares";
import { isExcludedDate, getPlatKodamaPriceClass } from "../calculator";
import { findStation, isNozomiMizuho } from "../stations";
import type {
  JourneySegment,
  CheapestCombinationResult,
  CheapestSegment,
} from "../types";
import { calculateSeasonalDiffForSide } from "./throughCalculation";

/**
 * 各区間の利用可能商品を列挙し、最安組み合わせを算出
 */
export function findCheapestCombination(
  segments: JourneySegment[],
  date: Date,
  throughTotal: number,
): CheapestCombinationResult | null {
  const excluded = isExcludedDate(date);
  const isAfter2026Apr = date >= new Date(2026, 3, 1);

  // 各区間の商品候補を列挙
  const segmentProducts: {
    product: string;
    fare: number;
    ticketFare?: number;
    expressFare?: number;
  }[][] = [];

  for (const seg of segments) {
    const products = getAvailableProducts(seg, date, excluded, isAfter2026Apr);
    if (products.length === 0) return null; // 候補なし → 計算不可
    segmentProducts.push(products);
  }

  // 全組み合わせの中で最安を探す
  const bestCombination = findMinCombination(segmentProducts, segments);

  if (!bestCombination || bestCombination.total >= throughTotal) {
    return null; // 通しと同額以上なら非表示
  }

  return {
    segments: bestCombination.segments,
    total: bestCombination.total,
    savings: throughTotal - bestCombination.total,
  };
}

/**
 * 区間ごとの利用可能商品を取得
 */
function getAvailableProducts(
  seg: JourneySegment,
  date: Date,
  excluded: boolean,
  isAfter2026Apr: boolean,
): {
  product: string;
  fare: number;
  ticketFare?: number;
  expressFare?: number;
}[] {
  const fareData = getAllFares(seg.fromId, seg.toId);
  if (!fareData) return [];

  const products: {
    product: string;
    fare: number;
    ticketFare?: number;
    expressFare?: number;
  }[] = [];
  const seasonalDiff =
    seg.seatType === "free"
      ? 0
      : calculateSeasonalDiffForSide(seg.fromId, seg.toId, date);

  // 1. 通常きっぷ（分割）
  const ticketFare = fareData.ticket_fare;
  if (ticketFare !== null) {
    let expressFare: number;
    if (seg.seatType === "free") {
      expressFare = fareData.free ?? 0;
    } else if (seg.seatType === "green") {
      expressFare = (fareData.green ?? 0) + seasonalDiff;
      if (isNozomiMizuho(seg.trainType)) {
        expressFare += fareData.nozomi_additional ?? 0;
      }
    } else {
      // 指定席
      expressFare = (fareData.hikari_reserved ?? 0) + seasonalDiff;
      if (isNozomiMizuho(seg.trainType)) {
        expressFare += fareData.nozomi_additional ?? 0;
      }
    }
    products.push({
      product: getTicketProductName(seg),
      fare: ticketFare + expressFare,
      ticketFare,
      expressFare,
    });
  }

  if (excluded) {
    // 設定除外日は早特・ぷらっとこだまを除外
    return products;
  }

  // 2. 早特商品（乗り継ぎ不可 → 各区間単体判定）

  // 早特1（ひかり・こだまの自由席）
  if (
    seg.seatType === "free" ||
    (seg.seatType !== "green" && !isNozomiMizuho(seg.trainType))
  ) {
    const h1Base = isAfter2026Apr
      ? fareData.smartex_hayatoku1_2026_apr
      : fareData.smartex_hayatoku1;
    if (h1Base !== null) {
      products.push({ product: "早特1 自由席", fare: h1Base });
    }
  }

  // 早特3
  addHayatoku3Products(products, fareData, seg);

  // 早特7
  addHayatoku7Products(products, fareData, seg);

  // 早特21
  addHayatoku21Products(products, fareData, seg);

  // ファミリー早特7（ひかり・こだまの指定席）
  if (
    seg.seatType === "reserved" &&
    (seg.trainType === null ||
      seg.trainType === "hikari" ||
      seg.trainType === "kodama")
  ) {
    const fh7 = fareData.smartex_family_hayatoku7_hikari_kodama_reserved;
    if (fh7 !== null) {
      products.push({ product: "ファミリー早特7 普通車", fare: fh7 });
    }
  }

  // ぷらっとこだま（東海道内こだまのみ）
  addPlatKodamaProducts(products, fareData, seg, date);

  return products;
}

/**
 * 早特3の商品を追加
 */
function addHayatoku3Products(
  products: { product: string; fare: number }[],
  fareData: AllFaresEntry,
  seg: JourneySegment,
): void {
  if (seg.seatType !== "green") return;

  // のぞみ・みずほ・さくら・つばめグリーン車
  if (
    seg.trainType === null ||
    seg.trainType === "nozomi" ||
    seg.trainType === "mizuho" ||
    seg.trainType === "sakura" ||
    seg.trainType === "tsubame"
  ) {
    const h3g = fareData.smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_green;
    if (h3g !== null) {
      products.push({ product: "早特3 グリーン車", fare: h3g });
    }
  }

  // ひかりグリーン車
  if (seg.trainType === null || seg.trainType === "hikari") {
    const h3hg = fareData.smartex_hayatoku3_hikari_green;
    if (h3hg !== null) {
      products.push({ product: "早特3 ひかりグリーン車", fare: h3hg });
    }
  }

  // こだまグリーン車
  if (seg.trainType === null || seg.trainType === "kodama") {
    const h3kg = fareData.smartex_hayatoku3_kodama_green;
    if (h3kg !== null) {
      products.push({ product: "早特3 こだまグリーン車", fare: h3kg });
    }
  }
}

/**
 * 早特7の商品を追加
 */
function addHayatoku7Products(
  products: { product: string; fare: number }[],
  fareData: AllFaresEntry,
  seg: JourneySegment,
): void {
  if (seg.seatType !== "reserved") return;

  // のぞみ・みずほ・さくら・つばめ普通車
  if (
    seg.trainType === null ||
    seg.trainType === "nozomi" ||
    seg.trainType === "mizuho" ||
    seg.trainType === "sakura" ||
    seg.trainType === "tsubame"
  ) {
    const h7r =
      fareData.smartex_hayatoku7_nozomi_mizuho_sakura_tsubame_reserved;
    if (h7r !== null) {
      products.push({ product: "早特7 普通車", fare: h7r });
    }
  }

  // ひかり・こだま普通車
  if (
    seg.trainType === null ||
    seg.trainType === "hikari" ||
    seg.trainType === "kodama"
  ) {
    const h7hk = fareData.smartex_hayatoku7_hikari_kodama_reserved;
    if (h7hk !== null) {
      products.push({ product: "早特7 ひかり・こだま普通車", fare: h7hk });
    }
  }
}

/**
 * 早特21の商品を追加
 */
function addHayatoku21Products(
  products: { product: string; fare: number }[],
  fareData: AllFaresEntry,
  seg: JourneySegment,
): void {
  if (seg.seatType !== "reserved") return;

  if (
    seg.trainType === null ||
    seg.trainType === "nozomi" ||
    seg.trainType === "mizuho" ||
    seg.trainType === "sakura" ||
    seg.trainType === "tsubame"
  ) {
    const h21r =
      fareData.smartex_hayatoku21_nozomi_mizuho_sakura_tsubame_reserved;
    if (h21r !== null) {
      products.push({ product: "早特21 普通車", fare: h21r });
    }
  }
}

/**
 * ぷらっとこだまの商品を追加
 */
function addPlatKodamaProducts(
  products: { product: string; fare: number }[],
  fareData: AllFaresEntry,
  seg: JourneySegment,
  date: Date,
): void {
  // こだまのみ利用可能
  if (seg.trainType !== null && seg.trainType !== "kodama") return;
  // グリーン or 指定席のみ
  if (seg.seatType === "free") return;

  // 東海道新幹線内のみ（両端が東海道）
  const fromStation = findStation(seg.fromId);
  const toStation = findStation(seg.toId);
  if (!fromStation || !toStation) return;
  if (fromStation.line !== "tokaido" || toStation.line !== "tokaido") return;

  const priceClass = getPlatKodamaPriceClass(date);

  if (seg.seatType === "reserved") {
    const prices: { cls: string; val: number | null }[] = [
      { cls: "A", val: fareData.plat_kodama_reserved_a },
      { cls: "B", val: fareData.plat_kodama_reserved_b },
      { cls: "C", val: fareData.plat_kodama_reserved_c },
      { cls: "D", val: fareData.plat_kodama_reserved_d },
    ];
    for (const p of prices) {
      if (p.val !== null && (priceClass === null || priceClass === p.cls)) {
        products.push({
          product: `ぷらっとこだま ${p.cls}料金 普通車`,
          fare: p.val,
        });
      }
    }
  } else if (seg.seatType === "green") {
    const prices: { cls: string; val: number | null }[] = [
      { cls: "A", val: fareData.plat_kodama_green_a },
      { cls: "B", val: fareData.plat_kodama_green_b },
      { cls: "C", val: fareData.plat_kodama_green_c },
      { cls: "D", val: fareData.plat_kodama_green_d },
    ];
    for (const p of prices) {
      if (p.val !== null && (priceClass === null || priceClass === p.cls)) {
        products.push({
          product: `ぷらっとこだま ${p.cls}料金 グリーン車`,
          fare: p.val,
        });
      }
    }
  }
}

/**
 * 通常きっぷの商品名を生成
 */
function getTicketProductName(seg: JourneySegment): string {
  const seatName =
    seg.seatType === "green"
      ? "グリーン車"
      : seg.seatType === "reserved"
        ? "指定席"
        : "自由席";
  return `通常きっぷ（${seatName}）`;
}

/**
 * 全組み合わせの最安を探す（再帰的に全探索、最大4区間なので問題なし）
 */
function findMinCombination(
  segmentProducts: {
    product: string;
    fare: number;
    ticketFare?: number;
    expressFare?: number;
  }[][],
  segments: JourneySegment[],
): { segments: CheapestSegment[]; total: number } | null {
  if (segmentProducts.length === 0) return null;

  let bestTotal = Infinity;
  let bestCombo: CheapestSegment[] | null = null;

  function search(
    idx: number,
    currentSegments: CheapestSegment[],
    currentTotal: number,
  ): void {
    if (idx === segmentProducts.length) {
      if (currentTotal < bestTotal) {
        bestTotal = currentTotal;
        bestCombo = [...currentSegments];
      }
      return;
    }

    for (const product of segmentProducts[idx]) {
      const seg: CheapestSegment = {
        fromId: segments[idx].fromId,
        toId: segments[idx].toId,
        productName: product.product,
        fare: product.fare,
        ticketFare: product.ticketFare,
        expressFare: product.expressFare,
      };
      currentSegments.push(seg);
      search(idx + 1, currentSegments, currentTotal + product.fare);
      currentSegments.pop();
    }
  }

  search(0, [], 0);
  if (!bestCombo) return null;
  return { segments: bestCombo, total: bestTotal };
}
