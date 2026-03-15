/**
 * 自由席分割最安値・早特混合分割最安値の自動探索
 *
 * 基本検索（経由駅なし）時に、途中駅で分割購入した場合の最安値を
 * 動的計画法（DP）で自動探索する。
 *
 * 乗車券は通常きっぷ区間を通しで購入し、特急券（自由席）のみ分割する。
 * 一体型商品（早特・SmartEX・ぷらっとこだま）は乗車券込みの価格をそのまま使用。
 */

import { getAllFares } from "./allFares";
import { isExcludedDate } from "./calculator";
import { Route } from "./Route";
import type { StationId } from "./stations";
import type { FareFilter } from "./types";
import {
  computeFreeSplitDP,
  buildFreeSeatSplit,
} from "./split/freeSeatSplitDP";
import { searchMixedSplit } from "./split/mixedSplitSearch";

// ─── 型定義 ───────────────────────────────────────────

/** 特急券の分割区間 */
export type ExpressSegment = {
  fromId: StationId;
  toId: StationId;
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
      fromId: StationId;
      toId: StationId;
      ticketFare: number;
      expressSegments: ExpressSegment[];
      subtotal: number;
    }
  | {
      type: "bundled";
      fromId: StationId;
      toId: StationId;
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
  fromId: StationId,
  toId: StationId,
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
  const betweenStations = new Route(fromId, toId).stationsBetween();
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
