import type { Consensus } from "../api";

function riskColor(probability: number) {
  if (probability < 0.33) return "var(--risk-low)";
  if (probability < 0.66) return "var(--amber)";
  return "var(--risk-high)";
}

export function ConsensusGauge({ consensus }: { consensus: Consensus }) {
  const r = 72;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(Math.max(consensus.probability, 0), 1);
  const offset = circumference * (1 - pct);
  const color = riskColor(pct);
  const isHighRisk = consensus.prediction === 1;

  return (
    <div className="panel p-6 flex flex-col items-center text-center">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={r} fill="none" stroke="var(--panel-muted)" strokeWidth="14" />
          <circle
            cx="90" cy="90" r={r} fill="none"
            stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{(pct * 100).toFixed(1)}%</span>
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>diabetic risk score</span>
        </div>
      </div>

      <span className={`badge mt-4 ${isHighRisk ? "badge-high" : "badge-low"}`}>
        {consensus.label}
      </span>

      <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
        <strong style={{ color: "var(--text)" }}>{Math.round(consensus.agreement * 100)}% agreement</strong>{" "}
        — {consensus.votes_diabetic} of {consensus.models_count} models voted "diabetic"
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
        Accuracy-weighted ensemble across all trained models
      </p>
    </div>
  );
}
