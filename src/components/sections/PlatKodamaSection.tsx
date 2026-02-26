import FareSection from "../FareSection";
import FareRow from "../FareRow";
import {
  applyPassenger,
  type CalculatedFares,
  type PassengerType,
} from "../../data/calculator";
import { TRAIN_TAGS } from "../../data/trainTags";
import platKodamaConfig from "../../data/plat_kodama_config.json";

type Props = {
  fares: CalculatedFares;
  passenger: PassengerType;
  date: Date;
};

function PlatKodamaSection({ fares, passenger, date }: Props) {
  const priceClass = fares.platKodamaPriceClass;
  const validUntil = new Date(platKodamaConfig.valid_until);
  const isExpired = date > validUntil;

  const validUntilStr = validUntil.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const note = `※ ${validUntilStr}までの料金です。ぷらっとこだまの旅行代金は随時変更される可能性があります`;

  return (
    <FareSection title="ぷらっとこだま" note={note}>
      <table className="fare-table__table">
        <thead>
          <tr>
            <th>項目</th>
            <th>料金</th>
          </tr>
        </thead>
        <tbody>
          {(priceClass === null || priceClass === "A") && (
            <FareRow
              label={`${TRAIN_TAGS.kodama}A料金 普通車`}
              value={applyPassenger(fares.platKodamaReservedA, passenger)}
              italic={isExpired}
            />
          )}
          {(priceClass === null || priceClass === "B") && (
            <FareRow
              label={`${TRAIN_TAGS.kodama}B料金 普通車`}
              value={applyPassenger(fares.platKodamaReservedB, passenger)}
              italic={isExpired}
            />
          )}
          {(priceClass === null || priceClass === "C") && (
            <FareRow
              label={`${TRAIN_TAGS.kodama}C料金 普通車`}
              value={applyPassenger(fares.platKodamaReservedC, passenger)}
              italic={isExpired}
            />
          )}
          {(priceClass === null || priceClass === "D") && (
            <FareRow
              label={`${TRAIN_TAGS.kodama}D料金 普通車`}
              value={applyPassenger(fares.platKodamaReservedD, passenger)}
              italic={isExpired}
            />
          )}
          {(priceClass === null || priceClass === "A") && (
            <FareRow
              label={`${TRAIN_TAGS.kodama}A料金 グリーン車`}
              value={applyPassenger(fares.platKodamaGreenA, passenger)}
              italic={isExpired}
            />
          )}
          {(priceClass === null || priceClass === "B") && (
            <FareRow
              label={`${TRAIN_TAGS.kodama}B料金 グリーン車`}
              value={applyPassenger(fares.platKodamaGreenB, passenger)}
              italic={isExpired}
            />
          )}
          {(priceClass === null || priceClass === "C") && (
            <FareRow
              label={`${TRAIN_TAGS.kodama}C料金 グリーン車`}
              value={applyPassenger(fares.platKodamaGreenC, passenger)}
              italic={isExpired}
            />
          )}
          {(priceClass === null || priceClass === "D") && (
            <FareRow
              label={`${TRAIN_TAGS.kodama}D料金 グリーン車`}
              value={applyPassenger(fares.platKodamaGreenD, passenger)}
              italic={isExpired}
            />
          )}
        </tbody>
      </table>
    </FareSection>
  );
}

export default PlatKodamaSection;
