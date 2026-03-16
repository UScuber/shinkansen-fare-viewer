import type { CalculatedFares, FareFilter } from "../../data/types";
import FareSection from "../FareSection";
import FareRow from "../FareRow";
import TrainLabel from "../TrainLabel";
import { isProductVisible } from "../../data/fareFilter";

interface SmartExSectionProps {
  fares: CalculatedFares;
  filter: FareFilter;
}

export default function SmartExSection({ fares, filter }: SmartExSectionProps) {
  const rows: { id: string; label: React.ReactNode; fare: number | null }[] =
    [];

  if (fares.smartexReservedNozomi != null) {
    rows.push({
      id: "smartex_reserved_nozomi",
      label: (
        <TrainLabel trainTypes={["nozomi", "mizuho"]} suffix="普通車指定席" />
      ),
      fare: fares.smartexReservedNozomi,
    });
  }

  if (fares.smartexReserved != null) {
    rows.push({
      id: "smartex_reserved",
      label: (
        <TrainLabel
          trainTypes={["hikari", "kodama", "sakura", "tsubame"]}
          suffix="普通車指定席"
        />
      ),
      fare: fares.smartexReserved,
    });
  }

  if (fares.smartexGreenNozomi != null) {
    rows.push({
      id: "smartex_green_nozomi",
      label: (
        <TrainLabel trainTypes={["nozomi", "mizuho"]} suffix="グリーン車" />
      ),
      fare: fares.smartexGreenNozomi,
    });
  }

  if (fares.smartexGreen != null) {
    rows.push({
      id: "smartex_green",
      label: (
        <TrainLabel
          trainTypes={["hikari", "kodama", "sakura", "tsubame"]}
          suffix="グリーン車"
        />
      ),
      fare: fares.smartexGreen,
    });
  }

  if (fares.smartexFree != null) {
    rows.push({
      id: "smartex_free",
      label: "自由席",
      fare: fares.smartexFree,
    });
  }

  const visible = rows.filter((r) => isProductVisible(r.id, filter));
  if (visible.length === 0) return null;

  return (
    <FareSection title="スマートEXサービス">
      {visible.map((r) => (
        <FareRow key={r.id} label={r.label} fare={r.fare} />
      ))}
    </FareSection>
  );
}
