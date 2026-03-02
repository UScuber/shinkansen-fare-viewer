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

function HayatokuSection({ fares, filter }: Props) {
  const nozomiMizuhoSakuraTsubame = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}${TRAIN_TAGS.sakura}${TRAIN_TAGS.tsubame}`;
  const hikariKodama = `${TRAIN_TAGS.hikari}${TRAIN_TAGS.kodama}`;

  const f = filter ?? null;
  const showHayatoku1Free = isProductVisible("hayatoku1Free", f);
  const showH3NozomiGreen = isProductVisible(
    "hayatoku3NozomiMizuhoSakuraTsubameGreen",
    f,
  );
  const showH3HikariGreen = isProductVisible("hayatoku3HikariGreen", f);
  const showH3KodamaGreen = isProductVisible("hayatoku3KodamaGreen", f);
  const showH7NozomiReserved = isProductVisible(
    "hayatoku7NozomiMizuhoSakuraTsubameReserved",
    f,
  );
  const showH7HikariReserved = isProductVisible(
    "hayatoku7HikariKodamaReserved",
    f,
  );
  const showH21NozomiReserved = isProductVisible(
    "hayatoku21NozomiMizuhoSakuraTsubameReserved",
    f,
  );
  const showFamilyH7 = isProductVisible(
    "familyHayatoku7HikariKodamaReserved",
    f,
  );

  const showSubHayatoku1 = showHayatoku1Free;
  const showSubHayatoku3 =
    showH3NozomiGreen || showH3HikariGreen || showH3KodamaGreen;
  const showSubHayatoku7 = showH7NozomiReserved || showH7HikariReserved;
  const showSubHayatoku21 = showH21NozomiReserved;
  const showSubFamily = showFamilyH7;

  if (
    !showSubHayatoku1 &&
    !showSubHayatoku3 &&
    !showSubHayatoku7 &&
    !showSubHayatoku21 &&
    !showSubFamily
  ) {
    return null;
  }

  return (
    <FareSection title="EX早特">
      <div className="fare-subgroups">
        <table className="fare-table__table">
          <thead>
            <tr>
              <th>項目</th>
              <th>料金</th>
            </tr>
          </thead>
        </table>

        {showSubHayatoku1 && (
          <div className="fare-subgroup">
            <h4 className="fare-subgroup__title">早特1</h4>
            <table className="fare-table__table">
              <tbody>
                <FareRow label="自由席" value={fares.hayatoku1Free} />
              </tbody>
            </table>
          </div>
        )}

        {showSubHayatoku3 && (
          <div className="fare-subgroup">
            <h4 className="fare-subgroup__title">早特3</h4>
            <table className="fare-table__table">
              <tbody>
                {showH3NozomiGreen && (
                  <FareRow
                    label={`${nozomiMizuhoSakuraTsubame}グリーン車`}
                    value={fares.hayatoku3NozomiMizuhoSakuraTsubameGreen}
                  />
                )}
                {showH3HikariGreen && (
                  <FareRow
                    label={`${TRAIN_TAGS.hikari}グリーン車`}
                    value={fares.hayatoku3HikariGreen}
                  />
                )}
                {showH3KodamaGreen && (
                  <FareRow
                    label={`${TRAIN_TAGS.kodama}グリーン車`}
                    value={fares.hayatoku3KodamaGreen}
                  />
                )}
              </tbody>
            </table>
          </div>
        )}

        {showSubHayatoku7 && (
          <div className="fare-subgroup">
            <h4 className="fare-subgroup__title">早特7</h4>
            <table className="fare-table__table">
              <tbody>
                {showH7NozomiReserved && (
                  <FareRow
                    label={`${nozomiMizuhoSakuraTsubame}普通車`}
                    value={fares.hayatoku7NozomiMizuhoSakuraTsubameReserved}
                  />
                )}
                {showH7HikariReserved && (
                  <FareRow
                    label={`${hikariKodama}普通車`}
                    value={fares.hayatoku7HikariKodamaReserved}
                  />
                )}
              </tbody>
            </table>
          </div>
        )}

        {showSubHayatoku21 && (
          <div className="fare-subgroup">
            <h4 className="fare-subgroup__title">早特21</h4>
            <table className="fare-table__table">
              <tbody>
                <FareRow
                  label={`${nozomiMizuhoSakuraTsubame}普通車`}
                  value={fares.hayatoku21NozomiMizuhoSakuraTsubameReserved}
                />
              </tbody>
            </table>
          </div>
        )}

        {showSubFamily && (
          <div className="fare-subgroup">
            <h4 className="fare-subgroup__title">ファミリー早特7</h4>
            <table className="fare-table__table">
              <tbody>
                <FareRow
                  label={`${hikariKodama}普通車`}
                  value={fares.familyHayatoku7HikariKodamaReserved}
                />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FareSection>
  );
}

export default HayatokuSection;
