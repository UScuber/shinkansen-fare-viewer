import { useEffect, useMemo, useState } from "react";
import SearchForm from "./components/SearchForm";
import FareTable from "./components/FareTable";
import SplitFareResult from "./components/SplitFareResult";
import DetailedSettings from "./components/DetailedSettings";
import ViaFareResult from "./components/ViaFareResult";
import { calculateAllFares } from "./data/calculator";
import type { CalculatedFares } from "./data/calculator";
import {
  searchSplitFares,
  type SplitSearchResult,
} from "./data/splitFareSearch";
import {
  calculateViaFare,
  validateGreenContiguity,
} from "./data/viaCalculator";
import { Route, stationName } from "./data/Route";
import type {
  SeatType,
  TrainType,
  SegmentConfig,
  JourneySegment,
  FareFilter,
  ViaFareResult as ViaFareResultType,
} from "./data/types";
import "./App.css";

/* ===== Query parameter encoding ===== */

const SEAT_TO_CODE: Record<string, string> = {
  reserved: "r",
  green: "g",
  free: "f",
};
const CODE_TO_SEAT: Record<string, SeatType> = {
  r: "reserved",
  g: "green",
  f: "free",
};
const TRAIN_TO_CODE: Record<string, string> = {
  nozomi: "no",
  hikari: "hi",
  kodama: "ko",
  mizuho: "mi",
  sakura: "sa",
  tsubame: "ts",
};
const CODE_TO_TRAIN: Record<string, TrainType> = {
  no: "nozomi",
  hi: "hikari",
  ko: "kodama",
  mi: "mizuho",
  sa: "sakura",
  ts: "tsubame",
};

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
  viaStations: string[],
  segmentConfigs: SegmentConfig[],
  useGakuwari: boolean,
): void {
  const params = new URLSearchParams();
  if (fromId) params.set("from", fromId);
  if (toId) params.set("to", toId);
  if (dateStr) params.set("date", dateStr);
  if (viaStations.length > 0) {
    params.set("via", viaStations.join(","));
    const seatCodes = segmentConfigs
      .map((c) => SEAT_TO_CODE[c.seatType ?? ""] ?? "r")
      .join(",");
    params.set("s", seatCodes);
    const trainCodes = segmentConfigs
      .map((c) => (c.trainType ? (TRAIN_TO_CODE[c.trainType] ?? "") : ""))
      .join(",");
    if (trainCodes.replace(/,/g, "")) {
      params.set("t", trainCodes);
    }
  } else {
    // フィルタモード: seatType/trainTypeが指定されている場合のみURLに保存
    const config = segmentConfigs[0];
    if (config) {
      if (config.seatType !== null) {
        params.set("s", SEAT_TO_CODE[config.seatType] ?? "");
      }
      if (config.trainType !== null) {
        params.set("t", TRAIN_TO_CODE[config.trainType] ?? "");
      }
    }
  }
  if (useGakuwari) {
    params.set("gaku", "1");
  }
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(null, "", nextUrl);
}

/** Parse initial state from URL query parameters */
function parseInitialParams(): {
  fromId: string;
  toId: string;
  dateStr: string;
  viaStations: string[];
  segmentConfigs: SegmentConfig[];
  useGakuwari: boolean;
} {
  const params = new URLSearchParams(window.location.search);
  const fromId = params.get("from") ?? "";
  const toId = params.get("to") ?? "";
  const dateStr = normalizeDateStr(params.get("date"));
  const useGakuwari = params.get("gaku") === "1";

  const viaStr = params.get("via") ?? "";
  const viaStations = viaStr ? viaStr.split(",").filter(Boolean) : [];

  const seatStr = params.get("s") ?? "";
  const seatCodes = seatStr ? seatStr.split(",") : [];
  const trainStr = params.get("t") ?? "";
  const trainCodes = trainStr ? trainStr.split(",") : [];

  if (viaStations.length > 0) {
    // 経由駅モード
    const numSegments = viaStations.length + 1;
    const segmentConfigs: SegmentConfig[] = [];
    for (let i = 0; i < numSegments; i++) {
      segmentConfigs.push({
        seatType: CODE_TO_SEAT[seatCodes[i]] ?? "reserved",
        trainType: trainCodes[i]
          ? (CODE_TO_TRAIN[trainCodes[i]] ?? null)
          : null,
      });
    }
    return { fromId, toId, dateStr, viaStations, segmentConfigs, useGakuwari };
  }

  // フィルタモード: sまたはtパラメータがあればフィルタを復元
  const hasFilterParams = seatStr !== "" || trainStr !== "";
  if (hasFilterParams) {
    const seatType: SeatType | null =
      seatCodes[0] && CODE_TO_SEAT[seatCodes[0]]
        ? CODE_TO_SEAT[seatCodes[0]]
        : null;
    const trainType: TrainType | null =
      trainCodes[0] && CODE_TO_TRAIN[trainCodes[0]]
        ? CODE_TO_TRAIN[trainCodes[0]]
        : null;
    return {
      fromId,
      toId,
      dateStr,
      viaStations: [],
      segmentConfigs: [{ seatType, trainType }],
      useGakuwari,
    };
  }

  return {
    fromId,
    toId,
    dateStr,
    viaStations: [],
    segmentConfigs: [{ seatType: null, trainType: null }],
    useGakuwari,
  };
}

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

  const date = useMemo(() => {
    const [y, mo, d] = dateStr.split("-").map(Number);
    return new Date(y, mo - 1, d);
  }, [dateStr]);

  // 自動計算
  const { fares, viaResult, splitResult, computeError } = useMemo<{
    fares: CalculatedFares | null;
    viaResult: ViaFareResultType | null;
    splitResult: SplitSearchResult | null;
    computeError: string | null;
  }>(() => {
    if (validationMessage) {
      return {
        fares: null,
        viaResult: null,
        splitResult: null,
        computeError: null,
      };
    }

    if (hasViaStations) {
      // 経由駅あり
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

      // グリーン車の連続性チェック（エラーはDetailedSettings内で表示）
      if (!validateGreenContiguity(segments)) {
        return {
          fares: null,
          viaResult: null,
          splitResult: null,
          computeError: null,
        };
      }

      const result = calculateViaFare(segments, date);
      if (!result) {
        return {
          fares: null,
          viaResult: null,
          splitResult: null,
          computeError: "この区間の料金データが見つかりませんでした。",
        };
      }
      return {
        fares: null,
        viaResult: result,
        splitResult: null,
        computeError: null,
      };
    } else {
      // 経由駅なし
      const result = calculateAllFares(fromId, toId, date);
      if (!result) {
        return {
          fares: null,
          viaResult: null,
          splitResult: null,
          computeError: "この区間の料金データが見つかりませんでした。",
        };
      }
      // 分割最安値の自動探索
      const split = searchSplitFares(fromId, toId, date, fareFilter);
      return {
        fares: result,
        viaResult: null,
        splitResult: split,
        computeError: null,
      };
    }
  }, [
    fromId,
    toId,
    date,
    viaStations,
    segmentConfigs,
    hasViaStations,
    validationMessage,
    fareFilter,
  ]);

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
                  fromId: allStops[i],
                  toId: allStops[i + 1],
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
