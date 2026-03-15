/**
 * 通し計算（System A）
 * 全区間を通しで特急料金を計算するロジック
 */

import { getAllFares } from "../allFares";
import { calculateStudentFare } from "../calculator";
import { getSeason, SEASON_DIFF } from "../calendar";
import { Route } from "../Route";
import { STATIONS, isNozomiMizuho, type StationId } from "../stations";
import type {
  JourneySegment,
  ThroughFareResult,
  SideBreakdown,
  SegmentDetail,
  NozomiSurchargeMethod,
} from "../types";

/**
 * 通し計算（System A）
 */
export function calculateThroughFare(
  segments: JourneySegment[],
  overallFrom: StationId,
  overallTo: StationId,
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
  const overallRoute = new Route(overallFrom, overallTo);
  const level1 = overallRoute.isCrossRegion;

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
  overallFrom: StationId,
  overallTo: StationId,
): boolean {
  // 博多が区間に含まれていなければfalse
  if (!new Route(overallFrom, overallTo).isHakataBetween) return false;

  const hakataIdx = Route.HAKATA_INDEX;

  // グリーン車区間の開始・終了インデックスを求める
  let greenStart: number | null = null;
  let greenEnd: number | null = null;

  for (const seg of segments) {
    if (seg.seatType === "green") {
      const r = new Route(seg.fromId, seg.toId);
      if (greenStart === null || r.lo < greenStart) greenStart = r.lo;
      if (greenEnd === null || r.hi > greenEnd) greenEnd = r.hi;
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
  overallFrom: StationId,
  overallTo: StationId,
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
  const overallRoute = new Route(overallFrom, overallTo);

  let tokaidoSanyoFrom: StationId;
  let tokaidoSanyoTo: StationId;
  let kyushuFrom: StationId;
  let kyushuTo: StationId;

  if (overallRoute.isDownward) {
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
  overallFrom: StationId,
  overallTo: StationId,
): {
  tokaidoSanyoSegments: JourneySegment[];
  kyushuSegments: JourneySegment[];
} {
  const hakataIdx = Route.HAKATA_INDEX;
  const overallRoute = new Route(overallFrom, overallTo);
  const goingDown = overallRoute.isDownward; // 東京→鹿児島方向

  const tokaidoSanyoSegments: JourneySegment[] = [];
  const kyushuSegments: JourneySegment[] = [];

  for (const seg of segments) {
    const segRoute = new Route(seg.fromId, seg.toId);
    const segLo = segRoute.lo;
    const segHi = segRoute.hi;

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
export function calculateOneSide(
  segments: JourneySegment[],
  sideFrom: StationId,
  sideTo: StationId,
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
export function calculateSeasonalDiffForSide(
  fromId: StationId,
  toId: StationId,
  date: Date,
): number {
  const season = getSeason(date);
  let diff = SEASON_DIFF[season];
  if (new Route(fromId, toId).isCrossRegion) {
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
  _sideFrom: StationId,
  _sideTo: StationId,
  greenSplitAtHakata: boolean,
): number {
  // グリーン車区間の最初と最後の駅を特定
  const greenSegments = segments.filter((s) => s.seatType === "green");
  if (greenSegments.length === 0) return 0;

  // 地理的順序でのグリーン区間の始点・終点を求める
  let greenFromIdx = Infinity;
  let greenToIdx = -Infinity;

  for (const seg of greenSegments) {
    const r = new Route(seg.fromId, seg.toId);
    if (r.lo < greenFromIdx) greenFromIdx = r.lo;
    if (r.hi > greenToIdx) greenToIdx = r.hi;
  }

  // Get actual station IDs from indices
  if (greenFromIdx >= STATIONS.length || greenToIdx >= STATIONS.length)
    return 0;
  const greenFromId = STATIONS[greenFromIdx].id;
  const greenToId = STATIONS[greenToIdx].id;

  if (greenSplitAtHakata) {
    // Level 2: green_chargeを博多で分割
    const hakataIdx = Route.HAKATA_INDEX;

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
  sideFrom: StationId,
  sideTo: StationId,
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
    const r = new Route(seg.fromId, seg.toId);
    if (r.lo < nozomiStartIdx) nozomiStartIdx = r.lo;
    if (r.hi > nozomiEndIdx) nozomiEndIdx = r.hi;
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
