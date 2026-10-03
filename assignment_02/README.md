# Assignment 02 — From Data Representation to a Deployable Intelligent System

**Course:** Intelligence System Development — PTIT  
**Instructor:** Assoc. Prof. Dinh Que Tran, Ph.D.  
**Report:** `report/Assignment_02.pdf`

Three independent intelligent applications built on the same end-to-end pipeline:

```
Raw data → Understand → Clean → Represent → Learn → Evaluate → Persist → Deploy
```

| # | Application | Task | Dataset | Status |
|---|---|---|---|---|
| 1 | **Diabetes** prediction | binary classification | BRFSS 2015 (Kaggle) | ✅ complete |
| 2 | **House price** prediction | regression | Vietnam house price (Kaggle) | ✅ complete |
| 3 | **Customer behaviour** prediction | binary classification | Olist e-commerce (Kaggle) | ✅ complete |

Each application is self-contained under its own folder:

```
<app>/
  data/            raw dataset (or download reference)
  notebook/        <app>.ipynb  — ML experiment (23 sections, executed with outputs)
  model/           model_pipeline.joblib  +  feature_names.joblib  +  input_schema.json
  api/             FastAPI service  →  POST /predict
  web/             React + Vite single-page client
  mobile/          Flutter client (REST consumer)
  requirements.txt
report/
  Assignment_02.pdf   ← final submitted report
```

---

## Data representation summary

| Application | Raw form | Numerical representation | Model input |
|---|---|---|---|
| Diabetes | CSV (survey) | 21 raw + 2 engineered, `StandardScaler` on 8 numeric cols | `X ∈ ℝ^{N×23}` dense |
| House price | CSV (listings) | encoded + scaled tabular features | `X ∈ ℝ^{N×d}` dense |
| Customer behaviour | 9 CSV tables + text reviews | 20 tabular → `ℝ^{43}` (impute, log1p, scale, one-hot) ∥ TF-IDF comment → `ℝ^{~13000}` sparse | `X ∈ ℝ^{N×~13000}` sparse |

---

## Environment

| | |
|---|---|
| Python | 3.10+ |
| Random seed | `42` (numpy, random, every split / estimator) |
| Node (web) | 18+ |
| Flutter (mobile) | 3.19+ |

Install per app:

```bash
cd <app>/
pip install -r requirements.txt
```

---

## Application 1 — Diabetes

**Dataset:** `alexteboul/diabetes-health-indicators-dataset` — `diabetes_012_health_indicators_BRFSS2015.csv`  
253,680 rows → 229,781 after de-duplication. Target: `Diabetes_binary`.  
**Model:** Random Forest — test ROC-AUC ≈ 0.81, recall ≈ 0.74.

```bash
cd diabetes/

# 1. reproduce experiment (writes model/*.joblib)
jupyter nbconvert --to notebook --execute notebook/diabetes.ipynb --output diabetes.ipynb
python api/build_artifacts.py   # SHAP background + neighbour index

# 2. API  →  http://localhost:8000/docs
uvicorn api.main:app --port 8000

# 3. Web  →  http://localhost:5173
npm --prefix web install && npm --prefix web run dev

# 4. Mobile (Android emulator)
cd mobile && flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8000
```

`POST /predict` example:

```bash
curl -s http://localhost:8000/predict \
  -H 'content-type: application/json' \
  -d '{"Age":9,"Sex":1,"HighBP":1,"HighChol":1,"BMI":34,"GenHlth":4,"DiffWalk":1,"PhysActivity":0,"Smoker":1}'
# → {"prediction":"diabetic","confidence":0.85,...}
```

---

## Application 2 — House price

**Dataset:** Vietnam house price dataset (Kaggle).  
Target: `Price` (million VND). Model trained on `log1p(Price)`.  
**Model:** Random Forest — predictions inverted with `expm1`.

```bash
cd house_price/

# 1. reproduce experiment (writes model/*.joblib)
jupyter nbconvert --to notebook --execute notebook/house_price.ipynb --output house_price.ipynb

# 2. API  →  http://localhost:8001/docs
uvicorn api.main:app --port 8001

# 3. Web  →  http://localhost:5174
npm --prefix web install && npm --prefix web run dev

# 4. Mobile
cd mobile && flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8001
```

`POST /predict` example:

```bash
curl -s http://localhost:8001/predict \
  -H 'content-type: application/json' \
  -d '{"Area":60,"Width":4,"Floors":3,"Bedrooms":3,"Legal":"pink_book","District":"Cau Giay"}'
# → {"predicted_price":3200.0,"unit":"million VND",...}
```

---

## Application 3 — Customer behaviour

**Dataset:** `olistbr/brazilian-ecommerce` (9 CSVs).  
98,673 reviewed orders → 95,824 after filtering. Target: `satisfied = review_score ≥ 4`.  
**Model:** Logistic Regression (tabular + TF-IDF text) — ROC-AUC 0.859, dissatisfied recall 0.672.

```bash
cd customer_behaviour/
pip install -r requirements.txt

# 1. reproduce experiment (writes model/*.joblib)
jupyter nbconvert --to notebook --execute notebook/customer_behaviour.ipynb --output customer_behaviour.ipynb

# 2. API  →  http://localhost:8002/docs
uvicorn api.main:app --port 8002

# 3. Web  →  http://localhost:5175
npm --prefix web install && npm --prefix web run dev

# 4. Mobile
cd mobile && flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8002
```

Or run API + web together with Docker:

```bash
cd customer_behaviour/
docker compose up --build
#   web  →  http://localhost:5175   ·   api  →  http://localhost:8002/docs
```

`POST /predict` example:

```bash
curl -s http://localhost:8002/predict \
  -H 'content-type: application/json' \
  -d '{
    "price_total": 129.90, "freight_total": 18.30,
    "main_payment_type": "credit_card", "max_installments": 3,
    "customer_state": "SP", "category": "bed_bath_table",
    "order_purchase_timestamp": "2018-05-01 10:00:00",
    "order_estimated_delivery_date": "2018-05-20 00:00:00",
    "order_delivered_customer_date": "2018-05-31 14:00:00",
    "review_comment_message": "Produto chegou muito atrasado."
  }'
# → {"prediction":"dissatisfied","confidence":0.9252,...}
```

---

## Deployment architecture

```
User input → POST /predict → validation → preprocessing (loaded from training) → saved model → JSON → web / mobile UI
```

**Data-leakage rule:** the deployed API loads the pipeline fitted on the *training* split and only calls `.transform()` / `.predict_proba()`. It never re-fits any scaler, encoder, imputer, or vectoriser on live input.
