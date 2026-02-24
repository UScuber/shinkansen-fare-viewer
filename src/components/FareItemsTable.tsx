import TrainLabel from "./TrainLabel";
import type { FareItem } from "../data/fareResults";

type FareItemsTableProps = {
  items: FareItem[];
  showHeader?: boolean;
};

function formatFare(
  n: number | null,
  unit?: string,
  withAsterisk?: boolean,
): string {
  if (n === null) return "-";
  if (unit === "km") return `${n.toFixed(1)}km`;
  const formatted = `${n.toLocaleString()}円`;
  return withAsterisk ? `*${formatted}` : formatted;
}

function FareItemsTable({ items, showHeader = true }: FareItemsTableProps) {
  return (
    <table className="fare-table__table">
      {showHeader && (
        <thead>
          <tr>
            <th>項目</th>
            <th>料金</th>
          </tr>
        </thead>
      )}
      <tbody>
        {items.map((item, itemIdx) => (
          <tr key={itemIdx}>
            <td>
              <TrainLabel label={item.label} />
              {item.note && item.note !== "km" && (
                <span className="fare-table__note"> ({item.note})</span>
              )}
            </td>
            <td className="fare-table__value">
              {formatFare(
                item.value,
                item.note === "km" ? "km" : undefined,
                item.italic,
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default FareItemsTable;
