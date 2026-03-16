import type {
  ExpressFareBreakdown,
  SegmentConfig,
  StationId,
  ViaFareResult,
} from "../types";
import { getFareEntry } from "../allFares";
import { calcGakuwariTicketFare } from "../calculator";
import { getSeason, getSeasonalBaseDiff } from "../calendar";
import { getStationIndex, isCrossRegion, HAKATA_INDEX } from "../stations";
import { needsLevel1Split, crossesHakata } from "./validation";

/** 通し計算（System A） */
export function calculateThroughFare(
  from: StationId,
  to: StationId,
  segments: { from: StationId; to: StationId }[],
  configs: SegmentConfig[],
  dateStr: string,
): ViaFareResult | null {
  // 乗車券は通し
  const fareEntry = getFareEntry(from, to);
  if (!fareEntry) return null;

  const ticketFare = fareEntry.ticket_fare;
  const distance = fareEntry.distance;
  const gakuwariTicketFare = calcGakuwariTicketFare(ticketFare, distance);

  const season = getSeason(dateStr);
  const baseDiff = getSeasonalBaseDiff(season);

  // 座席種別の判定
  const hasReservedOrGreen = configs.some(
    (c) => c.seatType === "reserved" || c.seatType === "green",
  );
  const hasGreen = configs.some((c) => c.seatType === "green");

  // 博多分割レベル1判定
  if (needsLevel1Split(from, to)) {
    return calculateLevel1Split(
      from,
      to,
      segments,
      configs,
      baseDiff,
      ticketFare,
      gakuwariTicketFare,
      distance,
    );
  }

  // 通常の通し計算
  const crossRegion = isCrossRegion(from, to);
  const seasonalDiff = hasReservedOrGreen
    ? crossRegion
      ? baseDiff * 2
      : baseDiff
    : 0;

  let expressFare: number;
  const breakdown: ExpressFareBreakdown = {
    base: 0,
    seasonalDiff,
    nozomiAdditional: 0,
    greenCharge: 0,
    deduction530: 0,
  };

  if (!hasReservedOrGreen) {
    // 全区間自由席
    expressFare = fareEntry.free;
    breakdown.base = fareEntry.free;
  } else {
    // 指定席ベース
    breakdown.base = fareEntry.hikari_reserved;
    expressFare = fareEntry.hikari_reserved + seasonalDiff;

    // グリーン車計算
    if (hasGreen) {
      const greenResult = calculateGreenCharge(from, to, segments, configs);
      breakdown.greenCharge = greenResult.greenCharge;
      breakdown.deduction530 = greenResult.deduction530;
      expressFare =
        expressFare - greenResult.deduction530 + greenResult.greenCharge;
    }

    // のぞみ/みずほ加算
    const nozomiAdd = calculateNozomiAdditional(from, to, segments, configs);
    breakdown.nozomiAdditional = nozomiAdd;
    expressFare += nozomiAdd;
  }

  const total = ticketFare + expressFare;
  const gakuwariTotal = gakuwariTicketFare + expressFare;

  return {
    ticketFare,
    gakuwariTicketFare,
    distance,
    expressFare,
    expressFareBreakdown: breakdown,
    total,
    gakuwariTotal,
  };
}

