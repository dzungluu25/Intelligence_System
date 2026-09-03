# Assignment 02 — Application 1: Diabetes Prediction

**Status: scaffold only.** Folder structure is in place per Appendix A; content still to
be added.

- **Task:** binary classification — predict whether a patient belongs to a diabetes
  target class from routine clinical / demographic measurements.
- `X` = patient features, `y` = diabetes class ∈ {0, 1}.
- **Metrics:** Accuracy, Precision, Recall, F1, ROC-AUC, confusion matrix (interpreted).
- **Models (≥4):** Logistic Regression, Decision Tree, Random Forest, SVM, KNN.

## To do

| Path | What goes here |
|---|---|
| `data/` | a diabetes Kaggle CSV + `data/README.md` (name, URL, licence, how to obtain) |
| `notebook/diabetes.ipynb` | the 23 sections of Appendix B; `RANDOM_SEED = 42`; every output followed by a markdown interpretation |
| `model/` | `model_pipeline.joblib` + `feature_names.joblib` (from notebook §22) + committed `input_schema.json` |
| `api/` | FastAPI `POST /predict` → `{ "prediction": "diabetic", "confidence": 0.91 }` |
| `web/` | input form → API → result + confidence |
| `mobile/` | REST client of the API |
| `requirements.txt` | numpy, pandas, scikit-learn, joblib, matplotlib, jupyter, fastapi, uvicorn, pydantic |

## Existing references to adapt

- `../../Assignment_1/` — a working diabetes notebook + full-stack app in a different
  (`notebook/ report/ app/`) layout.
- `../../../intelligent_system_assignments/assignment_02/diabetes/` — a full diabetes
  build already in this exact Appendix A layout (api/, notebook/, web/, mobile/).
