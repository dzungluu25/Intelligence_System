export function formatBillion(value: number): string {
  const num = value.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${num} tỷ`;
}

export function formatMillionPerM2(value: number): string {
  const num = value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  return `${num} triệu/m²`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: digits });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
