import type { CalculatedFares, FareFilter } from "../../data/types";
import FareListSection from "../sections/FareListSection";

interface FareTableViewProps {
  fares: CalculatedFares | null;
  useGakuwari: boolean;
  filter: FareFilter;
  showSmartEx: boolean;
  error?: string | null;
}

export default function FareTableView({
  fares,
  useGakuwari,
  filter,
  showSmartEx,
  error,
}: FareTableViewProps) {
  if (error) {
    return <div className="p-5 text-center text-sm text-red-500">{error}</div>;
  }
  if (!fares) {
    return (
      <div className="p-5 text-center text-sm text-red-500">
        区間のデータが見つかりません
      </div>
    );
  }

  return (
    <FareListSection
      fares={fares}
      useGakuwari={useGakuwari}
      filter={filter}
      showSmartEx={showSmartEx}
    />
  );
}
