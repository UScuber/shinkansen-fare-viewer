import TicketSection from "./sections/TicketSection";
import ExpressSection from "./sections/ExpressSection";
import SmartExSection from "./sections/SmartExSection";
import HayatokuSection from "./sections/HayatokuSection";
import PlatKodamaSection from "./sections/PlatKodamaSection";
import type { CalculatedFares } from "../data/calculator";

type Props = {
  fares: CalculatedFares;
  date: Date;
};

function FareTable({ fares, date }: Props) {
  return (
    <div className="fare-table">
      <TicketSection fares={fares} />
      <ExpressSection fares={fares} />
      <SmartExSection fares={fares} />
      <HayatokuSection fares={fares} />
      <PlatKodamaSection fares={fares} date={date} />
    </div>
  );
}

export default FareTable;
