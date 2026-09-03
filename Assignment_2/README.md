# Assignment 02 — From Data Representation to a Deployable Intelligent System

**Intelligent System Development** · Lecturer: Dinh Que Tran, Ph.D., Assoc. Prof. · Semester I.2026
Spec: `../../slide_assign/intel_sys_dev_assignment_02_final.pdf`

Three intelligent applications, each taken through the **same** pipeline and deployed as a
REST API with web + mobile clients:

```
Data → Understand → Clean → Represent → Learn → Evaluate → Persist → Deploy (Web + Mobile)
```

The point of the assignment is **not** "train three models" — it is to show how raw
real-world data of different kinds becomes a numerical representation `X` (and, for text,
`E`), then a model, then a persisted artifact, then a usable service.

## The three applications

| # | Folder | Task | Raw data | Representation | Status |
|---|---|---|---|---|---|
| 1 | [`diabetes/`](diabetes/) | Classification | CSV / tabular | feature matrix `X ∈ ℝ^{N×d}` | **scaffold only** |
| 2 | [`house_price/`](house_price/) | Regression | CSV / tabular | encoded + scaled `X ∈ ℝ^{N×d}` | structure + API stubs done; notebook + clients pending |
| 3 | [`customer_behavior/`](customer_behavior/) | Classification (+ text) | CSV + customer reviews | tabular `X` ⊕ text vectors / `E ∈ ℝ^{B×T×d}` | **scaffold only** |

## Repository layout (Appendix A)

```
Assignment_2/
├── diabetes/
│   ├── data/        raw Kaggle CSV (see data/README.md) — gitignored
│   ├── notebook/    <app>.ipynb — the 23 sections of Appendix B
│   ├── model/       model_pipeline.joblib + input_schema.json (schema committed)
│   ├── api/         FastAPI service — POST /predict (Appendix C)
│   ├── web/         web client — form → API → result (Appendix D)
│   ├── mobile/      mobile client — REST client of the API (Appendix E)
│   └── requirements.txt
├── house_price/     (same layout)
├── customer_behavior/ (same layout)
├── report/
│   └── Assignment_02.pdf   (~10 pages — the written report)
├── .gitignore
└── README.md        (this file)
```

> **Note on `data/`.** No CSV is committed (size + licence). Each `data/README.md` gives
> the Kaggle name / URL / how to obtain the file and where to place it.

## Per-application quick start

Each app is self-contained. From inside an app folder:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 1. get the dataset — see data/README.md
# 2. run the notebook end to end (produces model/model_pipeline.joblib + input_schema.json)
jupyter lab notebook/

# 3. serve the model
uvicorn api.main:app --reload --port <8001|8002|8003>
#    Swagger UI at http://localhost:<port>/docs
#    Postman: import api/*.postman_collection.json

# 4. web client
cd web && npm install && npm run dev

# 5. mobile client
cd mobile && npm install && npx cap sync && npx cap run android
```

Suggested API ports: diabetes `8001`, house_price `8001`, customer_behavior `8003`
(run one at a time, or change the port).

## Reproducibility

- Python 3.14 (each notebook's section 0 prints exact library versions)
- `RANDOM_SEED = 42` in every notebook
- `requirements.txt` per application
- OS: developed on macOS (Darwin)

## Deliverables (Appendix F)

Three notebooks · three persisted pipelines · three `POST /predict` services · three
mobile demos · one ~10-page report (`report/Assignment_02.pdf`) · this repo · dataset
references · README (this file).

## Current state

| Item | diabetes | house_price | customer_behavior |
|---|---|---|---|
| Folder structure | ✅ | ✅ | ✅ |
| `data/README.md` | ⬜ | ✅ | ⬜ |
| Notebook (23 sections) | ⬜ | ⬜ (old content, needs rewrite) | ⬜ |
| `model/input_schema.json` | ⬜ | ✅ (stub) | ⬜ |
| API (`POST /predict`) | ⬜ | ✅ (stub, needs model) | ⬜ |
| Web client | ⬜ | ⚠️ moved in, calls old API shape | ⬜ |
| Mobile client | ⬜ | ⚠️ moved in, calls old API shape | ⬜ |
| `requirements.txt` | ⬜ | ✅ | ⬜ |

`diabetes/` and `customer_behavior/` are empty folder scaffolds — content to be added.
Working references exist elsewhere: `../Assignment_1/` (a diabetes notebook + app in a
different layout) and `../../intelligent_system_assignments/assignment_02/diabetes/`
(a full diabetes build in this exact layout).
