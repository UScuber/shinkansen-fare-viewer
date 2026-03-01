/**
 * 乗り継ぎ駅・列車指定機能の共通型定義
 */

/** 座席種別 */
export type SeatType = "reserved" | "green" | "free";

/** 列車種別 */
export type TrainType =
  | "nozomi"
  | "hikari"
  | "kodama"
  | "mizuho"
  | "sakura"
  | "tsubame";

/** 区間情報（ユーザー入力） */
export type JourneySegment = {
  fromId: string;
  toId: string;
  seatType: SeatType;
  /** null = 未指定 → のぞみ/それ以外の両方を表示 */
  trainType: TrainType | null;
};

/** 区間ごとの設定（UI用） */
export type SegmentConfig = {
  seatType: SeatType;
  trainType: TrainType | null;
};

/** のぞみ加算の計算方式 */
export type NozomiSurchargeMethod = "individual_sum" | "through";

/** サイドごとの内訳 */
export type SideBreakdown = {
  fromId: string;
  toId: string;
  /** ベース特急料金（hikari_reserved通し or free） */
  baseFare: number;
  /** 季節加算額 */
  seasonalDiff: number;
  /** グリーン料金（-530 + green_charge）合計。グリーン車なしなら0 */
  greenAdjustment: number;
  /** のぞみ加算額 */
  nozomiSurcharge: number;
  /** のぞみ加算の計算方式 */
  nozomiMethod: NozomiSurchargeMethod | null;
  /** のぞみ個別合算値（参考用） */
  nozomiIndividualSum: number | null;
  /** のぞみ通し値（参考用） */
  nozomiThroughValue: number | null;
  /** このサイドが全区間自由席か */
  allFree: boolean;
  /** このサイドの区間リスト */
  segments: SegmentDetail[];
};

/** 区間ごとの詳細情報 */
export type SegmentDetail = {
  fromId: string;
  toId: string;
  seatType: SeatType;
  trainType: TrainType | null;
  /** この区間のnozomi_additional値 */
  nozomiAdditional: number | null;
};

/** 通し計算の内訳 */
export type ThroughBreakdown = {
  /** 博多分割レベル1（特急券全体分離）かどうか */
  hakataLevel1Split: boolean;
  /** 博多分割レベル2（green_chargeのみ分割）かどうか */
  hakataLevel2Split: boolean;
  /** サイドごとの内訳（Level1なら2つ、それ以外なら1つ） */
  sides: SideBreakdown[];
};

/** 通し計算の結果 */
export type ThroughFareResult = {
  /** 乗車券運賃（通し） */
  ticketFare: number;
  /** 学割運賃 */
  studentFare: number;
  /** 距離 */
  distance: number;
  /** 学割適用可能か */
  studentFareApplicable: boolean;
  /** のぞみ/みずほ乗車時の特急料金（該当しない場合null） */
  expressFareNozomi: number | null;
  /** のぞみ/みずほ以外の特急料金 */
  expressFareOther: number;
  /** 内訳 */
  breakdown: ThroughBreakdown;
};

/** 最安組み合わせの区間ごとの結果 */
export type CheapestSegment = {
  fromId: string;
  toId: string;
  /** 商品名（例: "通常きっぷ", "早特7", "ぷらっとこだま A料金"） */
  productName: string;
  /** 料金 */
  fare: number;
  /** 内訳（通常きっぷの場合のみ） */
  ticketFare?: number;
  expressFare?: number;
};

/** 最安組み合わせの結果 */
export type CheapestCombinationResult = {
  segments: CheapestSegment[];
  total: number;
  /** 通しとの差額 */
  savings: number;
};

/** 経由駅計算の全結果 */
export type ViaFareResult = {
  /** 通し計算結果 */
  through: ThroughFareResult;
  /** 最安組み合わせ結果（通しより安くない場合null） */
  cheapest: CheapestCombinationResult | null;
};
