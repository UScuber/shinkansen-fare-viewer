import type { ReactNode } from "react";
import StationSelect from "./StationSelect";
import SeasonBadge from "./SeasonBadge";

interface SearchFormProps {
  fromId: string;
  toId: string;
  dateStr: string;
  useGakuwari: boolean;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onGakuwariChange: (checked: boolean) => void;
  onSwap: () => void;
  children?: ReactNode;
}

function SearchForm({
  fromId,
  toId,
  dateStr,
  useGakuwari,
  onFromChange,
  onToChange,
  onDateChange,
  onGakuwariChange,
  onSwap,
  children,
}: SearchFormProps) {
  const selectedDate = dateStr ? new Date(dateStr) : null;

  return (
    <div className="search-form">
      <div className="search-form__stations">
        <StationSelect
          label="出発駅"
          value={fromId}
          onChange={onFromChange}
          exclude={toId}
        />
        <button
          className="swap-btn"
          onClick={onSwap}
          title="出発・到着を入れ替え"
        >
          ⇄
        </button>
        <StationSelect
          label="到着駅"
          value={toId}
          onChange={onToChange}
          exclude={fromId}
        />
      </div>

      <div className="search-form__options">
        <div className="form-group">
          <label className="form-label">移動日</label>
          <div className="date-input-wrap">
            <input
              type="date"
              className="form-input"
              value={dateStr}
              onChange={(e) => onDateChange(e.target.value)}
              min="2025-04-01"
              max="2027-03-31"
            />
            {selectedDate && <SeasonBadge date={selectedDate} />}
          </div>
        </div>
      </div>

      <div className="search-form__gakuwari">
        <label className="gakuwari-label">
          <input
            type="checkbox"
            checked={useGakuwari}
            onChange={(e) => onGakuwariChange(e.target.checked)}
          />
          <span>学割を適用する</span>
        </label>
      </div>

      {children}
    </div>
  );
}

export default SearchForm;
