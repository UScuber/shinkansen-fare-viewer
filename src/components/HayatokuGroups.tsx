import FareItemsTable from "./FareItemsTable";
import type { FareItem } from "../data/fareResults";

type HayatokuGroupsProps = {
  items: FareItem[];
};

const HAYATOKU_ORDER = ["早特1", "早特3", "早特7", "早特21", "ファミリー早特7"];

function HayatokuGroups({ items }: HayatokuGroupsProps) {
  const groups = HAYATOKU_ORDER.map((group) => ({
    group,
    items: items.filter((item) => item.group === group),
  })).filter((entry) => entry.items.length > 0);

  return (
    <div className="fare-subgroups">
      {groups.length > 0 && <FareItemsTable items={[]} />}
      {groups.map((entry) => (
        <div key={entry.group} className="fare-subgroup">
          <h4 className="fare-subgroup__title">{entry.group}</h4>
          <FareItemsTable items={entry.items} showHeader={false} />
        </div>
      ))}
    </div>
  );
}

export default HayatokuGroups;
