"""
Long-running Python worker that loads the trained scikit-learn/XGBoost models
once and serves predictions over a line-delimited JSON protocol on stdin/stdout.

Node.js (server.js) is the actual web server / API layer; this process only
does the model math, because the trained artifacts are scikit-learn/XGBoost
pickles that Node cannot load natively.

Protocol (one JSON object per line):
  in:  {"cmd": "predict", "req_id": "...", "features": {...}}
       {"cmd": "detail",  "req_id": "...", "result_id": "...", "model": "..."}
       {"cmd": "models",  "req_id": "..."}
       {"cmd": "dataset", "req_id": "..."}
  out: {"event": "ready", "models": [...]}                 (once, at startup)
       {"event": "fatal", "error": "..."}                  (startup failure)
       {"req_id": "...", "ok": true,  "data": {...}}
       {"req_id": "...", "ok": false, "error": "..."}
"""
import sys
import os
import json
import uuid
import warnings
warnings.filterwarnings("ignore")

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.inspection import permutation_importance

FEATURE_NAMES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age",
]
NON_MODEL_FILES = {"scaler.pkl", "imputer.pkl", "baseline.pkl"}
TREE_MODELS = {"random_forest", "xgboost"}

results_db = {}
models = {}
model_accuracies = {}
model_metrics = {}
explainers = {}
dataset_stats = {}
scaler = None


def compute_feature_importance(model_name, model, X_test, X_test_scaled, y_test):
    """Derive per-feature importance straight from each trained model/dataset,
    rather than a generic placeholder: native importances where the model
    exposes them, permutation importance (on the held-out test split) otherwise.
    """
    is_tree = model_name in TREE_MODELS
    eval_X = X_test if is_tree else X_test_scaled

    if hasattr(model, "feature_importances_"):
        raw = np.asarray(model.feature_importances_, dtype=float)
    elif hasattr(model, "coef_"):
        raw = np.abs(np.asarray(model.coef_)).reshape(-1, len(FEATURE_NAMES)).mean(axis=0)
    else:
        result = permutation_importance(
            model, eval_X, y_test, n_repeats=10, random_state=42, n_jobs=-1
        )
        raw = np.clip(result.importances_mean, a_min=0, a_max=None)

    total = raw.sum()
    normalized = raw / total if total > 0 else raw
    ranked = sorted(
        zip(FEATURE_NAMES, normalized.tolist()), key=lambda item: item[1], reverse=True
    )
    return [{"feature": name, "importance": float(value)} for name, value in ranked]


def compute_dataset_stats(df, cols_to_impute):
    """Real min/max/mean/median per feature from the training data, so the UI
    can show clinically meaningful input hints instead of arbitrary ranges.
    Zero placeholders in the imputed columns are excluded (0 is not a valid
    Glucose/BMI/etc. reading in this dataset — it means 'missing').
    """
    stats = {}
    for feature in FEATURE_NAMES:
        col = df[feature]
        if feature in cols_to_impute:
            col = col[col != 0]
        stats[feature] = {
            "min": float(col.min()),
            "max": float(col.max()),
            "mean": float(col.mean()),
            "median": float(col.median()),
            "std": float(col.std()),
        }
    return stats


