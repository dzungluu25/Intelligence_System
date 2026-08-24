import { useEffect, useState } from "react";
import { Clock, MapPin, Trash2 } from "lucide-react";
import type { HistoryEntry } from "../lib/types";
import { clearHistory, fetchHistory } from "../lib/api";
import { formatBillion, formatDate, formatNumber } from "../lib/format";
import { MODEL_LABELS } from "../lib/labels";

export function HistoryPanel() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);

  const load = () => {
    fetchHistory().then(setHistory).catch(() => setHistory([]));
  };

  useEffect(load, []);

  const handleClear = async () => {
    await clearHistory();
    load();
  };

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base font-bold">Lịch sử định giá</p>
          <p className="text-xs text-muted">Các lần ước tính gần đây của bạn</p>
        </div>
        {history && history.length > 0 && (
          <button className="btn-ghost !px-3 text-xs" onClick={handleClear}>
            <Trash2 className="h-3.5 w-3.5" />
            Xóa lịch sử
          </button>
        )}
      </div>

      {history === null && <p className="text-sm text-muted">Đang tải...</p>}
      {history !== null && history.length === 0 && (
        <p className="text-sm text-muted py-8 text-center">Chưa có lịch sử định giá nào.</p>
      )}

      <div className="space-y-2">
        {history?.map((h) => (
          <div key={h.id} className="surface-subtle p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
                {h.district}
              </p>
              <p className="text-[11px] text-muted mt-1 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatDate(h.timestamp)} · {formatNumber(h.area)} m² · {MODEL_LABELS[h.bestModel] ?? h.bestModel}
              </p>
            </div>
            <p className="text-sm font-bold shrink-0">{formatBillion(h.bestPrice)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
