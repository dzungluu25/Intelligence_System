import { motion } from "framer-motion";
import { Compass, Download, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import type { PredictResponse, PropertyInput } from "../lib/types";
import { formatBillion, formatMillionPerM2, formatPercent } from "../lib/format";
import { MODEL_LABELS } from "../lib/labels";

function confidenceFromCount(count: number | undefined): { label: string; detail: string; level: "high" | "medium" | "low" } {
  const n = count ?? 0;
  if (n >= 50) return { label: "Độ tin cậy cao", detail: `Dựa trên ${n} giao dịch quanh khu vực này`, level: "high" };
  if (n >= 15) return { label: "Độ tin cậy trung bình", detail: `Dựa trên ${n} giao dịch quanh khu vực này`, level: "medium" };
  return { label: "Độ tin cậy thấp", detail: n > 0 ? `Chỉ có ${n} giao dịch tham chiếu ở khu vực này` : "Khu vực này ít dữ liệu tham chiếu", level: "low" };
}

export function PredictionResult({ result, input }: { result: PredictResponse; input: PropertyInput }) {
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

  const confidence = confidenceFromCount(result.districtStats?.count);
  const confidenceColor =
    confidence.level === "high" ? "var(--positive)" : confidence.level === "medium" ? "var(--accent)" : "var(--negative)";
  const confidenceBg =
    confidence.level === "high" ? "var(--positive-soft)" : confidence.level === "medium" ? "var(--accent-soft)" : "var(--negative-soft)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="surface p-6"
      id="prediction-report"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Kết quả ước tính</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-extrabold tracking-tight">{formatBillion(bestResult.price)}</span>
            <span className="text-sm text-muted">({MODEL_LABELS[bestResult.model]})</span>
          </div>
          <p className="text-sm text-muted mt-1">
            Khoảng giá dự kiến: {formatBillion(minPrice)} – {formatBillion(maxPrice)}
          </p>
        </div>

        <button
          className="btn-ghost !py-2 !px-3 text-xs no-print"
          onClick={() => window.print()}
          title="Tải báo cáo chi tiết dạng PDF"
        >
          <Download className="h-3.5 w-3.5" />
          Tải báo cáo (PDF)
        </button>
      </div>

      <div
        className="mt-4 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
        style={{ background: confidenceBg }}
      >
        <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: confidenceColor }} />
        <div>
          <p className="text-sm font-bold" style={{ color: confidenceColor }}>
            {confidence.label}
          </p>
          <p className="text-xs text-muted">{confidence.detail}</p>
        </div>
      </div>

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
        {input.houseDirection && (
          <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
            <Compass className="h-3.5 w-3.5" />
            Hướng nhà: {input.houseDirection}
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
