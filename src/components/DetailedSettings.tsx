import React from "react";
import {
  findStation,
  getStationsBetween,
  getAvailableTrainsFiltered,
  doesTrainStopAt,
} from "../data/stations";
import type { Station } from "../data/stations";
import { validateGreenContiguity } from "../data/viaCalculator";
import type {
  SeatType,
  TrainType,
  SegmentConfig,
  JourneySegment,
} from "../data/types";

const LINE_GROUPS = [
  { id: "tokaido", name: "東海道新幹線" },
  { id: "sanyo", name: "山陽新幹線" },
  { id: "kyushu", name: "九州新幹線" },
] as const;

type Props = {
  fromId: string;
  toId: string;
  viaStations: string[];
  segmentConfigs: SegmentConfig[];
  onViaStationsChange: (vias: string[]) => void;
  onSegmentConfigsChange: (configs: SegmentConfig[]) => void;
};

const TRAIN_NAMES: Record<TrainType, string> = {
  nozomi: "のぞみ",
  hikari: "ひかり",
  kodama: "こだま",
  mizuho: "みずほ",
  sakura: "さくら",
  tsubame: "つばめ",
};

/**
 * 区間情報を生成
 */
function buildSegments(
  fromId: string,
  toId: string,
  viaStations: string[],
): { fromId: string; toId: string }[] {
  const allStops = [fromId, ...viaStations, toId];
  const segments: { fromId: string; toId: string }[] = [];
  for (let i = 0; i < allStops.length - 1; i++) {
    segments.push({ fromId: allStops[i], toId: allStops[i + 1] });
  }
  return segments;
}

/**
 * 経由駅候補をoptgroupで路線ごとにグループ化して表示
 */
function renderGroupedOptions(
  candidates: Station[],
  selectedVias: string[],
  currentViaId: string,
): React.ReactNode {
  const groups: { id: string; name: string; stations: Station[] }[] = [];
  let currentGroup: { id: string; name: string; stations: Station[] } | null =
    null;

  for (const s of candidates) {
    const lineId = s.line;
    const lineName = LINE_GROUPS.find((g) => g.id === lineId)?.name ?? lineId;
    if (!currentGroup || currentGroup.id !== lineId) {
      currentGroup = { id: lineId, name: lineName, stations: [] };
      groups.push(currentGroup);
    }
    currentGroup.stations.push(s);
  }

  return groups.map((group) => (
    <optgroup key={group.id} label={group.name}>
      {group.stations.map((s) => (
        <option
          key={s.id}
          value={s.id}
          disabled={selectedVias.includes(s.id) && s.id !== currentViaId}
        >
          {s.name}
        </option>
      ))}
    </optgroup>
  ));
}

