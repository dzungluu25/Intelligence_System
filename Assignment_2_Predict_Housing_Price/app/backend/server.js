import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import readline from "readline";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");
const HISTORY_LIMIT = 100;

function ensureHistoryFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_PATH)) fs.writeFileSync(HISTORY_PATH, "[]");
}
function readHistory() {
  ensureHistoryFile();
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
  } catch {
    return [];
  }
}
function writeHistory(list) {
  ensureHistoryFile();
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(list, null, 2));
}

function loadJSON(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, name), "utf-8"));
}

const locations = loadJSON("locations.json");
const categoricalOptions = loadJSON("categorical_options.json");
const districtStats = loadJSON("district_stats.json");
const metrics = loadJSON("metrics.json");
const featureImportance = loadJSON("feature_importance.json");
const listings = loadJSON("listings.json");

function resolvePython() {
  if (process.env.PYTHON_BIN && fs.existsSync(process.env.PYTHON_BIN)) {
    return process.env.PYTHON_BIN;
  }
  const candidates = [
    path.join(__dirname, "../../../venv/bin/python3"),
    path.join(__dirname, "../../../venv/bin/python"),
    path.join(__dirname, "../../../intelligent_system_assignments/venv/bin/python3"),
    path.join(__dirname, "../venv/bin/python3"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return "python3";
}

const PYTHON_BIN = resolvePython();
const WORKER_PATH = path.join(__dirname, "inference_worker.py");

let worker = null;
let ready = false;
let workerError = null;
const pending = new Map();

function startWorker() {
  console.log(`Using Python interpreter: ${PYTHON_BIN}`);
  worker = spawn(PYTHON_BIN, ["-u", WORKER_PATH], { cwd: __dirname });

  const rl = readline.createInterface({ input: worker.stdout });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (msg.type === "ready") {
      ready = true;
      console.log("Inference worker ready.");
      return;
    }
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    if (msg.ok) entry.resolve(msg.data);
    else entry.reject(new Error(msg.error || "worker error"));
  });

  worker.stderr.on("data", (chunk) => {
    process.stderr.write(`[worker] ${chunk}`);
  });

  worker.on("exit", (code) => {
    ready = false;
    workerError = `worker exited with code ${code}`;
    console.error(workerError);
    for (const { reject } of pending.values()) reject(new Error(workerError));
    pending.clear();
    setTimeout(startWorker, 2000);
  });
}
startWorker();

function callWorker(action, payload) {
  return new Promise((resolve, reject) => {
    if (!ready) {
      reject(new Error(workerError || "inference worker is not ready yet"));
      return;
    }
    const id = randomUUID();
    pending.set(id, { resolve, reject });
    worker.stdin.write(JSON.stringify({ id, action, payload }) + "\n");
  });
}

const resultsDb = new Map();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ready, error: workerError });
});

app.get("/api/meta", (req, res) => {
  res.json({ locations, categoricalOptions, districtStats });
});

app.get("/api/insights", (req, res) => {
  res.json({ metrics, featureImportance });
});

app.get("/api/history", (req, res) => {
  res.json(readHistory());
});

app.delete("/api/history", (req, res) => {
  writeHistory([]);
  res.json({ ok: true });
});

app.post("/api/predict", async (req, res) => {
  try {
    const payload = req.body || {};
    const data = await callWorker("predict", payload);

    const id = randomUUID();
    resultsDb.set(id, {
      scaledInput: data.scaledInput,
      payload,
      results: Object.fromEntries(data.results.map((r) => [r.model, r])),
    });

    const bestModel = [...data.results].sort((a, b) => b.r2 - a.r2)[0];
    const pricePerM2 = payload.area > 0 ? (bestModel.price * 1000) / payload.area : null;
    const stats = districtStats[payload.district] || null;

    const historyEntry = {
      id,
      timestamp: new Date().toISOString(),
      district: payload.district,
      area: payload.area,
      bestModel: bestModel.model,
      bestPrice: bestModel.price,
    };
    const history = readHistory();
    history.unshift(historyEntry);
    writeHistory(history.slice(0, HISTORY_LIMIT));

    res.json({
      id,
      results: data.results,
      bestModel: bestModel.model,
      pricePerM2,
      districtStats: stats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/result/:id", async (req, res) => {
  const entry = resultsDb.get(req.params.id);
  if (!entry) return res.status(404).json({ error: "result not found" });

  const modelName = req.query.model;
  const modelResult = entry.results[modelName];
  if (!modelResult) return res.status(404).json({ error: "model not found for this result" });

  try {
    if (!modelResult.shap) {
      const shapData = await callWorker("shap", {
        model: modelName,
        scaledInput: entry.scaledInput,
        predictedPrice: modelResult.price,
      });
      modelResult.shap = shapData;
    }
    res.json({
      model: modelName,
      price: modelResult.price,
      r2: modelResult.r2,
      mae: modelResult.mae,
      mape: modelResult.mape,
      baseValue: modelResult.shap.baseValue,
      contributions: modelResult.shap.contributions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/similar", (req, res) => {
  const { district, area, limit = 5 } = req.query;
  const targetArea = Number(area) || null;

  let candidates = listings;
  if (district) {
    candidates = candidates.filter((l) => l.District === district);
  }
  if (targetArea) {
    candidates = [...candidates].sort(
      (a, b) => Math.abs(a.Area - targetArea) - Math.abs(b.Area - targetArea)
    );
  }
  res.json(candidates.slice(0, Number(limit)));
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Housing price API listening on http://localhost:${PORT}`);
});
