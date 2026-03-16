import type {
  CheapestCombinationResult,
  CheapestSegment,
  SegmentConfig,
  StationId,
} from "../types";
import { getFareEntry } from "../allFares";
import { calculateAllFares, calcGakuwariTicketFare } from "../calculator";
import { isExcludedDate } from "../calendar";
import { getStationIndex } from "../stations";

interface SegmentProduct {
  productName: string;
  fare: number;
}

/** 最安組み合わせの算出（System B） */
export function findCheapestCombination(
  _from: StationId,
  _to: StationId,
  segments: { from: StationId; to: StationId }[],
  _configs: SegmentConfig[],
  dateStr: string,
  useGakuwari: boolean,
): CheapestCombinationResult | null {
  const excluded = isExcludedDate(dateStr);

  // 各区間の利用可能な商品リスト
  const segmentOptions: SegmentProduct[][] = segments.map((seg) => {
    const products: SegmentProduct[] = [];

    // 通常きっぷ（乗車券＋自由席特急券）
    const entry = getFareEntry(seg.from, seg.to);
    if (entry) {
      const ticket = useGakuwari
        ? calcGakuwariTicketFare(entry.ticket_fare, entry.distance)
        : entry.ticket_fare;
      products.push({
        productName: "通常きっぷ(自由席)",
        fare: ticket + entry.free,
      });
    }

    // 各早特・ぷらっとこだまの料金を取得
    const fares = calculateAllFares(seg.from, seg.to, dateStr);
    if (!fares) return products;

    // 早特商品
    if (!excluded) {
      addIfAvailable(products, "早特1", fares.hayatoku1);
      addIfAvailable(products, "早特3(グリーン)", fares.hayatoku3NozomiGreen);
      addIfAvailable(
        products,
        "早特3(ひかりグリーン)",
        fares.hayatoku3HikariGreen,
      );
      addIfAvailable(
        products,
        "早特3(こだまグリーン)",
        fares.hayatoku3KodamaGreen,
      );
      addIfAvailable(
        products,
        "早特7(のぞみ等)",
        fares.hayatoku7NozomiReserved,
      );
      addIfAvailable(
        products,
        "早特7(ひかり等)",
        fares.hayatoku7HikariReserved,
      );
      addIfAvailable(products, "早特21", fares.hayatoku21NozomiReserved);
      addIfAvailable(
        products,
        "ファミリー早特7",
        fares.familyHayatoku7HikariReserved,
      );

      // ぷらっとこだま（東海道新幹線内のみ）
      const fromIdx = getStationIndex(seg.from);
      const toIdx = getStationIndex(seg.to);
      if (Math.max(fromIdx, toIdx) <= 16) {
        addIfAvailable(
          products,
          "ぷらっとこだま(普通車)",
          fares.platKodamaReserved,
        );
        addIfAvailable(
          products,
          "ぷらっとこだま(グリーン)",
          fares.platKodamaGreen,
        );
      }
    }

    return products;
  });

  // 組み合わせの全探索
  const result = searchCheapest(segments, segmentOptions, 0, []);
  return result;
}

function addIfAvailable(
  products: SegmentProduct[],
  name: string,
  fare: number | null,
): void {
  if (fare != null) {
    products.push({ productName: name, fare });
  }
}

function searchCheapest(
  segments: { from: StationId; to: StationId }[],
  options: SegmentProduct[][],
  index: number,
  current: CheapestSegment[],
): CheapestCombinationResult | null {
  if (index === segments.length) {
    const total = current.reduce((sum, s) => sum + s.fare, 0);
    return { segments: [...current], total };
  }

  let best: CheapestCombinationResult | null = null;

  for (const product of options[index]) {
    current.push({
      from: segments[index].from,
      to: segments[index].to,
      productName: product.productName,
      fare: product.fare,
    });

    const result = searchCheapest(segments, options, index + 1, current);
    if (result && (best === null || result.total < best.total)) {
      best = result;
    }

    current.pop();
  }

  return best;
}
