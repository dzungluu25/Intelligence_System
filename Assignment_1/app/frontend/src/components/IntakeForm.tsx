import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import type { DatasetStats, FeatureVector } from "../api";
import { FEATURE_ORDER } from "../api";

const SAMPLE: FeatureVector = {
  Pregnancies: 2, Glucose: 130, BloodPressure: 70, SkinThickness: 25,
  Insulin: 90, BMI: 28.5, DiabetesPedigreeFunction: 0.45, Age: 33,
};

const FIELD_META: Record<keyof FeatureVector, { label: string; unit: string; step: string }> = {
  Pregnancies: { label: "Pregnancies", unit: "count", step: "1" },
  Glucose: { label: "Plasma Glucose", unit: "mg/dL", step: "1" },
  BloodPressure: { label: "Blood Pressure", unit: "mm Hg", step: "1" },
  SkinThickness: { label: "Skin Thickness", unit: "mm", step: "1" },
  Insulin: { label: "Serum Insulin", unit: "mu U/mL", step: "1" },
  BMI: { label: "Body Mass Index", unit: "kg/m²", step: "0.1" },
  DiabetesPedigreeFunction: { label: "Pedigree Function", unit: "score", step: "0.001" },
  Age: { label: "Age", unit: "years", step: "1" },
};

export function IntakeForm({
  onSubmit,
  loading,
  datasetStats,
}: {
  onSubmit: (features: FeatureVector) => void;
  loading: boolean;
  datasetStats: DatasetStats | null;
}) {
  const [values, setValues] = useState<FeatureVector>(SAMPLE);

  const handleChange = (key: keyof FeatureVector, raw: string) => {
    setValues((prev) => ({ ...prev, [key]: raw === "" ? 0 : Number(raw) }));
  };

  return (
    <form
      className="panel p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">Patient Intake</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Values pre-filled with a sample profile — edit before assessing
          </p>
        </div>
        <Activity className="h-5 w-5" style={{ color: "var(--brand)" }} />
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {FEATURE_ORDER.map((key) => {
          const meta = FIELD_META[key];
          const range = datasetStats?.feature_ranges[key];
          return (
            <div key={key}>
              <label className="field-label" htmlFor={key}>{meta.label}</label>
              <div className="relative">
                <input
                  id={key}
                  type="number"
                  step={meta.step}
                  className="field-input pr-14"
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  required
                />
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {meta.unit}
                </span>
              </div>
              {range && (
                <p className="field-hint">
                  Dataset range {Math.round(range.min)}–{Math.round(range.max)}, typical ≈ {Math.round(range.median)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button type="submit" className="btn-primary mt-5 w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
        {loading ? "Running ensemble..." : "Run Assessment"}
      </button>
    </form>
  );
}

export { SAMPLE };
