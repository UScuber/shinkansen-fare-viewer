import type { CalculatedFares, FareFilter } from "../../data/types";
import TicketSection from "./TicketSection";
import NormalTicketTotalSection from "./NormalTicketTotalSection";
import ExpressSection from "./ExpressSection";
import SmartExSection from "./SmartExSection";
import HayatokuSection from "./HayatokuSection";
import PlatKodamaSection from "./PlatKodamaSection";

interface FareListSectionProps {
  fares: CalculatedFares;
  useGakuwari: boolean;
  filter: FareFilter;
  showSmartEx: boolean;
}

export default function FareListSection({
  fares,
  useGakuwari,
  filter,
  showSmartEx,
}: FareListSectionProps) {
  return (
    <div className="space-y-0">
      <TicketSection fares={fares} useGakuwari={useGakuwari} />
      <NormalTicketTotalSection
        fares={fares}
        useGakuwari={useGakuwari}
        filter={filter}
      />
      <ExpressSection fares={fares} filter={filter} />
      {showSmartEx && <SmartExSection fares={fares} filter={filter} />}
      <HayatokuSection fares={fares} filter={filter} />
      <PlatKodamaSection fares={fares} filter={filter} />
    </div>
  );
}
