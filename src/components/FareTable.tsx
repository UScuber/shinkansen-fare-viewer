import TicketSection from "./sections/TicketSection";
import ExpressSection from "./sections/ExpressSection";
import SmartExSection from "./sections/SmartExSection";
import HayatokuSection from "./sections/HayatokuSection";
import PlatKodamaSection from "./sections/PlatKodamaSection";
import type { CalculatedFares, PassengerType } from "../data/calculator";

type Props = {
  fares: CalculatedFares;
  passenger: PassengerType;
  date: Date;
};

function FareTable({ fares, passenger, date }: Props) {
  return (
    <div className="fare-table">
      <TicketSection fares={fares} passenger={passenger} />
      <ExpressSection fares={fares} passenger={passenger} />
      <SmartExSection fares={fares} passenger={passenger} />
      <HayatokuSection fares={fares} passenger={passenger} />
      <PlatKodamaSection fares={fares} passenger={passenger} date={date} />
    </div>
  );
}

export default FareTable;
