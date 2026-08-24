import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { MetaResponse, PropertyInput } from "../lib/types";

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
            <NumberField
              label="Đường vào (m)"
              value={values.accessRoad}
              onChange={(v) => update("accessRoad", v)}
              step={0.1}
            />
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
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">-- Chọn --</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
