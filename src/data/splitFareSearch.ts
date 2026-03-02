/**
 * 自由席分割最安値・早特混合分割最安値の自動探索
 *
 * 基本検索（経由駅なし）時に、途中駅で分割購入した場合の最安値を
 * 動的計画法（DP）で自動探索する。
 *
 * 乗車券は通常きっぷ区間を通しで購入し、特急券（自由席）のみ分割する。
 * 一体型商品（早特・SmartEX・ぷらっとこだま）は乗車券込みの価格をそのまま使用。
 */

import { getAllFares, type AllFaresEntry } from "./allFares";
import {
  isExcludedDate,
  calculateSeasonalDiff,
  getPlatKodamaPriceClass,
} from "./calculator";
import { getStationsBetween, findStation } from "./stations";
import type { FareFilter } from "./types";

// ─── 型定義 ───────────────────────────────────────────

/** 特急券の分割区間 */
export type ExpressSegment = {
  fromId: string;
  toId: string;
  expressFare: number;
};

/** 自由席分割の結果 */
export type FreeSeatSplitResult = {
  throughTicketFare: number;
  expressSegments: ExpressSegment[];
  total: number;
  savings: number;
};

/** 早特混合分割のグループ */
export type MixedSplitGroup =
  | {
      type: "ticket_group";
      fromId: string;
      toId: string;
      ticketFare: number;
      expressSegments: ExpressSegment[];
      subtotal: number;
    }
  | {
      type: "bundled";
      fromId: string;
      toId: string;
      productName: string;
      fare: number;
    };

/** 早特混合分割の結果 */
export type MixedSplitResult = {
  groups: MixedSplitGroup[];
  total: number;
  savings: number;
};

/** 分割探索全体の結果 */
export type SplitSearchResult = {
  freeSeatSplit: FreeSeatSplitResult | null;
  mixedSplit: MixedSplitResult | null;
};

// ─── メインエントリポイント ────────────────────────────────

/**
 * 分割最安値を自動探索する
 * 経由駅なしの基本検索時に呼び出す
 */
export function searchSplitFares(
  fromId: string,
  toId: string,
  date: Date,
  filter?: FareFilter | null,
): SplitSearchResult {
  // 通しの料金データ（比較基準）
  const throughFareData = getAllFares(fromId, toId);
  if (!throughFareData) {
    return { freeSeatSplit: null, mixedSplit: null };
  }

  const throughTicketFare = throughFareData.ticket_fare;
  const throughFreeFare = throughFareData.free;
  if (throughTicketFare === null || throughFreeFare === null) {
    return { freeSeatSplit: null, mixedSplit: null };
  }

  const throughTotal = throughTicketFare + throughFreeFare;

  // 途中駅リストを取得
  const betweenStations = getStationsBetween(fromId, toId);
  if (betweenStations.length === 0) {
    return { freeSeatSplit: null, mixedSplit: null };
  }

  // 駅配列: [出発, ...途中駅, 到着]
  const stationIds = [fromId, ...betweenStations.map((s) => s.id), toId];
  const n = stationIds.length;

  const excluded = isExcludedDate(date);
  const isAfter2026Apr = date >= new Date(2026, 3, 1);

  // 自由席特急券の分割DPを全ペアで事前計算
  const { dp: freeDp, prev: freePrev } = computeFreeSplitDP(stationIds, n);

  // 自由席分割最安値
  let freeSeatSplit: FreeSeatSplitResult | null = null;
  if (!filter || filter.seatType === null || filter.seatType === "free") {
    freeSeatSplit = buildFreeSeatSplit(
      stationIds,
      n,
      throughTicketFare,
      throughTotal,
      freeDp,
      freePrev,
    );
  }

  // 早特混合分割最安値
  const allowTicketGroups =
    !filter || filter.seatType === null || filter.seatType === "free";
  const mixedSplit = searchMixedSplit(
    stationIds,
    n,
    throughTotal,
    date,
    excluded,
    isAfter2026Apr,
    filter,
    freeDp,
    freePrev,
    allowTicketGroups,
  );

  // 重複回避: 自由席分割と早特混合が同じパターンなら自由席分割を非表示
  if (freeSeatSplit && mixedSplit && isSamePattern(freeSeatSplit, mixedSplit)) {
    freeSeatSplit = null;
  }

  return { freeSeatSplit, mixedSplit };
}

