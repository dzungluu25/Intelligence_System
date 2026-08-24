import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { MetaResponse, PropertyInput } from "../lib/types";
import { LEGAL_STATUS_LABELS } from "../lib/labels";

const DEFAULT_INPUT: PropertyInput = {
  district: "",
  area: 80,
  frontage: 4.5,
  accessRoad: 6,
  floors: 3,
  bedrooms: 3,
  bathrooms: 2,
  houseDirection: "",
  balconyDirection: "",
  legalStatus: "",
  furnitureState: "",
};

const ALLEY_WIDTH_TIERS: { label: string; value: number }[] = [
  { label: "< 2m", value: 1.5 },
  { label: "2 – 3m", value: 2.5 },
  { label: "Ô tô vào được", value: 5 },
];

export function PredictForm({
  meta,
  loading,
  onSubmit,
}: {
  meta: MetaResponse | null;
  loading: boolean;
  onSubmit: (input: PropertyInput) => void;
}) {
  const [city, setCity] = useState("");
  const [values, setValues] = useState<PropertyInput>(DEFAULT_INPUT);

  const cities = meta ? Object.keys(meta.locations).sort() : [];
  const districts = meta && city ? meta.locations[city] ?? [] : [];

  const update = <K extends keyof PropertyInput>(key: K, value: PropertyInput[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form
      className="surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="mb-4">
        <h2 className="text-base font-bold">Thông tin bất động sản</h2>
        <p className="text-xs text-muted">Nhập thông tin để nhận ước tính giá từ 6 mô hình AI</p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Vị trí</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Tỉnh / Thành phố</label>
              <select
                className="input-field"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  update("district", "");
                }}
                required
              >
                <option value="">-- Chọn --</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Quận / Huyện</label>
              <select
                className="input-field"
                value={values.district}
                onChange={(e) => update("district", e.target.value)}
                disabled={!city}
                required
              >
                <option value="">-- Chọn --</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Kích thước</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Diện tích (m²)" value={values.area} onChange={(v) => update("area", v)} step={1} />
            <NumberField
              label="Mặt tiền (m)"
              value={values.frontage}
              onChange={(v) => update("frontage", v)}
              step={0.1}
            />
            <div className="col-span-2">
              <label className="field-label">Đường vào / Độ rộng ngõ (m)</label>
              <input
                type="number"
                step={0.1}
                min={0}
                className="input-field"
                value={values.accessRoad}
                onChange={(e) => update("accessRoad", e.target.value === "" ? 0 : Number(e.target.value))}
                required
              />
              <div className="mt-1.5 flex gap-1.5">
                {ALLEY_WIDTH_TIERS.map((tier) => (
                  <button
                    key={tier.label}
                    type="button"
                    className="chip"
                    style={{
                      background: values.accessRoad === tier.value ? "var(--accent-soft)" : "var(--bg-subtle)",
                      color: values.accessRoad === tier.value ? "var(--accent)" : "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                    onClick={() => update("accessRoad", tier.value)}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
            <NumberField label="Số tầng" value={values.floors} onChange={(v) => update("floors", v)} step={1} />
            <NumberField
              label="Phòng ngủ"
              value={values.bedrooms}
              onChange={(v) => update("bedrooms", v)}
              step={1}
            />
            <NumberField
              label="Phòng tắm"
              value={values.bathrooms}
              onChange={(v) => update("bathrooms", v)}
              step={1}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Đặc điểm khác</p>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Hướng nhà"
              value={values.houseDirection}
              options={meta?.categoricalOptions["House direction"] ?? []}
              onChange={(v) => update("houseDirection", v)}
            />
            <SelectField
              label="Hướng ban công"
              value={values.balconyDirection}
              options={meta?.categoricalOptions["Balcony direction"] ?? []}
              onChange={(v) => update("balconyDirection", v)}
            />
            <SelectField
              label="Pháp lý"
              value={values.legalStatus}
              options={meta?.categoricalOptions["Legal status"] ?? []}
              labelFor={(o) => LEGAL_STATUS_LABELS[o] ?? o}
              onChange={(v) => update("legalStatus", v)}
            />
            <SelectField
              label="Nội thất"
              value={values.furnitureState}
              options={meta?.categoricalOptions["Furniture state"] ?? []}
              onChange={(v) => update("furnitureState", v)}
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary mt-5 w-full" disabled={loading || !meta}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {loading ? "Đang tính toán..." : "Ước tính giá"}
      </button>
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type="number"
        step={step}
        min={0}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        required
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  labelFor,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  labelFor?: (raw: string) => string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">-- Chọn --</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labelFor ? labelFor(o) : o}
          </option>
        ))}
      </select>
    </div>
  );
}
