import React from "react";
import StationSelect from "./StationSelect";
import SeasonBadge from "./SeasonBadge";
import type { PassengerType } from "../data/calculator";

interface SearchFormProps {
  fromId: string;
  toId: string;
  dateStr: string;
  passenger: PassengerType;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onPassengerChange: (p: PassengerType) => void;
  onSearch: () => void;
  error?: string;
}

const SearchForm: React.FC<SearchFormProps> = ({
  fromId,
  toId,
  dateStr,
  passenger,
  onFromChange,
  onToChange,
  onDateChange,
  onPassengerChange,
  onSearch,
  error,
}) => {
  const handleSwap = () => {
    const tmp = fromId;
    onFromChange(toId);
    onToChange(tmp);
  };

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
          onClick={handleSwap}
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

        <div className="form-group">
          <label className="form-label">乗客</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="adult"
                checked={passenger === "adult"}
                onChange={() => onPassengerChange("adult")}
              />
              大人
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="child"
                checked={passenger === "child"}
                onChange={() => onPassengerChange("child")}
              />
              子ども（小学生）
            </label>
          </div>
        </div>
      </div>

      {error && <p className="search-error">{error}</p>}

      <button className="search-btn" onClick={onSearch}>
        料金を検索
      </button>
    </div>
  );
};

export default SearchForm;
