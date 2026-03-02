import FareSection from "../FareSection";
import FareRow from "../FareRow";
import type { CalculatedFares } from "../../data/calculator";
import { TRAIN_TAGS } from "../../data/trainTags";

type Props = {
  fares: CalculatedFares;
};

function ExpressSection({ fares }: Props) {
  const nozomiMizuho = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}`;
  const nonNozomiMizuho = `${TRAIN_TAGS.kodama}${TRAIN_TAGS.hikari}${TRAIN_TAGS.sakura}${TRAIN_TAGS.tsubame}`;

  return (
    <FareSection title="特急券">
      <table className="fare-table__table">
        <thead>
          <tr>
            <th>項目</th>
            <th>料金</th>
          </tr>
        </thead>
        <tbody>
          {fares.expressNozomiMizuhoReserved !== null && (
            <FareRow
              label={`${nozomiMizuho}普通車`}
              value={fares.expressNozomiMizuhoReserved}
            />
          )}
          <FareRow
            label={`${nonNozomiMizuho}普通車`}
            value={fares.expressOtherReserved}
          />
          {fares.expressNozomiMizuhoGreen !== null && (
            <FareRow
              label={`${nozomiMizuho}グリーン車`}
              value={fares.expressNozomiMizuhoGreen}
            />
          )}
          <FareRow
            label={`${nonNozomiMizuho}グリーン車`}
            value={fares.expressOtherGreen}
          />
          <FareRow label="自由席" value={fares.expressFree} />
        </tbody>
      </table>
    </FareSection>
  );
}

export default ExpressSection;
