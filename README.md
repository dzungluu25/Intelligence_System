# Intelligence System Development — PTIT

**Course:** Intelligence System Development  
**Instructor:** Assoc. Prof. Dinh Que Tran, Ph.D.

---

## Repository structure

```
Assignment_1/          Assignment 01 — Diabetes risk screening (single app)
  notebook/            Report.ipynb + executed outputs
  report/              Written report (PDF)
  app/                 Vite/React + Node.js/Express + Python inference

Assignment_2/          Assignment 02 — From Data Representation to a Deployable
  diabetes/            Intelligent System (three independent ML services)
  house_price/           Each service follows the same layout:
  customer_behaviour/      notebook/ · model/ · api/ · web/ · mobile/
  report/              Assignment_02.pdf (final report)
```

---

## Assignment 01 — Diabetes risk screening

Binary classification on the Pima Indians Diabetes dataset (768 records, 8 clinical features). Six models trained and compared; best selected automatically by F1.

| Model | Accuracy | F1 |
|---|---|---|
| **XGBoost** (selected) | 87.66% | 0.826 |

Demo app: React + Vite frontend · Express + Python backend · SHAP explanations.

```bash
# backend
cd Assignment_1/app/backend && pip install -r requirements.txt && node server.js

# frontend
cd Assignment_1/app/frontend && npm install && npm run dev
```

---

## Assignment 02 — From Data Representation to a Deployable Intelligent System

Three end-to-end ML services, each with a standardised 23-section notebook, FastAPI backend, React/Vite web client, and Flutter mobile client.

| # | Service | Task | Dataset | Model | Report metric |
|---|---|---|---|---|---|
| 1 | **Diabetes** | binary classification | BRFSS 2015 (Kaggle) | Random Forest | ROC-AUC 0.81, recall 0.74 |
| 2 | **House price** | regression | Vietnam listings (Kaggle) | Random Forest | — |
| 3 | **Customer behaviour** | binary classification | Olist e-commerce (Kaggle) | Logistic Regression | ROC-AUC 0.859 |

**Final report:** `Assignment_2/report/Assignment_02.pdf`

Quick start for any service:

```bash
cd Assignment_2/<service>/

# 1. reproduce experiment
jupyter nbconvert --to notebook --execute notebook/<service>.ipynb --output <service>.ipynb

# 2. API  →  http://localhost:800x/docs
uvicorn api.main:app --port 800x

# 3. web  →  http://localhost:517x
npm --prefix web install && npm --prefix web run dev

# 4. mobile (Android emulator)
cd mobile && flutter pub get && flutter run --dart-define=API_URL=http://10.0.2.2:800x
```

See `Assignment_2/README.md` for full instructions and `POST /predict` examples for each service.

---

## Common conventions

| Convention | Value |
|---|---|
| Random seed | `42` everywhere |
| Python | 3.10+ |
| Node | 18+ |
| Flutter | 3.19+ |
| Data-leakage rule | API only calls `.transform()` / `.predict_proba()` — never re-fits on live input |
