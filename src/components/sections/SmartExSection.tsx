import FareSection from "../FareSection";
import FareRow from "../FareRow";
import {
  applyPassenger,
  type CalculatedFares,
  type PassengerType,
} from "../../data/calculator";
import { TRAIN_TAGS } from "../../data/trainTags";

type Props = {
  fares: CalculatedFares;
  passenger: PassengerType;
};

function SmartExSection({ fares, passenger }: Props) {
  const nozomiMizuho = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}`;
  const nonNozomiMizuho = `${TRAIN_TAGS.kodama}${TRAIN_TAGS.hikari}${TRAIN_TAGS.sakura}${TRAIN_TAGS.tsubame}`;

  return (
    <FareSection title="スマートEXサービス">
      <table className="fare-table__table">
        <thead>
          <tr>
            <th>項目</th>
            <th>料金</th>
          </tr>
        </thead>
        <tbody>
          {fares.smartexNozomiMizuhoReserved !== null && (
            <FareRow
              label={`${nozomiMizuho}普通車`}
              value={applyPassenger(
                fares.smartexNozomiMizuhoReserved,
                passenger,
              )}
            />
          )}
          <FareRow
            label={`${nonNozomiMizuho}普通車`}
            value={applyPassenger(fares.smartexOtherReserved, passenger)}
          />
          {fares.smartexNozomiMizuhoGreen !== null && (
            <FareRow
              label={`${nozomiMizuho}グリーン車`}
              value={applyPassenger(
                fares.smartexNozomiMizuhoGreen,
                passenger,
              )}
            />
          )}
          <FareRow
            label={`${nonNozomiMizuho}グリーン車`}
            value={applyPassenger(fares.smartexOtherGreen, passenger)}
          />
          <FareRow
            label="自由席"
            value={applyPassenger(fares.smartexFree, passenger)}
          />
        </tbody>
      </table>
    </FareSection>
  );
}

export default SmartExSection;
