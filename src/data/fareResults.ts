/**
 * 料金表示用データの組み立て
 */

import { getAllFares } from "./allFares";
import {
  addAdditional,
  addSeasonalDiff,
  applyPassenger,
  calculateSeasonalDiff,
  calculateStudentFare,
  isExcludedDate,
  type PassengerType,
} from "./calculator";

export type { PassengerType } from "./calculator";

export type FareItem = {
  label: string;
  value: number | null;
  group?: string;
  note?: string;
};

export type FareResult = {
  section: string;
  items: FareItem[];
};

const TRAIN_TAGS = {
  nozomi: "<の>",
  hikari: "<ひ>",
  kodama: "<こ>",
  mizuho: "<み>",
  sakura: "<さ>",
  tsubame: "<つ>",
} as const;

/**
 * 指定区間・日付・乗客種別の全料金プランを計算して返す
 */
export function calculateFares(
  fromId: string,
  toId: string,
  date: Date,
  passenger: PassengerType,
): FareResult[] {
  const fareData = getAllFares(fromId, toId);

  if (!fareData) {
    return [];
  }

  const results: FareResult[] = [];
  const seasonalDiff = calculateSeasonalDiff(fromId, toId, date);
  const excluded = isExcludedDate(date);

  const nozomiMizuho = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}`;
  const nozomiMizuhoSakuraTsubame = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}${TRAIN_TAGS.sakura}${TRAIN_TAGS.tsubame}`;
  const hikariKodama = `${TRAIN_TAGS.hikari}${TRAIN_TAGS.kodama}`;

  // ================================================
  // グループ1: 乗車券
  // ================================================
  const ticketItems: FareItem[] = [];

  ticketItems.push({
    label: "距離",
    value: fareData.distance,
    note: "km",
  });

  ticketItems.push({
    label: "乗車券運賃",
    value: applyPassenger(fareData.ticket_fare, passenger),
  });

  const studentFare = calculateStudentFare(
    fareData.distance,
    fareData.ticket_fare,
  );
  ticketItems.push({
    label: "学割運賃",
    value: applyPassenger(studentFare, passenger),
    note:
      Math.ceil(fareData.distance) >= 101
        ? undefined
        : "101km未満のため通常運賃と同額",
  });

  results.push({
    section: "乗車券",
    items: ticketItems,
  });

  // ================================================
  // グループ2: 特急券
  // ================================================
  const expressItems: FareItem[] = [];

  const hikariReservedWithSeason = addSeasonalDiff(
    fareData.hikari_reserved,
    seasonalDiff,
  );
  const greenWithSeason = addSeasonalDiff(fareData.green, seasonalDiff);

  if (fareData.nozomi_additional !== null) {
    expressItems.push({
      label: `${nozomiMizuho}普通車`,
      value: applyPassenger(
        addAdditional(hikariReservedWithSeason, fareData.nozomi_additional),
        passenger,
      ),
    });
  }

  expressItems.push({
    label: `${nozomiMizuho}以外の普通車`,
    value: applyPassenger(hikariReservedWithSeason, passenger),
  });

  if (fareData.nozomi_additional !== null) {
    expressItems.push({
      label: `${nozomiMizuho}グリーン車`,
      value: applyPassenger(
        addAdditional(greenWithSeason, fareData.nozomi_additional),
        passenger,
      ),
    });
  }

  expressItems.push({
    label: `${nozomiMizuho}以外のグリーン車`,
    value: applyPassenger(greenWithSeason, passenger),
  });

  expressItems.push({
    label: "自由席",
    value: applyPassenger(fareData.free, passenger),
  });

  results.push({
    section: "特急券",
    items: expressItems,
  });

  // ================================================
  // グループ3: スマートEXサービス
  // ================================================
  const smartexItems: FareItem[] = [];

  if (fareData.nozomi_additional !== null) {
    smartexItems.push({
      label: `${nozomiMizuho}普通車`,
      value: applyPassenger(
        addAdditional(fareData.smartex_reserved, fareData.nozomi_additional),
        passenger,
      ),
    });
  }

  smartexItems.push({
    label: `${nozomiMizuho}以外の普通車`,
    value: applyPassenger(fareData.smartex_reserved, passenger),
  });

  if (fareData.nozomi_additional !== null) {
    smartexItems.push({
      label: `${nozomiMizuho}グリーン車`,
      value: applyPassenger(
        addAdditional(fareData.smartex_green, fareData.nozomi_additional),
        passenger,
      ),
    });
  }

  smartexItems.push({
    label: `${nozomiMizuho}以外のグリーン車`,
    value: applyPassenger(fareData.smartex_green, passenger),
  });

  smartexItems.push({
    label: "自由席",
    value: applyPassenger(fareData.smartex_free, passenger),
  });

  results.push({
    section: "スマートEXサービス",
    items: smartexItems,
  });

  // ================================================
  // グループ4: EX早特
  // ================================================
  const hayatokuItems: FareItem[] = [];

  const isAfter2026Apr = date >= new Date(2026, 3, 1);
  const hayatoku1Base = isAfter2026Apr
    ? fareData.smartex_hayatoku1_2026_apr
    : fareData.smartex_hayatoku1;

  hayatokuItems.push({
    group: "早特1",
    label: "自由席",
    value: excluded ? null : applyPassenger(hayatoku1Base, passenger),
  });

  hayatokuItems.push({
    group: "早特3",
    label: `${nozomiMizuhoSakuraTsubame}グリーン車`,
    value: excluded
      ? null
      : applyPassenger(
          fareData.smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_green,
          passenger,
        ),
  });

  hayatokuItems.push({
    group: "早特3",
    label: `${TRAIN_TAGS.hikari}グリーン車`,
    value: excluded
      ? null
      : applyPassenger(fareData.smartex_hayatoku3_hikari_green, passenger),
  });

  hayatokuItems.push({
    group: "早特3",
    label: `${TRAIN_TAGS.kodama}グリーン車`,
    value: excluded
      ? null
      : applyPassenger(fareData.smartex_hayatoku3_kodama_green, passenger),
  });

  hayatokuItems.push({
    group: "早特7",
    label: `${nozomiMizuhoSakuraTsubame}普通車`,
    value: excluded
      ? null
      : applyPassenger(
          fareData.smartex_hayatoku7_nozomi_mizuho_sakura_tsubame_reserved,
          passenger,
        ),
  });

  hayatokuItems.push({
    group: "早特7",
    label: `${hikariKodama}普通車`,
    value: excluded
      ? null
      : applyPassenger(
          fareData.smartex_hayatoku7_hikari_kodama_reserved,
          passenger,
        ),
  });

  hayatokuItems.push({
    group: "早特21",
    label: `${nozomiMizuhoSakuraTsubame}普通車`,
    value: excluded
      ? null
      : applyPassenger(
          fareData.smartex_hayatoku21_nozomi_mizuho_sakura_tsubame_reserved,
          passenger,
        ),
  });

  hayatokuItems.push({
    group: "ファミリー早特7",
    label: `${hikariKodama}普通車`,
    value: excluded
      ? null
      : applyPassenger(
          fareData.smartex_family_hayatoku7_hikari_kodama_reserved,
          passenger,
        ),
  });

  results.push({
    section: "EX早特",
    items: hayatokuItems,
  });

  // ================================================
  // グループ5: ぷらっとこだま
  // ================================================
  const platKodamaItems: FareItem[] = [];

  platKodamaItems.push({
    label: "A料金 普通車",
    value: excluded
      ? null
      : applyPassenger(fareData.plat_kodama_reserved_a, passenger),
  });

  platKodamaItems.push({
    label: "B料金 普通車",
    value: excluded
      ? null
      : applyPassenger(fareData.plat_kodama_reserved_b, passenger),
  });

  platKodamaItems.push({
    label: "C料金 普通車",
    value: excluded
      ? null
      : applyPassenger(fareData.plat_kodama_reserved_c, passenger),
  });

  platKodamaItems.push({
    label: "D料金 普通車",
    value: excluded
      ? null
      : applyPassenger(fareData.plat_kodama_reserved_d, passenger),
  });

  platKodamaItems.push({
    label: "A料金 グリーン車",
    value: excluded
      ? null
      : applyPassenger(fareData.plat_kodama_green_a, passenger),
  });

  platKodamaItems.push({
    label: "B料金 グリーン車",
    value: excluded
      ? null
      : applyPassenger(fareData.plat_kodama_green_b, passenger),
  });

  platKodamaItems.push({
    label: "C料金 グリーン車",
    value: excluded
      ? null
      : applyPassenger(fareData.plat_kodama_green_c, passenger),
  });

  platKodamaItems.push({
    label: "D料金 グリーン車",
    value: excluded
      ? null
      : applyPassenger(fareData.plat_kodama_green_d, passenger),
  });

  results.push({
    section: "ぷらっとこだま",
    items: platKodamaItems,
  });

  return results;
}
