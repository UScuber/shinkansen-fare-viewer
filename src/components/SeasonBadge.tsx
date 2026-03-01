import React from "react";
import { getSeason, SEASON_DIFF } from "../data/calendar";

type Props = {
  date: Date;
};

const seasonLabels: Record<string, { label: string; color: string }> = {
  peak2: { label: "最繁忙期 (+400円)", color: "#e53e3e" },
  peak1: { label: "繁忙期 (+200円)", color: "#ed8936" },
  normal: { label: "通常期", color: "#3182ce" },
  off: { label: "閑散期 (-200円)", color: "#38a169" },
};

const SeasonBadge: React.FC<Props> = ({ date }) => {
  const season = getSeason(date);
  const info = seasonLabels[season];
  return (
    <span
      className="season-badge"
      style={{ backgroundColor: info.color, color: "white" }}
      title={`指定席に${SEASON_DIFF[season] >= 0 ? "+" : ""}${SEASON_DIFF[season]}円`}
    >
      {info.label}
    </span>
  );
};

export default SeasonBadge;
