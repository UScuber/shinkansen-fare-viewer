import { stationName } from "../../data/Route";
import { Route } from "../../data/Route";
import { doesTrainStopAt } from "../../data/stations";
import type { Station } from "../../data/stations";
import type { TrainType, SegmentConfig } from "../../data/types";

const TRAIN_NAMES: Record<TrainType, string> = {
  nozomi: "のぞみ",
  hikari: "ひかり",
  kodama: "こだま",
  mizuho: "みずほ",
  sakura: "さくら",
  tsubame: "つばめ",
};

type Props = {
  seg: { fromId: string; toId: string };
  index: number;
  config: SegmentConfig;
  isFilterMode: boolean;
  onSeatChange: (index: number, value: string) => void;
  onTrainChange: (index: number, trainType: TrainType | null) => void;
  viaAfter?: {
    viaIndex: number;
    viaStationId: string;
    viaCandidates: Station[];
    allViaStations: string[];
    onViaChange: (index: number, stationId: string) => void;
    onViaRemove: (index: number) => void;
    renderGroupedOptions: (
      candidates: Station[],
      selectedVias: string[],
      currentViaId: string,
    ) => React.ReactNode;
  };
};

function SegmentConfigRow({
  seg,
  index,
  config,
  isFilterMode,
  onSeatChange,
  onTrainChange,
  viaAfter,
}: Props) {
  const fromName = stationName(seg.fromId);
  const toName = stationName(seg.toId);
  const availableTrains = new Route(seg.fromId, seg.toId)
    .availableTrainsFiltered;
  const isFree = config.seatType === "free";
  const trainNotSelected =
    !isFilterMode && !isFree && config.trainType === null;
  const trainStopError =
    !isFree &&
    config.trainType !== null &&
    (!doesTrainStopAt(config.trainType, seg.fromId) ||
      !doesTrainStopAt(config.trainType, seg.toId));

  return (
    <>
      <div className="segment-config">
        <div className="segment-config__label">
          {isFilterMode
            ? `区間: ${fromName} → ${toName}`
            : `区間${index + 1}: ${fromName} → ${toName}`}
        </div>
        <div className="segment-config__controls">
          <div className="segment-config__seat">
            <label className="form-label--small">座席</label>
            <select
              className="form-select--small"
              value={config.seatType ?? ""}
              onChange={(e) => onSeatChange(index, e.target.value)}
            >
              {isFilterMode && <option value="">-- 未選択 --</option>}
              <option value="reserved">指定席</option>
              <option value="green">グリーン車</option>
              <option value="free">自由席</option>
            </select>
          </div>
          <div className="segment-config__train">
            <label className="form-label--small">列車</label>
            <select
              className={`form-select--small${trainStopError ? " form-select--error" : ""}${trainNotSelected ? " form-select--placeholder" : ""}`}
              value={config.trainType ?? ""}
              onChange={(e) =>
                onTrainChange(
                  index,
                  e.target.value === "" ? null : (e.target.value as TrainType),
                )
              }
              disabled={isFree}
            >
              {isFilterMode ? (
                <option value="">-- 未選択 --</option>
              ) : (
                <option value="" disabled hidden>
                  列車を選択
                </option>
              )}
              {trainStopError && config.trainType && (
                <option value={config.trainType} disabled>
                  {TRAIN_NAMES[config.trainType]}
                </option>
              )}
              {availableTrains.map((t) => (
                <option key={t} value={t}>
                  {TRAIN_NAMES[t]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {trainStopError && (
          <p className="segment-config__stop-error">
            「{TRAIN_NAMES[config.trainType!]}」は{fromName}または{toName}
            に停車しません。
          </p>
        )}
      </div>

      {viaAfter && (
        <div className="via-station-row via-station-row--between">
          <span className="via-station-row__label">
            経由駅{viaAfter.viaIndex + 1}:
          </span>
          <select
            className="form-select--small via-station-row__select"
            value={viaAfter.viaStationId}
            onChange={(e) =>
              viaAfter.onViaChange(viaAfter.viaIndex, e.target.value)
            }
          >
            {viaAfter.renderGroupedOptions(
              viaAfter.viaCandidates,
              viaAfter.allViaStations,
              viaAfter.viaStationId,
            )}
          </select>
          <button
            className="via-station-row__remove"
            onClick={() => viaAfter.onViaRemove(viaAfter.viaIndex)}
            title="経由駅を削除"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

export default SegmentConfigRow;
