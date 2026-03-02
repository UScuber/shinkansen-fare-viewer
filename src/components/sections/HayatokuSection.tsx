import FareSection from "../FareSection";
import FareRow from "../FareRow";
import type { CalculatedFares } from "../../data/calculator";
import { TRAIN_TAGS } from "../../data/trainTags";

type Props = {
  fares: CalculatedFares;
};

function HayatokuSection({ fares }: Props) {
  const nozomiMizuhoSakuraTsubame = `${TRAIN_TAGS.nozomi}${TRAIN_TAGS.mizuho}${TRAIN_TAGS.sakura}${TRAIN_TAGS.tsubame}`;
  const hikariKodama = `${TRAIN_TAGS.hikari}${TRAIN_TAGS.kodama}`;

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

        <div className="fare-subgroup">
          <h4 className="fare-subgroup__title">早特1</h4>
          <table className="fare-table__table">
            <tbody>
              <FareRow label="自由席" value={fares.hayatoku1Free} />
            </tbody>
          </table>
        </div>

        <div className="fare-subgroup">
          <h4 className="fare-subgroup__title">早特3</h4>
          <table className="fare-table__table">
            <tbody>
              <FareRow
                label={`${nozomiMizuhoSakuraTsubame}グリーン車`}
                value={fares.hayatoku3NozomiMizuhoSakuraTsubameGreen}
              />
              <FareRow
                label={`${TRAIN_TAGS.hikari}グリーン車`}
                value={fares.hayatoku3HikariGreen}
              />
              <FareRow
                label={`${TRAIN_TAGS.kodama}グリーン車`}
                value={fares.hayatoku3KodamaGreen}
              />
            </tbody>
          </table>
        </div>

        <div className="fare-subgroup">
          <h4 className="fare-subgroup__title">早特7</h4>
          <table className="fare-table__table">
            <tbody>
              <FareRow
                label={`${nozomiMizuhoSakuraTsubame}普通車`}
                value={fares.hayatoku7NozomiMizuhoSakuraTsubameReserved}
              />
              <FareRow
                label={`${hikariKodama}普通車`}
                value={fares.hayatoku7HikariKodamaReserved}
              />
            </tbody>
          </table>
        </div>

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
      </div>
    </FareSection>
  );
}

export default HayatokuSection;
