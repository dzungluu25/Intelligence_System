export const MODEL_LABELS: Record<string, string> = {
  linear_regression: "Hồi quy tuyến tính",
  svr_linear: "SVR (tuyến tính)",
  svr_rbf: "SVR (RBF)",
  knn: "K láng giềng gần nhất",
  random_forest: "Random Forest",
  xgboost: "XGBoost",
};

const FEATURE_LABELS: Record<string, string> = {
  Area: "Diện tích",
  Frontage: "Mặt tiền",
  "Access Road": "Đường vào",
  Floors: "Số tầng",
  Bedrooms: "Phòng ngủ",
  Bathrooms: "Phòng tắm",
  OTHER_FACTORS: "Các yếu tố khác",
};

const PREFIX_LABELS: [string, string][] = [
  ["House direction_", "Hướng nhà: "],
  ["Balcony direction_", "Hướng ban công: "],
  ["Legal status_", "Pháp lý: "],
  ["Furniture state_", "Nội thất: "],
  ["District_", "Quận/huyện: "],
];

export function translateFeatureName(rawName: string): string {
  if (rawName in FEATURE_LABELS) return FEATURE_LABELS[rawName];
  for (const [prefix, label] of PREFIX_LABELS) {
    if (rawName.startsWith(prefix)) {
      return `${label}${rawName.slice(prefix.length)}`;
    }
  }
  return rawName;
}
