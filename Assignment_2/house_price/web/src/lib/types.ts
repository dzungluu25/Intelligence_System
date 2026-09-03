export interface PropertyInput {
  district: string;
  area: number;
  frontage: number;
  accessRoad: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  houseDirection: string;
  balconyDirection: string;
  legalStatus: string;
  furnitureState: string;
}

export interface ModelResult {
  model: ModelName;
  price: number;
  r2: number;
  mae: number;
  mape: number;
}

export type ModelName =
  | "linear_regression"
  | "svr_linear"
  | "svr_rbf"
  | "knn"
  | "random_forest"
  | "xgboost";

export interface DistrictStats {
  city: string;
  count: number;
  avgPrice: number;
  avgPricePerM2: number;
}

export interface PredictResponse {
  id: string;
  results: ModelResult[];
  bestModel: ModelName;
  pricePerM2: number | null;
  districtStats: DistrictStats | null;
}

export interface ShapContribution {
  feature: string;
  value: number;
}

export interface ShapResponse {
  model: ModelName;
  price: number;
  r2: number;
  mae: number;
  mape: number;
  baseValue: number;
  contributions: ShapContribution[];
}

export interface MetaResponse {
  locations: Record<string, string[]>;
  categoricalOptions: {
    "House direction": string[];
    "Balcony direction": string[];
    "Legal status": string[];
    "Furniture state": string[];
  };
  districtStats: Record<string, DistrictStats>;
}

export interface ModelMetrics {
  r2: number;
  mae: number;
  rmse: number;
  mape: number;
}

export interface FeatureImportanceEntry {
  feature: string;
  importance: number;
}

export interface InsightsResponse {
  metrics: Record<ModelName, ModelMetrics>;
  featureImportance: Partial<Record<ModelName, FeatureImportanceEntry[]>>;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  district: string;
  area: number;
  bestModel: ModelName;
  bestPrice: number;
}

export interface SimilarListing {
  Address: string;
  District: string;
  City: string;
  Area: number;
  Frontage: number | null;
  Floors: number | null;
  Bedrooms: number | null;
  Bathrooms: number | null;
  "Legal status": string;
  "Furniture state": string;
  Price: number;
}
