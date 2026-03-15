import FareListSection, { type FareRowDef } from "./FareListSection";
import { NOZOMI_MIZUHO, NON_NOZOMI_MIZUHO } from "../ui/trainLabels";
import type { CalculatedFares } from "../../data/calculator";
import type { FareFilter } from "../../data/types";

type Props = {
  fares: CalculatedFares;
  filter?: FareFilter | null;
};

function ExpressSection({ fares, filter }: Props) {
  const rows: FareRowDef[] = [
    {
      label: `${NOZOMI_MIZUHO}普通車`,
      value: fares.expressNozomiMizuhoReserved,
      productId: "expressNozomiMizuhoReserved",
      extraCheck: fares.expressNozomiMizuhoReserved !== null,
    },
    {
      label: `${NON_NOZOMI_MIZUHO}普通車`,
      value: fares.expressOtherReserved,
      productId: "expressOtherReserved",
    },
    {
      label: `${NOZOMI_MIZUHO}グリーン車`,
      value: fares.expressNozomiMizuhoGreen,
      productId: "expressNozomiMizuhoGreen",
      extraCheck: fares.expressNozomiMizuhoGreen !== null,
    },
    {
      label: `${NON_NOZOMI_MIZUHO}グリーン車`,
      value: fares.expressOtherGreen,
      productId: "expressOtherGreen",
    },
    {
      label: "自由席",
      value: fares.expressFree,
      productId: "expressFree",
    },
  ];

  return <FareListSection title="特急券" rows={rows} filter={filter} />;
}

export default ExpressSection;
