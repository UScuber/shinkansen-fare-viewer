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

function SmartExSection({ fares, filter }: Props) {
  const nozomiMizuho = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}`;
  const nonNozomiMizuho = `${TRAIN_TAGS.kodama}${TRAIN_TAGS.hikari}${TRAIN_TAGS.sakura}${TRAIN_TAGS.tsubame}`;

  const f = filter ?? null;
  const showNozomiReserved =
    fares.smartexNozomiMizuhoReserved !== null &&
    isProductVisible("smartexNozomiMizuhoReserved", f);
  const showOtherReserved = isProductVisible("smartexOtherReserved", f);
  const showNozomiGreen =
    fares.smartexNozomiMizuhoGreen !== null &&
    isProductVisible("smartexNozomiMizuhoGreen", f);
  const showOtherGreen = isProductVisible("smartexOtherGreen", f);
  const showFree = isProductVisible("smartexFree", f);

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
    <FareSection title="スマートEXサービス">
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
              value={fares.smartexNozomiMizuhoReserved}
            />
          )}
          {showOtherReserved && (
            <FareRow
              label={`${nonNozomiMizuho}普通車`}
              value={fares.smartexOtherReserved}
            />
          )}
          {showNozomiGreen && (
            <FareRow
              label={`${nozomiMizuho}グリーン車`}
              value={fares.smartexNozomiMizuhoGreen}
            />
          )}
          {showOtherGreen && (
            <FareRow
              label={`${nonNozomiMizuho}グリーン車`}
              value={fares.smartexOtherGreen}
            />
          )}
          {showFree && <FareRow label="自由席" value={fares.smartexFree} />}
        </tbody>
      </table>
    </FareSection>
  );
}

export default SmartExSection;
