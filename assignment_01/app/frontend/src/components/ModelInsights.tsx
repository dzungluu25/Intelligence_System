import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Database, Layers, TrendingUp } from "lucide-react";
import { api } from "../api";
import type { DatasetStats, ModelMetrics } from "../api";

const MODEL_LABELS: Record<string, string> = {
  random_forest: "Random Forest",
  xgboost: "XGBoost",
  knn: "KNN",
  svm_linear: "SVM Linear",
  svm_rbf: "SVM RBF",
  logistic_regression: "Log. Regression",
};

const METRIC_COLORS: Record<string, string> = {
  accuracy: "#0d9488",
  precision: "#2dd4bf",
  recall: "#b7791f",
  f1: "#134e4a",
};

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="panel-muted flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{hint}</p>
      </div>
    </div>
  );
}

export function ModelInsights() {
  const [models, setModels] = useState<ModelMetrics[] | null>(null);
  const [dataset, setDataset] = useState<DatasetStats | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.models(), api.dataset()])
      .then(([m, d]) => {
        setModels(m.data.models);
        setDataset(d.data);
        setSelectedModel(m.data.models[0]?.model ?? "");
      })
      .catch(() => setError("Could not reach the backend. Is the Node.js server running?"));
  }, []);

  const chartData = useMemo(
    () =>
      (models ?? []).map((m) => ({
        name: MODEL_LABELS[m.model] ?? m.model,
        accuracy: +(m.accuracy * 100).toFixed(1),
        precision: +(m.precision * 100).toFixed(1),
        recall: +(m.recall * 100).toFixed(1),
        f1: +(m.f1 * 100).toFixed(1),
      })),
    [models]
  );

  const active = models?.find((m) => m.model === selectedModel);
  const importanceData = useMemo(
    () => (active ? [...active.feature_importance].sort((a, b) => a.importance - b.importance) : []),
    [active]
  );

  if (error) {
    return <div className="panel p-6 text-sm" style={{ color: "var(--risk-high)" }}>{error}</div>;
  }

  if (!models || !dataset) {
    return <div className="panel p-6 text-sm" style={{ color: "var(--text-muted)" }}>Loading model insights…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={<Database className="h-5 w-5" />} label="Training records" value={dataset.n_samples.toString()} hint="Pima Indians Diabetes dataset" />
        <StatCard icon={<Layers className="h-5 w-5" />} label="Input features" value={dataset.n_features.toString()} hint="8 clinical measurements" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Positive rate" value={`${(dataset.positive_rate * 100).toFixed(1)}%`} hint="Diabetic cases in dataset" />
      </div>

      <div className="panel p-5">
        <h3 className="mb-1 text-base font-bold">Model Comparison</h3>
        <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Accuracy, precision, recall and F1 computed on the same held-out test split for every model
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" unit="%" />
              <Tooltip
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="accuracy" name="Accuracy" fill={METRIC_COLORS.accuracy} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="precision" name="Precision" fill={METRIC_COLORS.precision} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="recall" name="Recall" fill={METRIC_COLORS.recall} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="f1" name="F1" fill={METRIC_COLORS.f1} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-bold">Feature Importance</h3>
          <select
            className="field-input w-auto py-1.5 text-xs"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.model} value={m.model}>{MODEL_LABELS[m.model] ?? m.model}</option>
            ))}
          </select>
        </div>
        <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
          {active && ["random_forest", "xgboost"].includes(active.model)
            ? "Native impurity-based importance from the trained tree ensemble."
            : "Native model coefficients, or permutation importance on the test split when the model has no built-in ranking."}
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={importanceData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={140} stroke="var(--text-muted)" />
              <Tooltip
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => Number(v).toFixed(3)}
              />
              <Bar dataKey="importance" fill="#0d9488" radius={[0, 3, 3, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="mb-3 text-base font-bold">Confusion Matrices (held-out test split)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <div key={m.model} className="panel-muted p-3">
              <p className="mb-2 text-xs font-semibold">{MODEL_LABELS[m.model] ?? m.model}</p>
              <div className="grid grid-cols-2 gap-1 text-center text-[11px]">
                <div className="rounded p-2" style={{ background: "var(--risk-low-soft)", color: "var(--risk-low)" }}>
                  TN {m.confusion_matrix.true_negative}
                </div>
                <div className="rounded p-2" style={{ background: "var(--risk-high-soft)", color: "var(--risk-high)" }}>
                  FP {m.confusion_matrix.false_positive}
                </div>
                <div className="rounded p-2" style={{ background: "var(--risk-high-soft)", color: "var(--risk-high)" }}>
                  FN {m.confusion_matrix.false_negative}
                </div>
                <div className="rounded p-2" style={{ background: "var(--risk-low-soft)", color: "var(--risk-low)" }}>
                  TP {m.confusion_matrix.true_positive}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
