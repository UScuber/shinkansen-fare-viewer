import FareSection from "../FareSection";
import TrainLabel from "../TrainLabel";
import { formatYen } from "../ui/format";
import { NOZOMI_MIZUHO, NON_NOZOMI_MIZUHO } from "../ui/trainLabels";
import type { CalculatedFares } from "../../data/calculator";
import type { FareFilter } from "../../data/types";
import { isProductVisible, type ProductId } from "../../data/fareFilter";

type Props = {
  fares: CalculatedFares;
  useGakuwari: boolean;
  filter?: FareFilter | null;
};

function NormalTicketTotalSection({ fares, useGakuwari, filter }: Props) {
  const ticketFare = useGakuwari ? fares.studentFare : fares.ticketFare;

  if (ticketFare === null) return null;

  const nozomiMizuho = NOZOMI_MIZUHO;
  const nonNozomiMizuho = NON_NOZOMI_MIZUHO;

  const f = filter ?? null;

  type TotalRow = {
    key: string;
    label: string;
    expressFare: number | null;
    productId: ProductId;
    extraCheck?: boolean;
  };

  const rows: TotalRow[] = [
    {
      key: "free",
      label: "自由席",
      expressFare: fares.expressFree,
      productId: "expressFree",
    },
    {
      key: "otherReserved",
      label: `${nonNozomiMizuho}指定席`,
      expressFare: fares.expressOtherReserved,
      productId: "expressOtherReserved",
    },
    {
      key: "nozomiReserved",
      label: `${nozomiMizuho}指定席`,
      expressFare: fares.expressNozomiMizuhoReserved,
      productId: "expressNozomiMizuhoReserved",
      extraCheck: fares.expressNozomiMizuhoReserved !== null,
    },
    {
      key: "otherGreen",
      label: `${nonNozomiMizuho}グリーン車`,
      expressFare: fares.expressOtherGreen,
      productId: "expressOtherGreen",
    },
    {
      key: "nozomiGreen",
      label: `${nozomiMizuho}グリーン車`,
      expressFare: fares.expressNozomiMizuhoGreen,
      productId: "expressNozomiMizuhoGreen",
      extraCheck: fares.expressNozomiMizuhoGreen !== null,
    },
  ];

  const visibleRows = rows.filter(
    (r) =>
      r.expressFare !== null &&
      (r.extraCheck === undefined || r.extraCheck) &&
      isProductVisible(r.productId, f),
  );

  if (visibleRows.length === 0) return null;

  return (
    <FareSection title="通常きっぷ 合計（乗車券＋特急券）">
      <div className="normal-total">
        {visibleRows.map((row) => {
          const total =
            row.expressFare !== null ? ticketFare + row.expressFare : null;
          return (
            <div key={row.key} className="normal-total__item">
              <div className="normal-total__label">
                【<TrainLabel label={row.label} />】
              </div>
              <div className="normal-total__calc">
                <span className="normal-total__breakdown">
                  乗車券 {formatYen(ticketFare)}
                  {useGakuwari && (
                    <span className="normal-total__gakuwari-badge">学割</span>
                  )}
                  {" + "}
                  {row.key === "free"
                    ? "自由席特急券"
                    : row.key.includes("Green")
                      ? "グリーン車特急券"
                      : "指定席特急券"}{" "}
                  {formatYen(row.expressFare)}
                </span>
                <span className="normal-total__total">{formatYen(total)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </FareSection>
  );
}

export default NormalTicketTotalSection;
