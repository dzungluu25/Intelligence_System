"""
Trains all six regression models on the Vietnam housing dataset and persists
every artifact the Node.js backend / Python inference worker need at runtime:

  - {model_name}.pkl        one per model (linear_regression, svr_linear,
                             svr_rbf, knn, random_forest, xgboost)
  - scaler.pkl               StandardScaler fit on the TRAIN split only
  - feature_cols.json        exact one-hot column order the models expect
  - median_values.json       per-numeric-column training medians (for
                              imputing missing/omitted request fields)
  - locations.json           {city: [districts]} derived from the dataset
  - metrics.json             real R2 / MAE / RMSE / MAPE per model, computed
                              on the held-out test split (replaces the
                              hardcoded lookup tables the old FastAPI backend
                              shipped with)
  - feature_importance.json  native feature importances for the two
                              tree-based models (random_forest, xgboost)

Run once after changing the dataset or model choices:
    python train_all.py
"""
import json
import time

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR, LinearSVR
from xgboost import XGBRegressor


def extract_district(address):
    if pd.isna(address) or address == "Unknown":
        return "Unknown"
    parts = [p.strip() for p in str(address).split(",")]
    return parts[-2] if len(parts) >= 2 else "Unknown"


def extract_city(address):
    if pd.isna(address) or address == "Unknown":
        return "Unknown"
    parts = [p.strip() for p in str(address).split(",")]
    return parts[-1] if len(parts) >= 1 else "Unknown"


print("Loading dataset...")
df = pd.read_csv("vietnam_housing_dataset.csv")
df = df.dropna(subset=["Price"])

numerical_cols = df.select_dtypes(include=["float64", "int64"]).columns.drop("Price")
categorical_cols = df.select_dtypes(include=["object"]).columns

median_values = {}
for col in numerical_cols:
    med = float(df[col].median())
    median_values[col] = med
    df[col] = df[col].fillna(med)

for col in categorical_cols:
    df[col] = df[col].fillna("Unknown")

df["District"] = df["Address"].apply(extract_district)
df["City"] = df["Address"].apply(extract_city)

locations = {}
for city in df["City"].unique():
    districts = sorted(df[df["City"] == city]["District"].unique().tolist())
    locations[city] = districts

categorical_options = {}
for col in ["House direction", "Balcony direction", "Legal status", "Furniture state"]:
    values = sorted(v for v in df[col].unique().tolist() if v != "Unknown")
    categorical_options[col] = values

district_stats = {}
df["_price_per_m2"] = df["Price"] * 1000 / df["Area"].replace(0, np.nan)
for district, group in df.groupby("District"):
    if district == "Unknown" or len(group) < 5:
        continue
    district_stats[district] = {
        "city": group["City"].mode().iat[0],
        "count": int(len(group)),
        "avgPrice": round(float(group["Price"].mean()), 3),
        "avgPricePerM2": round(float(group["_price_per_m2"].mean(skipna=True)), 1),
    }

listing_cols = [
    "Address", "District", "City", "Area", "Frontage", "Floors",
    "Bedrooms", "Bathrooms", "Legal status", "Furniture state", "Price",
]
listings = df[listing_cols].to_dict(orient="records")

X = df.drop(["Price", "Address", "City", "_price_per_m2"], axis=1, errors="ignore")
X_encoded = pd.get_dummies(X, drop_first=True)
feature_cols = X_encoded.columns.tolist()

y_raw = df["Price"].values
y_log = np.log1p(y_raw)

X_train, X_test, y_train_log, y_test_log, y_train_raw, y_test_raw = train_test_split(
    X_encoded, y_log, y_raw, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Small background sample for SHAP KernelExplainer (svr_rbf, knn) at inference time,
# saved so the worker never needs to touch the raw CSV/train split again.
rng = np.random.default_rng(42)
bg_idx = rng.choice(X_train_scaled.shape[0], size=50, replace=False)
shap_background = X_train_scaled[bg_idx].tolist()

models = {
    "linear_regression": LinearRegression(),
    "svr_linear": LinearSVR(dual=False, loss="squared_epsilon_insensitive", C=1.0, max_iter=20000, random_state=42),
    "svr_rbf": SVR(kernel="rbf", C=10, gamma="scale"),
    "knn": KNeighborsRegressor(n_neighbors=9, weights="distance"),
    "random_forest": RandomForestRegressor(
        n_estimators=200, max_depth=20, min_samples_split=2, random_state=42, n_jobs=-1
    ),
    "xgboost": XGBRegressor(
        n_estimators=200, learning_rate=0.1, max_depth=5, objective="reg:squarederror", random_state=42, n_jobs=-1
    ),
}

metrics = {}
feature_importance = {}

for name, model in models.items():
    t0 = time.time()
    print(f"Training {name}...")
    model.fit(X_train_scaled, y_train_log)

    pred_log = model.predict(X_test_scaled)
    pred_price = np.expm1(pred_log)

    r2 = r2_score(y_test_raw, pred_price)
    mae = mean_absolute_error(y_test_raw, pred_price)
    rmse = np.sqrt(mean_squared_error(y_test_raw, pred_price))
    mape = mean_absolute_percentage_error(y_test_raw, pred_price) * 100

    metrics[name] = {
        "r2": round(float(r2), 4),
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "mape": round(float(mape), 2),
    }

    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        pairs = sorted(zip(feature_cols, importances), key=lambda p: p[1], reverse=True)[:15]
        feature_importance[name] = [{"feature": f, "importance": round(float(v), 5)} for f, v in pairs]

    joblib.dump(model, f"{name}.pkl")
    print(f"  -> R2={metrics[name]['r2']}, MAE={metrics[name]['mae']}, RMSE={metrics[name]['rmse']}, "
          f"MAPE={metrics[name]['mape']}%  ({time.time() - t0:.1f}s)")

joblib.dump(scaler, "scaler.pkl")

with open("feature_cols.json", "w") as f:
    json.dump(feature_cols, f, ensure_ascii=False, indent=2)

with open("median_values.json", "w") as f:
    json.dump(median_values, f, ensure_ascii=False, indent=2)

with open("locations.json", "w") as f:
    json.dump(locations, f, ensure_ascii=False, indent=2)

with open("categorical_options.json", "w") as f:
    json.dump(categorical_options, f, ensure_ascii=False, indent=2)

with open("district_stats.json", "w") as f:
    json.dump(district_stats, f, ensure_ascii=False, indent=2)

with open("listings.json", "w") as f:
    json.dump(listings, f, ensure_ascii=False)

with open("shap_background.json", "w") as f:
    json.dump(shap_background, f)

with open("metrics.json", "w") as f:
    json.dump(metrics, f, ensure_ascii=False, indent=2)

with open("feature_importance.json", "w") as f:
    json.dump(feature_importance, f, ensure_ascii=False, indent=2)

print("\nAll artifacts saved: 6x .pkl, scaler.pkl, feature_cols.json, median_values.json,")
print("locations.json, categorical_options.json, district_stats.json, listings.json,")
print("metrics.json, feature_importance.json")
print("\n=== Final ranking by R2 ===")
for name, m in sorted(metrics.items(), key=lambda kv: kv[1]["r2"], reverse=True):
    print(f"  {name:20s} R2={m['r2']:.4f}  MAE={m['mae']:.4f}  MAPE={m['mape']}%")
