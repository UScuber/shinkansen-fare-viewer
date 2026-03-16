import type { CalculatedFares, FareFilter } from "../../data/types";
import FareSection from "../FareSection";
import TrainLabel from "../TrainLabel";
import { formatYen } from "../ui/format";
import { isProductVisible } from "../../data/fareFilter";

interface NormalTicketTotalSectionProps {
  fares: CalculatedFares;
  useGakuwari: boolean;
  filter: FareFilter;
}

interface TotalRow {
  productId: string;
  label: React.ReactNode;
  ticketFare: number;
  expressFare: number;
}

export default function NormalTicketTotalSection({
  fares,
  useGakuwari,
  filter,
}: NormalTicketTotalSectionProps) {
  const ticket = useGakuwari ? fares.gakuwariTicketFare : fares.ticketFare;

  const rows: TotalRow[] = [
    {
      productId: "total_free",
      label: "自由席",
      ticketFare: ticket,
      expressFare: fares.free,
    },
    {
      productId: "total_hikari_reserved",
      label: (
        <TrainLabel
          trainTypes={["hikari", "kodama", "sakura", "tsubame"]}
          suffix="指定席"
        />
      ),
      ticketFare: ticket,
      expressFare: fares.hikariReserved,
    },
  ];

  if (fares.nozomiReserved != null) {
    rows.push({
      productId: "total_nozomi_reserved",
      label: <TrainLabel trainTypes={["nozomi", "mizuho"]} suffix="指定席" />,
      ticketFare: ticket,
      expressFare: fares.nozomiReserved,
    });
  }

  rows.push({
    productId: "total_hikari_green",
    label: (
      <TrainLabel
        trainTypes={["hikari", "kodama", "sakura", "tsubame"]}
        suffix="グリーン車"
      />
    ),
    ticketFare: ticket,
    expressFare: fares.hikariGreen,
  });

  if (fares.nozomiGreen != null) {
    rows.push({
      productId: "total_nozomi_green",
      label: (
        <TrainLabel trainTypes={["nozomi", "mizuho"]} suffix="グリーン車" />
      ),
      ticketFare: ticket,
      expressFare: fares.nozomiGreen,
    });
  }

  const visibleRows = rows.filter((r) => isProductVisible(r.productId, filter));
  if (visibleRows.length === 0) return null;

  return (
    <FareSection title="通常きっぷ 合計（乗車券＋特急券）">
      {visibleRows.map((row) => {
        const total = row.ticketFare + row.expressFare;
        return (
          <div
            key={row.productId}
            className="border-b border-gray-100 py-2 last:border-b-0"
          >
            <div className="mb-1 text-sm text-gray-600">{row.label}</div>
            <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-gray-400">
                {useGakuwari ? "乗車券(学割) " : "乗車券 "}
                {formatYen(row.ticketFare)} + 特急券{" "}
                {formatYen(row.expressFare)}
              </span>
              <span className="whitespace-nowrap font-mono text-sm font-bold text-indigo-900">
                {formatYen(total)}
              </span>
            </div>
          </div>
        );
      })}
    </FareSection>
  );
}
