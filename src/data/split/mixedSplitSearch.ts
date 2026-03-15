/**
 * 早特混合分割DP
 * 通常きっぷグループと一体商品（早特・SmartEX・ぷらっとこだま）の最安組み合わせを探索
 */

import { getAllFares, type AllFaresEntry } from "../allFares";
import { calculateSeasonalDiff, getPlatKodamaPriceClass } from "../calculator";
import { findStation, type StationId } from "../stations";
import type { FareFilter } from "../types";
import type { MixedSplitGroup, MixedSplitResult } from "../splitFareSearch";
import { reconstructExpressPath } from "./freeSeatSplitDP";

type BundledProduct = {
  productName: string;
  fare: number;
};

type MixedTransition =
  | { type: "bundled"; product: BundledProduct }
  | { type: "ticket_group" };

export function searchMixedSplit(
  stationIds: StationId[],
  n: number,
  throughTotal: number,
  date: Date,
  excluded: boolean,
  isAfter2026Apr: boolean,
  filter: FareFilter | null | undefined,
  freeDp: number[][],
  freePrev: number[][],
  allowTicketGroups: boolean,
): MixedSplitResult | null {
  const dp = new Array<number>(n).fill(Infinity);
  const mainPrev = new Array<number>(n).fill(-1);
  const mainTransition = new Array<MixedTransition | null>(n).fill(null);
  dp[0] = 0;

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] === Infinity) continue;

      // ① 一体商品（早特・SmartEX・ぷらっとこだま）
      const products = getAvailableBundledProducts(
        stationIds[j],
        stationIds[i],
        date,
        excluded,
        isAfter2026Apr,
        filter,
      );
      for (const product of products) {
        if (dp[j] + product.fare < dp[i]) {
          dp[i] = dp[j] + product.fare;
          mainPrev[i] = j;
          mainTransition[i] = { type: "bundled", product };
        }
      }

      // ② 通常きっぷグループ（乗車券通し + 自由席特急券分割）
      if (allowTicketGroups) {
        const ticketFareData = getAllFares(stationIds[j], stationIds[i]);
        if (
          ticketFareData &&
          ticketFareData.ticket_fare !== null &&
          freeDp[j][i] !== Infinity
        ) {
          const groupCost = ticketFareData.ticket_fare + freeDp[j][i];
          if (dp[j] + groupCost < dp[i]) {
            dp[i] = dp[j] + groupCost;
            mainPrev[i] = j;
            mainTransition[i] = { type: "ticket_group" };
          }
        }
      }
    }
  }

  const total = dp[n - 1];
  if (total >= throughTotal || total === Infinity) {
    return null;
  }

  // 経路復元
  const groups: MixedSplitGroup[] = [];
  let idx = n - 1;
  while (idx > 0) {
    const j = mainPrev[idx];
    const transition = mainTransition[idx]!;

    if (transition.type === "bundled") {
      groups.unshift({
        type: "bundled",
        fromId: stationIds[j],
        toId: stationIds[idx],
        productName: transition.product.productName,
        fare: transition.product.fare,
      });
    } else {
      // ticket_group
      const ticketFare = getAllFares(
        stationIds[j],
        stationIds[idx],
      )!.ticket_fare!;
      const expressSegments = reconstructExpressPath(
        stationIds,
        freePrev,
        j,
        idx,
      );
      groups.unshift({
        type: "ticket_group",
        fromId: stationIds[j],
        toId: stationIds[idx],
        ticketFare,
        expressSegments,
        subtotal: ticketFare + freeDp[j][idx],
      });
    }
    idx = j;
  }

  // 分割なし（1グループ = 通し）で通常きっぷグループかつ特急券も1区間なら表示不要
  if (groups.length === 1) {
    const g = groups[0];
    if (g.type === "ticket_group" && g.expressSegments.length <= 1) {
      return null;
    }
    if (g.type === "bundled") {
      return null;
    }
  }

  return {
    groups,
    total,
    savings: throughTotal - total,
  };
}

// ─── 一体商品候補列挙 ────────────────────────────────────────

/**
 * 分割探索用に、区間で利用可能な一体商品（早特・SmartEX・ぷらっとこだま）を列挙する
 * 通常きっぷはメインDPの ticket_group_cost として別途処理されるため含まない
 */
function getAvailableBundledProducts(
  fromId: StationId,
  toId: StationId,
  date: Date,
  excluded: boolean,
  isAfter2026Apr: boolean,
  filter?: FareFilter | null,
): BundledProduct[] {
  const fareData = getAllFares(fromId, toId);
  if (!fareData) return [];

  const products: BundledProduct[] = [];
  const seasonalDiff = calculateSeasonalDiff(fromId, toId, date);

  // --- スマートEX ---
  addSmartExProducts(products, fareData, seasonalDiff, filter);

  // --- 早特・ぷらっとこだま（設定除外日は対象外） ---
  if (!excluded) {
    addHayatokuProductsForSplit(
      products,
      fareData,
      fromId,
      toId,
      isAfter2026Apr,
      filter,
    );
    addPlatKodamaProductsForSplit(
      products,
      fareData,
      fromId,
      toId,
      date,
      filter,
    );
  }

  return products;
}

