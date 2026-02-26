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

function HayatokuSection({ fares, passenger }: Props) {
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
              <FareRow
                label="自由席"
                value={applyPassenger(fares.hayatoku1Free, passenger)}
              />
            </tbody>
          </table>
        </div>

        <div className="fare-subgroup">
          <h4 className="fare-subgroup__title">早特3</h4>
          <table className="fare-table__table">
            <tbody>
              <FareRow
                label={`${nozomiMizuhoSakuraTsubame}グリーン車`}
                value={applyPassenger(
                  fares.hayatoku3NozomiMizuhoSakuraTsubameGreen,
                  passenger,
                )}
              />
              <FareRow
                label={`${TRAIN_TAGS.hikari}グリーン車`}
                value={applyPassenger(
                  fares.hayatoku3HikariGreen,
                  passenger,
                )}
              />
              <FareRow
                label={`${TRAIN_TAGS.kodama}グリーン車`}
                value={applyPassenger(
                  fares.hayatoku3KodamaGreen,
                  passenger,
                )}
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
                value={applyPassenger(
                  fares.hayatoku7NozomiMizuhoSakuraTsubameReserved,
                  passenger,
                )}
              />
              <FareRow
                label={`${hikariKodama}普通車`}
                value={applyPassenger(
                  fares.hayatoku7HikariKodamaReserved,
                  passenger,
                )}
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
                value={applyPassenger(
                  fares.hayatoku21NozomiMizuhoSakuraTsubameReserved,
                  passenger,
                )}
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
                value={applyPassenger(
                  fares.familyHayatoku7HikariKodamaReserved,
                  passenger,
                )}
              />
            </tbody>
          </table>
        </div>
      </div>
    </FareSection>
  );
}

export default HayatokuSection;
