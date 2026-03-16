import type { CalculatedFares } from "../../data/types";
import FareSection from "../FareSection";
import { formatYen, formatDistance } from "../ui/format";

interface TicketSectionProps {
  fares: CalculatedFares;
  useGakuwari: boolean;
}

export default function TicketSection({
  fares,
  useGakuwari,
}: TicketSectionProps) {
  const ticketFare = useGakuwari ? fares.gakuwariTicketFare : fares.ticketFare;

  return (
    <FareSection title="乗車券">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
        <span className="text-sm text-gray-600">距離</span>
        <span className="whitespace-nowrap text-right font-mono text-sm font-bold text-indigo-900">
          {formatDistance(fares.distance)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
        <span className="text-sm text-gray-600">
          {useGakuwari ? "乗車券運賃（学割）" : "乗車券運賃"}
        </span>
        <span className="whitespace-nowrap text-right font-mono text-sm font-bold text-indigo-900">
          {formatYen(ticketFare)}
        </span>
      </div>
    </FareSection>
  );
}
