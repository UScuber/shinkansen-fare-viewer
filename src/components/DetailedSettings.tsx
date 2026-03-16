import type { SegmentConfig, StationId } from "../data/types";
import { getIntermediateStations } from "../data/stations";
import { buildSegments } from "../data/Route";
import { Button } from "@/components/ui/button";
import SegmentConfigRow from "./ui/SegmentConfigRow";

interface DetailedSettingsProps {
  from: StationId;
  to: StationId;
  viaStations: StationId[];
  segmentConfigs: SegmentConfig[];
  onViaStationsChange: (via: StationId[]) => void;
  onSegmentConfigsChange: (configs: SegmentConfig[]) => void;
}

export default function DetailedSettings({
  from,
  to,
  viaStations,
  segmentConfigs,
  onViaStationsChange,
  onSegmentConfigsChange,
}: DetailedSettingsProps) {
  const segments = buildSegments(from, to, viaStations);

  const handleAddVia = () => {
    if (viaStations.length >= 3) return;
    const lastSegment = segments[segments.length - 1];
    const candidates = getIntermediateStations(
      lastSegment.from,
      lastSegment.to,
    );
    if (candidates.length === 0) return;
    const newVia = [...viaStations, candidates[0].id];
    onViaStationsChange(newVia);
    onSegmentConfigsChange([
      ...segmentConfigs,
      { seatType: null, trainType: null },
    ]);
  };

  const handleRemoveVia = (index: number) => {
    const newVia = viaStations.filter((_, i) => i !== index);
    const newConfigs = [...segmentConfigs];
    newConfigs.splice(index + 1, 1);
    onViaStationsChange(newVia);
    onSegmentConfigsChange(newConfigs);
  };

  const handleViaChange = (index: number, stationId: StationId) => {
    const newVia = [...viaStations];
    newVia[index] = stationId;
    onViaStationsChange(newVia);
  };

  const handleSegmentConfigChange = (index: number, config: SegmentConfig) => {
    const newConfigs = [...segmentConfigs];
    newConfigs[index] = config;
    onSegmentConfigsChange(newConfigs);
  };

  const getViaCandidates = (viaIndex: number) => {
    const allPoints = [from, ...viaStations, to];
    const prevStation = allPoints[viaIndex];
    const nextStation = allPoints[viaIndex + 2];
    return getIntermediateStations(prevStation, nextStation).filter(
      (s) => !viaStations.includes(s.id) || viaStations[viaIndex] === s.id,
    );
  };

  return (
    <div className="mt-3.5 border-t border-gray-300 pt-3">
      <h4 className="mb-2.5 text-sm text-gray-600">詳細設定</h4>

      {segments.map((seg, i) => (
        <div key={`seg-${i}`}>
          {i > 0 && i <= viaStations.length && (
            <div className="my-1.5 flex items-center gap-2 rounded bg-orange-50 px-3 py-1">
              <label className="flex items-center gap-1.5 text-[0.85rem] text-gray-600">
                経由駅{i}:
                <select
                  className="rounded border border-gray-300 px-1.5 py-0.5 text-[0.85rem]"
                  value={viaStations[i - 1]}
                  onChange={(e) =>
                    handleViaChange(i - 1, e.target.value as StationId)
                  }
                >
                  {getViaCandidates(i - 1).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-gray-400 hover:text-red-500"
                onClick={() => handleRemoveVia(i - 1)}
                title="経由駅を削除"
              >
                ×
              </Button>
            </div>
          )}
          <SegmentConfigRow
            from={seg.from}
            to={seg.to}
            config={segmentConfigs[i] ?? { seatType: null, trainType: null }}
            onChange={(c) => handleSegmentConfigChange(i, c)}
            index={i}
          />
        </div>
      ))}

      {viaStations.length < 3 && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 text-indigo-900"
          onClick={handleAddVia}
        >
          ＋ 経由駅を追加
        </Button>
      )}
    </div>
  );
}
