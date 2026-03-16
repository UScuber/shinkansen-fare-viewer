import type { CalculatedFares, FareFilter } from "../../data/types";
import FareSection from "../FareSection";
import FareRow from "../FareRow";
import TrainLabel from "../TrainLabel";
import { isProductVisible } from "../../data/fareFilter";

interface ExpressSectionProps {
  fares: CalculatedFares;
  filter: FareFilter;
}

export default function ExpressSection({ fares, filter }: ExpressSectionProps) {
  const rows: { id: string; label: React.ReactNode; fare: number | null }[] =
    [];

  if (fares.nozomiReserved != null) {
    rows.push({
      id: "express_nozomi_reserved",
      label: (
        <TrainLabel trainTypes={["nozomi", "mizuho"]} suffix="普通車指定席" />
      ),
      fare: fares.nozomiReserved,
    });
  }

  rows.push({
    id: "express_hikari_reserved",
    label: (
      <TrainLabel
        trainTypes={["hikari", "kodama", "sakura", "tsubame"]}
        suffix="普通車指定席"
      />
    ),
    fare: fares.hikariReserved,
  });

  if (fares.nozomiGreen != null) {
    rows.push({
      id: "express_nozomi_green",
      label: (
        <TrainLabel trainTypes={["nozomi", "mizuho"]} suffix="グリーン車" />
      ),
      fare: fares.nozomiGreen,
    });
  }

  rows.push({
    id: "express_hikari_green",
    label: (
      <TrainLabel
        trainTypes={["hikari", "kodama", "sakura", "tsubame"]}
        suffix="グリーン車"
      />
    ),
    fare: fares.hikariGreen,
  });

  rows.push({
    id: "express_free",
    label: "自由席",
    fare: fares.free,
  });

  const visible = rows.filter((r) => isProductVisible(r.id, filter));
  if (visible.length === 0) return null;

  return (
    <FareSection title="特急券">
      {visible.map((r) => (
        <FareRow key={r.id} label={r.label} fare={r.fare} />
      ))}
    </FareSection>
  );
}
