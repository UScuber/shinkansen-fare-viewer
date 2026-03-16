import type { SeasonType } from "../data/types";
import { getSeasonLabel } from "../data/calendar";
import { Badge } from "@/components/ui/badge";

interface SeasonBadgeProps {
  season: SeasonType;
}

export default function SeasonBadge({ season }: SeasonBadgeProps) {
  const info = getSeasonLabel(season);
  return (
    <Badge className="text-white" style={{ backgroundColor: info.color }}>
      {info.label} ({info.diff})
    </Badge>
  );
}
