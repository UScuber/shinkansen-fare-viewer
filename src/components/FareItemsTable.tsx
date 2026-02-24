import React from "react";
import TrainLabel from "./TrainLabel";
import type { FareItem } from "../data/fareResults";

type FareItemsTableProps = {
  items: FareItem[];
};

function formatFare(n: number | null, unit?: string): string {
  if (n === null) return "-";
  if (unit === "km") return `${n} km`;
  return `¥${n.toLocaleString()}`;
}

const FareItemsTable: React.FC<FareItemsTableProps> = ({ items }) => {
  return (
    <table className="fare-table__table">
      <thead>
        <tr>
          <th>項目</th>
          <th>料金</th>
        </tr>
      </thead>
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
              {formatFare(item.value, item.note === "km" ? "km" : undefined)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FareItemsTable;
