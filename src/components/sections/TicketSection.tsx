import FareSection from "../FareSection";
import FareRow from "../FareRow";
import type { CalculatedFares } from "../../data/calculator";

type Props = {
  fares: CalculatedFares;
  useGakuwari?: boolean;
};

function TicketSection({ fares, useGakuwari = false }: Props) {
  return (
    <FareSection title="乗車券">
      <table className="fare-table__table">
        <thead>
          <tr>
            <th>項目</th>
            <th>料金</th>
          </tr>
        </thead>
        <tbody>
          <FareRow label="距離" value={fares.distance} note="km" />
          {useGakuwari ? (
            <FareRow
              label="学割運賃"
              value={fares.studentFare}
              note={
                fares.studentFareApplicable
                  ? "学割適用中"
                  : "101km未満のため通常運賃と同額"
              }
            />
          ) : (
            <FareRow label="乗車券運賃" value={fares.ticketFare} />
          )}
        </tbody>
      </table>
    </FareSection>
  );
}

export default TicketSection;
