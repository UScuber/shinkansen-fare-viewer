/**
 * 乗り継ぎ駅・列車指定の料金計算ロジック
 *
 * System A: 通し計算（全区間を通しで計算）
 * System B: 最安組み合わせ（各区間の商品の最安組み合わせ）
 */

import { getAllFares, type AllFaresEntry } from "./allFares";
import {
  calculateStudentFare,
  isExcludedDate,
  getPlatKodamaPriceClass,
} from "./calculator";
import { getSeason, SEASON_DIFF } from "./calendar";
import {
  STATIONS,
  findStation,
  getStationIndex,
  isHakataBetween,
  isNozomiMizuho,
} from "./stations";
import type {
  JourneySegment,
  ThroughFareResult,
  SideBreakdown,
  SegmentDetail,
  NozomiSurchargeMethod,
  CheapestCombinationResult,
  CheapestSegment,
  ViaFareResult,
} from "./types";

// ─── ヘルパー ───────────────────────────────────────────

/**
 * 東海道新幹線の東京～京都の駅かどうか判定（新大阪は含まない）
 */
function isTokaidoUpToKyoto(stationId: string): boolean {
  const station = findStation(stationId);
  if (!station) return false;
  return station.line === "tokaido" && station.id !== "shinosaka";
}

/**
 * 九州新幹線の駅かどうか判定
 */
function isKyushu(stationId: string): boolean {
  const station = findStation(stationId);
  if (!station) return false;
  return station.line === "kyushu";
}

/**
 * 博多分割レベル1の条件を満たすか判定
 * 東海道(東京～京都) ↔ 九州(新鳥栖～鹿児島中央)
 */
function isLevel1HakataSplit(fromId: string, toId: string): boolean {
  return (
    (isTokaidoUpToKyoto(fromId) && isKyushu(toId)) ||
    (isKyushu(fromId) && isTokaidoUpToKyoto(toId))
  );
}

/**
 * 東海道(東京～京都) ↔ 九州をまたぐかどうか（全区間の端点で判定）
 */
function isCrossRegionForSeason(fromId: string, toId: string): boolean {
  return (
    (isTokaidoUpToKyoto(fromId) && isKyushu(toId)) ||
    (isKyushu(fromId) && isTokaidoUpToKyoto(toId))
  );
}

// ─── 通し計算（System A） ──────────────────────────────────

/**
 * 経由駅指定時の料金を計算する
 * @param segments 区間配列（出発→経由1→...→到着）
 * @param date 移動日
 */
export function calculateViaFare(
  segments: JourneySegment[],
  date: Date,
): ViaFareResult | null {
  if (segments.length === 0) return null;

  const overallFrom = segments[0].fromId;
  const overallTo = segments[segments.length - 1].toId;

  // 通し計算 (System A)
  const through = calculateThroughFare(segments, overallFrom, overallTo, date);
  if (!through) return null;

  // 最安組み合わせ (System B)
  // 通し計算結果の特急料金（のぞみなし版 or のぞみあり版のうち安い方）+ 乗車券通し
  const throughTotalOther = through.ticketFare + through.expressFareOther;
  const throughTotalNozomi =
    through.expressFareNozomi !== null
      ? through.ticketFare + through.expressFareNozomi
      : null;
  const throughTotal =
    throughTotalNozomi !== null
      ? Math.min(throughTotalOther, throughTotalNozomi)
      : throughTotalOther;

  const cheapest = findCheapestCombination(segments, date, throughTotal);

  return { through, cheapest };
}

/**
 * 通し計算（System A）
 */
