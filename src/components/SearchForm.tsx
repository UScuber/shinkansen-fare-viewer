import type { SegmentConfig, StationId } from "../data/types";
import type { SeasonType } from "../data/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import StationSelect from "./StationSelect";
import SeasonBadge from "./SeasonBadge";
import DetailedSettings from "./DetailedSettings";

interface SearchFormProps {
  from: StationId;
  to: StationId;
  dateStr: string;
  useGakuwari: boolean;
  season: SeasonType;
  viaStations: StationId[];
  segmentConfigs: SegmentConfig[];
  onFromChange: (id: StationId) => void;
  onToChange: (id: StationId) => void;
  onDateChange: (date: string) => void;
  onGakuwariChange: (use: boolean) => void;
  onSwap: () => void;
  onViaStationsChange: (via: StationId[]) => void;
  onSegmentConfigsChange: (configs: SegmentConfig[]) => void;
}

export default function SearchForm({
  from,
  to,
  dateStr,
  useGakuwari,
  season,
  viaStations,
  segmentConfigs,
  onFromChange,
  onToChange,
  onDateChange,
  onGakuwariChange,
  onSwap,
  onViaStationsChange,
  onSegmentConfigsChange,
}: SearchFormProps) {
  return (
    <div className="rounded-lg bg-gray-100 p-4">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
        <StationSelect
          value={from}
          onChange={onFromChange}
          excludeId={to}
          label="出発駅"
        />
        <Button
          variant="secondary"
          size="icon"
          className="shrink-0 self-center rounded-full sm:rotate-0"
          onClick={onSwap}
          title="入れ替え"
        >
          ⇄
        </Button>
        <StationSelect
          value={to}
          onChange={onToChange}
          excludeId={from}
          label="到着駅"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          移動日
          <input
            type="date"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            value={dateStr}
            onChange={(e) => onDateChange(e.target.value)}
            min="2025-04-01"
            max="2027-03-31"
          />
        </label>
        <SeasonBadge season={season} />
      </div>

      <Label className="mt-2.5 cursor-pointer text-sm text-gray-600">
        <Checkbox
          checked={useGakuwari}
          onCheckedChange={(checked) => onGakuwariChange(checked === true)}
        />
        学割を適用する
      </Label>

      <DetailedSettings
        from={from}
        to={to}
        viaStations={viaStations}
        segmentConfigs={segmentConfigs}
        onViaStationsChange={onViaStationsChange}
        onSegmentConfigsChange={onSegmentConfigsChange}
      />
    </div>
  );
}
