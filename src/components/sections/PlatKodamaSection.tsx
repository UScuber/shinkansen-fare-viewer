import FareSection from "../FareSection";
import FareRow from "../FareRow";
import FareTableView from "../ui/FareTableView";
import type { CalculatedFares } from "../../data/calculator";
import type { FareFilter } from "../../data/types";
import { isProductVisible } from "../../data/fareFilter";
import { TRAIN_TAGS } from "../../data/trainTags";
import platKodamaConfig from "../../data/plat_kodama_config.json";

type Props = {
  fares: CalculatedFares;
  date: Date;
  filter?: FareFilter | null;
};

const PRICE_CLASSES = ["A", "B", "C", "D"] as const;

function PlatKodamaSection({ fares, date, filter }: Props) {
  const priceClass = fares.platKodamaPriceClass;
  const validUntil = new Date(platKodamaConfig.valid_until);
  const isExpired = date > validUntil;

  const validUntilStr = validUntil.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const note = `※ ${validUntilStr}までの料金です。ぷらっとこだまの旅行代金は随時変更される可能性があります`;

  const f = filter ?? null;
  const showReserved = isProductVisible("platKodamaReserved", f);
  const showGreen = isProductVisible("platKodamaGreen", f);

  if (!showReserved && !showGreen) {
    return null;
  }

  const reservedKeys = {
    A: fares.platKodamaReservedA,
    B: fares.platKodamaReservedB,
    C: fares.platKodamaReservedC,
    D: fares.platKodamaReservedD,
  } as const;

  const greenKeys = {
    A: fares.platKodamaGreenA,
    B: fares.platKodamaGreenB,
    C: fares.platKodamaGreenC,
    D: fares.platKodamaGreenD,
  } as const;

  const seatConfigs = [
    { show: showReserved, suffix: "普通車", values: reservedKeys },
    { show: showGreen, suffix: "グリーン車", values: greenKeys },
  ];

  return (
    <FareSection title="ぷらっとこだま" note={note}>
      <FareTableView>
        {seatConfigs.flatMap((seat) =>
          seat.show
            ? PRICE_CLASSES.filter(
                (cls) => priceClass === null || priceClass === cls,
              ).map((cls) => (
                <FareRow
                  key={`${seat.suffix}-${cls}`}
                  label={`${TRAIN_TAGS.kodama}${cls}料金 ${seat.suffix}`}
                  value={seat.values[cls]}
                  italic={isExpired}
                />
              ))
            : [],
        )}
      </FareTableView>
    </FareSection>
  );
}

export default PlatKodamaSection;
