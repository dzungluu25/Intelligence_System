import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { PredictResponse } from "../lib/types";
import { formatBillion, formatMillionPerM2, formatPercent } from "../lib/format";
import { MODEL_LABELS } from "../lib/labels";

export function PredictionResult({ result }: { result: PredictResponse }) {
  const prices = result.results.map((r) => r.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const bestResult = result.results.find((r) => r.model === result.bestModel)!;

  const spread = maxPrice - minPrice;
  const agreementPct = Math.max(0, 100 - (spread / bestResult.price) * 100);

  const districtDiff =
    result.districtStats && result.pricePerM2
      ? ((result.pricePerM2 - result.districtStats.avgPricePerM2) / result.districtStats.avgPricePerM2) * 100
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="surface p-6"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Kết quả ước tính</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-4xl font-extrabold tracking-tight">{formatBillion(bestResult.price)}</span>
        <span className="text-sm text-muted">({MODEL_LABELS[bestResult.model]})</span>
      </div>
      <p className="text-sm text-muted mt-1">
        Khoảng giá dự kiến: {formatBillion(minPrice)} – {formatBillion(maxPrice)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {result.pricePerM2 !== null && (
          <span className="chip" style={{ background: "var(--bg-subtle)", color: "var(--text)" }}>
            {formatMillionPerM2(result.pricePerM2)}
          </span>
        )}
        <span
          className="chip"
          style={{
            background: agreementPct > 70 ? "var(--positive-soft)" : "var(--accent-soft)",
            color: agreementPct > 70 ? "var(--positive)" : "var(--accent)",
          }}
        >
          {formatPercent(agreementPct, 0)} đồng thuận giữa các mô hình
        </span>
        {districtDiff !== null && (
          <span
            className="chip"
            style={{
              background: districtDiff >= 0 ? "var(--negative-soft)" : "var(--positive-soft)",
              color: districtDiff >= 0 ? "var(--negative)" : "var(--positive)",
            }}
          >
            {districtDiff >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {formatPercent(Math.abs(districtDiff), 0)} {districtDiff >= 0 ? "cao hơn" : "thấp hơn"} trung bình khu
            vực
          </span>
        )}
      </div>

      <p className="text-xs text-faint mt-4">
        Mô hình được huấn luyện trên hơn 30.000 tin đăng thực tế tại Việt Nam. Đây là ước tính tham khảo, không thay
        thế thẩm định chuyên nghiệp.
      </p>
    </motion.div>
  );
}