/**
 * フィルタ条件とマッチするか判定
 * seatType/trainType が null のフィルタは条件なし（全許可）
 * trainType に "nozomi" を指定した場合は nozomi/mizuho の商品にマッチ
 */
function matchesFilter(
  filter: FareFilter | null | undefined,
  seatType: "reserved" | "green" | "free",
  trainGroup: "nozomi" | null, // null = ひかり等（のぞみ以外）
): boolean {
  if (!filter) return true;

  if (filter.seatType !== null && filter.seatType !== seatType) {
    return false;
  }

  if (filter.trainType !== null) {
    const isNozomiGroup = trainGroup === "nozomi";
    const filterIsNozomi =
      filter.trainType === "nozomi" || filter.trainType === "mizuho";

    if (isNozomiGroup && !filterIsNozomi) return false;
    if (!isNozomiGroup && filterIsNozomi) {
      // のぞみフィルタで、のぞみ以外の商品 → のぞみ加算付き商品があるはずなのでこれは非表示
      // ただし自由席は列車非依存なので許可
      if (seatType !== "free") return false;
    }
  }

  return true;
}

/**
 * スマートEXの商品を追加
 */
function addSmartExProducts(
  products: BundledProduct[],
  fareData: AllFaresEntry,
  seasonalDiff: number,
  filter?: FareFilter | null,
): void {
  // 自由席
  if (fareData.smartex_free !== null && matchesFilter(filter, "free", null)) {
    products.push({
      productName: "スマートEX（自由席）",
      fare: fareData.smartex_free,
    });
  }

  // 指定席（ひかり等）
  if (
    fareData.smartex_reserved !== null &&
    matchesFilter(filter, "reserved", null)
  ) {
    products.push({
      productName: "スマートEX（指定席）",
      fare: fareData.smartex_reserved + seasonalDiff,
    });
  }

  // 指定席（のぞみ/みずほ）
  if (
    fareData.smartex_reserved !== null &&
    fareData.nozomi_additional !== null &&
    matchesFilter(filter, "reserved", "nozomi")
  ) {
    products.push({
      productName: "スマートEX（のぞみ/みずほ指定席）",
      fare:
        fareData.smartex_reserved + seasonalDiff + fareData.nozomi_additional,
    });
  }

  // グリーン車（ひかり等）
  if (fareData.smartex_green !== null && matchesFilter(filter, "green", null)) {
    products.push({
      productName: "スマートEX（グリーン車）",
      fare: fareData.smartex_green + seasonalDiff,
    });
  }

  // グリーン車（のぞみ/みずほ）
  if (
    fareData.smartex_green !== null &&
    fareData.nozomi_additional !== null &&
    matchesFilter(filter, "green", "nozomi")
  ) {
    products.push({
      productName: "スマートEX（のぞみ/みずほグリーン車）",
      fare: fareData.smartex_green + seasonalDiff + fareData.nozomi_additional,
    });
  }
}

/**
 * 早特商品を追加
 */
