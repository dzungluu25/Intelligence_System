# Assignment 02 — Application 3: E-commerce Customer Behavior / Interest

**Status: scaffold only.** Folder structure is in place per Appendix A; content still to
be added.

- **Task:** classification (exact target chosen from the dataset — e.g. "will the
  customer recommend the product", "product-category interest", "will purchase").
- `X` = customer behavioral features **+ text representation** of customer
  comments / reviews; `y` = the chosen interest / behavior target.
- **This app is the one that must demonstrate text representation:**
  `Comment → Tokens → Token IDs → Vector / Embedding`, reporting `B`, `T`, `d` and
  `E ∈ ℝ^{B×T×d}` (or a TF-IDF matrix `ℝ^{B×V}`).
- Compare a **tabular-only** representation with **tabular + text** and report whether
  text improves prediction.
- **Models (≥4, spec says compare 6):** Logistic Regression, Decision Tree, Random
  Forest, SVM / KNN, a text-based linear classifier, one more justified model.
- **Metrics:** Accuracy, Precision, Recall, F1, ROC-AUC, confusion matrix (interpreted).

## To do

| Path | What goes here |
|---|---|
| `data/` | an e-commerce Kaggle dataset **with customer comments/reviews** + `data/README.md` |
| `notebook/customer_behavior.ipynb` | the 23 sections of Appendix B, including the text-representation demo (§12) and the tabular-vs-text comparison; `RANDOM_SEED = 42` |
| `model/` | `model_pipeline.joblib` (tabular + text vectorizer in one pipeline) + `input_schema.json` |
| `api/` | FastAPI `POST /predict` → `{ "interest": "electronics", "confidence": 0.87 }` |
| `web/` | form (customer features + a free-text comment box) → API → predicted interest |
| `mobile/` | REST client of the API |
| `requirements.txt` | as house_price + nothing extra (TF-IDF is in scikit-learn); add `nltk`/`spacy` only if used |

## Candidate dataset

"Women's E-Commerce Clothing Reviews" (Kaggle, `nicapotato/womens-ecommerce-clothing-reviews`,
~23.5k rows): target `Recommended IND` (0/1), text column `Review Text`, tabular features
Age, Rating, Positive Feedback Count, Division/Department/Class Name. Confirm and record
in `data/README.md` before building.
