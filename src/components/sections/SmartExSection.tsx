import FareSection from "../FareSection";
import FareRow from "../FareRow";
import type { CalculatedFares } from "../../data/calculator";
import { TRAIN_TAGS } from "../../data/trainTags";

type Props = {
  fares: CalculatedFares;
};

function SmartExSection({ fares }: Props) {
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
              value={fares.smartexNozomiMizuhoReserved}
            />
          )}
          <FareRow
            label={`${nonNozomiMizuho}普通車`}
            value={fares.smartexOtherReserved}
          />
          {fares.smartexNozomiMizuhoGreen !== null && (
            <FareRow
              label={`${nozomiMizuho}グリーン車`}
              value={fares.smartexNozomiMizuhoGreen}
            />
          )}
          <FareRow
            label={`${nonNozomiMizuho}グリーン車`}
            value={fares.smartexOtherGreen}
          />
          <FareRow
            label="自由席"
            value={fares.smartexFree}
          />
        </tbody>
      </table>
    </FareSection>
  );
}

export default SmartExSection;
