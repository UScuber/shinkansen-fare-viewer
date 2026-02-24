import { useState } from "react";
import SearchForm from "./components/SearchForm";
import FareTable from "./components/FareTable";
import { calculateFares } from "./data/calculator";
import { findStation } from "./data/stations";
import type { FareResult, PassengerType } from "./data/calculator";
import "./App.css";

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function App() {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [dateStr, setDateStr] = useState(toDateInputValue(new Date()));
  const [passenger, setPassenger] = useState<PassengerType>("adult");
  const [results, setResults] = useState<FareResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

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
