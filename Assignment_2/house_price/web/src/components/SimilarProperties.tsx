import { useEffect, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import type { SimilarListing } from "../lib/types";
import { fetchSimilar } from "../lib/api";
import { formatBillion, formatNumber } from "../lib/format";

export function SimilarProperties({ district, area }: { district: string; area: number }) {
  const [open, setOpen] = useState(false);
  const [listings, setListings] = useState<SimilarListing[] | null>(null);

  useEffect(() => {
    if (!open || listings !== null) return;
    fetchSimilar(district, area, 5).then(setListings).catch(() => setListings([]));
  }, [open, district, area, listings]);

  return (
    <div className="surface overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="text-sm font-bold">Giao dịch lân cận</p>
          <p className="text-xs text-muted">Tin đăng thực tế gần khu vực và diện tích bạn nhập</p>
        </div>
        <ChevronDown
          className="h-4 w-4 text-muted transition-transform shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div className="border-t border-default px-5 py-4">
          {listings === null && <p className="text-sm text-muted">Đang tải...</p>}
          {listings !== null && listings.length === 0 && (
            <p className="text-sm text-muted">Không tìm thấy bất động sản tương tự.</p>
          )}
          <div className="space-y-2.5">
            {listings?.map((l, i) => (
              <div key={i} className="surface-subtle p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0 text-muted" />
                    <span className="truncate">{l.Address}</span>
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    {formatNumber(l.Area)} m² · {l.Bedrooms ?? "-"} PN · {l.Bathrooms ?? "-"} PT ·{" "}
                    {l["Legal status"] !== "Unknown" ? l["Legal status"] : "Chưa rõ pháp lý"}
                  </p>
                </div>
                <p className="text-sm font-bold shrink-0">{formatBillion(l.Price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
