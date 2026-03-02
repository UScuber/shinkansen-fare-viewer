import { findStation } from "../data/stations";
import type {
  FreeSeatSplitResult,
  MixedSplitGroup,
  MixedSplitResult,
  SplitSearchResult,
} from "../data/splitFareSearch";

type Props = {
  result: SplitSearchResult;
};

function formatYen(value: number): string {
  return `${value.toLocaleString()}円`;
}

function stationName(id: string): string {
  return findStation(id)?.name ?? id;
}

function FreeSeatSplitSection({ split }: { split: FreeSeatSplitResult }) {
  return (
    <div className="split-result__section">
      <h3 className="split-result__section-title">
        自由席 分割最安値（通しより {formatYen(split.savings)} 安い）
      </h3>

      <div className="split-result__segment-list">
        <div className="split-result__segment-item split-result__segment-item--ticket">
          <div className="split-result__segment-route">
            乗車券（{stationName(split.expressSegments[0].fromId)} →{" "}
            {stationName(
              split.expressSegments[split.expressSegments.length - 1].toId,
            )}{" "}
            通し）
          </div>
          <div className="split-result__segment-fare">
            {formatYen(split.throughTicketFare)}
          </div>
        </div>
        {split.expressSegments.map((seg, i) => (
          <div key={i} className="split-result__segment-item">
            <div className="split-result__segment-route">
              特急券{i + 1}: {stationName(seg.fromId)} → {stationName(seg.toId)}
            </div>
            <div className="split-result__segment-detail">
              自由席特急券 {formatYen(seg.expressFare)}
            </div>
          </div>
        ))}
      </div>

      <div className="split-result__total">
        <span>合計</span>
        <span className="split-result__total-value">
          {formatYen(split.total)}
        </span>
      </div>
    </div>
  );
}

function MixedGroupItem({ group }: { group: MixedSplitGroup }) {
  if (group.type === "bundled") {
    return (
      <div className="split-result__segment-item split-result__segment-item--bundled">
        <div className="split-result__segment-route">
          {stationName(group.fromId)} → {stationName(group.toId)}
        </div>
        <div className="split-result__segment-product">{group.productName}</div>
        <div className="split-result__segment-fare">
          {formatYen(group.fare)}
        </div>
      </div>
    );
  }

  // ticket_group
  return (
    <div className="split-result__ticket-group">
      <div className="split-result__ticket-group-header">
        通常きっぷ: {stationName(group.fromId)} → {stationName(group.toId)}
      </div>
      <div className="split-result__ticket-group-items">
        <div className="split-result__ticket-group-row">
          <span>乗車券（通し）</span>
          <span>{formatYen(group.ticketFare)}</span>
        </div>
        {group.expressSegments.map((seg, i) => (
          <div key={i} className="split-result__ticket-group-row">
            <span>
              自由席特急券 {stationName(seg.fromId)} → {stationName(seg.toId)}
            </span>
            <span>{formatYen(seg.expressFare)}</span>
          </div>
        ))}
        <div className="split-result__ticket-group-row split-result__ticket-group-row--subtotal">
          <span>小計</span>
          <span>{formatYen(group.subtotal)}</span>
        </div>
      </div>
    </div>
  );
}

function MixedSplitSection({ split }: { split: MixedSplitResult }) {
  return (
    <div className="split-result__section split-result__section--mixed">
      <h3 className="split-result__section-title">
        早特混合 分割最安値（通しより {formatYen(split.savings)} 安い）
      </h3>

      <div className="split-result__segment-list">
        {split.groups.map((group, i) => (
          <MixedGroupItem key={i} group={group} />
        ))}
      </div>

      <div className="split-result__total">
        <span>合計</span>
        <span className="split-result__total-value">
          {formatYen(split.total)}
        </span>
      </div>
    </div>
  );
}

function SplitFareResult({ result }: Props) {
  const { freeSeatSplit, mixedSplit } = result;

  if (!freeSeatSplit && !mixedSplit) {
    return null;
  }

  return (
    <div className="split-result">
      {freeSeatSplit && <FreeSeatSplitSection split={freeSeatSplit} />}
      {mixedSplit && <MixedSplitSection split={mixedSplit} />}
    </div>
  );
}

export default SplitFareResult;