function calculateThroughFare(
  segments: JourneySegment[],
  overallFrom: string,
  overallTo: string,
  date: Date,
): ThroughFareResult | null {
  // 乗車券（通し）
  const overallFareData = getAllFares(overallFrom, overallTo);
  if (!overallFareData) return null;

  const distance = overallFareData.distance;
  const ticketFare = overallFareData.ticket_fare;
  if (ticketFare === null) return null;

  const studentFare = calculateStudentFare(distance, ticketFare) ?? ticketFare;
  const studentFareApplicable = Math.ceil(distance) >= 101;

  // 博多分割判定
  const level1 = isLevel1HakataSplit(overallFrom, overallTo);

  // グリーン車で博多をまたぐかどうか（Level 2判定用）
  const greenCrossesHakata =
    !level1 && doesGreenCrossHakata(segments, overallFrom, overallTo);

  if (level1) {
    // Level 1: 博多で特急券を完全分離
    const result = calculateLevel1(segments, overallFrom, overallTo, date);
    if (!result) return null;

    return {
      ticketFare,
      studentFare,
      distance,
      studentFareApplicable,
      expressFareNozomi: result.nozomiFare,
      expressFareOther: result.otherFare,
      breakdown: {
        hakataLevel1Split: true,
        hakataLevel2Split: false,
        sides: result.sides,
      },
    };
  }

  // Level 1でない場合: 通し計算
  const result = calculateOneSide(
    segments,
    overallFrom,
    overallTo,
    date,
    greenCrossesHakata,
  );
  if (!result) return null;

  return {
    ticketFare,
    studentFare,
    distance,
    studentFareApplicable,
    expressFareNozomi: result.nozomiFare,
    expressFareOther: result.otherFare,
    breakdown: {
      hakataLevel1Split: false,
      hakataLevel2Split: greenCrossesHakata,
      sides: [result.side],
    },
  };
}

/**
 * グリーン車区間が博多をまたぐか判定
 */
function doesGreenCrossHakata(
  segments: JourneySegment[],
  overallFrom: string,
  overallTo: string,
): boolean {
  // 博多が区間に含まれていなければfalse
  if (!isHakataBetween(overallFrom, overallTo)) return false;

  const hakataIdx = getStationIndex("hakata");

  // グリーン車区間の開始・終了インデックスを求める
  let greenStart: number | null = null;
  let greenEnd: number | null = null;

  for (const seg of segments) {
    if (seg.seatType === "green") {
      const fromIdx = getStationIndex(seg.fromId);
      const toIdx = getStationIndex(seg.toId);
      const lo = Math.min(fromIdx, toIdx);
      const hi = Math.max(fromIdx, toIdx);
      if (greenStart === null || lo < greenStart) greenStart = lo;
      if (greenEnd === null || hi > greenEnd) greenEnd = hi;
    }
  }

  if (greenStart === null || greenEnd === null) return false;
  return greenStart < hakataIdx && greenEnd > hakataIdx;
}

/**
 * Level 1: 博多で完全分離して東海道・山陽側と九州側を独立計算
 */
function calculateLevel1(
  segments: JourneySegment[],
  overallFrom: string,
  overallTo: string,
  date: Date,
): {
  nozomiFare: number | null;
  otherFare: number;
  sides: SideBreakdown[];
} | null {
  // セグメントを博多の前後で分割
  const { tokaidoSanyoSegments, kyushuSegments } = splitSegmentsAtHakata(
    segments,
    overallFrom,
    overallTo,
  );

  // 東京側から見た並び順で、東海道・山陽側は overallFrom ↔ 博多
  // 九州側は 博多 ↔ overallTo
  const fromIdx = getStationIndex(overallFrom);
  const toIdx = getStationIndex(overallTo);

  let tokaidoSanyoFrom: string;
  let tokaidoSanyoTo: string;
  let kyushuFrom: string;
  let kyushuTo: string;

  if (fromIdx < toIdx) {
    // 東京→鹿児島方向
    tokaidoSanyoFrom = overallFrom;
    tokaidoSanyoTo = "hakata";
    kyushuFrom = "hakata";
    kyushuTo = overallTo;
  } else {
    // 鹿児島→東京方向
    tokaidoSanyoFrom = "hakata";
    tokaidoSanyoTo = overallTo;
    kyushuFrom = overallFrom;
    kyushuTo = "hakata";
  }

  // 東海道・山陽側
  const tsResult = calculateOneSide(
    tokaidoSanyoSegments,
    tokaidoSanyoFrom,
    tokaidoSanyoTo,
    date,
    false, // Level 1ではgreen_chargeの博多分割は各サイド内で完結
  );
  if (!tsResult) return null;

  // 九州側
  const kResult = calculateOneSide(
    kyushuSegments,
    kyushuFrom,
    kyushuTo,
    date,
    false,
  );
  if (!kResult) return null;

  // 合算
  const otherFare = tsResult.otherFare + kResult.otherFare;
  let nozomiFare: number | null = null;

  // のぞみ料金は両サイドで最も高い組み合わせ
  if (tsResult.nozomiFare !== null || kResult.nozomiFare !== null) {
    const tsFare = tsResult.nozomiFare ?? tsResult.otherFare;
    const kFare = kResult.nozomiFare ?? kResult.otherFare;
    nozomiFare = tsFare + kFare;
  }

  return {
    nozomiFare,
    otherFare,
    sides: [tsResult.side, kResult.side],
  };
}

