import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  showHeader?: boolean;
};

function FareTableView({ children, showHeader = true }: Props) {
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
      <tbody>{children}</tbody>
    </table>
  );
}

export default FareTableView;
