import type { CalculatedFares, FareFilter } from "../../data/types";
import FareSection from "../FareSection";
import FareRow from "../FareRow";
import { isProductVisible } from "../../data/fareFilter";
import { getPlatKodamaValidUntil } from "../../data/calendar";

interface PlatKodamaSectionProps {
  fares: CalculatedFares;
  filter: FareFilter;
}

export default function PlatKodamaSection({
  fares,
  filter,
}: PlatKodamaSectionProps) {
  if (fares.isExcludedDate) return null;
  if (fares.platKodamaReserved == null && fares.platKodamaGreen == null)
    return null;

  const rows: { id: string; label: string; fare: number | null }[] = [];

  if (fares.platKodamaReserved != null) {
    rows.push({
      id: "plat_kodama_reserved",
      label: `${fares.platKodamaLabel} 普通車`,
      fare: fares.platKodamaReserved,
    });
  }

  if (fares.platKodamaGreen != null) {
    rows.push({
      id: "plat_kodama_green",
      label: `${fares.platKodamaLabel} グリーン車`,
      fare: fares.platKodamaGreen,
    });
  }

  const visible = rows.filter((r) => isProductVisible(r.id, filter));
  if (visible.length === 0) return null;

  const validUntil = getPlatKodamaValidUntil();
  const note = `※${validUntil.replace("-", "年").replace("-", "月")}日乗車分まで`;

  return (
    <FareSection title="ぷらっとこだま" note={note}>
      {visible.map((r) => (
        <FareRow
          key={r.id}
          label={r.label}
          fare={r.fare}
          italic={fares.platKodamaAfterValidUntil}
        />
      ))}
    </FareSection>
  );
}
