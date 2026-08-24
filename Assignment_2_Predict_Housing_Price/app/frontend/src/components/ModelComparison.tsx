import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import type { PredictResponse } from "../lib/types";
import { formatBillion, formatPercent } from "../lib/format";
import { MODEL_LABELS } from "../lib/labels";
import { ShapExplanation } from "./ShapExplanation";

export function ModelComparison({ result }: { result: PredictResponse }) {
  const [expanded, setExpanded] = useState<string | null>(result.bestModel);
  const sorted = [...result.results].sort((a, b) => b.r2 - a.r2);

  return (
    <div className="surface p-5">
      <p className="text-base font-bold">So sánh 6 mô hình</p>
      <p className="text-xs text-muted mb-4">Mỗi mô hình học một cách khác nhau — nhấn để xem giải thích chi tiết</p>

      <div className="space-y-2">
        {sorted.map((r) => {
          const isBest = r.model === result.bestModel;
          const isOpen = expanded === r.model;
          return (
            <div
              key={r.model}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: isBest ? "var(--accent)" : "var(--border)" }}
            >
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ background: isOpen ? "var(--bg-subtle)" : "transparent" }}
                onClick={() => setExpanded(isOpen ? null : r.model)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isBest && <Sparkles className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />}
                  <span className="font-semibold text-sm truncate">{MODEL_LABELS[r.model] ?? r.model}</span>
                  {isBest && (
                    <span
                      className="chip !py-0.5 !px-2 text-[10px] shrink-0"
                      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      TỐT NHẤT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-sm">{formatBillion(r.price)}</span>
                  <span className="text-xs text-muted hidden sm:inline">R² {formatPercent(r.r2 * 100, 0)}</span>
                  <ChevronDown
                    className="h-4 w-4 text-muted transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </div>
              </button>

              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div className="px-4 py-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <StatTile label="R²" value={formatPercent(r.r2 * 100, 1)} />
                      <StatTile label="MAE" value={`${r.mae.toFixed(2)} tỷ`} />
                      <StatTile label="MAPE" value={formatPercent(r.mape, 1)} />
                    </div>
                    <ShapExplanation resultId={result.id} model={r.model} />
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-subtle px-3 py-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}
