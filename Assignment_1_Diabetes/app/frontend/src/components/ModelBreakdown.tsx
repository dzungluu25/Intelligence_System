import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { api } from "../api";
import type { ModelDetail, ModelSummary } from "../api";

const MODEL_LABELS: Record<string, string> = {
  random_forest: "Random Forest",
  xgboost: "XGBoost",
  knn: "K-Nearest Neighbors",
  svm_linear: "SVM (Linear)",
  svm_rbf: "SVM (RBF)",
  logistic_regression: "Logistic Regression",
};

function ShapBars({ shap }: { shap: ModelDetail["shap_values"] }) {
  const max = Math.max(...shap.map((s) => Math.abs(s.value)), 0.001);
  const sorted = [...shap].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return (
    <div className="space-y-1.5">
      {sorted.map((s) => {
        const width = (Math.abs(s.value) / max) * 100;
        const positive = s.value >= 0;
        return (
          <div key={s.feature} className="flex items-center gap-2 text-xs">
            <span className="w-36 shrink-0 truncate" style={{ color: "var(--text-muted)" }}>{s.feature}</span>
            <div className="h-3 flex-1 rounded-full" style={{ background: "var(--panel-muted)" }}>
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${width}%`,
                  background: positive ? "var(--risk-high)" : "var(--risk-low)",
                }}
              />
            </div>
            <span className="w-14 shrink-0 text-right font-mono" style={{ color: "var(--text-muted)" }}>
              {s.value >= 0 ? "+" : ""}{s.value.toFixed(3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ModelRow({ resultId, summary }: { resultId: string; summary: ModelSummary }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ModelDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !detail && !loading) {
      setLoading(true);
      setError(null);
      try {
        const res = await api.detail(resultId, summary.model);
        setDetail(res.data);
      } catch {
        setError("Detail unavailable for this result.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="panel-muted overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{MODEL_LABELS[summary.model] ?? summary.model}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {(summary.accuracy * 100).toFixed(1)}% test accuracy
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
        </div>
      </button>

      {open && (
        <div className="border-t px-4 py-3.5" style={{ borderColor: "var(--border)" }}>
          {loading && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading SHAP explanation...
            </div>
          )}
          {error && <p className="text-xs" style={{ color: "var(--risk-high)" }}>{error}</p>}
          {detail && (
            <>
              <div className="mb-3 flex items-center gap-4 text-xs">
                <span>
                  Prediction:{" "}
                  <strong>{detail.prediction === 1 ? "Diabetic" : "Non-Diabetic"}</strong>
                </span>
                <span>Confidence: <strong>{(detail.confidence * 100).toFixed(1)}%</strong></span>
              </div>
              <ShapBars shap={detail.shap_values} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ModelBreakdown({ resultId, results }: { resultId: string; results: ModelSummary[] }) {
  return (
    <div className="panel p-5">
      <h3 className="mb-1 text-base font-bold">Per-Model Breakdown</h3>
      <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
        Ranked by held-out test accuracy — expand a model to see which features drove its prediction (SHAP)
      </p>
      <div className="space-y-2">
        {results.map((r) => (
          <ModelRow key={r.model} resultId={resultId} summary={r} />
        ))}
      </div>
    </div>
  );
}
