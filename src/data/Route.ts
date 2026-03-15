/**
 * 2駅間の区間情報をカプセル化するRouteクラス
 *
 * 地域判定・インデックス操作・料金データアクセス・列車可用性を一元管理する。
 */

import {
  STATIONS,
  findStation,
  doesTrainStopAt,
  type Station,
  type StationId,
} from "./stations";
import { getAllFares, type AllFaresEntry } from "./allFares";
import type { TrainType } from "./types";

// ── 駅インデックス（内部用） ──

function getStationIndex(id: string): number {
  return STATIONS.findIndex((s) => s.id === id);
}

const SHINOSAKA_INDEX = getStationIndex("shinosaka");
const HAKATA_INDEX = getStationIndex("hakata");

// ── 単一駅の地域判定 ──

/** 東海道新幹線の東京～京都の駅かどうか（新大阪は含まない） */
export function isTokaidoUpToKyoto(stationId: string): boolean {
  const s = findStation(stationId);
  return s !== undefined && s.line === "tokaido" && s.id !== "shinosaka";
}

/** 九州新幹線の駅かどうか */
export function isKyushuStation(stationId: string): boolean {
  const s = findStation(stationId);
  return s !== undefined && s.line === "kyushu";
}

// ── ユーティリティ ──

/** 駅名を安全に取得（見つからない場合はIDをそのまま返す） */
export function stationName(id: string): string {
  return findStation(id)?.name ?? id;
}

// ── Routeクラス ──

/** 2駅間の区間情報をカプセル化 */
export class Route {
  readonly fromIdx: number;
  readonly toIdx: number;
  /** 地理的に小さい方のインデックス */
  readonly lo: number;
  /** 地理的に大きい方のインデックス */
  readonly hi: number;

  readonly fromId: StationId;
  readonly toId: StationId;

  constructor(fromId: string, toId: string) {
    this.fromId = fromId as StationId;
    this.toId = toId as StationId;
    this.fromIdx = getStationIndex(fromId);
    this.toIdx = getStationIndex(toId);
    this.lo = Math.min(this.fromIdx, this.toIdx);
    this.hi = Math.max(this.fromIdx, this.toIdx);
  }

  // ── 駅情報 ──

  get fromStation(): Station | undefined {
    return findStation(this.fromId);
  }

  get toStation(): Station | undefined {
    return findStation(this.toId);
  }

  get fromName(): string {
    return this.fromStation?.name ?? this.fromId;
  }

  get toName(): string {
    return this.toStation?.name ?? this.toId;
  }

  get valid(): boolean {
    return this.fromIdx !== -1 && this.toIdx !== -1;
  }

  /** 東京→鹿児島方向か */
  get isDownward(): boolean {
    return this.fromIdx < this.toIdx;
  }

  // ── 地域判定 ──

  get isTokaidoOnly(): boolean {
    return this.hi <= SHINOSAKA_INDEX;
  }

  get isSanyoOnly(): boolean {
    return this.lo >= SHINOSAKA_INDEX && this.hi <= HAKATA_INDEX;
  }

  get isKyushuOnly(): boolean {
    return this.lo >= HAKATA_INDEX;
  }

  get crossesTokaidoSanyo(): boolean {
    return (
      this.lo < SHINOSAKA_INDEX &&
      this.hi > SHINOSAKA_INDEX &&
      this.hi <= HAKATA_INDEX
    );
  }

  get crossesSanyoKyushu(): boolean {
    return (
      this.lo >= SHINOSAKA_INDEX &&
      this.lo < HAKATA_INDEX &&
      this.hi > HAKATA_INDEX
    );
  }

  /** 東海道(東京～京都) ↔ 九州(新鳥栖～鹿児島中央)またぎ → 季節加算倍・博多分割Level1 */
  get isCrossRegion(): boolean {
    return (
      (isTokaidoUpToKyoto(this.fromId) && isKyushuStation(this.toId)) ||
      (isKyushuStation(this.fromId) && isTokaidoUpToKyoto(this.toId))
    );
  }

  /** 博多が両駅の間にあるか（両端含まない） */
  get isHakataBetween(): boolean {
    return HAKATA_INDEX > this.lo && HAKATA_INDEX < this.hi;
  }

  /** 指定インデックスが区間内にあるか（両端含まない） */
  containsIndex(idx: number): boolean {
    return idx > this.lo && idx < this.hi;
  }

  // ── 料金データ ──

  get fares(): AllFaresEntry | null {
    return getAllFares(this.fromId, this.toId);
  }

  get distance(): number {
    return this.fares?.distance ?? 0;
  }

  get ticketFare(): number | null {
    return this.fares?.ticket_fare ?? null;
  }

  // ── 間の駅 ──

  stationsBetween(): Station[] {
    return STATIONS.slice(this.lo + 1, this.hi);
  }

  // ── 列車 ──

  /** エリアベースの利用可能列車リスト */
  get availableTrains(): TrainType[] {
    if (!this.valid) return [];
    if (this.isTokaidoOnly) return ["nozomi", "hikari", "kodama"];
    if (this.isSanyoOnly)
      return ["nozomi", "hikari", "kodama", "mizuho", "sakura"];
    if (this.isKyushuOnly) return ["mizuho", "sakura", "tsubame"];
    if (this.crossesTokaidoSanyo) return ["nozomi", "hikari", "kodama"];
    if (this.crossesSanyoKyushu) return ["mizuho", "sakura"];
    return [];
  }

  /** 停車駅フィルタリング済みの利用可能列車 */
  get availableTrainsFiltered(): TrainType[] {
    return this.availableTrains.filter(
      (t) => doesTrainStopAt(t, this.fromId) && doesTrainStopAt(t, this.toId),
    );
  }

  // ── 静的アクセス ──

  static get HAKATA_INDEX(): number {
    return HAKATA_INDEX;
  }

  static get SHINOSAKA_INDEX(): number {
    return SHINOSAKA_INDEX;
  }
}
