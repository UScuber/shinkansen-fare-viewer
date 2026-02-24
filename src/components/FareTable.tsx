import HayatokuGroups from "./HayatokuGroups";
import FareItemsTable from "./FareItemsTable";
import type { FareResult } from "../data/fareResults";

type Props = {
  results: FareResult[];
};

function FareTable({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="fare-table">
      {results.map((section, idx) => (
        <section key={idx} className="fare-section">
          <h3 className="fare-section__title">{section.section}</h3>
          {section.section === "EX早特" ? (
            <HayatokuGroups items={section.items} />
          ) : (
            <FareItemsTable items={section.items} />
          )}
        </section>
      ))}
    </div>
  );
}

export default FareTable;
