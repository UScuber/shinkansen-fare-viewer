import React from "react";
import type { FareResult } from "../data/calculator";

type Props = {
  results: FareResult[];
};

function formatFare(n: number | null): string {
  if (n === null) return "—";
  return `¥${n.toLocaleString()}`;
}

const FareTable: React.FC<Props> = ({ results }) => {
  if (results.length === 0) return null;

  return (
    <div className="fare-table">
      {results.map((section, idx) => (
        <section key={idx} className="fare-section">
          <h3 className="fare-section__title">{section.section}</h3>
          <table className="fare-table__table">
            <thead>
              <tr>
                <th>項目</th>
                <th>料金</th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((item, itemIdx) => (
                <tr key={itemIdx}>
                  <td>
                    {item.label}
                    {item.note && (
                      <span className="fare-table__note"> ({item.note})</span>
                    )}
                  </td>
                  <td className="fare-table__value">
                    {formatFare(item.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
};

export default FareTable;
