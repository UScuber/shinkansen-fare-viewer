export function formatYen(value: number | null): string {
  if (value === null) return "-";
  return `${value.toLocaleString()}円`;
}
