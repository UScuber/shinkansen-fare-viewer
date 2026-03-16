/** 全駅のID型 */
export type StationId =
  | "tokyo"
  | "shinagawa"
  | "shinyokohama"
  | "odawara"
  | "atami"
  | "mishima"
  | "shinfuji"
  | "shizuoka"
  | "kakegawa"
  | "hamamatsu"
  | "toyohashi"
  | "mikawaanjo"
  | "nagoya"
  | "gifuhashima"
  | "maibara"
  | "kyoto"
  | "shinosaka"
  | "shinkobe"
  | "nishiakashi"
  | "himeji"
  | "aioi"
  | "okayama"
  | "shinkurashiki"
  | "shinonomichi"
  | "mihara"
  | "higashihiroshima"
  | "hiroshima"
  | "shiniwakuni"
  | "tokuyama"
  | "shinyamaguchi"
  | "asa"
  | "shinshimonoseki"
  | "kokura"
  | "hakata"
  | "fukuyama"
  | "shintoso"
  | "kurume"
  | "chikugofunagoya"
  | "shinomuta"
  | "shinyatsushiro"
  | "kumamoto"
  | "shintamana"
  | "shinminamata"
  | "izumi"
  | "sendai"
  | "kagoshimachuo";

/** 列車名 */
export type TrainType =
  | "nozomi"
  | "hikari"
  | "kodama"
  | "mizuho"
  | "sakura"
  | "tsubame";

/** 座席種別 */
export type SeatType = "reserved" | "green" | "free";

/** 季節コード */
export type SeasonType = "off" | "normal" | "peak1" | "peak2";

/** 料金データ1件（fares.json由来） */
export interface FareEntry {
  start: StationId;
  end: StationId;
  hikari_reserved: number;
  green: number;
  green_charge: number | null;
  free: number;
  nozomi_additional: number | null;
  distance: number;
  ticket_fare: number;
  smartex_free: number | null;
  smartex_reserved: number | null;
  smartex_green: number | null;
  smartex_hayatoku1: number | null;
  smartex_hayatoku1_2026_apr: number | null;
  smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_green: number | null;
  smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_reserved: number | null;
  smartex_hayatoku3_hikari_green: number | null;
  smartex_hayatoku3_kodama_green: number | null;
  smartex_hayatoku7_nozomi_mizuho_sakura_tsubame_reserved: number | null;
  smartex_hayatoku7_hikari_kodama_reserved: number | null;
  smartex_hayatoku21_nozomi_mizuho_sakura_tsubame_reserved: number | null;
  smartex_family_hayatoku7_hikari_kodama_reserved: number | null;
  plat_kodama_reserved_a: number | null;
  plat_kodama_reserved_b: number | null;
  plat_kodama_reserved_c: number | null;
  plat_kodama_reserved_d: number | null;
  plat_kodama_green_a: number | null;
  plat_kodama_green_b: number | null;
  plat_kodama_green_c: number | null;
  plat_kodama_green_d: number | null;
}

/** 計算済み料金 */
export interface CalculatedFares {
  distance: number;
  ticketFare: number;
  gakuwariTicketFare: number;
  free: number;
  hikariReserved: number;
  hikariReservedBase: number;
  nozomiReserved: number | null;
  hikariGreen: number;
  nozomiGreen: number | null;
  nozomiAdditional: number | null;
  greenCharge: number | null;
  seasonalDiff: number;
  smartexFree: number | null;
  smartexReserved: number | null;
  smartexReservedNozomi: number | null;
  smartexGreen: number | null;
  smartexGreenNozomi: number | null;
  hayatoku1: number | null;
  hayatoku3NozomiGreen: number | null;
  hayatoku3HikariGreen: number | null;
  hayatoku3KodamaGreen: number | null;
  hayatoku7NozomiReserved: number | null;
  hayatoku7HikariReserved: number | null;
  hayatoku21NozomiReserved: number | null;
  familyHayatoku7HikariReserved: number | null;
  platKodamaReserved: number | null;
  platKodamaGreen: number | null;
  platKodamaLabel: string;
  platKodamaAfterValidUntil: boolean;
  isExcludedDate: boolean;
}

/** 区間設定 */
export interface SegmentConfig {
  seatType: SeatType | null;
  trainType: TrainType | null;
}

/** フィルタ条件 */
export interface FareFilter {
  seatType: SeatType | null;
  trainType: TrainType | null;
}

/** 経由駅計算の通し結果 */
export interface ViaFareResult {
  ticketFare: number;
  gakuwariTicketFare: number;
  distance: number;
  expressFare: number;
  expressFareBreakdown: ExpressFareBreakdown;
  total: number;
  gakuwariTotal: number;
}

/** 特急料金の内訳 */
export interface ExpressFareBreakdown {
  base: number;
  seasonalDiff: number;
  nozomiAdditional: number;
  greenCharge: number;
  deduction530: number;
}

/** 最安組み合わせの区間結果 */
export interface CheapestSegment {
  from: StationId;
  to: StationId;
  productName: string;
  fare: number;
}

/** 最安組み合わせ全体の結果 */
export interface CheapestCombinationResult {
  segments: CheapestSegment[];
  total: number;
}

/** 分割探索の結果 */
export interface SplitFareResultData {
  freeSplit: FreeSplitResult | null;
  mixedSplit: MixedSplitResult | null;
}

/** 自由席分割結果 */
export interface FreeSplitResult {
  ticketFare: number;
  segments: { from: StationId; to: StationId; fare: number }[];
  total: number;
  throughTotal: number;
  saving: number;
}

/** 早特混合分割結果 */
export interface MixedSplitResult {
  segments: {
    from: StationId;
    to: StationId;
    productName: string;
    fare: number;
  }[];
  total: number;
  throughTotal: number;
  saving: number;
}
