import TicketSection from "./sections/TicketSection";
import ExpressSection from "./sections/ExpressSection";
import SmartExSection from "./sections/SmartExSection";
import HayatokuSection from "./sections/HayatokuSection";
import PlatKodamaSection from "./sections/PlatKodamaSection";
import type { CalculatedFares } from "../data/calculator";
import type { FareFilter } from "../data/types";

type Props = {
  fares: CalculatedFares;
  date: Date;
  filter?: FareFilter | null;
};

function FareTable({ fares, date, filter }: Props) {
  return (
    <div className="fare-table">
      <TicketSection fares={fares} />
      <ExpressSection fares={fares} filter={filter} />
      <SmartExSection fares={fares} filter={filter} />
      <HayatokuSection fares={fares} filter={filter} />
      <PlatKodamaSection fares={fares} date={date} filter={filter} />
    </div>
  );
}

export default FareTable;
