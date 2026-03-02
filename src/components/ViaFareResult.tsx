import React from "react";
import { findStation } from "../data/stations";
import type {
  ViaFareResult as ViaFareResultType,
  ThroughFareResult,
  SideBreakdown,
  CheapestCombinationResult,
} from "../data/types";

type Props = {
  result: ViaFareResultType;
};

function formatYen(value: number | null): string {
  if (value === null) return "-";
  return `${value.toLocaleString()}円`;
}

function stationName(id: string): string {
  return findStation(id)?.name ?? id;
}

function ThroughSection({ through }: { through: ThroughFareResult }) {
  const { breakdown } = through;

  return (
    <div className="via-result__section">
      <h3 className="via-result__section-title">通し計算</h3>

      {/* 乗車券 */}
      <div className="via-result__subsection">
        <h4 className="via-result__subsection-title">乗車券（通し）</h4>
        <table className="via-result__table">
          <tbody>
            <tr>
              <td>距離</td>
              <td>{through.distance} km</td>
            </tr>
            <tr>
              <td>乗車券運賃</td>
              <td>{formatYen(through.ticketFare)}</td>
            </tr>
            <tr>
              <td>学割運賃</td>
              <td>
                {formatYen(through.studentFare)}
                {!through.studentFareApplicable && (
                  <span className="via-result__note">
                    （101km未満のため通常運賃と同額）
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 特急券 */}
      <div className="via-result__subsection">
        <h4 className="via-result__subsection-title">特急券（通し）</h4>

        {breakdown.sides.map((side, i) => (
          <SideDetail
            key={i}
            side={side}
            sideIndex={i}
            totalSides={breakdown.sides.length}
            isLevel1={breakdown.hakataLevel1Split}
          />
        ))}

        {/* 合計特急料金 */}
        <table className="via-result__table via-result__table--total">
          <tbody>
            {through.expressFareNozomi !== null && (
              <tr>
                <td>のぞみ/みずほ利用時 特急料金</td>
                <td className="via-result__total-value">
                  {formatYen(through.expressFareNozomi)}
                </td>
              </tr>
            )}
            <tr>
              <td>
                {through.expressFareNozomi !== null
                  ? "のぞみ/みずほ以外 特急料金"
                  : "特急料金"}
              </td>
              <td className="via-result__total-value">
                {formatYen(through.expressFareOther)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 合計 */}
      <div className="via-result__total-section">
        {through.expressFareNozomi !== null && (
          <div className="via-result__grand-total">
            <span>合計（のぞみ/みずほ利用時）</span>
            <span className="via-result__grand-total-value">
              {formatYen(through.ticketFare + through.expressFareNozomi)}
            </span>
          </div>
        )}
        <div className="via-result__grand-total">
          <span>
            {through.expressFareNozomi !== null
              ? "合計（のぞみ/みずほ以外）"
              : "合計"}
          </span>
          <span className="via-result__grand-total-value">
            {formatYen(through.ticketFare + through.expressFareOther)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SideDetail({
  side,
  sideIndex,
  totalSides,
  isLevel1,
}: {
  side: SideBreakdown;
  sideIndex: number;
  totalSides: number;
  isLevel1: boolean;
}) {
  const sideLabel = isLevel1
    ? sideIndex === 0
      ? "【東海道・山陽側】"
      : "【九州側】"
    : "";

  return (
    <div className="via-result__side">
      {totalSides > 1 && (
        <h5 className="via-result__side-title">
          {sideLabel}
          {stationName(side.fromId)} → {stationName(side.toId)}
        </h5>
      )}

      <table className="via-result__table">
        <tbody>
          {side.allFree ? (
            <tr>
              <td>自由席特急料金</td>
              <td>{formatYen(side.baseFare)}</td>
            </tr>
          ) : (
            <>
              <tr>
                <td>ベース（指定席特急料金）</td>
                <td>{formatYen(side.baseFare)}</td>
              </tr>
              {side.greenAdjustment !== 0 && (
                <tr>
                  <td>グリーン料金調整</td>
                  <td>
                    {side.greenAdjustment > 0 ? "+" : ""}
                    {formatYen(side.greenAdjustment)}
                  </td>
                </tr>
              )}
              {side.seasonalDiff !== 0 && (
                <tr>
                  <td>季節加算</td>
                  <td>
                    {side.seasonalDiff > 0 ? "+" : ""}
                    {formatYen(side.seasonalDiff)}
                  </td>
                </tr>
              )}
              {side.nozomiSurcharge > 0 && (
                <tr>
                  <td>
                    のぞみ/みずほ加算
                    {side.nozomiMethod && (
                      <span className="via-result__note">
                        {side.nozomiMethod === "individual_sum"
                          ? "（個別合算）"
                          : "（通し）"}
                        {side.nozomiIndividualSum !== null &&
                          side.nozomiThroughValue !== null && (
                            <>
                              {" "}
                              個別{formatYen(side.nozomiIndividualSum)} vs 通し
                              {formatYen(side.nozomiThroughValue)}
                            </>
                          )}
                      </span>
                    )}
                  </td>
                  <td>+{formatYen(side.nozomiSurcharge)}</td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>

      {/* 区間詳細 */}
      {side.segments.length > 1 && (
        <div className="via-result__segment-details">
          {side.segments.map((seg, j) => (
            <span key={j} className="via-result__segment-chip">
              {stationName(seg.fromId)}→{stationName(seg.toId)}
              {seg.seatType === "green"
                ? " グリーン"
                : seg.seatType === "free"
                  ? " 自由席"
                  : " 指定席"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CheapestSection({
  cheapest,
}: {
  cheapest: CheapestCombinationResult;
}) {
  return (
    <div className="via-result__section via-result__section--cheapest">
      <h3 className="via-result__section-title">
        最安の組み合わせ（通しより{formatYen(cheapest.savings)}安い）
      </h3>

      <div className="via-result__cheapest-list">
        {cheapest.segments.map((seg, i) => (
          <div key={i} className="via-result__cheapest-item">
            <div className="via-result__cheapest-route">
              区間{i + 1}: {stationName(seg.fromId)} → {stationName(seg.toId)}
            </div>
            <div className="via-result__cheapest-product">
              {seg.productName}
            </div>
            <div className="via-result__cheapest-fare">
              {formatYen(seg.fare)}
              {seg.ticketFare !== undefined &&
                seg.expressFare !== undefined && (
                  <span className="via-result__note">
                    （乗車券 {formatYen(seg.ticketFare)} + 特急券{" "}
                    {formatYen(seg.expressFare)}）
                  </span>
                )}
            </div>
          </div>
        ))}
      </div>

      <div className="via-result__grand-total via-result__grand-total--cheapest">
        <span>合計</span>
        <span className="via-result__grand-total-value">
          {formatYen(cheapest.total)}
        </span>
      </div>
    </div>
  );
}

const ViaFareResult: React.FC<Props> = ({ result }) => {
  return (
    <div className="via-result">
      <ThroughSection through={result.through} />
      {result.cheapest && <CheapestSection cheapest={result.cheapest} />}
    </div>
  );
};

export default ViaFareResult;
