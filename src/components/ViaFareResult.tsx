import type { ViaCalcResult } from "../data/viaCalculator";
import FareSection from "./FareSection";
import { formatYen, formatDistance } from "./ui/format";

interface ViaFareResultProps {
  result: ViaCalcResult;
  useGakuwari: boolean;
}

export default function ViaFareResult({
  result,
  useGakuwari,
}: ViaFareResultProps) {
  if (result.error) {
    return (
      <div className="p-5 text-center text-sm text-red-500">{result.error}</div>
    );
  }

  const through = result.throughFare;
  const cheapest = result.cheapest;

  return (
    <div>
      {through && (
        <FareSection title="通し計算">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5">
            <span className="text-sm text-gray-600">
              乗車券 {formatDistance(through.distance)}
            </span>
            <span className="whitespace-nowrap font-mono text-sm font-bold text-indigo-900">
              {formatYen(
                useGakuwari ? through.gakuwariTicketFare : through.ticketFare,
              )}
            </span>
          </div>
          <div className="py-1 pb-2">
            <div className="py-0.5 text-xs text-gray-400">
              指定席特急料金（ベース）:{" "}
              {formatYen(through.expressFareBreakdown.base)}
            </div>
            {through.expressFareBreakdown.seasonalDiff !== 0 && (
              <div className="py-0.5 text-xs text-gray-400">
                季節加算:{" "}
                {through.expressFareBreakdown.seasonalDiff > 0 ? "+" : ""}
                {formatYen(through.expressFareBreakdown.seasonalDiff)}
              </div>
            )}
            {through.expressFareBreakdown.nozomiAdditional > 0 && (
              <div className="py-0.5 text-xs text-gray-400">
                のぞみ加算: +
                {formatYen(through.expressFareBreakdown.nozomiAdditional)}
              </div>
            )}
            {through.expressFareBreakdown.greenCharge > 0 && (
              <div className="py-0.5 text-xs text-gray-400">
                グリーン料金: +
                {formatYen(through.expressFareBreakdown.greenCharge)}
              </div>
            )}
            {through.expressFareBreakdown.deduction530 > 0 && (
              <div className="py-0.5 text-xs text-gray-400">
                指定席→グリーン車引き: -
                {formatYen(through.expressFareBreakdown.deduction530)}
              </div>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between border-t-2 border-indigo-900 pt-2">
            <span className="text-sm text-gray-600">合計</span>
            <span className="whitespace-nowrap font-mono text-base font-bold text-indigo-900">
              {formatYen(useGakuwari ? through.gakuwariTotal : through.total)}
            </span>
          </div>
        </FareSection>
      )}

      {cheapest && through && (
        <FareSection title="最安組み合わせ">
          {cheapest.segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5 last:border-b-0"
            >
              <span className="text-sm text-gray-600">
                区間{i + 1}: {seg.productName}
              </span>
              <span className="whitespace-nowrap font-mono text-sm font-bold text-indigo-900">
                {formatYen(seg.fare)}
              </span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t-2 border-indigo-900 pt-2">
            <span className="text-sm text-gray-600">合計</span>
            <span className="whitespace-nowrap font-mono text-base font-bold text-indigo-900">
              {formatYen(cheapest.total)}
            </span>
          </div>
          <div className="py-1.5 text-center text-[0.85rem] font-bold text-green-600">
            通しより{" "}
            {formatYen(
              (useGakuwari ? through.gakuwariTotal : through.total) -
                cheapest.total,
            )}{" "}
            おトク
          </div>
        </FareSection>
      )}
    </div>
  );
}
