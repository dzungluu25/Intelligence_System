import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const client = axios.create({ baseURL: API_URL });

export type FeatureVector = {
  Pregnancies: number;
  Glucose: number;
  BloodPressure: number;
  SkinThickness: number;
  Insulin: number;
  BMI: number;
  DiabetesPedigreeFunction: number;
  Age: number;
};

export const FEATURE_ORDER: (keyof FeatureVector)[] = [
  "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
  "Insulin", "BMI", "DiabetesPedigreeFunction", "Age",
];

export type Consensus = {
  prediction: number;
  label: string;
  probability: number;
  agreement: number;
  votes_diabetic: number;
  votes_non_diabetic: number;
  models_count: number;
};

export type ModelSummary = { model: string; accuracy: number };

export type PredictResponse = {
  id: string;
  results: ModelSummary[];
  consensus: Consensus;
};

export type ShapFeature = { feature: string; value: number };

export type ModelDetail = {
  model: string;
  prediction: number;
  confidence: number;
  accuracy: number;
  shap_values: ShapFeature[];
};

export type ConfusionMatrix = {
  true_negative: number;
  false_positive: number;
  false_negative: number;
  true_positive: number;
};

export type FeatureImportance = { feature: string; importance: number };

export type ModelMetrics = {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion_matrix: ConfusionMatrix;
  feature_importance: FeatureImportance[];
};

export type FeatureRange = { min: number; max: number; mean: number; median: number; std: number };

export type DatasetStats = {
  n_samples: number;
  n_features: number;
  positive_rate: number;
  feature_ranges: Record<string, FeatureRange>;
};

export type HistoryEntry = {
  id: string;
  timestamp: string;
  features: FeatureVector;
  consensus: Consensus;
  topModel: ModelSummary;
};

export type BatchRowResult = {
  row: number;
  features?: FeatureVector;
  consensus?: Consensus;
  topModel?: ModelSummary;
  error?: string;
};

export type BatchResponse = {
  count: number;
  successCount: number;
  results: BatchRowResult[];
};

export const api = {
  health: () => client.get<{ ready: boolean; error: string | null }>("/api/health"),
  predict: (features: FeatureVector) => client.post<PredictResponse>("/api/predict", features),
  detail: (resultId: string, model: string) =>
    client.get<ModelDetail>(`/api/result/${resultId}`, { params: { model } }),
  models: () => client.get<{ models: ModelMetrics[] }>("/api/models"),
  dataset: () => client.get<DatasetStats>("/api/dataset"),
  history: (limit = 50) => client.get<{ history: HistoryEntry[] }>("/api/history", { params: { limit } }),
  clearHistory: () => client.delete("/api/history"),
  batchPredict: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return client.post<BatchResponse>("/api/batch-predict", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
