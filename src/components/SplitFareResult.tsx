import type { SplitFareResultData } from "../data/types";
import { getStationName } from "../data/stations";
import FareSection from "./FareSection";
import { formatYen } from "./ui/format";

interface SplitFareResultProps {
  result: SplitFareResultData;
}

export default function SplitFareResult({ result }: SplitFareResultProps) {
  const { freeSplit, mixedSplit } = result;

  if (!freeSplit && !mixedSplit) return null;

  return (
    <div>
      {freeSplit && (
        <FareSection title="自由席分割最安値">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5">
            <span className="text-sm text-gray-600">乗車券（通し）</span>
            <span className="whitespace-nowrap font-mono text-sm font-bold text-indigo-900">
              {formatYen(freeSplit.ticketFare)}
            </span>
          </div>
          {freeSplit.segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5"
            >
              <span className="text-sm text-gray-600">
                区間{i + 1}: {getStationName(seg.from)}→{getStationName(seg.to)}
              </span>
              <span className="whitespace-nowrap font-mono text-sm font-bold text-indigo-900">
                {formatYen(seg.fare)}
              </span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t-2 border-indigo-900 pt-2">
            <span className="text-sm text-gray-600">合計</span>
            <span className="whitespace-nowrap font-mono text-base font-bold text-indigo-900">
              {formatYen(freeSplit.total)}
            </span>
          </div>
          <div className="py-1.5 text-center text-[0.85rem] font-bold text-green-600">
            通しより {formatYen(freeSplit.saving)} 安い
          </div>
        </FareSection>
      )}

      {mixedSplit && (
        <FareSection title="早特混合分割最安値">
          {mixedSplit.segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5"
            >
              <span className="text-sm text-gray-600">
                区間{i + 1}: {seg.productName}（{getStationName(seg.from)}→
                {getStationName(seg.to)}）
              </span>
              <span className="whitespace-nowrap font-mono text-sm font-bold text-indigo-900">
                {formatYen(seg.fare)}
              </span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t-2 border-indigo-900 pt-2">
            <span className="text-sm text-gray-600">合計</span>
            <span className="whitespace-nowrap font-mono text-base font-bold text-indigo-900">
              {formatYen(mixedSplit.total)}
            </span>
          </div>
          <div className="py-1.5 text-center text-[0.85rem] font-bold text-green-600">
            通しより {formatYen(mixedSplit.saving)} 安い
          </div>
        </FareSection>
      )}
    </div>
  );
}
