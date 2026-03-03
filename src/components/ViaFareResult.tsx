import React from "react";
import { findStation, isNozomiMizuho } from "../data/stations";
import type {
  ViaFareResult as ViaFareResultType,
  ThroughFareResult,
  SideBreakdown,
  CheapestCombinationResult,
  JourneySegment,
} from "../data/types";

type Props = {
  result: ViaFareResultType;
  useGakuwari: boolean;
  segments: JourneySegment[];
};

function formatYen(value: number | null): string {
  if (value === null) return "-";
  return `${value.toLocaleString()}円`;
}

function stationName(id: string): string {
  return findStation(id)?.name ?? id;
}

/**
 * 指定された列車にのぞみ/みずほが含まれているか判定
 */
function hasNozomiMizuhoInSegments(segments: JourneySegment[]): boolean {
  return segments.some(
    (s) => isNozomiMizuho(s.trainType) && s.seatType !== "free",
  );
}

function ThroughSection({
  through,
  useGakuwari,
  segments,
}: {
  through: ThroughFareResult;
  useGakuwari: boolean;
  segments: JourneySegment[];
}) {
  const { breakdown } = through;
  const ticketFare = useGakuwari ? through.studentFare : through.ticketFare;

  // 列車が指定されているので、のぞみ/みずほを使うかどうかで適切な特急料金を選択
  const usesNozomi = hasNozomiMizuhoInSegments(segments);
  const expressFare =
    usesNozomi && through.expressFareNozomi !== null
      ? through.expressFareNozomi
      : through.expressFareOther;

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
              <td>
                {useGakuwari ? "学割運賃" : "乗車券運賃"}
                {useGakuwari && !through.studentFareApplicable && (
                  <span className="via-result__note">
                    （101km未満のため通常運賃と同額）
                  </span>
                )}
              </td>
              <td>{formatYen(ticketFare)}</td>
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
            <tr>
              <td>特急料金</td>
              <td className="via-result__total-value">
                {formatYen(expressFare)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 合計 */}
      <div className="via-result__total-section">
        <div className="via-result__grand-total">
          <span>合計</span>
          <span className="via-result__grand-total-value">
            {formatYen(ticketFare + expressFare)}
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
              {seg.ticketFare !== undefined &&
                seg.expressFare !== undefined && (
                  <span className="via-result__note">
                    乗車券 {formatYen(seg.ticketFare)} + 特急券{" "}
                    {formatYen(seg.expressFare)}
                  </span>
                )}
              <span className="via-result__fare-value">
                {formatYen(seg.fare)}
              </span>
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

const ViaFareResult: React.FC<Props> = ({ result, useGakuwari, segments }) => {
  return (
    <div className="via-result">
      <ThroughSection
        through={result.through}
        useGakuwari={useGakuwari}
        segments={segments}
      />
      {result.cheapest && <CheapestSection cheapest={result.cheapest} />}
    </div>
  );
};

export default ViaFareResult;
