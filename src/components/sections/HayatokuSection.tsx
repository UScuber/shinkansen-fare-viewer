import type { CalculatedFares, FareFilter } from "../../data/types";
import FareSection from "../FareSection";
import FareRow from "../FareRow";
import TrainLabel from "../TrainLabel";
import { isProductVisible } from "../../data/fareFilter";

interface HayatokuSectionProps {
  fares: CalculatedFares;
  filter: FareFilter;
}

export default function HayatokuSection({
  fares,
  filter,
}: HayatokuSectionProps) {
  if (fares.isExcludedDate) return null;

  const groups: {
    title: string;
    rows: { id: string; label: React.ReactNode; fare: number | null }[];
  }[] = [
    {
      title: "早特1",
      rows: [
        {
          id: "hayatoku1",
          label: "自由席",
          fare: fares.hayatoku1,
        },
      ],
    },
    {
      title: "早特3",
      rows: [
        {
          id: "hayatoku3_nozomi_green",
          label: (
            <TrainLabel
              trainTypes={["nozomi", "mizuho", "sakura", "tsubame"]}
              suffix="グリーン車"
            />
          ),
          fare: fares.hayatoku3NozomiGreen,
        },
        {
          id: "hayatoku3_hikari_green",
          label: <TrainLabel trainTypes={["hikari"]} suffix="グリーン車" />,
          fare: fares.hayatoku3HikariGreen,
        },
        {
          id: "hayatoku3_kodama_green",
          label: <TrainLabel trainTypes={["kodama"]} suffix="グリーン車" />,
          fare: fares.hayatoku3KodamaGreen,
        },
      ],
    },
    {
      title: "早特7",
      rows: [
        {
          id: "hayatoku7_nozomi_reserved",
          label: (
            <TrainLabel
              trainTypes={["nozomi", "mizuho", "sakura", "tsubame"]}
              suffix="普通車指定席"
            />
          ),
          fare: fares.hayatoku7NozomiReserved,
        },
        {
          id: "hayatoku7_hikari_reserved",
          label: (
            <TrainLabel
              trainTypes={["hikari", "kodama"]}
              suffix="普通車指定席"
            />
          ),
          fare: fares.hayatoku7HikariReserved,
        },
      ],
    },
    {
      title: "早特21",
      rows: [
        {
          id: "hayatoku21_nozomi_reserved",
          label: (
            <TrainLabel
              trainTypes={["nozomi", "mizuho", "sakura", "tsubame"]}
              suffix="普通車指定席"
            />
          ),
          fare: fares.hayatoku21NozomiReserved,
        },
      ],
    },
    {
      title: "ファミリー早特7",
      rows: [
        {
          id: "family_hayatoku7_hikari_reserved",
          label: (
            <TrainLabel
              trainTypes={["hikari", "kodama"]}
              suffix="普通車指定席"
            />
          ),
          fare: fares.familyHayatoku7HikariReserved,
        },
      ],
    },
  ];

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      rows: g.rows.filter(
        (r) => r.fare != null && isProductVisible(r.id, filter),
      ),
    }))
    .filter((g) => g.rows.length > 0);

  if (visibleGroups.length === 0) return null;

  return (
    <FareSection title="EX早特">
      {visibleGroups.map((group) => (
        <div key={group.title} className="mb-2">
          <div className="mb-0.5 border-b border-indigo-100 py-1 text-xs font-bold text-indigo-900">
            {group.title}
          </div>
          {group.rows.map((r) => (
            <FareRow key={r.id} label={r.label} fare={r.fare} />
          ))}
        </div>
      ))}
    </FareSection>
  );
}
