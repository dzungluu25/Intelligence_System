# Assignment 01 — Diabetes screening with classical ML

**Author:** Lưu Anh Dũng (B23DCDK036)

Binary classification on the Pima Indians Diabetes dataset (768 patients, 8 clinical features, target `Outcome`), comparing several classical models and serving them in a small web app.

- Report: [report/Report.md](report/Report.md), PDF [report/A1_02_dungla_036.pdf](report/A1_02_dungla_036.pdf)
- Dataset: [kaggle.com/datasets/hasibur013/diabetes-dataset](https://www.kaggle.com/datasets/hasibur013/diabetes-dataset) (included as `notebook/diabetes.csv` and `app/backend/diabetes_dataset.csv`)

## Structure

```
assignment_01/
├── notebook/
│   ├── Report.ipynb      # EDA, preprocessing, training and comparison of the models
│   ├── Report.pdf        # notebook export
│   └── diabetes.csv
├── app/
│   ├── backend/          # Node.js API (server.js) + Python inference worker
│   ├── frontend/         # React + TypeScript + Vite UI
│   └── docker-compose.yml
└── report/               # report (Markdown + PDF) and images
```

Models: baseline, logistic regression, KNN, linear SVM, RBF SVM, random forest, XGBoost.

## Run

1. **Train the models.** Run `notebook/Report.ipynb`. It writes `imputer.pkl`, `scaler.pkl`, `baseline.pkl` and one `<model>.pkl` per classifier. These files are not in git (`*.pkl` is ignored).
2. **Copy the models to the backend:** `cp notebook/*.pkl app/backend/`
3. **Start the app:**
   ```bash
   cd app
   docker compose up --build        # backend on :8000, frontend on :3000
   ```
   Without Docker: `pip install -r backend/requirements.txt`, then `npm install && npm start` in `backend/` and `npm install && npm run dev` in `frontend/`.
