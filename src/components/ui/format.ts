/** 金額をフォーマット（3桁区切り + 円） */
export function formatYen(amount: number | null): string {
  if (amount == null) return "-";
  return `${amount.toLocaleString()}円`;
}

/** 距離をフォーマット */
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}
