/**
 * 料金表示用データの組み立て
 */

import {
  applyPassenger,
  calculateAllFares,
  type PassengerType,
} from "./calculator";
import platKodamaConfig from "./plat_kodama_config.json";

export type { PassengerType } from "./calculator";

export type FareItem = {
  label: string;
  value: number | null;
  group?: string;
  note?: string;
  italic?: boolean;
};

export type FareResult = {
  section: string;
  items: FareItem[];
  sectionNote?: string;
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
  const fares = calculateAllFares(fromId, toId, date);

  if (!fares) {
    return [];
  }

  const results: FareResult[] = [];

  const nozomiMizuho = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}`;
  const nozomiMizuhoSakuraTsubame = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}${TRAIN_TAGS.sakura}${TRAIN_TAGS.tsubame}`;
  const hikariKodama = `${TRAIN_TAGS.hikari}${TRAIN_TAGS.kodama}`;
  const nonNozomiMizuho = `${TRAIN_TAGS.kodama}${TRAIN_TAGS.hikari}${TRAIN_TAGS.sakura}${TRAIN_TAGS.tsubame}`;

  // ================================================
  // グループ1: 乗車券
  // ================================================
  const ticketItems: FareItem[] = [];

  ticketItems.push({
    label: "距離",
    value: fares.distance,
    note: "km",
  });

  ticketItems.push({
    label: "乗車券運賃",
    value: applyPassenger(fares.ticketFare, passenger),
  });

  ticketItems.push({
    label: "学割運賃",
    value: applyPassenger(fares.studentFare, passenger),
    note: fares.studentFareApplicable
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

  if (fares.expressNozomiMizuhoReserved !== null) {
    expressItems.push({
      label: `${nozomiMizuho}普通車`,
      value: applyPassenger(fares.expressNozomiMizuhoReserved, passenger),
    });
  }

  expressItems.push({
    label: `${nonNozomiMizuho}普通車`,
    value: applyPassenger(fares.expressOtherReserved, passenger),
  });

  if (fares.expressNozomiMizuhoGreen !== null) {
    expressItems.push({
      label: `${nozomiMizuho}グリーン車`,
      value: applyPassenger(fares.expressNozomiMizuhoGreen, passenger),
    });
  }

  expressItems.push({
    label: `${nonNozomiMizuho}グリーン車`,
    value: applyPassenger(fares.expressOtherGreen, passenger),
  });

  expressItems.push({
    label: "自由席",
    value: applyPassenger(fares.expressFree, passenger),
  });

  results.push({
    section: "特急券",
    items: expressItems,
  });

  // ================================================
  // グループ3: スマートEXサービス
  // ================================================
  const smartexItems: FareItem[] = [];

  if (fares.smartexNozomiMizuhoReserved !== null) {
    smartexItems.push({
      label: `${nozomiMizuho}普通車`,
      value: applyPassenger(fares.smartexNozomiMizuhoReserved, passenger),
    });
  }

  smartexItems.push({
    label: `${nonNozomiMizuho}普通車`,
    value: applyPassenger(fares.smartexOtherReserved, passenger),
  });

  if (fares.smartexNozomiMizuhoGreen !== null) {
    smartexItems.push({
      label: `${nozomiMizuho}グリーン車`,
      value: applyPassenger(fares.smartexNozomiMizuhoGreen, passenger),
    });
  }

  smartexItems.push({
    label: `${nonNozomiMizuho}グリーン車`,
    value: applyPassenger(fares.smartexOtherGreen, passenger),
  });

  smartexItems.push({
    label: "自由席",
    value: applyPassenger(fares.smartexFree, passenger),
  });

  results.push({
    section: "スマートEXサービス",
    items: smartexItems,
  });

  // ================================================
  // グループ4: EX早特
  // ================================================
  const hayatokuItems: FareItem[] = [];

  hayatokuItems.push({
    group: "早特1",
    label: "自由席",
    value: applyPassenger(fares.hayatoku1Free, passenger),
  });

  hayatokuItems.push({
    group: "早特3",
    label: `${nozomiMizuhoSakuraTsubame}グリーン車`,
    value: applyPassenger(
      fares.hayatoku3NozomiMizuhoSakuraTsubameGreen,
      passenger,
    ),
  });

  hayatokuItems.push({
    group: "早特3",
    label: `${TRAIN_TAGS.hikari}グリーン車`,
    value: applyPassenger(fares.hayatoku3HikariGreen, passenger),
  });

  hayatokuItems.push({
    group: "早特3",
    label: `${TRAIN_TAGS.kodama}グリーン車`,
    value: applyPassenger(fares.hayatoku3KodamaGreen, passenger),
  });

  hayatokuItems.push({
    group: "早特7",
    label: `${nozomiMizuhoSakuraTsubame}普通車`,
    value: applyPassenger(
      fares.hayatoku7NozomiMizuhoSakuraTsubameReserved,
      passenger,
    ),
  });

  hayatokuItems.push({
    group: "早特7",
    label: `${hikariKodama}普通車`,
    value: applyPassenger(fares.hayatoku7HikariKodamaReserved, passenger),
  });

  hayatokuItems.push({
    group: "早特21",
    label: `${nozomiMizuhoSakuraTsubame}普通車`,
    value: applyPassenger(
      fares.hayatoku21NozomiMizuhoSakuraTsubameReserved,
      passenger,
    ),
  });

  hayatokuItems.push({
    group: "ファミリー早特7",
    label: `${hikariKodama}普通車`,
    value: applyPassenger(fares.familyHayatoku7HikariKodamaReserved, passenger),
  });

  results.push({
    section: "EX早特",
    items: hayatokuItems,
  });

  // ================================================
  // グループ5: ぷらっとこだま
  // ================================================
  const platKodamaItems: FareItem[] = [];
  const priceClass = fares.platKodamaPriceClass;

  // valid_untilを過ぎているかチェック
  const validUntil = new Date(platKodamaConfig.valid_until);
  const isExpired = date > validUntil;

  // 料金区分が判定できる場合は該当プランのみ表示、できない場合は全プランを表示
  if (priceClass === null || priceClass === "A") {
    platKodamaItems.push({
      label: `${TRAIN_TAGS.kodama}A料金 普通車`,
      value: applyPassenger(fares.platKodamaReservedA, passenger),
      italic: isExpired,
    });
  }

  if (priceClass === null || priceClass === "B") {
    platKodamaItems.push({
      label: `${TRAIN_TAGS.kodama}B料金 普通車`,
      value: applyPassenger(fares.platKodamaReservedB, passenger),
      italic: isExpired,
    });
  }

  if (priceClass === null || priceClass === "C") {
    platKodamaItems.push({
      label: `${TRAIN_TAGS.kodama}C料金 普通車`,
      value: applyPassenger(fares.platKodamaReservedC, passenger),
      italic: isExpired,
    });
  }

  if (priceClass === null || priceClass === "D") {
    platKodamaItems.push({
      label: `${TRAIN_TAGS.kodama}D料金 普通車`,
      value: applyPassenger(fares.platKodamaReservedD, passenger),
      italic: isExpired,
    });
  }

  if (priceClass === null || priceClass === "A") {
    platKodamaItems.push({
      label: `${TRAIN_TAGS.kodama}A料金 グリーン車`,
      value: applyPassenger(fares.platKodamaGreenA, passenger),
      italic: isExpired,
    });
  }

  if (priceClass === null || priceClass === "B") {
    platKodamaItems.push({
      label: `${TRAIN_TAGS.kodama}B料金 グリーン車`,
      value: applyPassenger(fares.platKodamaGreenB, passenger),
      italic: isExpired,
    });
  }

  if (priceClass === null || priceClass === "C") {
    platKodamaItems.push({
      label: `${TRAIN_TAGS.kodama}C料金 グリーン車`,
      value: applyPassenger(fares.platKodamaGreenC, passenger),
      italic: isExpired,
    });
  }

  if (priceClass === null || priceClass === "D") {
    platKodamaItems.push({
      label: `${TRAIN_TAGS.kodama}D料金 グリーン車`,
      value: applyPassenger(fares.platKodamaGreenD, passenger),
      italic: isExpired,
    });
  }

  // 料金の有効期限と変更に関する注意メッセージ
  const validUntilStr = validUntil.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const platKodamaNote = `※ ${validUntilStr}までの料金です。ぷらっとこだまの旅行代金は随時変更される可能性があります`;

  results.push({
    section: "ぷらっとこだま",
    items: platKodamaItems,
    sectionNote: platKodamaNote,
  });

  return results;
}
