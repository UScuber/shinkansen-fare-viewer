import type { StationId } from "../data/types";
import { STATION_GROUPS } from "../data/stations";

interface StationSelectProps {
  value: StationId;
  onChange: (id: StationId) => void;
  excludeId?: StationId;
  label: string;
}

export default function StationSelect({
  value,
  onChange,
  excludeId,
  label,
}: StationSelectProps) {
  return (
    <label className="flex min-w-[120px] flex-1 flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as StationId)}
      >
        {STATION_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.stations.map((s) => (
              <option key={s.id} value={s.id} disabled={s.id === excludeId}>
                {s.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
