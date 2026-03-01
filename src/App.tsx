import { useEffect, useMemo, useState } from "react";
import SearchForm from "./components/SearchForm";
import FareTable from "./components/FareTable";
import DetailedSettings from "./components/DetailedSettings";
import ViaFareResult from "./components/ViaFareResult";
import { calculateAllFares } from "./data/calculator";
import type { CalculatedFares } from "./data/calculator";
import { calculateViaFare, validateGreenContiguity } from "./data/viaCalculator";
import { findStation } from "./data/stations";
import type { SegmentConfig, JourneySegment, ViaFareResult as ViaFareResultType } from "./data/types";
import "./App.css";

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeDateStr(value: string | null): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return toDateInputValue(new Date());
}

function updateQueryParams(
  fromId: string,
  toId: string,
  dateStr: string,
): void {
  const params = new URLSearchParams();
  if (fromId) params.set("from", fromId);
  if (toId) params.set("to", toId);
  if (dateStr) params.set("date", dateStr);
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(null, "", nextUrl);
}

function App() {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [dateStr, setDateStr] = useState(toDateInputValue(new Date()));
  const [fares, setFares] = useState<CalculatedFares | null>(null);
  const [viaResult, setViaResult] = useState<ViaFareResultType | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // 経由駅と区間設定
  const [viaStations, setViaStations] = useState<string[]>([]);
  const [segmentConfigs, setSegmentConfigs] = useState<SegmentConfig[]>([
    { seatType: "reserved", trainType: null },
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialFrom = params.get("from") ?? "";
    const initialTo = params.get("to") ?? "";
    const initialDate = normalizeDateStr(params.get("date"));

    setFromId(initialFrom);
    setToId(initialTo);
    setDateStr(initialDate);

    if (initialFrom && initialTo) {
      const [y, mo, d] = initialDate.split("-").map(Number);
      const date = new Date(y, mo - 1, d);
      const result = calculateAllFares(initialFrom, initialTo, date);
      setFares(result);
      setSearched(true);
      if (!result) {
        setError("この区間の料金データが見つかりませんでした。");
      }
    }
  }, []);

  // 経由駅変更時にセグメント設定を同期
  const handleViaStationsChange = (newVias: string[]) => {
    setViaStations(newVias);
    // 経由駅がクリアされた場合、セグメント設定もリセット
    if (newVias.length === 0) {
      setSegmentConfigs([{ seatType: "reserved", trainType: null }]);
    }
  };

  const handleSegmentConfigsChange = (configs: SegmentConfig[]) => {
    setSegmentConfigs(configs);
  };

  const hasViaStations = viaStations.length > 0;

  const handleSearch = () => {
    setError("");
    setViaResult(null);

    if (!fromId || !toId) {
      setError("出発駅と到着駅を選択してください。");
      return;
    }
    if (fromId === toId) {
      setError("出発駅と到着駅が同じです。");
      return;
    }
    if (!dateStr) {
      setError("移動日を選択してください。");
      return;
    }

    const [y, mo, d] = dateStr.split("-").map(Number);
    const date = new Date(y, mo - 1, d);

    if (hasViaStations) {
      // 経由駅あり → via計算
      const allStops = [fromId, ...viaStations, toId];
      const segments: JourneySegment[] = [];
      for (let i = 0; i < allStops.length - 1; i++) {
        segments.push({
          fromId: allStops[i],
          toId: allStops[i + 1],
          seatType: segmentConfigs[i]?.seatType ?? "reserved",
          trainType: segmentConfigs[i]?.trainType ?? null,
        });
      }

      // バリデーション: グリーン車の連続性
      if (!validateGreenContiguity(segments)) {
        setError("グリーン車を指定する区間は連続している必要があります。");
        return;
      }

      const result = calculateViaFare(segments, date);
      if (!result) {
        setError("この区間の料金データが見つかりませんでした。");
        return;
      }
      setViaResult(result);
      setFares(null);
      setSearched(true);
    } else {
      // 経由駅なし → 従来の計算
      const result = calculateAllFares(fromId, toId, date);
      setFares(result);
      setViaResult(null);
      setSearched(true);
      if (!result) {
        setError("この区間の料金データが見つかりませんでした。");
      }
    }

    updateQueryParams(fromId, toId, dateStr);
  };

  const fromStation = findStation(fromId);
  const toStation = findStation(toId);

  const date = useMemo(() => {
    const [y, mo, d] = dateStr.split("-").map(Number);
    return new Date(y, mo - 1, d);
  }, [dateStr]);

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
            onFromChange={setFromId}
            onToChange={setToId}
            onDateChange={setDateStr}
            onSearch={handleSearch}
            error={error}
            hasViaStations={hasViaStations}
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

        {searched && fares && !hasViaStations && (
          <section className="result-section">
            <div className="result-header">
              <h2 className="result-title">
                {fromStation?.name ?? fromId} → {toStation?.name ?? toId}
              </h2>
              <div className="result-meta">
                <span>{dateStr}</span>
              </div>
            </div>
            <FareTable fares={fares} date={date} />
          </section>
        )}

        {searched && viaResult && hasViaStations && (
          <section className="result-section">
            <div className="result-header">
              <h2 className="result-title">
                {fromStation?.name ?? fromId}
                {viaStations.map((v) => {
                  const s = findStation(v);
                  return ` → ${s?.name ?? v}`;
                }).join("")}
                {" → "}
                {toStation?.name ?? toId}
              </h2>
              <div className="result-meta">
                <span>{dateStr}</span>
              </div>
            </div>
            <ViaFareResult result={viaResult} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