const DetailedSettings: React.FC<Props> = ({
  fromId,
  toId,
  viaStations,
  segmentConfigs,
  onViaStationsChange,
  onSegmentConfigsChange,
}) => {
  // 出発駅・到着駅が未設定なら何も表示しない
  if (!fromId || !toId || fromId === toId) {
    return null;
  }

  const isFilterMode = viaStations.length === 0;

  // 経由駅候補：出発〜到着間の駅（両端含まない）
  const betweenStations = getStationsBetween(fromId, toId);

  // 経由駅を追加
  const handleAddVia = () => {
    if (viaStations.length >= 3) return;
    // デフォルトとして最初の候補を選択
    const available = betweenStations.filter(
      (s) => s.id !== fromId && s.id !== toId && !viaStations.includes(s.id),
    );
    if (available.length === 0) return;
    const newVias = [...viaStations, available[0].id];
    onViaStationsChange(newVias);
    // フィルタモードからの遷移時にnull seatTypeをreservedに変換
    const fixedConfigs = segmentConfigs.map((c) => ({
      ...c,
      seatType: c.seatType ?? ("reserved" as SeatType),
    }));
    // 新しいセグメント設定を追加
    const newConfigs = [
      ...fixedConfigs,
      { seatType: "reserved" as SeatType, trainType: null },
    ];
    onSegmentConfigsChange(newConfigs);
  };

  // 経由駅を削除
  const handleRemoveVia = (index: number) => {
    const newVias = viaStations.filter((_, i) => i !== index);
    onViaStationsChange(newVias);
    // 対応するセグメント設定を削除（index+1の設定を削除）
    const newConfigs = segmentConfigs.filter((_, i) => i !== index + 1);
    onSegmentConfigsChange(newConfigs);
  };

  // 経由駅の変更（無効になった列車選択をリセット）
  const handleViaChange = (index: number, stationId: string) => {
    const newVias = [...viaStations];
    newVias[index] = stationId;

    // 新しい区間を再構築し、各区間で選択中の列車が有効かチェック
    const newSegments = buildSegments(fromId, toId, newVias);
    const newConfigs = segmentConfigs.map((config, i) => {
      if (i >= newSegments.length) return config;
      const seg = newSegments[i];
      if (config.trainType === null || config.seatType === "free")
        return config;
      const available = getAvailableTrainsFiltered(seg.fromId, seg.toId);
      if (!available.includes(config.trainType)) {
        return { ...config, trainType: null };
      }
      return config;
    });

    onViaStationsChange(newVias);
    onSegmentConfigsChange(newConfigs);
  };

  // セグメント設定の変更
  const handleSeatChange = (index: number, value: string) => {
    const seatType = value === "" ? null : (value as SeatType);
    const newConfigs = [...segmentConfigs];
    newConfigs[index] = {
      ...newConfigs[index],
      seatType,
      // 自由席に変更した場合、列車名をクリア
      trainType: seatType === "free" ? null : newConfigs[index].trainType,
    };
    onSegmentConfigsChange(newConfigs);
  };

  const handleTrainChange = (index: number, trainType: TrainType | null) => {
    const newConfigs = [...segmentConfigs];
    newConfigs[index] = { ...newConfigs[index], trainType };
    onSegmentConfigsChange(newConfigs);
  };

  // 現在の区間リスト
  const segments = buildSegments(fromId, toId, viaStations);

  // グリーン車の連続性チェック
  const journeySegments: JourneySegment[] = segments.map((seg, i) => ({
    ...seg,
    seatType: segmentConfigs[i]?.seatType ?? "reserved",
    trainType: segmentConfigs[i]?.trainType ?? null,
  }));
  const greenValid = validateGreenContiguity(journeySegments);

  return (
    <div className="detailed-settings">
      <div className="detailed-settings__content">
        <div className="detailed-settings__segments">
          {segments.map((seg, i) => {
            const fromName = findStation(seg.fromId)?.name ?? seg.fromId;
            const toName = findStation(seg.toId)?.name ?? seg.toId;
            const config = segmentConfigs[i] ?? {
              seatType: isFilterMode ? null : ("reserved" as SeatType),
              trainType: null,
            };
            const availableTrains = getAvailableTrainsFiltered(
              seg.fromId,
              seg.toId,
            );
            const isFree = config.seatType === "free";
            // 自由席以外で列車が未選択かどうか（フィルタモードではハイライトしない）
            const trainNotSelected =
              !isFilterMode && !isFree && config.trainType === null;
            // 選択済み列車が停車駅に該当しないかチェック（未選択時はエラーなし）
            const trainStopError =
              !isFree &&
              config.trainType !== null &&
              (!doesTrainStopAt(config.trainType, seg.fromId) ||
                !doesTrainStopAt(config.trainType, seg.toId));

            // この区間の後に表示する経由駅
            const viaIndex = i;
            const hasViaAfter = viaIndex < viaStations.length;

            let viaCandidates: Station[] = [];
            if (hasViaAfter) {
              const prevStation =
                viaIndex === 0 ? fromId : viaStations[viaIndex - 1];
              const nextStation =
                viaIndex === viaStations.length - 1
                  ? toId
                  : viaStations[viaIndex + 1];
              viaCandidates = getStationsBetween(prevStation, nextStation);
            }

            return (
              <React.Fragment key={i}>
                <div className="segment-config">
                  <div className="segment-config__label">
                    {isFilterMode
                      ? `区間: ${fromName} → ${toName}`
                      : `区間${i + 1}: ${fromName} → ${toName}`}
                  </div>
                  <div className="segment-config__controls">
                    <div className="segment-config__seat">
                      <label className="form-label--small">座席</label>
                      <select
                        className="form-select--small"
                        value={config.seatType ?? ""}
                        onChange={(e) => handleSeatChange(i, e.target.value)}
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
                          handleTrainChange(
                            i,
                            e.target.value === ""
                              ? null
                              : (e.target.value as TrainType),
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
                      「{TRAIN_NAMES[config.trainType!]}」は{fromName}または
                      {toName}
                      に停車しません。
                    </p>
                  )}
                </div>

                {/* 区間と区間の間に経由駅を表示 */}
                {hasViaAfter && (
                  <div className="via-station-row via-station-row--between">
                    <span className="via-station-row__label">
                      経由駅{viaIndex + 1}:
                    </span>
                    <select
                      className="form-select--small via-station-row__select"
                      value={viaStations[viaIndex]}
                      onChange={(e) =>
                        handleViaChange(viaIndex, e.target.value)
                      }
                    >
                      {renderGroupedOptions(
                        viaCandidates,
                        viaStations,
                        viaStations[viaIndex],
                      )}
                    </select>
                    <button
                      className="via-station-row__remove"
                      onClick={() => handleRemoveVia(viaIndex)}
                      title="経由駅を削除"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* グリーン車連続性エラー */}
        {!greenValid && viaStations.length > 0 && (
          <p className="detailed-settings__error">
            グリーン車を指定する区間は連続している必要があります。
          </p>
        )}

        {/* 経由駅の追加ボタン */}
        {viaStations.length < 3 &&
          betweenStations.length > viaStations.length && (
            <button
              className="detailed-settings__add-btn"
              onClick={handleAddVia}
            >
              ＋ 経由駅を追加
            </button>
          )}
      </div>
    </div>
  );
};

export default DetailedSettings;