def emit(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def load_resources():
    global scaler, models, model_accuracies, model_metrics, explainers, dataset_stats

    df = pd.read_csv("diabetes_dataset.csv")
    X = df[FEATURE_NAMES]
    y = df["Outcome"]

    cols_to_impute = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
    dataset_stats = {
        "n_samples": int(len(df)),
        "n_features": len(FEATURE_NAMES),
        "positive_rate": float(y.mean()),
        "feature_ranges": compute_dataset_stats(df, cols_to_impute),
    }

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    X_train, X_test = X_train.copy(), X_test.copy()

    imputer = joblib.load("imputer.pkl")
    X_train[cols_to_impute] = X_train[cols_to_impute].replace(0, np.nan)
    X_test[cols_to_impute] = X_test[cols_to_impute].replace(0, np.nan)
    X_train[cols_to_impute] = imputer.transform(X_train[cols_to_impute])
    X_test[cols_to_impute] = imputer.transform(X_test[cols_to_impute])

    scaler = joblib.load("scaler.pkl")
    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    background_data = shap.sample(X_train_scaled, 50)

    model_files = [f for f in os.listdir(".") if f.endswith(".pkl") and f not in NON_MODEL_FILES]
    for f in model_files:
        model_name = f.replace(".pkl", "")
        model = joblib.load(f)
        models[model_name] = model

        preds = model.predict(X_test if model_name in TREE_MODELS else X_test_scaled)
        model_accuracies[model_name] = float(accuracy_score(y_test, preds))

        cm = confusion_matrix(y_test, preds, labels=[0, 1])
        model_metrics[model_name] = {
            "accuracy": float(accuracy_score(y_test, preds)),
            "precision": float(precision_score(y_test, preds, zero_division=0)),
            "recall": float(recall_score(y_test, preds, zero_division=0)),
            "f1": float(f1_score(y_test, preds, zero_division=0)),
            "confusion_matrix": {
                "true_negative": int(cm[0][0]),
                "false_positive": int(cm[0][1]),
                "false_negative": int(cm[1][0]),
                "true_positive": int(cm[1][1]),
            },
            "feature_importance": compute_feature_importance(
                model_name, model, X_test, X_test_scaled, y_test
            ),
        }

        try:
            if model_name in TREE_MODELS:
                explainers[model_name] = shap.TreeExplainer(model)
            else:
                explainers[model_name] = shap.KernelExplainer(model.predict_proba, background_data)
        except Exception as e:
            sys.stderr.write(f"Explainer setup failed for {model_name}: {e}\n")
            if hasattr(model, "predict_proba"):
                explainers[model_name] = shap.KernelExplainer(model.predict_proba, background_data)
            else:
                explainers[model_name] = shap.KernelExplainer(model.predict, background_data)


def handle_predict(payload):
    req_dict = payload["features"]
    missing = [f for f in FEATURE_NAMES if f not in req_dict]
    if missing:
        raise ValueError(f"Missing features: {', '.join(missing)}")

    features = np.array([[float(req_dict[f]) for f in FEATURE_NAMES]])
    scaled_features = scaler.transform(features)

    result_id = str(uuid.uuid4())
    results_db[result_id] = {}
    summary_list = []
    votes = []  # (model_name, pred, proba_diabetic, accuracy)

    for model_name, model in models.items():
        is_tree = model_name in TREE_MODELS
        model_input = features if is_tree else scaled_features

        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(model_input)[0]
            pred = int(np.argmax(proba))
            confidence = float(proba[pred])
            proba_diabetic = float(proba[1]) if len(proba) > 1 else float(pred)
        else:
            pred = int(model.predict(model_input)[0])
            confidence = 1.0
            proba_diabetic = float(pred)

        votes.append((model_name, pred, proba_diabetic, model_accuracies.get(model_name, 0.0)))

        explainer = explainers.get(model_name)
        shap_features = []
        if explainer:
            shap_vals = explainer.shap_values(model_input)
            if isinstance(shap_vals, list):
                sv = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
            elif shap_vals.ndim == 3:
                sv = shap_vals[0, :, 1] if shap_vals.shape[2] > 1 else shap_vals[0, :, 0]
            else:
                sv = shap_vals[0]
            for i, f_name in enumerate(FEATURE_NAMES):
                shap_features.append({"feature": f_name, "value": float(sv[i])})

        acc = model_accuracies.get(model_name, 0.0)

        results_db[result_id][model_name] = {
            "model": model_name,
            "prediction": pred,
            "confidence": confidence,
            "accuracy": acc,
            "shap_values": shap_features,
        }
        summary_list.append({"model": model_name, "accuracy": acc})

    summary_list.sort(key=lambda x: x["accuracy"], reverse=True)

    total_weight = sum(acc for _, _, _, acc in votes) or 1.0
    weighted_probability = sum(p * acc for _, _, p, acc in votes) / total_weight
    majority_pred = 1 if weighted_probability >= 0.5 else 0
    votes_diabetic = sum(1 for _, pred, _, _ in votes if pred == 1)
    votes_non_diabetic = len(votes) - votes_diabetic
    agreeing = votes_diabetic if majority_pred == 1 else votes_non_diabetic

    consensus = {
        "prediction": majority_pred,
        "label": "Diabetic" if majority_pred == 1 else "Non-Diabetic",
        "probability": float(weighted_probability),
        "agreement": float(agreeing / len(votes)) if votes else 0.0,
        "votes_diabetic": votes_diabetic,
        "votes_non_diabetic": votes_non_diabetic,
        "models_count": len(votes),
    }

    return {"id": result_id, "results": summary_list, "consensus": consensus}


def handle_models(payload):
    rows = [
        {"model": name, **model_metrics.get(name, {"accuracy": model_accuracies.get(name, 0.0)})}
        for name in models.keys()
    ]
    rows.sort(key=lambda x: x.get("f1", x.get("accuracy", 0.0)), reverse=True)
    return {"models": rows}


def handle_dataset(payload):
    return dataset_stats


def handle_detail(payload):
    result_id = payload["result_id"]
    model_name = payload["model"]
    if result_id not in results_db:
        raise LookupError("Result ID not found")
    if model_name not in results_db[result_id]:
        raise LookupError("Model not found for this result")
    return results_db[result_id][model_name]


def main():
    try:
        load_resources()
    except Exception as e:
        emit({"event": "fatal", "error": str(e)})
        sys.exit(1)

    emit({"event": "ready", "models": list(models.keys())})

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue

        req_id = payload.get("req_id")
        cmd = payload.get("cmd")
        try:
            if cmd == "predict":
                data = handle_predict(payload)
            elif cmd == "detail":
                data = handle_detail(payload)
            elif cmd == "models":
                data = handle_models(payload)
            elif cmd == "dataset":
                data = handle_dataset(payload)
            else:
                raise ValueError(f"Unknown command: {cmd}")
            emit({"req_id": req_id, "ok": True, "data": data})
        except Exception as e:
            emit({"req_id": req_id, "ok": False, "error": str(e)})


if __name__ == "__main__":
    main()