// ─── 自由席特急券の分割DP（全ペア事前計算） ─────────────────

/**
 * 全ペア(j, i)について自由席特急券の最安分割を計算
 * dp[j][i] = station j → station i の自由席特急券の最安分割コスト
 * prev[j][i] = 最適パスで station i の直前の駅インデックス
 */
function computeFreeSplitDP(
  stationIds: string[],
  n: number,
): { dp: number[][]; prev: number[][] } {
  // dp[j][i] と prev[j][i] を初期化
  const dp: number[][] = [];
  const prev: number[][] = [];
  for (let j = 0; j < n; j++) {
    dp[j] = new Array<number>(n).fill(Infinity);
    prev[j] = new Array<number>(n).fill(-1);
    dp[j][j] = 0;
  }

  for (let j = 0; j < n; j++) {
    for (let i = j + 1; i < n; i++) {
      for (let m = j; m < i; m++) {
        if (dp[j][m] === Infinity) continue;

        const fareData = getAllFares(stationIds[m], stationIds[i]);
        if (!fareData || fareData.free === null) continue;

        const cost = dp[j][m] + fareData.free;
        if (cost < dp[j][i]) {
          dp[j][i] = cost;
          prev[j][i] = m;
        }
      }
    }
  }

  return { dp, prev };
}

/**
 * 自由席特急券の分割パスを復元
 */
function reconstructExpressPath(
  stationIds: string[],
  freePrev: number[][],
  start: number,
  end: number,
): ExpressSegment[] {
  const segments: ExpressSegment[] = [];
  let idx = end;
  while (idx > start) {
    const m = freePrev[start][idx];
    const fareData = getAllFares(stationIds[m], stationIds[idx]);
    segments.unshift({
      fromId: stationIds[m],
      toId: stationIds[idx],
      expressFare: fareData!.free!,
    });
    idx = m;
  }
  return segments;
}

// ─── 自由席分割最安値の構築 ──────────────────────────────────

function buildFreeSeatSplit(
  stationIds: string[],
  n: number,
  throughTicketFare: number,
  throughTotal: number,
  freeDp: number[][],
  freePrev: number[][],
): FreeSeatSplitResult | null {
  const expressTotal = freeDp[0][n - 1];
  if (expressTotal === Infinity) return null;

  const total = throughTicketFare + expressTotal;
  if (total >= throughTotal) return null;

  // 経路復元
  const expressSegments = reconstructExpressPath(
    stationIds,
    freePrev,
    0,
    n - 1,
  );

  // 分割なし（1区間 = 通し）なら表示不要
  if (expressSegments.length <= 1) return null;

  return {
    throughTicketFare,
    expressSegments,
    total,
    savings: throughTotal - total,
  };
}

// ─── 早特混合分割DP ──────────────────────────────────────

type BundledProduct = {
  productName: string;
  fare: number;
};

type MixedTransition =
  | { type: "bundled"; product: BundledProduct }
  | { type: "ticket_group" };

function searchMixedSplit(
  stationIds: string[],
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
  fromId: string,
  toId: string,
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

  // ファミリー早特7（ひかり・こだमの指定席）
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

// ─── ユーティリティ ──────────────────────────────────────

/**
 * 自由席分割と早特混合分割が同じパターンかどうか判定
 * 早特混合が1つの通常きっぷグループのみで、特急券分割が同一なら同じ
 */
function isSamePattern(
  free: FreeSeatSplitResult,
  mixed: MixedSplitResult,
): boolean {
  if (mixed.groups.length !== 1) return false;
  const group = mixed.groups[0];
  if (group.type !== "ticket_group") return false;
  if (group.expressSegments.length !== free.expressSegments.length)
    return false;
  for (let i = 0; i < free.expressSegments.length; i++) {
    if (free.expressSegments[i].fromId !== group.expressSegments[i].fromId)
      return false;
    if (free.expressSegments[i].toId !== group.expressSegments[i].toId)
      return false;
  }
  return true;
}
