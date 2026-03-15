import { type ReactNode } from "react";
import type { Station } from "../data/stations";
import { Route } from "../data/Route";
import { validateGreenContiguity } from "../data/viaCalculator";
import SegmentConfigRow from "./ui/SegmentConfigRow";
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
): ReactNode {
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

function DetailedSettings({
  fromId,
  toId,
  viaStations,
  segmentConfigs,
  onViaStationsChange,
  onSegmentConfigsChange,
}: Props) {
  // 出発駅・到着駅が未設定なら何も表示しない
  if (!fromId || !toId || fromId === toId) {
    return null;
  }

  const isFilterMode = viaStations.length === 0;

  // 経由駅候補：出発〜到着間の駅（両端含まない）
  const betweenStations = new Route(fromId, toId).stationsBetween();

  // 経由駅を追加
  const handleAddVia = () => {
    if (viaStations.length >= 3) return;
    const available = betweenStations.filter(
      (s) => s.id !== fromId && s.id !== toId && !viaStations.includes(s.id),
    );
    if (available.length === 0) return;
    const newVias = [...viaStations, available[0].id];
    onViaStationsChange(newVias);
    const fixedConfigs = segmentConfigs.map((c) => ({
      ...c,
      seatType: c.seatType ?? ("reserved" as SeatType),
    }));
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
    const newConfigs = segmentConfigs.filter((_, i) => i !== index + 1);
    onSegmentConfigsChange(newConfigs);
  };

  // 経由駅の変更（無効になった列車選択をリセット）
  const handleViaChange = (index: number, stationId: string) => {
    const newVias = [...viaStations];
    newVias[index] = stationId;

    const newSegments = buildSegments(fromId, toId, newVias);
    const newConfigs = segmentConfigs.map((config, i) => {
      if (i >= newSegments.length) return config;
      const seg = newSegments[i];
      if (config.trainType === null || config.seatType === "free")
        return config;
      const available = new Route(seg.fromId, seg.toId).availableTrainsFiltered;
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
            const config = segmentConfigs[i] ?? {
              seatType: isFilterMode ? null : ("reserved" as SeatType),
              trainType: null,
            };
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
              viaCandidates = new Route(
                prevStation,
                nextStation,
              ).stationsBetween();
            }

            return (
              <SegmentConfigRow
                key={i}
                seg={seg}
                index={i}
                config={config}
                isFilterMode={isFilterMode}
                onSeatChange={handleSeatChange}
                onTrainChange={handleTrainChange}
                viaAfter={
                  hasViaAfter
                    ? {
                        viaIndex,
                        viaStationId: viaStations[viaIndex],
                        viaCandidates,
                        allViaStations: viaStations,
                        onViaChange: handleViaChange,
                        onViaRemove: handleRemoveVia,
                        renderGroupedOptions,
                      }
                    : undefined
                }
              />
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
}

export default DetailedSettings;
