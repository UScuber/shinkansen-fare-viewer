import { STATIONS } from "../data/stations";

type Props = {
  label: string;
  value: string;
  onChange: (id: string) => void;
  exclude?: string;
};

function StationSelect({ label, value, onChange, exclude }: Props) {
  const lines = [
    { id: "tokaido", name: "東海道新幹線" },
    { id: "sanyo", name: "山陽新幹線" },
    { id: "kyushu", name: "九州新幹線" },
  ] as const;

  return (
    <div className="station-select">
      <label className="station-select__label">{label}</label>
      <select
        className="station-select__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- 駅を選択 --</option>
        {lines.map((line) => (
          <optgroup key={line.id} label={line.name}>
            {STATIONS.filter((s) => s.line === line.id && s.id !== exclude).map(
              (s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ),
            )}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export default StationSelect;
