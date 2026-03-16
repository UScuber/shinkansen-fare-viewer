import type { CalculatedFares, FareFilter } from "../data/types";
import FareTableView from "./ui/FareTableView";

interface FareTableProps {
  fares: CalculatedFares | null;
  useGakuwari: boolean;
  filter: FareFilter;
  showSmartEx: boolean;
}

export default function FareTable({
  fares,
  useGakuwari,
  filter,
  showSmartEx,
}: FareTableProps) {
  return (
    <FareTableView
      fares={fares}
      useGakuwari={useGakuwari}
      filter={filter}
      showSmartEx={showSmartEx}
    />
  );
}
