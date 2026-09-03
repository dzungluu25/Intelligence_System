import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardList, Gauge, History, Stethoscope, UploadCloud } from "lucide-react";
import { api } from "./api";
import type { DatasetStats, FeatureVector, PredictResponse } from "./api";
import { IntakeForm } from "./components/IntakeForm";
import { ConsensusGauge } from "./components/ConsensusGauge";
import { ModelBreakdown } from "./components/ModelBreakdown";
import { ModelInsights } from "./components/ModelInsights";
import { BatchUpload } from "./components/BatchUpload";
import { HistoryPanel } from "./components/HistoryPanel";

type Tab = "assess" | "batch" | "history" | "insights";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "assess", label: "Assess", icon: <Stethoscope className="h-4 w-4" /> },
  { key: "batch", label: "Batch Upload", icon: <UploadCloud className="h-4 w-4" /> },
  { key: "history", label: "History", icon: <History className="h-4 w-4" /> },
  { key: "insights", label: "Model Insights", icon: <Gauge className="h-4 w-4" /> },
];

function AssessTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [datasetStats, setDatasetStats] = useState<DatasetStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.dataset().then((res) => setDatasetStats(res.data)).catch(() => {});
  }, []);

  const runAssessment = async (features: FeatureVector) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.predict(features);
      setResult(res.data);
    } catch {
      setError("Prediction failed. Ensure the Node.js backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <IntakeForm onSubmit={runAssessment} loading={loading} datasetStats={datasetStats} />
      </div>
      <div className="space-y-5 lg:col-span-7">
        {error && (
          <div className="panel flex items-center gap-2 p-4 text-sm" style={{ color: "var(--risk-high)" }}>
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {!result && !error && (
          <div className="panel flex flex-col items-center gap-3 p-10 text-center">
            <ClipboardList className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Fill in the patient intake form and run an assessment to see the ensemble
              risk score and per-model breakdown.
            </p>
          </div>
        )}
        {result && (
          <>
            <ConsensusGauge consensus={result.consensus} />
            <ModelBreakdown resultId={result.id} results={result.results} />
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>("assess");

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--brand)" }}>
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Gluco<span style={{ color: "var(--brand-strong)" }}>Sense</span>
              </h1>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Ensemble Diabetes Risk Assessment
              </p>
            </div>
          </div>
          <nav className="panel-muted flex gap-1 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`tab-btn ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        <main>
          {tab === "assess" && <AssessTab />}
          {tab === "batch" && <BatchUpload />}
          {tab === "history" && <HistoryPanel />}
          {tab === "insights" && <ModelInsights />}
        </main>
      </div>
    </div>
  );
}

export default App;
