import FareSection from "../FareSection";
import FareRow from "../FareRow";
import type { CalculatedFares } from "../../data/calculator";
import type { FareFilter } from "../../data/types";
import { isProductVisible } from "../../data/fareFilter";
import { TRAIN_TAGS } from "../../data/trainTags";

type Props = {
  fares: CalculatedFares;
  filter?: FareFilter | null;
};

function ExpressSection({ fares, filter }: Props) {
  const nozomiMizuho = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}`;
  const nonNozomiMizuho = `${TRAIN_TAGS.kodama}${TRAIN_TAGS.hikari}${TRAIN_TAGS.sakura}${TRAIN_TAGS.tsubame}`;

  const f = filter ?? null;
  const showNozomiReserved =
    fares.expressNozomiMizuhoReserved !== null &&
    isProductVisible("expressNozomiMizuhoReserved", f);
  const showOtherReserved = isProductVisible("expressOtherReserved", f);
  const showNozomiGreen =
    fares.expressNozomiMizuhoGreen !== null &&
    isProductVisible("expressNozomiMizuhoGreen", f);
  const showOtherGreen = isProductVisible("expressOtherGreen", f);
  const showFree = isProductVisible("expressFree", f);

  if (
    !showNozomiReserved &&
    !showOtherReserved &&
    !showNozomiGreen &&
    !showOtherGreen &&
    !showFree
  ) {
    return null;
  }

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
          {showNozomiReserved && (
            <FareRow
              label={`${nozomiMizuho}普通車`}
              value={fares.expressNozomiMizuhoReserved}
            />
          )}
          {showOtherReserved && (
            <FareRow
              label={`${nonNozomiMizuho}普通車`}
              value={fares.expressOtherReserved}
            />
          )}
          {showNozomiGreen && (
            <FareRow
              label={`${nozomiMizuho}グリーン車`}
              value={fares.expressNozomiMizuhoGreen}
            />
          )}
          {showOtherGreen && (
            <FareRow
              label={`${nonNozomiMizuho}グリーン車`}
              value={fares.expressOtherGreen}
            />
          )}
          {showFree && <FareRow label="自由席" value={fares.expressFree} />}
        </tbody>
      </table>
    </FareSection>
  );
}

export default ExpressSection;
