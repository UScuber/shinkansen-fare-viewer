import type {
  SeatType,
  SegmentConfig,
  StationId,
  TrainType,
} from "../../data/types";
import { getAvailableTrains, getStationName } from "../../data/stations";
import { TRAIN_TAGS } from "../../data/trainTags";

interface SegmentConfigRowProps {
  from: StationId;
  to: StationId;
  config: SegmentConfig;
  onChange: (config: SegmentConfig) => void;
  index: number;
}

export default function SegmentConfigRow({
  from,
  to,
  config,
  onChange,
  index,
}: SegmentConfigRowProps) {
  const availableTrains = getAvailableTrains(from, to);
  const isFree = config.seatType === "free";

  const handleSeatChange = (seatType: SeatType | null) => {
    if (seatType === "free") {
      onChange({ seatType, trainType: null });
    } else {
      onChange({ ...config, seatType });
    }
  };

  const handleTrainChange = (trainType: TrainType | null) => {
    onChange({ ...config, trainType });
  };

  return (
    <div className="mb-1.5 rounded-md border border-gray-200 bg-white px-3 py-2">
      <div className="mb-1.5 text-xs text-gray-500">
        区間{index + 1}: {getStationName(from)} → {getStationName(to)}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          座席
          <select
            className="rounded border border-gray-300 px-1.5 py-0.5 text-[0.85rem]"
            value={config.seatType ?? ""}
            onChange={(e) =>
              handleSeatChange((e.target.value || null) as SeatType | null)
            }
          >
            <option value="">-- 未選択 --</option>
            <option value="reserved">指定席</option>
            <option value="green">グリーン車</option>
            <option value="free">自由席</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          列車
          <select
            className="rounded border border-gray-300 px-1.5 py-0.5 text-[0.85rem] disabled:opacity-50"
            value={config.trainType ?? ""}
            onChange={(e) =>
              handleTrainChange((e.target.value || null) as TrainType | null)
            }
            disabled={isFree}
          >
            <option value="">-- 未選択 --</option>
            {availableTrains.map((t) => (
              <option key={t} value={t}>
                {TRAIN_TAGS[t].name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
