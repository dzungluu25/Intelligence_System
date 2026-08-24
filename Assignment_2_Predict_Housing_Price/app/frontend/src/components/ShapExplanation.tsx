import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";
import type { ShapResponse } from "../lib/types";
import { fetchShap } from "../lib/api";
import { formatBillion } from "../lib/format";
import { translateFeatureName } from "../lib/labels";

export function ShapExplanation({ resultId, model }: { resultId: string; model: string }) {
  const [data, setData] = useState<ShapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetchShap(resultId, model)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải giải thích cho mô hình này.");
      });
    return () => {
      cancelled = true;
    };
  }, [resultId, model]);

  if (error) {
    return <p className="text-sm text-muted py-6 text-center">{error}</p>;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang phân tích các yếu tố ảnh hưởng...
      </div>
    );
  }

  const contributions = data.contributions;
  const increasing = contributions.filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
  const decreasing = contributions.filter((c) => c.value < 0).sort((a, b) => a.value - b.value);

  const chartData = contributions
    .map((c) => ({ name: translateFeatureName(c.feature), value: c.value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 8)
    .reverse();

  const topIncreasing = increasing[0];
  const topDecreasing = decreasing[0];

  return (
    <div>
      <p className="text-sm mb-4">
        {topIncreasing && (
          <>
            <strong style={{ color: "var(--positive)" }}>{translateFeatureName(topIncreasing.feature)}</strong> là
            yếu tố tăng giá nhiều nhất
            {topDecreasing && (
              <>
                , trong khi{" "}
                <strong style={{ color: "var(--negative)" }}>{translateFeatureName(topDecreasing.feature)}</strong>{" "}
                kéo giá xuống.
              </>
            )}
          </>
        )}
      </p>

      <div style={{ width: "100%", height: Math.max(220, chartData.length * 34) }}>
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
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
              formatter={(value) => formatBillion(Number(value))}
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={4}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.value >= 0 ? "var(--positive)" : "var(--negative)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-5 mt-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--positive)" }} />
          Tăng giá
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--negative)" }} />
          Giảm giá
        </span>
      </div>
    </div>
  );
}
