import { useEffect, useState } from "react";
import SearchForm from "./components/SearchForm";
import FareTable from "./components/FareTable";
import { calculateFares } from "./data/fareResults";
import { findStation } from "./data/stations";
import type { FareResult, PassengerType } from "./data/fareResults";
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
  passenger: PassengerType,
): void {
  const params = new URLSearchParams();
  if (fromId) params.set("from", fromId);
  if (toId) params.set("to", toId);
  if (dateStr) params.set("date", dateStr);
  if (passenger) params.set("passenger", passenger);
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
  const [passenger, setPassenger] = useState<PassengerType>("adult");
  const [results, setResults] = useState<FareResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialFrom = params.get("from") ?? "";
    const initialTo = params.get("to") ?? "";
    const initialDate = normalizeDateStr(params.get("date"));
    const initialPassenger =
      params.get("passenger") === "child" ? "child" : "adult";

    setFromId(initialFrom);
    setToId(initialTo);
    setDateStr(initialDate);
    setPassenger(initialPassenger);

    if (initialFrom && initialTo) {
      const [y, mo, d] = initialDate.split("-").map(Number);
      const date = new Date(y, mo - 1, d);
      const fares = calculateFares(
        initialFrom,
        initialTo,
        date,
        initialPassenger,
      );
      setResults(fares);
      setSearched(true);
      if (fares.length === 0) {
        setError("この区間の料金データが見つかりませんでした。");
      }
    }
  }, []);

  const handleSearch = () => {
    setError("");
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
    // dateStr は "YYYY-MM-DD" 形式 → ローカル時刻でDateを作る
    const [y, mo, d] = dateStr.split("-").map(Number);
    const date = new Date(y, mo - 1, d);
    const fares = calculateFares(fromId, toId, date, passenger);
    setResults(fares);
    setSearched(true);
    updateQueryParams(fromId, toId, dateStr, passenger);
    if (fares.length === 0) {
      setError("この区間の料金データが見つかりませんでした。");
    }
  };

  const fromStation = findStation(fromId);
  const toStation = findStation(toId);

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
            passenger={passenger}
            onFromChange={setFromId}
            onToChange={setToId}
            onDateChange={setDateStr}
            onPassengerChange={setPassenger}
            onSearch={handleSearch}
            error={error}
          />
        </section>

        {searched && results.length > 0 && (
          <section className="result-section">
            <div className="result-header">
              <h2 className="result-title">
                {fromStation?.name ?? fromId} → {toStation?.name ?? toId}
              </h2>
              <div className="result-meta">
                <span>{dateStr}</span>
                <span>{passenger === "adult" ? "大人" : "子ども"} 1名</span>
              </div>
            </div>
            <FareTable results={results} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