function addHayatokuProductsForSplit(
  products: BundledProduct[],
  fareData: AllFaresEntry,
  _fromId: string,
  _toId: string,
  isAfter2026Apr: boolean,
  filter?: FareFilter | null,
): void {
  // 早特1（ひかり・こだまの自由席）
  if (matchesFilter(filter, "free", null)) {
    const h1Base = isAfter2026Apr
      ? fareData.smartex_hayatoku1_2026_apr
      : fareData.smartex_hayatoku1;
    if (h1Base !== null) {
      products.push({ productName: "早特1（自由席）", fare: h1Base });
    }
  }

  // 早特3（グリーン車のみ）
  // のぞみ・みずほ・さくら・つばめグリーン車
  if (
    matchesFilter(filter, "green", "nozomi") ||
    matchesFilter(filter, "green", null)
  ) {
    const h3g = fareData.smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_green;
    if (h3g !== null && matchesFilterForHayatoku3(filter)) {
      products.push({ productName: "早特3（グリーン車）", fare: h3g });
    }
  }

  // ひかりグリーン車
  if (matchesFilter(filter, "green", null)) {
    const h3hg = fareData.smartex_hayatoku3_hikari_green;
    if (h3hg !== null && matchesFilterForHayatoku3Train(filter, "hikari")) {
      products.push({
        productName: "早特3（ひかりグリーン車）",
        fare: h3hg,
      });
    }
  }

  // こだまグリーン車
  if (matchesFilter(filter, "green", null)) {
    const h3kg = fareData.smartex_hayatoku3_kodama_green;
    if (h3kg !== null && matchesFilterForHayatoku3Train(filter, "kodama")) {
      products.push({
        productName: "早特3（こだまグリーン車）",
        fare: h3kg,
      });
    }
  }

  // 早特7（指定席のみ）
  // のぞみ・みずほ・さくら・つばめ普通車
  if (
    fareData.smartex_hayatoku7_nozomi_mizuho_sakura_tsubame_reserved !== null &&
    matchesFilter(filter, "reserved", "nozomi")
  ) {
    products.push({
      productName: "早特7（普通車）",
      fare: fareData.smartex_hayatoku7_nozomi_mizuho_sakura_tsubame_reserved,
    });
  }

  // ひかり・こだま普通車
  if (
    fareData.smartex_hayatoku7_hikari_kodama_reserved !== null &&
    matchesFilter(filter, "reserved", null)
  ) {
    if (matchesFilterTrain(filter, ["hikari", "kodama"])) {
      products.push({
        productName: "早特7（ひかり・こだま普通車）",
        fare: fareData.smartex_hayatoku7_hikari_kodama_reserved,
      });
    }
  }

  // 早特21（指定席のみ）
  if (
    fareData.smartex_hayatoku21_nozomi_mizuho_sakura_tsubame_reserved !==
      null &&
    matchesFilter(filter, "reserved", "nozomi")
  ) {
    products.push({
      productName: "早特21（普通車）",
      fare: fareData.smartex_hayatoku21_nozomi_mizuho_sakura_tsubame_reserved,
    });
  }

  // ファミリー早特7（ひかり・こだまの指定席）
  if (
    fareData.smartex_family_hayatoku7_hikari_kodama_reserved !== null &&
    matchesFilter(filter, "reserved", null)
  ) {
    if (matchesFilterTrain(filter, ["hikari", "kodama"])) {
      products.push({
        productName: "ファミリー早特7（普通車）",
        fare: fareData.smartex_family_hayatoku7_hikari_kodama_reserved,
      });
    }
  }
}

/**
 * 早特3のフィルタリング（のぞみグループ用）
 */
function matchesFilterForHayatoku3(
  filter: FareFilter | null | undefined,
): boolean {
  if (!filter || filter.trainType === null) return true;
  // 早特3のこのグループは nozomi, mizuho, sakura, tsubame で利用可能
  return ["nozomi", "mizuho", "sakura", "tsubame"].includes(filter.trainType);
}

/**
 * 早特3のフィルタリング（個別列車用）
 */
function matchesFilterForHayatoku3Train(
  filter: FareFilter | null | undefined,
  train: "hikari" | "kodama",
): boolean {
  if (!filter || filter.trainType === null) return true;
  return filter.trainType === train;
}

/**
 * 列車フィルタとの照合
 */
function matchesFilterTrain(
  filter: FareFilter | null | undefined,
  trains: string[],
): boolean {
  if (!filter || filter.trainType === null) return true;
  return trains.includes(filter.trainType);
}

/**
 * ぷらっとこだまの商品を追加
 */
function addPlatKodamaProductsForSplit(
  products: BundledProduct[],
  fareData: AllFaresEntry,
  fromId: string,
  toId: string,
  date: Date,
  filter?: FareFilter | null,
): void {
  // こだまフィルタチェック
  if (filter?.trainType !== null && filter?.trainType !== undefined) {
    if (filter.trainType !== "kodama") return;
  }

  // 東海道新幹線内のみ
  const fromStation = findStation(fromId);
  const toStation = findStation(toId);
  if (!fromStation || !toStation) return;
  if (fromStation.line !== "tokaido" || toStation.line !== "tokaido") return;

  const priceClass = getPlatKodamaPriceClass(date);

  // 指定席
  if (!filter || filter.seatType === null || filter.seatType === "reserved") {
    const prices: { cls: string; val: number | null }[] = [
      { cls: "A", val: fareData.plat_kodama_reserved_a },
      { cls: "B", val: fareData.plat_kodama_reserved_b },
      { cls: "C", val: fareData.plat_kodama_reserved_c },
      { cls: "D", val: fareData.plat_kodama_reserved_d },
    ];
    for (const p of prices) {
      if (p.val !== null && (priceClass === null || priceClass === p.cls)) {
        products.push({
          productName: `ぷらっとこだま ${p.cls}料金 普通車`,
          fare: p.val,
        });
      }
    }
  }

  // グリーン車
  if (!filter || filter.seatType === null || filter.seatType === "green") {
    const prices: { cls: string; val: number | null }[] = [
      { cls: "A", val: fareData.plat_kodama_green_a },
      { cls: "B", val: fareData.plat_kodama_green_b },
      { cls: "C", val: fareData.plat_kodama_green_c },
      { cls: "D", val: fareData.plat_kodama_green_d },
    ];
    for (const p of prices) {
      if (p.val !== null && (priceClass === null || priceClass === p.cls)) {
        products.push({
          productName: `ぷらっとこだま ${p.cls}料金 グリーン車`,
          fare: p.val,
        });
      }
    }
  }
}
