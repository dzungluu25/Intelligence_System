import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { MetaResponse, PredictResponse, PropertyInput } from "../lib/types";
import { fetchMeta, predict } from "../lib/api";
import { PredictForm } from "../components/PredictForm";
import { PredictionResult } from "../components/PredictionResult";
import { ModelComparison } from "../components/ModelComparison";
import { SimilarProperties } from "../components/SimilarProperties";

export function PredictPage() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [lastInput, setLastInput] = useState<PropertyInput | null>(null);

  useEffect(() => {
    fetchMeta()
      .then(setMeta)
      .catch(() => setError("Không thể kết nối máy chủ. Vui lòng thử lại sau."));
  }, []);

  const handleSubmit = async (input: PropertyInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predict(input);
      setResult(res);
      setLastInput(input);
    } catch {
      setError("Đã có lỗi xảy ra khi ước tính giá. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
      <div>
        <PredictForm meta={meta} loading={loading} onSubmit={handleSubmit} />
      </div>

      <div className="space-y-5">
        {error && (
          <div
            className="surface p-4 flex items-center gap-2 text-sm"
            style={{ color: "var(--negative)", borderColor: "var(--negative)" }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!result && !error && (
          <div className="surface p-10 text-center">
            <p className="text-sm text-muted">
              Điền thông tin bất động sản bên trái và nhấn "Ước tính giá" để xem kết quả từ 6 mô hình AI.
            </p>
          </div>
        )}

        {result && (
          <>
            <PredictionResult result={result} />
            <ModelComparison result={result} />
            {lastInput && <SimilarProperties district={lastInput.district} area={lastInput.area} />}
          </>
        )}
      </div>
    </div>
  );
}