/**
 * セグメントを博多の前後で分割
 */
function splitSegmentsAtHakata(
  segments: JourneySegment[],
  overallFrom: string,
  overallTo: string,
): {
  tokaidoSanyoSegments: JourneySegment[];
  kyushuSegments: JourneySegment[];
} {
  const hakataIdx = getStationIndex("hakata");
  const fromIdx = getStationIndex(overallFrom);
  const toIdx = getStationIndex(overallTo);
  const goingDown = fromIdx < toIdx; // 東京→鹿児島方向

  const tokaidoSanyoSegments: JourneySegment[] = [];
  const kyushuSegments: JourneySegment[] = [];

  for (const seg of segments) {
    const segFromIdx = getStationIndex(seg.fromId);
    const segToIdx = getStationIndex(seg.toId);
    const segLo = Math.min(segFromIdx, segToIdx);
    const segHi = Math.max(segFromIdx, segToIdx);

    if (segHi <= hakataIdx) {
      // 博多以前（東海道・山陽側）
      tokaidoSanyoSegments.push(seg);
    } else if (segLo >= hakataIdx) {
      // 博多以降（九州側）
      kyushuSegments.push(seg);
    } else {
      // 博多をまたぐセグメント → 分割
      if (goingDown) {
        tokaidoSanyoSegments.push({
          ...seg,
          toId: "hakata",
        });
        kyushuSegments.push({
          ...seg,
          fromId: "hakata",
        });
      } else {
        kyushuSegments.push({
          ...seg,
          toId: "hakata",
        });
        tokaidoSanyoSegments.push({
          ...seg,
          fromId: "hakata",
        });
      }
    }
  }

  return { tokaidoSanyoSegments, kyushuSegments };
}

/**
 * 1つのサイド（全区間 or Level1分離後の各サイド）の特急料金を計算
 *
 * @param segments このサイドのセグメント
 * @param sideFrom このサイドの出発駅
 * @param sideTo このサイドの到着駅
 * @param date 移動日
 * @param greenSplitAtHakata Level 2でgreen_chargeを博多分割するか
 */
