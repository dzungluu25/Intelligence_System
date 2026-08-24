import axios from "axios";
import type {
  HistoryEntry,
  InsightsResponse,
  MetaResponse,
  PredictResponse,
  PropertyInput,
  ShapResponse,
  SimilarListing,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8001/api";

const client = axios.create({ baseURL: API_BASE });
client.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

export async function fetchHealth(): Promise<{ ready: boolean; error: string | null }> {
  const { data } = await client.get("/health");
  return data;
}

export async function fetchMeta(): Promise<MetaResponse> {
  const { data } = await client.get("/meta");
  return data;
}

export async function fetchInsights(): Promise<InsightsResponse> {
  const { data } = await client.get("/insights");
  return data;
}

export async function predict(input: PropertyInput): Promise<PredictResponse> {
  const { data } = await client.post("/predict", input);
  return data;
}

export async function fetchShap(resultId: string, model: string): Promise<ShapResponse> {
  const { data } = await client.get(`/result/${resultId}`, { params: { model } });
  return data;
}

export async function fetchSimilar(district: string, area: number, limit = 5): Promise<SimilarListing[]> {
  const { data } = await client.get("/similar", { params: { district, area, limit } });
  return data;
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const { data } = await client.get("/history");
  return data;
}

export async function clearHistory(): Promise<void> {
  await client.delete("/history");
}