/** レベル1分割（博多で完全分離） */
function calculateLevel1Split(
  from: StationId,
  to: StationId,
  segments: { from: StationId; to: StationId }[],
  configs: SegmentConfig[],
  baseDiff: number,
  ticketFare: number,
  gakuwariTicketFare: number,
  distance: number,
): ViaFareResult | null {
  let fromIdx = getStationIndex(from);
  let toIdx = getStationIndex(to);
  const reversed = fromIdx > toIdx;
  if (reversed) [fromIdx, toIdx] = [toIdx, fromIdx];

  const hakataId: StationId = "hakata";

  // 東海道・山陽側と九州側を分離
  const tokaidoFrom = reversed ? hakataId : from;
  const tokaidoTo = reversed ? to : hakataId;
  const kyushuFrom = reversed ? from : hakataId;
  const kyushuTo = reversed ? hakataId : to;

  const tokaidoEntry = getFareEntry(tokaidoFrom, tokaidoTo);
  const kyushuEntry = getFareEntry(kyushuFrom, kyushuTo);
  if (!tokaidoEntry || !kyushuEntry) return null;

  // 各側の区間とコンフィグを分割
  const hakataSegIdx = segments.findIndex((s) => {
    const fi = getStationIndex(s.from);
    const ti = getStationIndex(s.to);
    const minI = Math.min(fi, ti);
    const maxI = Math.max(fi, ti);
    return minI < HAKATA_INDEX && maxI > HAKATA_INDEX;
  });

  // 博多が経由駅に含まれている場合
  const hakataViaIdx = segments.findIndex(
    (s) => s.from === "hakata" || s.to === "hakata",
  );

  let splitIdx: number;
  if (hakataSegIdx >= 0) {
    splitIdx = hakataSegIdx;
  } else if (hakataViaIdx >= 0) {
    // 博多が区間の端の場合
    const seg = segments[hakataViaIdx];
    splitIdx = seg.to === "hakata" ? hakataViaIdx + 1 : hakataViaIdx;
  } else {
    splitIdx = segments.length; // fallback
  }

  const tokaidoConfigs = configs.slice(0, splitIdx || 1);
  const kyushuConfigs = configs.slice(splitIdx || 1);

  // 各側の計算
  const tokaidoHasReservedOrGreen = tokaidoConfigs.some(
    (c) => c.seatType === "reserved" || c.seatType === "green",
  );
  const kyushuHasReservedOrGreen = kyushuConfigs.some(
    (c) => c.seatType === "reserved" || c.seatType === "green",
  );

  const tokaidoSeasonalDiff = tokaidoHasReservedOrGreen ? baseDiff : 0;
  const kyushuSeasonalDiff = kyushuHasReservedOrGreen ? baseDiff : 0;

  let tokaidoExpress: number;
  if (!tokaidoHasReservedOrGreen) {
    tokaidoExpress = tokaidoEntry.free;
  } else {
    tokaidoExpress = tokaidoEntry.hikari_reserved + tokaidoSeasonalDiff;
    if (tokaidoConfigs.some((c) => c.seatType === "green")) {
      const gc = tokaidoEntry.green_charge ?? 0;
      tokaidoExpress = tokaidoExpress - 530 + gc;
    }
    // のぞみ加算（東海道・山陽側）
    const nozomiSegs = segments.slice(0, splitIdx || 1);
    const nozomiConfigs = tokaidoConfigs;
    const nozomiAdd = calculateNozomiAdditionalForSide(
      nozomiSegs,
      nozomiConfigs,
    );
    tokaidoExpress += nozomiAdd;
  }

  let kyushuExpress: number;
  if (!kyushuHasReservedOrGreen) {
    kyushuExpress = kyushuEntry.free;
  } else {
    kyushuExpress = kyushuEntry.hikari_reserved + kyushuSeasonalDiff;
    if (kyushuConfigs.some((c) => c.seatType === "green")) {
      const gc = kyushuEntry.green_charge ?? 0;
      kyushuExpress = kyushuExpress - 530 + gc;
    }
  }

  const expressFare = tokaidoExpress + kyushuExpress;
  const totalSeasonalDiff = tokaidoSeasonalDiff + kyushuSeasonalDiff;

  const total = ticketFare + expressFare;
  const gakuwariTotal = gakuwariTicketFare + expressFare;

  return {
    ticketFare,
    gakuwariTicketFare,
    distance,
    expressFare,
    expressFareBreakdown: {
      base: tokaidoExpress + kyushuExpress - totalSeasonalDiff,
      seasonalDiff: totalSeasonalDiff,
      nozomiAdditional: 0,
      greenCharge: 0,
      deduction530: 0,
    },
    total,
    gakuwariTotal,
  };
}

/** グリーン料金の計算（通しまたは博多分割Level2） */
function calculateGreenCharge(
  _from: StationId,
  _to: StationId,
  segments: { from: StationId; to: StationId }[],
  configs: SegmentConfig[],
): { greenCharge: number; deduction530: number } {
  // グリーン車区間を特定
  let firstGreenIdx = -1;
  let lastGreenIdx = -1;
  for (let i = 0; i < configs.length; i++) {
    if (configs[i].seatType === "green") {
      if (firstGreenIdx === -1) firstGreenIdx = i;
      lastGreenIdx = i;
    }
  }

  if (firstGreenIdx === -1) return { greenCharge: 0, deduction530: 0 };

  const greenFrom = segments[firstGreenIdx].from;
  const greenTo = segments[lastGreenIdx].to;

  // 博多をまたぐ場合はLevel2分割
  if (crossesHakata(greenFrom, greenTo)) {
    const gc1 = getFareEntry(greenFrom, "hakata")?.green_charge ?? 0;
    const gc2 = getFareEntry("hakata", greenTo)?.green_charge ?? 0;
    return { greenCharge: gc1 + gc2, deduction530: 530 };
  }

  const greenEntry = getFareEntry(greenFrom, greenTo);
  return {
    greenCharge: greenEntry?.green_charge ?? 0,
    deduction530: 530,
  };
}

/** のぞみ/みずほ加算の最適計算（東京〜博多間） */
function calculateNozomiAdditional(
  _from: StationId,
  _to: StationId,
  segments: { from: StationId; to: StationId }[],
  configs: SegmentConfig[],
): number {
  // のぞみ/みずほに乗車する区間を特定
  const nozomiSegments: { from: StationId; to: StationId }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const train = configs[i]?.trainType;
    if (train === "nozomi" || train === "mizuho") {
      nozomiSegments.push(segments[i]);
    }
  }

  if (nozomiSegments.length === 0) return 0;

  // 方法A: 各区間の加算額の合計
  let sumIndividual = 0;
  for (const seg of nozomiSegments) {
    const entry = getFareEntry(seg.from, seg.to);
    if (entry?.nozomi_additional != null) {
      sumIndividual += entry.nozomi_additional;
    }
  }

  // 方法B: 最初→最後を通しで計算
  const throughFrom = nozomiSegments[0].from;
  const throughTo = nozomiSegments[nozomiSegments.length - 1].to;
  const throughEntry = getFareEntry(throughFrom, throughTo);
  const throughAdditional = throughEntry?.nozomi_additional ?? Infinity;

  return Math.min(sumIndividual, throughAdditional);
}

/** 片側ののぞみ加算計算 */
function calculateNozomiAdditionalForSide(
  segments: { from: StationId; to: StationId }[],
  configs: SegmentConfig[],
): number {
  return calculateNozomiAdditional(
    segments[0]?.from ?? "tokyo",
    segments[segments.length - 1]?.to ?? "tokyo",
    segments,
    configs,
  );
}
