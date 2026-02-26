import TrainLabel from "./TrainLabel";

type Props = {
  label: string;
  value: number | null;
  note?: string;
  italic?: boolean;
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

function FareRow({ label, value, note, italic }: Props) {
  return (
    <tr>
      <td>
        <TrainLabel label={label} />
        {note && note !== "km" && (
          <span className="fare-table__note"> ({note})</span>
        )}
      </td>
      <td className="fare-table__value">
        {formatFare(value, note === "km" ? "km" : undefined, italic)}
      </td>
    </tr>
  );
}

export default FareRow;