function calculateOneSide(
  segments: JourneySegment[],
  sideFrom: string,
  sideTo: string,
  date: Date,
  greenSplitAtHakata: boolean,
): {
  nozomiFare: number | null;
  otherFare: number;
  side: SideBreakdown;
} | null {
  if (segments.length === 0) return null;

  const fareData = getAllFares(sideFrom, sideTo);
  if (!fareData) return null;

  // 全区間自由席かどうか
  const allFree = segments.every((s) => s.seatType === "free");

  // グリーン車区間があるか
  const hasGreen = segments.some((s) => s.seatType === "green");

  // 季節加算（通し区間で判定）
  const seasonalDiff = allFree
    ? 0
    : calculateSeasonalDiffForSide(sideFrom, sideTo, date);

  // ベース特急料金
  let baseFare: number;
  if (allFree) {
    baseFare = fareData.free ?? 0;
  } else {
    baseFare = fareData.hikari_reserved ?? 0;
  }

  // グリーン調整額
  let greenAdjustment = 0;
  if (hasGreen) {
    greenAdjustment = calculateGreenAdjustment(
      segments,
      sideFrom,
      sideTo,
      greenSplitAtHakata,
    );
  }

  // のぞみ加算
  const nozomiResult = calculateNozomiSurcharge(segments, sideFrom, sideTo);

  // 区間詳細を作成
  const segmentDetails: SegmentDetail[] = segments.map((seg) => {
    const segFareData = getAllFares(seg.fromId, seg.toId);
    return {
      fromId: seg.fromId,
      toId: seg.toId,
      seatType: seg.seatType,
      trainType: seg.trainType,
      nozomiAdditional: segFareData?.nozomi_additional ?? null,
    };
  });

  // 特急料金を算出
  // のぞみなし版
  let expressFareOther: number;
  if (allFree) {
    expressFareOther = baseFare;
  } else if (hasGreen) {
    // 指定席特急料金 - 530 + green_charge + 季節加算
    expressFareOther = baseFare - 530 + greenAdjustment + seasonalDiff;
  } else {
    expressFareOther = baseFare + seasonalDiff;
  }

  // のぞみあり版
  let expressFareNozomi: number | null = null;
  if (nozomiResult.surcharge > 0 || nozomiResult.hasSomeNozomi) {
    expressFareNozomi = expressFareOther + nozomiResult.surcharge;
  }

  const side: SideBreakdown = {
    fromId: sideFrom,
    toId: sideTo,
    baseFare,
    seasonalDiff,
    greenAdjustment: hasGreen ? greenAdjustment - 530 : 0, // display value: -530 + green_charge
    nozomiSurcharge: nozomiResult.surcharge,
    nozomiMethod: nozomiResult.method,
    nozomiIndividualSum: nozomiResult.individualSum,
    nozomiThroughValue: nozomiResult.throughValue,
    allFree,
    segments: segmentDetails,
  };

  return {
    nozomiFare: expressFareNozomi,
    otherFare: expressFareOther,
    side,
  };
}

/**
 * サイドの季節加算を計算
 */
function calculateSeasonalDiffForSide(
  fromId: string,
  toId: string,
  date: Date,
): number {
  const season = getSeason(date);
  let diff = SEASON_DIFF[season];
  if (isCrossRegionForSeason(fromId, toId)) {
    diff *= 2;
  }
  return diff;
}

/**
 * グリーン料金調整額を計算
 * green_chargeの通し計算（博多分割対応含む）
 * 戻り値: green_charge の合計値（-530の分は呼び出し元で適用）
 */
function calculateGreenAdjustment(
  segments: JourneySegment[],
  _sideFrom: string,
  _sideTo: string,
  greenSplitAtHakata: boolean,
): number {
  // グリーン車区間の最初と最後の駅を特定
  const greenSegments = segments.filter((s) => s.seatType === "green");
  if (greenSegments.length === 0) return 0;

  // 地理的順序でのグリーン区間の始点・終点を求める
  let greenFromIdx = Infinity;
  let greenToIdx = -Infinity;

  for (const seg of greenSegments) {
    const fromIdx = getStationIndex(seg.fromId);
    const toIdx = getStationIndex(seg.toId);
    const lo = Math.min(fromIdx, toIdx);
    const hi = Math.max(fromIdx, toIdx);
    if (lo < greenFromIdx) greenFromIdx = lo;
    if (hi > greenToIdx) greenToIdx = hi;
  }

  // Get actual station IDs from indices
  if (greenFromIdx >= STATIONS.length || greenToIdx >= STATIONS.length)
    return 0;
  const greenFromId = STATIONS[greenFromIdx].id;
  const greenToId = STATIONS[greenToIdx].id;

  if (greenSplitAtHakata) {
    // Level 2: green_chargeを博多で分割
    const hakataIdx = getStationIndex("hakata");

    if (greenFromIdx < hakataIdx && greenToIdx > hakataIdx) {
      // 博多をまたぐ → 分割
      const gc1Data = getAllFares(greenFromId, "hakata");
      const gc2Data = getAllFares("hakata", greenToId);
      const gc1 = gc1Data?.green_charge ?? 0;
      const gc2 = gc2Data?.green_charge ?? 0;
      return gc1 + gc2;
    }
  }

  // 通常: 通し計算
  const gcData = getAllFares(greenFromId, greenToId);
  return gcData?.green_charge ?? 0;
}

/**
 * のぞみ/みずほ加算を計算
 * 個別合算 vs 通しの安い方を選択
 */
