import { useEffect, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { api } from "../api";
import type { HistoryEntry } from "../api";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function HistoryPanel() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api.history(100)
      .then((res) => setHistory(res.data.history))
      .catch(() => setError("Could not reach the backend."));
  };

  useEffect(() => { load(); }, []);

  const clear = async () => {
    await api.clearHistory();
    load();
  };

  if (error) {
    return <div className="panel p-6 text-sm" style={{ color: "var(--risk-high)" }}>{error}</div>;
  }

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">Assessment History</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Persisted on the Node.js server — every run of "Run Assessment" is logged here
          </p>
        </div>
        {history && history.length > 0 && (
          <button type="button" className="btn-secondary" onClick={clear}>
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {history === null && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      )}

      {history && history.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Clock className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No assessments yet. Run one from the Assess tab.
          </p>
        </div>
      )}

      {history && history.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table-clean">
            <thead>
              <tr>
                <th>When</th>
                <th>Glucose</th>
                <th>BMI</th>
                <th>Age</th>
                <th>Consensus</th>
                <th>Risk score</th>
                <th>Top model</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatTime(entry.timestamp)}
                  </td>
                  <td>{entry.features.Glucose}</td>
                  <td>{entry.features.BMI}</td>
                  <td>{entry.features.Age}</td>
                  <td>
                    <span className={`badge ${entry.consensus.prediction === 1 ? "badge-high" : "badge-low"}`}>
                      {entry.consensus.label}
                    </span>
                  </td>
                  <td>{(entry.consensus.probability * 100).toFixed(1)}%</td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {entry.topModel.model.replace(/_/g, " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
