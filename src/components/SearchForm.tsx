import React from "react";
import StationSelect from "./StationSelect";
import SeasonBadge from "./SeasonBadge";

interface SearchFormProps {
  fromId: string;
  toId: string;
  dateStr: string;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onSearch: () => void;
  error?: string;
  hasViaStations?: boolean;
  children?: React.ReactNode;
}

const SearchForm: React.FC<SearchFormProps> = ({
  fromId,
  toId,
  dateStr,
  onFromChange,
  onToChange,
  onDateChange,
  onSearch,
  error,
  hasViaStations,
  children,
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

      </div>

      {children}

      {error && <p className="search-error">{error}</p>}

      <button className="search-btn" onClick={onSearch}>
        {hasViaStations ? "経由料金を検索" : "料金を検索"}
      </button>
    </div>
  );
};

export default SearchForm;
