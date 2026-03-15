import FareSection from "../FareSection";
import FareRow from "../FareRow";
import FareTableView from "../ui/FareTableView";
import type { FareFilter } from "../../data/types";
import { isProductVisible, type ProductId } from "../../data/fareFilter";

export type FareRowDef = {
  label: string;
  value: number | null;
  productId: ProductId;
  extraCheck?: boolean;
};

type Props = {
  title: string;
  rows: FareRowDef[];
  filter?: FareFilter | null;
};

function FareListSection({ title, rows, filter }: Props) {
  const f = filter ?? null;
  const visible = rows.filter(
    (r) =>
      r.value !== null &&
      (r.extraCheck === undefined || r.extraCheck) &&
      isProductVisible(r.productId, f),
  );
  if (visible.length === 0) return null;

  return (
    <FareSection title={title}>
      <FareTableView>
        {visible.map((r) => (
          <FareRow key={r.productId} label={r.label} value={r.value} />
        ))}
      </FareTableView>
    </FareSection>
  );
}

export default FareListSection;
