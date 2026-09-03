import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { InsightsResponse, ModelName } from "../lib/types";
import { fetchInsights } from "../lib/api";
import { formatPercent } from "../lib/format";
import { MODEL_LABELS, translateFeatureName } from "../lib/labels";

const MODEL_ORDER: ModelName[] = ["xgboost", "random_forest", "svr_rbf", "knn", "linear_regression", "svr_linear"];

export function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelName>("random_forest");

  useEffect(() => {
    fetchInsights().then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return <p className="text-sm text-muted text-center py-10">Đang tải...</p>;
  }

  const r2Data = MODEL_ORDER.filter((m) => data.metrics[m]).map((m) => ({
    name: MODEL_LABELS[m] ?? m,
    r2: data.metrics[m].r2 * 100,
  }));

  const importanceModels = Object.keys(data.featureImportance) as ModelName[];
  const importanceData = (data.featureImportance[selectedModel] ?? [])
    .slice(0, 10)
    .map((f) => ({ name: translateFeatureName(f.feature), importance: f.importance }))
    .reverse();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-lg font-bold">Thống kê & so sánh mô hình</p>
        <p className="text-sm text-muted">Độ chính xác và các yếu tố quan trọng nhất theo từng mô hình</p>
      </div>

      <div className="surface p-5">
        <p className="text-sm font-bold mb-1">Độ chính xác theo mô hình (R²)</p>
        <p className="text-xs text-muted mb-4">Tỷ lệ phần trăm biến động giá được mô hình giải thích</p>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={r2Data} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                formatter={(value) => formatPercent(Number(value), 1)}
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="r2" radius={[6, 6, 0, 0]}>
                {r2Data.map((_, idx) => (
                  <Cell key={idx} fill={idx === 0 ? "var(--accent)" : "var(--border-strong)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface p-5">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <p className="text-sm font-bold">Mức độ quan trọng của đặc trưng</p>
          <select
            className="input-field !w-auto text-xs"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelName)}
          >
            {importanceModels.map((m) => (
              <option key={m} value={m}>
                {MODEL_LABELS[m] ?? m}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted mb-4">Những đặc trưng ảnh hưởng nhiều nhất đến dự đoán của mô hình đã chọn</p>
        <div style={{ width: "100%", height: Math.max(240, importanceData.length * 32) }}>
          <ResponsiveContainer>
            <BarChart data={importanceData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="importance" radius={4} fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface p-5 overflow-x-auto">
        <p className="text-sm font-bold mb-3">Bảng chi tiết</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-default">
              <th className="pb-2 font-semibold">Mô hình</th>
              <th className="pb-2 font-semibold">R²</th>
              <th className="pb-2 font-semibold">MAE (tỷ)</th>
              <th className="pb-2 font-semibold">RMSE (tỷ)</th>
              <th className="pb-2 font-semibold">MAPE</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_ORDER.filter((m) => data.metrics[m]).map((m) => (
              <tr key={m} className="border-b border-default last:border-0">
                <td className="py-2 font-medium">{MODEL_LABELS[m] ?? m}</td>
                <td className="py-2">{formatPercent(data.metrics[m].r2 * 100, 1)}</td>
                <td className="py-2">{data.metrics[m].mae.toFixed(3)}</td>
                <td className="py-2">{data.metrics[m].rmse.toFixed(3)}</td>
                <td className="py-2">{formatPercent(data.metrics[m].mape, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