function calculateNozomiSurcharge(
  segments: JourneySegment[],
  sideFrom: string,
  sideTo: string,
): {
  surcharge: number;
  method: NozomiSurchargeMethod | null;
  individualSum: number | null;
  throughValue: number | null;
  hasSomeNozomi: boolean;
} {
  // のぞみ/みずほに乗車するセグメントを特定
  const nozomiSegments = segments.filter(
    (s) => isNozomiMizuho(s.trainType) && s.seatType !== "free", // 自由席にはのぞみ加算なし
  );

  if (nozomiSegments.length === 0) {
    // 列車未指定のセグメント（trainType === null かつ seatType !== "free"）がある場合
    // のぞみ乗車の可能性があるのでhasSomeNozomiをtrueにする必要がある
    const hasUnspecifiedNonFree = segments.some(
      (s) => s.trainType === null && s.seatType !== "free",
    );

    if (hasUnspecifiedNonFree) {
      // 列車未指定の場合: 通し区間全体ののぞみ加算を計算
      const fareData = getAllFares(sideFrom, sideTo);
      const throughNozomi = fareData?.nozomi_additional ?? null;
      if (throughNozomi !== null && throughNozomi > 0) {
        return {
          surcharge: throughNozomi,
          method: "through",
          individualSum: null,
          throughValue: throughNozomi,
          hasSomeNozomi: true,
        };
      }
    }

    return {
      surcharge: 0,
      method: null,
      individualSum: null,
      throughValue: null,
      hasSomeNozomi: false,
    };
  }

  // 方式A: 個別合算
  let individualSum = 0;
  for (const seg of nozomiSegments) {
    const segFareData = getAllFares(seg.fromId, seg.toId);
    const additional = segFareData?.nozomi_additional;
    if (additional !== null && additional !== undefined) {
      individualSum += additional;
    }
  }

  // 方式B: 通し（最初ののぞみ乗車駅～最後の降車駅）
  // 地理的順序で最初と最後を特定
  let nozomiStartIdx = Infinity;
  let nozomiEndIdx = -Infinity;
  for (const seg of nozomiSegments) {
    const fromIdx = getStationIndex(seg.fromId);
    const toIdx = getStationIndex(seg.toId);
    const lo = Math.min(fromIdx, toIdx);
    const hi = Math.max(fromIdx, toIdx);
    if (lo < nozomiStartIdx) nozomiStartIdx = lo;
    if (hi > nozomiEndIdx) nozomiEndIdx = hi;
  }

  const nozomiStartId =
    nozomiStartIdx < STATIONS.length ? STATIONS[nozomiStartIdx].id : null;
  const nozomiEndId =
    nozomiEndIdx < STATIONS.length ? STATIONS[nozomiEndIdx].id : null;

  let throughValue = 0;
  if (nozomiStartId && nozomiEndId) {
    const throughData = getAllFares(nozomiStartId, nozomiEndId);
    throughValue = throughData?.nozomi_additional ?? 0;
  }

  // 安い方を選択
  const surcharge = Math.min(individualSum, throughValue);
  const method: NozomiSurchargeMethod =
    individualSum <= throughValue ? "individual_sum" : "through";

  return {
    surcharge,
    method,
    individualSum,
    throughValue,
    hasSomeNozomi: true,
  };
}

// ─── 最安組み合わせ（System B） ────────────────────────────

/**
 * 各区間の利用可能商品を列挙し、最安組み合わせを算出
 */
function findCheapestCombination(
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

// ─── バリデーション ────────────────────────────────────────

/**
 * グリーン車区間が連続しているかチェック
 */
export function validateGreenContiguity(segments: JourneySegment[]): boolean {
  const greenFlags = segments.map((s) => s.seatType === "green");
  let firstGreen = -1;
  let lastGreen = -1;

  for (let i = 0; i < greenFlags.length; i++) {
    if (greenFlags[i]) {
      if (firstGreen === -1) firstGreen = i;
      lastGreen = i;
    }
  }

  if (firstGreen === -1) return true; // グリーンなし → OK

  // firstGreen〜lastGreen間に非グリーンがないか
  for (let i = firstGreen; i <= lastGreen; i++) {
    if (!greenFlags[i]) return false; // 分離NG
  }
  return true;
}
