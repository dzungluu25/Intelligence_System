import express from "express";
import cors from "cors";
import multer from "multer";
import { spawn } from "child_process";
import readline from "readline";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FEATURE_NAMES = [
  "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
  "Insulin", "BMI", "DiabetesPedigreeFunction", "Age",
];

const DATA_DIR = path.join(__dirname, "data");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");
const HISTORY_LIMIT = 200;
const MAX_BATCH_ROWS = 300;

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

function appendHistory(entry) {
  const history = readHistory();
  history.unshift(entry);
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history.slice(0, HISTORY_LIMIT), null, 2));
}

function validateFeatures(body) {
  const errors = [];
  for (const feature of FEATURE_NAMES) {
    if (typeof body[feature] !== "number" || Number.isNaN(body[feature])) {
      errors.push(feature);
    }
  }
  return errors;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV must contain a header row and at least one data row");

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = {};
    headers.forEach((header, i) => {
      const key = FEATURE_NAMES.find((f) => f.toLowerCase() === header.toLowerCase());
      if (key) row[key] = Number(cells[i]);
    });
    return row;
  });
  return rows;
}

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
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return "python3";
}

const PYTHON_BIN = resolvePython();
const WORKER_PATH = path.join(__dirname, "inference_worker.py");

let worker = null;
let ready = false;
let startupError = null;
const pending = new Map();

function startWorker() {
  ready = false;
  worker = spawn(PYTHON_BIN, ["-u", WORKER_PATH], { cwd: __dirname });

  const rl = readline.createInterface({ input: worker.stdout });
  rl.on("line", (line) => {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      console.error("[worker] non-JSON stdout:", line);
      return;
    }

    if (msg.event === "ready") {
      ready = true;
      startupError = null;
      console.log(`Inference worker ready with ${msg.models.length} models:`, msg.models.join(", "));
      return;
    }
    if (msg.event === "fatal") {
      startupError = msg.error;
      console.error("Inference worker failed to start:", msg.error);
      return;
    }

    const entry = pending.get(msg.req_id);
    if (!entry) return;
    pending.delete(msg.req_id);
    if (msg.ok) entry.resolve(msg.data);
    else entry.reject(new Error(msg.error || "Unknown worker error"));
  });

  worker.stderr.on("data", (chunk) => process.stderr.write(`[worker] ${chunk}`));
  worker.on("exit", (code) => {
    console.error(`Inference worker exited (code ${code}). Restarting in 1s...`);
    for (const { reject } of pending.values()) reject(new Error("Worker process exited"));
    pending.clear();
    ready = false;
    setTimeout(startWorker, 1000);
  });
}

function callWorker(cmd, payload, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    if (!ready || !worker) {
      return reject(new Error(startupError || "Model worker is not ready yet"));
    }
    const req_id = randomUUID();
    const timer = setTimeout(() => {
      pending.delete(req_id);
      reject(new Error("Worker request timed out"));
    }, timeoutMs);

    pending.set(req_id, {
      resolve: (data) => { clearTimeout(timer); resolve(data); },
      reject: (err) => { clearTimeout(timer); reject(err); },
    });

    worker.stdin.write(JSON.stringify({ cmd, req_id, ...payload }) + "\n");
  });
}

console.log(`Using Python interpreter: ${PYTHON_BIN}`);
startWorker();
ensureHistoryFile();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ready, error: startupError });
});

app.get("/api/models", async (req, res) => {
  try {
    const data = await callWorker("models", {});
    res.json(data);
  } catch (err) {
    res.status(503).json({ detail: err.message });
  }
});

app.get("/api/dataset", async (req, res) => {
  try {
    const data = await callWorker("dataset", {});
    res.json(data);
  } catch (err) {
    res.status(503).json({ detail: err.message });
  }
});

app.post("/api/predict", async (req, res) => {
  const body = req.body || {};
  const missing = validateFeatures(body);
  if (missing.length > 0) {
    return res.status(422).json({ detail: `Missing or invalid numeric field(s): ${missing.join(", ")}` });
  }
  try {
    const data = await callWorker("predict", { features: body });
    appendHistory({
      id: data.id,
      timestamp: new Date().toISOString(),
      features: body,
      consensus: data.consensus,
      topModel: data.results[0],
    });
    res.json(data);
  } catch (err) {
    console.error("Predict error:", err.message);
    res.status(503).json({ detail: err.message });
  }
});

app.get("/api/result/:resultId", async (req, res) => {
  const { resultId } = req.params;
  const { model } = req.query;
  if (!model) {
    return res.status(422).json({ detail: "model query parameter is required" });
  }
  try {
    const data = await callWorker("detail", { result_id: resultId, model });
    res.json(data);
  } catch (err) {
    const status = /not found/i.test(err.message) ? 404 : 503;
    res.status(status).json({ detail: err.message });
  }
});

app.get("/api/history", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, HISTORY_LIMIT);
  res.json({ history: readHistory().slice(0, limit) });
});

app.delete("/api/history", (req, res) => {
  fs.writeFileSync(HISTORY_PATH, "[]");
  res.json({ cleared: true });
});

app.post("/api/batch-predict", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(422).json({ detail: "Upload a CSV file under the 'file' field" });
  }

  let rows;
  try {
    rows = parseCsv(req.file.buffer.toString("utf-8"));
  } catch (err) {
    return res.status(422).json({ detail: err.message });
  }

  if (rows.length > MAX_BATCH_ROWS) {
    return res.status(422).json({ detail: `Batch limited to ${MAX_BATCH_ROWS} rows (got ${rows.length})` });
  }

  const results = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const missing = validateFeatures(row);
    if (missing.length > 0) {
      results.push({ row: i + 1, error: `Missing or invalid field(s): ${missing.join(", ")}` });
      continue;
    }
    try {
      const data = await callWorker("predict", { features: row });
      results.push({ row: i + 1, features: row, consensus: data.consensus, topModel: data.results[0] });
    } catch (err) {
      results.push({ row: i + 1, error: err.message });
    }
  }

  res.json({
    count: results.length,
    successCount: results.filter((r) => !r.error).length,
    results,
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Node.js API server listening on http://localhost:${PORT}`);
});
