"""
Persistent inference worker for the housing-price backend.

Protocol: newline-delimited JSON over stdin/stdout.
  in  -> {"id": <str>, "action": "predict"|"shap", "payload": {...}}
  out -> {"id": <str>, "ok": true, "data": {...}}
       | {"id": <str>, "ok": false, "error": <str>}

On startup, once every model/artifact is loaded, the worker prints a single
  {"type": "ready"}
line so the Node parent knows it's safe to start forwarding requests.
"""
import json
import sys

import joblib
import numpy as np
import pandas as pd
import shap

MODEL_NAMES = ["linear_regression", "svr_linear", "svr_rbf", "knn", "random_forest", "xgboost"]

scaler = joblib.load("scaler.pkl")
with open("feature_cols.json") as f:
    feature_cols = json.load(f)
with open("median_values.json") as f:
    median_values = json.load(f)
with open("metrics.json") as f:
    metrics = json.load(f)
with open("shap_background.json") as f:
    shap_background = np.array(json.load(f))

models = {name: joblib.load(f"{name}.pkl") for name in MODEL_NAMES}

explainers = {}
shap_background_summary = None
for name, model in models.items():
    try:
        if name in ("random_forest", "xgboost"):
            explainers[name] = shap.TreeExplainer(model)
        elif name in ("linear_regression", "svr_linear"):
            explainers[name] = shap.LinearExplainer(model, shap_background)
        elif name in ("svr_rbf", "knn"):
            if shap_background_summary is None:
                shap_background_summary = shap.kmeans(shap_background, 10)
            explainers[name] = shap.KernelExplainer(model.predict, shap_background_summary)
    except Exception as e:  # noqa: BLE001
        sys.stderr.write(f"[worker] failed to build explainer for {name}: {e}\n")


def build_row(payload):
    row = {col: 0.0 for col in feature_cols}

    def numeric(field, csv_col):
        val = payload.get(field)
        if val is None or val <= 0:
            return median_values.get(csv_col, 0.0)
        return float(val)

    row["Area"] = numeric("area", "Area")
    row["Frontage"] = numeric("frontage", "Frontage")
    row["Access Road"] = numeric("accessRoad", "Access Road")
    row["Floors"] = numeric("floors", "Floors")
    row["Bedrooms"] = numeric("bedrooms", "Bedrooms")
    row["Bathrooms"] = numeric("bathrooms", "Bathrooms")

    def set_dummy(prefix, value):
        if not value:
            return
        col_name = f"{prefix}_{value}"
        if col_name in row:
            row[col_name] = 1.0

    set_dummy("House direction", payload.get("houseDirection"))
    set_dummy("Balcony direction", payload.get("balconyDirection"))
    set_dummy("Legal status", payload.get("legalStatus"))
    set_dummy("Furniture state", payload.get("furnitureState"))

    district = (payload.get("district") or "").strip()
    for prefix in ("Quận ", "Huyện ", "Thị xã ", "Thành phố "):
        if district.startswith(prefix):
            district = district[len(prefix):]
            break
    set_dummy("District", district)

    df = pd.DataFrame([row])[feature_cols]
    return scaler.transform(df)


def handle_predict(payload):
    scaled = build_row(payload)
    results = []
    for name, model in models.items():
        pred_log = model.predict(scaled)[0]
        pred_price = float(np.expm1(pred_log))
        m = metrics.get(name, {})
        results.append({
            "model": name,
            "price": round(pred_price, 4),
            "r2": m.get("r2", 0.0),
            "mae": m.get("mae", 0.0),
            "mape": m.get("mape", 0.0),
        })
    return {"results": results, "scaledInput": scaled[0].tolist()}


def handle_shap(payload):
    model_name = payload["model"]
    scaled_input = np.array([payload["scaledInput"]])
    predicted_price = payload["predictedPrice"]

    if model_name not in explainers:
        return {"baseValue": 0.0, "contributions": []}

    explainer = explainers[model_name]
    if isinstance(explainer, shap.KernelExplainer):
        shap_vals = explainer.shap_values(scaled_input, nsamples=100)
    else:
        shap_vals = explainer.shap_values(scaled_input)

    sv = shap_vals[0] if isinstance(shap_vals, list) else shap_vals
    if len(sv.shape) > 1:
        sv = sv[0]

    base_log = explainer.expected_value
    base_log = float(base_log[0]) if hasattr(base_log, "__iter__") else float(base_log)
    base_price = float(np.expm1(base_log))

    predicted_log = float(np.log1p(predicted_price))
    total_log_change = predicted_log - base_log
    price_change = predicted_price - base_price
    multiplier = price_change / total_log_change if abs(total_log_change) > 1e-6 else float(np.exp(base_log))

    contributions = [
        {"feature": feature_cols[i], "value": float(sv[i]) * multiplier}
        for i in range(len(feature_cols))
    ]
    contributions.sort(key=lambda c: abs(c["value"]), reverse=True)

    top = [c for c in contributions[:10] if abs(c["value"]) > 0.001]
    others_sum = sum(c["value"] for c in contributions[10:])
    if abs(others_sum) > 0.001:
        top.append({"feature": "OTHER_FACTORS", "value": others_sum})

    return {"baseValue": base_price, "contributions": top}


ACTIONS = {"predict": handle_predict, "shap": handle_shap}

sys.stdout.write(json.dumps({"type": "ready"}) + "\n")
sys.stdout.flush()

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        handler = ACTIONS[req["action"]]
        data = handler(req.get("payload", {}))
        out = {"id": req["id"], "ok": True, "data": data}
    except Exception as e:  # noqa: BLE001
        out = {"id": req.get("id"), "ok": False, "error": str(e)}
    sys.stdout.write(json.dumps(out) + "\n")
    sys.stdout.flush()
