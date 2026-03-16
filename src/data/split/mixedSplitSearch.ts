import type { MixedSplitResult, StationId } from "../types";
import { getFareEntry } from "../allFares";
import { calculateAllFares, calcGakuwariTicketFare } from "../calculator";
import { STATIONS, getStationIndex } from "../stations";
import { isExcludedDate } from "../calendar";

/** 早特混合分割最安値探索 */
export function computeMixedSplitDP(
  from: StationId,
  to: StationId,
  dateStr: string,
  useGakuwari: boolean,
): MixedSplitResult | null {
  let fromIdx = getStationIndex(from);
  let toIdx = getStationIndex(to);
  const reversed = fromIdx > toIdx;
  if (reversed) [fromIdx, toIdx] = [toIdx, fromIdx];

  const n = toIdx - fromIdx;
  if (n <= 1) return null;

  const excluded = isExcludedDate(dateStr);

  // 通しの自由席料金
  const throughEntry = getFareEntry(from, to);
  if (!throughEntry) return null;
  const throughTicket = useGakuwari
    ? calcGakuwariTicketFare(throughEntry.ticket_fare, throughEntry.distance)
    : throughEntry.ticket_fare;
  const throughTotal = throughTicket + throughEntry.free;

  // Step 1: 全ペアの自由席DPを事前計算
  const freeDp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(n + 1).fill(Infinity),
  );
  for (let len = 0; len <= n; len++) {
    freeDp[len][len] = 0;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      // freeDp[start][i] = min over k of freeDp[start][k] + free(k, i)
      for (let start = 0; start <= j; start++) {
        const stJ = STATIONS[fromIdx + j].id;
        const stI = STATIONS[fromIdx + i].id;
        const entry = getFareEntry(stJ, stI);
        if (!entry) continue;
        const cost = freeDp[start][j] + entry.free;
        if (cost < freeDp[start][i]) {
          freeDp[start][i] = cost;
        }
      }
    }
  }

  // Step 2: メインDP
  const dp = new Array<number>(n + 1).fill(Infinity);
  const dpPrev = new Array<number>(n + 1).fill(-1);
  const dpProduct = new Array<string>(n + 1).fill("");
  const dpFare = new Array<number>(n + 1).fill(0);
  dp[0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] === Infinity) continue;

      const stJ = STATIONS[fromIdx + j].id;
      const stI = STATIONS[fromIdx + i].id;

      // 通常きっぷグループ（乗車券＋自由席特急券分割）
      if (freeDp[j][i] < Infinity) {
        const entry = getFareEntry(stJ, stI);
        if (entry) {
          const ticket = useGakuwari
            ? calcGakuwariTicketFare(entry.ticket_fare, entry.distance)
            : entry.ticket_fare;
          const cost = dp[j] + ticket + freeDp[j][i];
          if (cost < dp[i]) {
            dp[i] = cost;
            dpPrev[i] = j;
            dpProduct[i] = "通常きっぷ(自由席)";
            dpFare[i] = ticket + freeDp[j][i];
          }
        }
      }

      // 一体商品
      if (!excluded) {
        const fares = calculateAllFares(stJ, stI, dateStr);
        if (fares) {
          const products: { name: string; fare: number | null }[] = [
            { name: "早特1", fare: fares.hayatoku1 },
            { name: "早特3(グリーン)", fare: fares.hayatoku3NozomiGreen },
            { name: "早特3(ひかりグリーン)", fare: fares.hayatoku3HikariGreen },
            { name: "早特3(こだまグリーン)", fare: fares.hayatoku3KodamaGreen },
            { name: "早特7(のぞみ等)", fare: fares.hayatoku7NozomiReserved },
            { name: "早特7(ひかり等)", fare: fares.hayatoku7HikariReserved },
            { name: "早特21", fare: fares.hayatoku21NozomiReserved },
            {
              name: "ファミリー早特7",
              fare: fares.familyHayatoku7HikariReserved,
            },
          ];

          // ぷらっとこだま
          if (Math.max(fromIdx + j, fromIdx + i) <= 16) {
            products.push({
              name: `ぷらっとこだま(普通車)`,
              fare: fares.platKodamaReserved,
            });
            products.push({
              name: `ぷらっとこだま(グリーン)`,
              fare: fares.platKodamaGreen,
            });
          }

          // SmartEX
          if (fares.smartexFree != null) {
            products.push({ name: "SmartEX(自由席)", fare: fares.smartexFree });
          }

          for (const p of products) {
            if (p.fare == null) continue;
            const cost = dp[j] + p.fare;
            if (cost < dp[i]) {
              dp[i] = cost;
              dpPrev[i] = j;
              dpProduct[i] = p.name;
              dpFare[i] = p.fare;
            }
          }
        }
      }
    }
  }

  if (dp[n] >= throughTotal) return null;

  // パスを復元
  const segments: {
    from: StationId;
    to: StationId;
    productName: string;
    fare: number;
  }[] = [];
  let cur = n;
  while (cur > 0) {
    const p = dpPrev[cur];
    segments.unshift({
      from: STATIONS[fromIdx + p].id,
      to: STATIONS[fromIdx + cur].id,
      productName: dpProduct[cur],
      fare: dpFare[cur],
    });
    cur = p;
  }

  if (segments.length <= 1) return null;

  const total = dp[n];
  const saving = throughTotal - total;
  if (saving <= 0) return null;

  return { segments, total, throughTotal, saving };
}
