import { useRef, useState } from "react";
import { AlertTriangle, FileUp, Loader2, UploadCloud } from "lucide-react";
import { api } from "../api";
import type { BatchResponse } from "../api";

const SAMPLE_CSV =
  "Pregnancies,Glucose,BloodPressure,SkinThickness,Insulin,BMI,DiabetesPedigreeFunction,Age\n" +
  "6,148,72,35,0,33.6,0.627,50\n" +
  "1,85,66,29,0,26.6,0.351,31\n" +
  "8,183,64,0,0,23.3,0.672,32\n";

export function BatchUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runBatch = async (chosen: File) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await api.batchPredict(chosen);
      setResponse(res.data);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Batch prediction failed.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (chosen: File | null) => {
    setFile(chosen);
    if (chosen) runBatch(chosen);
  };

  return (
    <div className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-base font-bold">Batch Assessment</h2>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Upload a CSV with columns Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI,
          DiabetesPedigreeFunction, Age — every row is run through all 6 trained models.
        </p>

        <label
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 text-center transition-colors"
          style={{ borderColor: "var(--border)" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) handleFile(dropped);
          }}
        >
          <UploadCloud className="h-8 w-8" style={{ color: "var(--brand)" }} />
          <span className="text-sm font-semibold">
            {file ? file.name : "Click to choose a CSV, or drag one here"}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Max 300 rows</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
            <FileUp className="h-4 w-4" /> Choose file
          </button>
          <button
            type="button"
            className="text-xs font-semibold underline"
            style={{ color: "var(--brand)" }}
            onClick={() => {
              const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample_patients.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download sample CSV
          </button>
          {loading && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing rows…
            </span>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: "var(--risk-high-soft)", color: "var(--risk-high)" }}>
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      {response && (
        <div className="panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold">Results</h3>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {response.successCount} of {response.count} rows processed
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Glucose</th>
                  <th>BMI</th>
                  <th>Age</th>
                  <th>Consensus</th>
                  <th>Risk score</th>
                  <th>Agreement</th>
                </tr>
              </thead>
              <tbody>
                {response.results.map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    {r.error ? (
                      <td colSpan={6} style={{ color: "var(--risk-high)" }}>{r.error}</td>
                    ) : (
                      <>
                        <td>{r.features?.Glucose}</td>
                        <td>{r.features?.BMI}</td>
                        <td>{r.features?.Age}</td>
                        <td>
                          <span className={`badge ${r.consensus?.prediction === 1 ? "badge-high" : "badge-low"}`}>
                            {r.consensus?.label}
                          </span>
                        </td>
                        <td>{((r.consensus?.probability ?? 0) * 100).toFixed(1)}%</td>
                        <td>{Math.round((r.consensus?.agreement ?? 0) * 100)}%</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
