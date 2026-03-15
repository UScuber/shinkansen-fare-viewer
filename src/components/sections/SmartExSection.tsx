import FareListSection, { type FareRowDef } from "./FareListSection";
import { NOZOMI_MIZUHO, NON_NOZOMI_MIZUHO } from "../ui/trainLabels";
import type { CalculatedFares } from "../../data/calculator";
import type { FareFilter } from "../../data/types";

type Props = {
  fares: CalculatedFares;
  filter?: FareFilter | null;
};

function SmartExSection({ fares, filter }: Props) {
  const rows: FareRowDef[] = [
    {
      label: `${NOZOMI_MIZUHO}普通車`,
      value: fares.smartexNozomiMizuhoReserved,
      productId: "smartexNozomiMizuhoReserved",
      extraCheck: fares.smartexNozomiMizuhoReserved !== null,
    },
    {
      label: `${NON_NOZOMI_MIZUHO}普通車`,
      value: fares.smartexOtherReserved,
      productId: "smartexOtherReserved",
    },
    {
      label: `${NOZOMI_MIZUHO}グリーン車`,
      value: fares.smartexNozomiMizuhoGreen,
      productId: "smartexNozomiMizuhoGreen",
      extraCheck: fares.smartexNozomiMizuhoGreen !== null,
    },
    {
      label: `${NON_NOZOMI_MIZUHO}グリーン車`,
      value: fares.smartexOtherGreen,
      productId: "smartexOtherGreen",
    },
    {
      label: "自由席",
      value: fares.smartexFree,
      productId: "smartexFree",
    },
  ];

  return (
    <FareListSection title="スマートEXサービス" rows={rows} filter={filter} />
  );
}

export default SmartExSection;
