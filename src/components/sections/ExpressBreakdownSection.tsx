import FareSection from "../FareSection";
import type { CalculatedFares } from "../../data/calculator";

type Props = {
  fares: CalculatedFares;
};

function formatYen(n: number): string {
  return `${n.toLocaleString()}円`;
}

function formatDiff(n: number): string {
  if (n > 0) return `+${n.toLocaleString()}円`;
  if (n < 0) return `${n.toLocaleString()}円`;
  return "0円";
}

function getSeasonLabel(diff: number): string {
  if (diff >= 400) return "最繁忙期";
  if (diff >= 200) return "繁忙期";
  if (diff <= -200) return "閑散期";
  return "通常期";
}

function ExpressBreakdownSection({ fares }: Props) {
  const base = fares.hikariReservedBase;
  if (base === null) return null;

  const seasonalDiff = fares.seasonalDiff;
  const nozomiAdd = fares.nozomiAdditional;
  const greenCharge = fares.greenCharge;
  const seasonLabel = getSeasonLabel(seasonalDiff);

  // 自由席 = 指定席特急料金（通常期） − 530円
  const freeFare = base - 530;

  // グリーン車 = 指定席特急料金（通常期） − 530円 + グリーン料金
  const greenFare = greenCharge !== null ? base - 530 + greenCharge : null;

  return (
    <FareSection title="特急料金の内訳">
      <table className="fare-table__table">
        <thead>
          <tr>
            <th>項目</th>
            <th>料金</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>指定席特急料金（通常期）</td>
            <td className="fare-table__value">{formatYen(base)}</td>
          </tr>
          {nozomiAdd !== null && (
            <tr>
              <td>のぞみ/みずほ加算</td>
              <td className="fare-table__value">
                +{nozomiAdd.toLocaleString()}円
              </td>
            </tr>
          )}
          {seasonalDiff !== 0 && (
            <tr>
              <td>
                季節加算
                <span className="fare-table__note">（{seasonLabel}）</span>
              </td>
              <td className="fare-table__value">{formatDiff(seasonalDiff)}</td>
            </tr>
          )}
          {seasonalDiff === 0 && (
            <tr>
              <td>
                季節加算
                <span className="fare-table__note">（{seasonLabel}）</span>
              </td>
              <td className="fare-table__value">±0円</td>
            </tr>
          )}
          <tr>
            <td>
              自由席
              <span className="fare-table__note">
                （指定席特急料金 − 530円）
              </span>
            </td>
            <td className="fare-table__value">{formatYen(freeFare)}</td>
          </tr>
          {greenFare !== null && (
            <tr>
              <td>
                グリーン車
                <span className="fare-table__note">
                  （指定席特急料金 − 530円 + グリーン料金{" "}
                  {formatYen(greenCharge!)})
                </span>
              </td>
              <td className="fare-table__value">{formatYen(greenFare)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </FareSection>
  );
}

export default ExpressBreakdownSection;
