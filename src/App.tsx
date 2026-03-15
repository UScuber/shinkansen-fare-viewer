import { useEffect, useMemo, useState } from "react";
import SearchForm from "./components/SearchForm";
import FareTable from "./components/FareTable";
import SplitFareResult from "./components/SplitFareResult";
import DetailedSettings from "./components/DetailedSettings";
import ViaFareResult from "./components/ViaFareResult";
import { Route, stationName } from "./data/Route";
import { toStationId } from "./data/stations";
import type { SegmentConfig, FareFilter } from "./data/types";
import { parseInitialParams, updateQueryParams } from "./utils/urlParams";
import { useComputedFares } from "./hooks/useComputedFares";
import "./App.css";

const INITIAL = parseInitialParams();

function App() {
  const [fromId, setFromId] = useState(INITIAL.fromId);
  const [toId, setToId] = useState(INITIAL.toId);
  const [dateStr, setDateStr] = useState(INITIAL.dateStr);
  const [viaStations, setViaStations] = useState<string[]>(INITIAL.viaStations);
  const [segmentConfigs, setSegmentConfigs] = useState<SegmentConfig[]>(
    INITIAL.segmentConfigs,
  );
  const [useGakuwari, setUseGakuwari] = useState(INITIAL.useGakuwari);

  const hasViaStations = viaStations.length > 0;

  /**
   * 区間リストに対してセグメント設定の列車選択を検証し、
   * 無効になった列車をnullにリセットした新しい設定を返す
   */
  const sanitizeConfigs = (
    newFrom: string,
    newTo: string,
    newVias: string[],
    configs: SegmentConfig[],
  ): SegmentConfig[] => {
    const allStops = [newFrom, ...newVias, newTo];
    return configs.map((config, i) => {
      if (i >= allStops.length - 1) return config;
      if (config.trainType === null || config.seatType === "free")
        return config;
      const segFrom = allStops[i];
      const segTo = allStops[i + 1];
      if (!segFrom || !segTo) return config;
      const available = new Route(segFrom, segTo).availableTrainsFiltered;
      if (!available.includes(config.trainType)) {
        return { ...config, trainType: null };
      }
      return config;
    });
  };

  // 経由駅変更時にセグメント設定を同期
  const handleViaStationsChange = (newVias: string[]) => {
    setViaStations(newVias);
    if (newVias.length === 0) {
      // フィルタモードにリセット
      setSegmentConfigs([{ seatType: null, trainType: null }]);
    }
  };

  const handleSegmentConfigsChange = (configs: SegmentConfig[]) => {
    setSegmentConfigs(configs);
  };

  // 出発駅の変更
  const handleFromChange = (newFrom: string) => {
    setFromId(newFrom);
    if (viaStations.length > 0 && newFrom && toId) {
      setSegmentConfigs(
        sanitizeConfigs(newFrom, toId, viaStations, segmentConfigs),
      );
    } else if (!hasViaStations) {
      setSegmentConfigs((prev) => sanitizeConfigs(newFrom, toId, [], prev));
    }
  };

  // 到着駅の変更
  const handleToChange = (newTo: string) => {
    setToId(newTo);
    if (viaStations.length > 0 && fromId && newTo) {
      setSegmentConfigs(
        sanitizeConfigs(fromId, newTo, viaStations, segmentConfigs),
      );
    } else if (!hasViaStations) {
      setSegmentConfigs((prev) => sanitizeConfigs(fromId, newTo, [], prev));
    }
  };

  // スワップ時に経由駅・セグメント設定も反転
  const handleSwap = () => {
    const newFrom = toId;
    const newTo = fromId;
    const newVias = [...viaStations].reverse();
    const newConfigs = [...segmentConfigs].reverse();
    setFromId(newFrom);
    setToId(newTo);
    if (viaStations.length > 0) {
      setViaStations(newVias);
      setSegmentConfigs(sanitizeConfigs(newFrom, newTo, newVias, newConfigs));
    } else {
      setSegmentConfigs(sanitizeConfigs(newFrom, newTo, [], newConfigs));
    }
  };

  // フィルタ設定を導出
  const fareFilter: FareFilter | null = useMemo(() => {
    if (hasViaStations) return null;
    const config = segmentConfigs[0];
    if (!config) return null;
    if (config.seatType === null && config.trainType === null) return null;
    return {
      seatType: config.seatType,
      trainType: config.trainType,
    };
  }, [hasViaStations, segmentConfigs]);

  // バリデーションメッセージ（結果エリアに表示）
  const validationMessage = useMemo(() => {
    if (!fromId && !toId) return "出発駅と到着駅を選択してください。";
    if (!fromId) return "出発駅を選択してください。";
    if (!toId) return "到着駅を選択してください。";
    if (fromId === toId) return "出発駅と到着駅が同じです。";
    // 経由駅ありの場合、自由席以外の全区間で列車が選択されているかチェック
    if (hasViaStations) {
      const hasUnselectedTrain = segmentConfigs.some(
        (c) => c.seatType !== "free" && c.trainType === null,
      );
      if (hasUnselectedTrain) {
        return "各区間の列車を選択してください。";
      }
    }
    return null;
  }, [fromId, toId, hasViaStations, segmentConfigs]);

  // 料金計算
  const { fares, viaResult, splitResult, computeError, date } =
    useComputedFares(
      fromId,
      toId,
      dateStr,
      viaStations,
      segmentConfigs,
      fareFilter,
      validationMessage,
    );

  // URL同期
  useEffect(() => {
    updateQueryParams(
      fromId,
      toId,
      dateStr,
      viaStations,
      segmentConfigs,
      useGakuwari,
    );
  }, [fromId, toId, dateStr, viaStations, segmentConfigs, useGakuwari]);

  const fromName = stationName(fromId);
  const toName = stationName(toId);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🚄 新幹線 料金検索</h1>
        <p className="app-subtitle">東海道・山陽・九州新幹線 2026年度</p>
      </header>

      <main className="app-main">
        <section className="search-section">
          <SearchForm
            fromId={fromId}
            toId={toId}
            dateStr={dateStr}
            useGakuwari={useGakuwari}
            onFromChange={handleFromChange}
            onToChange={handleToChange}
            onDateChange={setDateStr}
            onGakuwariChange={setUseGakuwari}
            onSwap={handleSwap}
          >
            <DetailedSettings
              fromId={fromId}
              toId={toId}
              viaStations={viaStations}
              segmentConfigs={segmentConfigs}
              onViaStationsChange={handleViaStationsChange}
              onSegmentConfigsChange={handleSegmentConfigsChange}
            />
          </SearchForm>
        </section>

        {/* バリデーションメッセージ */}
        {validationMessage && (
          <section className="result-section">
            <p className="result-message">{validationMessage}</p>
          </section>
        )}

        {/* 計算エラー */}
        {!validationMessage && computeError && (
          <section className="result-section">
            <p className="result-message result-message--error">
              {computeError}
            </p>
          </section>
        )}

        {/* 通常結果 */}
        {fares && !hasViaStations && (
          <section className="result-section">
            <div className="result-header">
              <h2 className="result-title">
                {fromName} → {toName}
              </h2>
              <div className="result-meta">
                <span>{dateStr}</span>
              </div>
            </div>
            <FareTable
              fares={fares}
              date={date}
              filter={fareFilter}
              useGakuwari={useGakuwari}
            />
            {splitResult && <SplitFareResult result={splitResult} />}
          </section>
        )}

        {/* 経由結果 */}
        {viaResult && hasViaStations && (
          <section className="result-section">
            <div className="result-header">
              <h2 className="result-title">
                {fromName}
                {viaStations.map((v) => ` → ${stationName(v)}`).join("")}
                {" → "}
                {toName}
              </h2>
              <div className="result-meta">
                <span>{dateStr}</span>
              </div>
            </div>
            <ViaFareResult
              result={viaResult}
              useGakuwari={useGakuwari}
              segments={(() => {
                const allStops = [fromId, ...viaStations, toId];
                return allStops.slice(0, -1).map((_, i) => ({
                  fromId: toStationId(allStops[i])!,
                  toId: toStationId(allStops[i + 1])!,
                  seatType:
                    segmentConfigs[i]?.seatType ?? ("reserved" as const),
                  trainType: segmentConfigs[i]?.trainType ?? null,
                }));
              })()}
            />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
