import { useState, useEffect, useCallback } from "react";
import type { SegmentConfig, StationId } from "./data/types";
import { getSeason } from "./data/calendar";
import { parseUrlParams, updateUrlParams } from "./utils/urlParams";
import { useComputedFares } from "./hooks/useComputedFares";
import SearchForm from "./components/SearchForm";
import FareTable from "./components/FareTable";
import ViaFareResult from "./components/ViaFareResult";
import SplitFareResult from "./components/SplitFareResult";

function App() {
  const initial = parseUrlParams();
  const [from, setFrom] = useState<StationId>(initial.from);
  const [to, setTo] = useState<StationId>(initial.to);
  const [dateStr, setDateStr] = useState(initial.date);
  const [useGakuwari, setUseGakuwari] = useState(initial.gakuwari);
  const [viaStations, setViaStations] = useState<StationId[]>(
    initial.viaStations,
  );
  const [segmentConfigs, setSegmentConfigs] = useState<SegmentConfig[]>(
    initial.segmentConfigs,
  );

  const season = getSeason(dateStr);
  const hasVia = viaStations.length > 0;

  const { fares, viaResult, splitResult, filter } = useComputedFares(
    from,
    to,
    dateStr,
    useGakuwari,
    viaStations,
    segmentConfigs,
  );

  useEffect(() => {
    updateUrlParams({
      from,
      to,
      date: dateStr,
      gakuwari: useGakuwari,
      viaStations,
      segmentConfigs,
    });
  }, [from, to, dateStr, useGakuwari, viaStations, segmentConfigs]);

  const handleSwap = useCallback(() => {
    setFrom(to);
    setTo(from);
    setViaStations((prev) => [...prev].reverse());
  }, [from, to]);

  const handleFromChange = useCallback(
    (id: StationId) => {
      if (id === to) return;
      setFrom(id);
      setViaStations([]);
      setSegmentConfigs([{ seatType: null, trainType: null }]);
    },
    [to],
  );

  const handleToChange = useCallback(
    (id: StationId) => {
      if (id === from) return;
      setTo(id);
      setViaStations([]);
      setSegmentConfigs([{ seatType: null, trainType: null }]);
    },
    [from],
  );

  return (
    <div className="mx-auto max-w-[900px] p-4 font-sans sm:p-4">
      <h1 className="mb-4 text-center text-2xl text-indigo-900">
        新幹線料金検索
      </h1>

      <SearchForm
        from={from}
        to={to}
        dateStr={dateStr}
        useGakuwari={useGakuwari}
        season={season}
        viaStations={viaStations}
        segmentConfigs={segmentConfigs}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onDateChange={setDateStr}
        onGakuwariChange={setUseGakuwari}
        onSwap={handleSwap}
        onViaStationsChange={setViaStations}
        onSegmentConfigsChange={setSegmentConfigs}
      />

      <div className="mt-5">
        {from === to ? (
          <div className="p-5 text-center text-sm text-red-500">
            出発駅と到着駅が同じです
          </div>
        ) : hasVia ? (
          viaResult && (
            <ViaFareResult result={viaResult} useGakuwari={useGakuwari} />
          )
        ) : (
          <>
            <FareTable
              fares={fares}
              useGakuwari={useGakuwari}
              filter={filter}
              showSmartEx={!hasVia}
            />
            {splitResult && <SplitFareResult result={splitResult} />}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
