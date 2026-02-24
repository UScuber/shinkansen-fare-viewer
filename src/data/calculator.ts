/**
 * 料金計算ロジック
 */

import { getAllFares } from "./allFares";

export type PassengerType = "adult" | "child";

export type FareItem = {
  label: string;
  value: number | null;
  note?: string;
};

export type FareResult = {
  section: string;
  items: FareItem[];
};

function applyPassenger(fare: number | null, type: PassengerType): number | null {
  if (fare === null) return null;
  if (type === "child") return Math.floor(fare / 2);
  return fare;
}

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

  // 基本情報セクション
  results.push({
    section: "基本情報",
    items: [
      {
        label: "距離(km)",
        value: fareData.distance,
      },
      {
        label: "乗車券運賃",
        value: applyPassenger(fareData.ticket_fare, passenger),
      },
    ],
  });

  // 通常きっぷセクション
  const normalItems: FareItem[] = [];
  
  normalItems.push({
    label: "自由席特急料金",
    value: applyPassenger(fareData.free, passenger),
  });
  
  normalItems.push({
    label: "のぞみ、みずほを除く列車の指定席特急料金",
    value: applyPassenger(fareData.hikari_reserved, passenger),
  });
  
  normalItems.push({
    label: "のぞみ、みずほを除く列車のグリーン車特急料金",
    value: applyPassenger(fareData.green, passenger),
  });
  
  normalItems.push({
    label: "のぞみ、みずほ加算運賃",
    value: applyPassenger(fareData.nozomi_additional, passenger),
    note: "指定席やグリーン車で乗車する場合に特急料金に加算",
  });

  // のぞみ指定席の合計を計算
  if (fareData.hikari_reserved !== null && fareData.nozomi_additional !== null) {
    normalItems.push({
      label: "のぞみ、みずほ指定席特急料金",
      value: applyPassenger(fareData.hikari_reserved + fareData.nozomi_additional, passenger),
      note: "ひかり指定席 + のぞみ加算",
    });
  }

  // のぞみグリーン車の合計を計算
  if (fareData.green !== null && fareData.nozomi_additional !== null) {
    normalItems.push({
      label: "のぞみ、みずほグリーン車特急料金",
      value: applyPassenger(fareData.green + fareData.nozomi_additional, passenger),
      note: "グリーン車 + のぞみ加算",
    });
  }

  results.push({
    section: "通常きっぷ",
    items: normalItems,
  });

  // スマートEXセクション
  results.push({
    section: "スマートEX（基本料金）",
    items: [
      {
        label: "自由席",
        value: applyPassenger(fareData.smartex_free, passenger),
      },
      {
        label: "指定席",
        value: applyPassenger(fareData.smartex_reserved, passenger),
        note: "のぞみ、みずほに乗車する場合、のぞみ加算運賃が必要",
      },
      {
        label: "グリーン車",
        value: applyPassenger(fareData.smartex_green, passenger),
        note: "のぞみ、みずほに乗車する場合、のぞみ加算運賃が必要",
      },
    ],
  });

  // 早特1セクション
  const hayatoku1Items: FareItem[] = [];
  
  // 現在の日付を確認して、2026年4月以降かどうかを判定
  const isAfter2026Apr = date >= new Date(2026, 3, 1); // 2026年4月1日
  
  if (isAfter2026Apr && fareData.smartex_hayatoku1_2026_apr !== null) {
    hayatoku1Items.push({
      label: "早特1（2026年4月以降）",
      value: applyPassenger(fareData.smartex_hayatoku1_2026_apr, passenger),
    });
  } else if (!isAfter2026Apr && fareData.smartex_hayatoku1 !== null) {
    hayatoku1Items.push({
      label: "早特1（2026年3月まで）",
      value: applyPassenger(fareData.smartex_hayatoku1, passenger),
    });
  }
  
  if (hayatoku1Items.length > 0) {
    results.push({
      section: "スマートEX早特1",
      items: hayatoku1Items,
    });
  }

  // 早特3セクション
  const hayatoku3Items: FareItem[] = [];
  
  hayatoku3Items.push({
    label: "早特3 指定席（のぞみ、みずほ、さくら、つばめ）",
    value: applyPassenger(fareData.smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_reserved, passenger),
  });
  
  hayatoku3Items.push({
    label: "早特3 グリーン車（のぞみ、みずほ、さくら、つばめ）",
    value: applyPassenger(fareData.smartex_hayatoku3_nozomi_mizuho_sakura_tsubame_green, passenger),
  });
  
  hayatoku3Items.push({
    label: "早特3 グリーン車（ひかり）",
    value: applyPassenger(fareData.smartex_hayatoku3_hikari_green, passenger),
  });
  
  hayatoku3Items.push({
    label: "早特3 グリーン車（こだま）",
    value: applyPassenger(fareData.smartex_hayatoku3_kodama_green, passenger),
  });
  
  if (hayatoku3Items.some(item => item.value !== null)) {
    results.push({
      section: "スマートEX早特3",
      items: hayatoku3Items,
    });
  }

  // 早特7セクション
  const hayatoku7Items: FareItem[] = [];
  
  hayatoku7Items.push({
    label: "早特7 指定席（のぞみ、みずほ、さくら、つばめ）",
    value: applyPassenger(fareData.smartex_hayatoku7_nozomi_mizuho_sakura_tsubame_reserved, passenger),
  });
  
  hayatoku7Items.push({
    label: "早特7 指定席（ひかり、こだま）",
    value: applyPassenger(fareData.smartex_hayatoku7_hikari_kodama_reserved, passenger),
  });
  
  hayatoku7Items.push({
    label: "ファミリー早特7 指定席（ひかり、こだま）",
    value: applyPassenger(fareData.smartex_family_hayatoku7_hikari_kodama_reserved, passenger),
  });
  
  if (hayatoku7Items.some(item => item.value !== null)) {
    results.push({
      section: "スマートEX早特7",
      items: hayatoku7Items,
    });
  }

  // 早特21セクション
  const hayatoku21Items: FareItem[] = [];
  
  hayatoku21Items.push({
    label: "早特21 指定席（のぞみ、みずほ、さくら、つばめ）",
    value: applyPassenger(fareData.smartex_hayatoku21_nozomi_mizuho_sakura_tsubame_reserved, passenger),
  });
  
  if (hayatoku21Items.some(item => item.value !== null)) {
    results.push({
      section: "スマートEX早特21",
      items: hayatoku21Items,
    });
  }

  // ぷらっとこだまセクション
  const platKodamaItems: FareItem[] = [];
  
  platKodamaItems.push({
    label: "ぷらっとこだま 指定席 プランA",
    value: applyPassenger(fareData.plat_kodama_reserved_a, passenger),
  });
  
  platKodamaItems.push({
    label: "ぷらっとこだま 指定席 プランB",
    value: applyPassenger(fareData.plat_kodama_reserved_b, passenger),
  });
  
  platKodamaItems.push({
    label: "ぷらっとこだま 指定席 プランC",
    value: applyPassenger(fareData.plat_kodama_reserved_c, passenger),
  });
  
  platKodamaItems.push({
    label: "ぷらっとこだま 指定席 プランD",
    value: applyPassenger(fareData.plat_kodama_reserved_d, passenger),
  });
  
  platKodamaItems.push({
    label: "ぷらっとこだま グリーン車 プランA",
    value: applyPassenger(fareData.plat_kodama_green_a, passenger),
  });
  
  platKodamaItems.push({
    label: "ぷらっとこだま グリーン車 プランB",
    value: applyPassenger(fareData.plat_kodama_green_b, passenger),
  });
  
  platKodamaItems.push({
    label: "ぷらっとこだま グリーン車 プランC",
    value: applyPassenger(fareData.plat_kodama_green_c, passenger),
  });
  
  platKodamaItems.push({
    label: "ぷらっとこだま グリーン車 プランD",
    value: applyPassenger(fareData.plat_kodama_green_d, passenger),
  });
  
  if (platKodamaItems.some(item => item.value !== null)) {
    results.push({
      section: "ぷらっとこだま",
      items: platKodamaItems,
    });
  }

  return results;
}
