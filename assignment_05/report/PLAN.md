# Assignment 05 — Report Plan

**Output:** `report/Assignment_05.tex` → `Assignment_05.pdf` (XeLaTeX, same template as `assignment_04/report/Assignment_04.tex`:
Times New Roman, 1-inch margins, booktabs tables, `float` figures).
**Author:** Lưu Anh Dũng (B23DCDK036) · E23CNPM02 · Intelligent System Development · Lecturer: Assoc. Prof. Dinh Que Tran, Ph.D.

This file plans the report: its sections, what goes in each, and which notebook output each table and
figure comes from. Terms and names follow `../PLAN.md` §6 (run IDs `<dataset>-<framework>-<model>`, glossary).

## Writing rules

- Concise, same style as the notebooks: formula + a small worked example, layer tables with shapes.
- Every number and figure is taken from the executed notebooks; every table/figure caption names its run ID or dataset code.
- Figures: one or two plots per image (the notebooks already save them that way), width ≤ `\textwidth`.
- Results are interpreted only in the results/comparison sections, not in the method sections.

## Inputs to collect before writing

| What | Where it comes from |
|---|---|
| 12 CNN runs + `DB-TF-MLP`: accuracy, macro P/R/F1, params, epochs, time/epoch, train time, inference ms/1k | the section-6 results table in each executed notebook (also `notebook/results/<run_id>.json` on the machine that ran them) |
| DB extra metrics: F1 (positive), ROC-AUC, average precision | same, DB only |
| Figures | taken from the executed notebooks: `python report/extract_figures.py` decodes every embedded image and saves it as `report/images/<name>.png`, using the same name as the notebook's `savefig` (67 figures: SV 23, GT 23, DB 21) |
| Cross-dataset 12-row table + charts | `report/make_summary.py` (to write: reads all `results/*.json`, outputs `summary.csv`, a LaTeX table and 2 bar charts) |

## Sections

### 1. Cover page
Title "Assignment 05 — CNN-3 vs CNN-5 in TensorFlow and PyTorch", course, class, author, lecturer, date. Table of contents on page 2.

### 2. Executive summary (≤ 1 page)
- One paragraph: 3 datasets × 2 depths × 2 frameworks = 12 models, same data split, settings and seed.
- The 12-row summary table (from `make_summary.py`): run ID, params, test accuracy, macro F1, time/epoch.
- 3–4 takeaways, each one sentence with a number: does depth help (per dataset)? do TF and PT agree? which is faster? what limits DB (weak features, MLP baseline)?

### 3. CNN fundamentals
Short, with formulas and tiny examples (reuse the notebook tables):

| Topic | Content | Source cell |
|---|---|---|
| Convolution | `out = Σ(window × filter) + b`; output size `⌊(H + 2P − K)/S⌋ + 1`; the 5×5 stroke example (3, 3, −3) | SV 4.2 |
| ReLU, max pooling | `max(0, x)`; 2×2 pool example | SV 4.2 |
| Batch normalization | `(x − μ)/σ · γ + β`; dark/bright example | GT 4.2 |
| Receptive field | 22×22 (CNN-3) vs 28×28 (CNN-5) | SV/GT 4.3 |
| Parameters | `(K·K·C_in + 1)·F`, first layer = 896 | 4.4 |
| Softmax + cross-entropy | `−ln p(true)`; start loss ln 10 = 2.30, ln 43 = 3.76 | SV/GT 4.5 |
| Sigmoid + binary cross-entropy | `p = 0.77 → 0.26 / 1.47` | DB 4.5 |
| Conv1D on tables | `out[i] = w₁x[i−1] + w₂x[i] + w₃x[i+1] + b`; why Flatten, not GAP | DB 4.2–4.3 |
| Metrics | precision, recall, F1, macro F1 (toy: accuracy 0.95 vs macro F1 0.49), ROC-AUC | GT 4.6, DB 4.6 |
| Training | Adam, epoch, early stopping (patience 3), class weights `N/(2·N_c)` | 4.5, DB 2.4 |

### 4. Project structure and setup
- Folder tree (`dataset/`, `notebook/`, `report/`), one notebook per dataset.
- Naming convention table (dataset / framework / model codes, run ID, file names).
- Fairness rules table: same split (`splits.npz`), batch 256, Adam 1e-3, max 20 epochs, patience 3, Glorot init in both, BatchNorm momentum 0.9 ≡ 0.1, trainable-parameter check.
- Environment: Python 3.12, TF 2.18 (+ Metal), PyTorch, hardware used for the reported run.

### 5. Datasets
One subsection per dataset, same layout: source + size table, preprocessing (formula + example), EDA figures.

| Dataset | Table | Figures (`report/images/`) |
|---|---|---|
| 5.1 SVHN (`SV`) | 99,289 images, 32×32×3, 10 classes, split sizes | `SV_samples.png`, `SV_class_distribution.png`, `SV_pixel_stats.png` |
| 5.2 GTSRB (`GT`) | 51,839 images, 43 classes, largest/smallest class ratio | `GT_samples.png`, `GT_class_distribution.png`, `GT_pixel_stats.png` |
| 5.3 Diabetes (`DB`) | 300,000 of 700,000 rows, 24 features → d = 42, target share, class weights; note: synthetic data | `DB_target_balance.png`, `DB_feature_effect.png`, `DB_top_features.png`, `DB_categorical_rates.png` (`DB_correlation.png` → appendix) |

### 6. Models
- Layer table CNN-3 vs CNN-5 for images (shapes 32×32×3 → … → 4×4×128 → classes) and for DB (Conv1D, d×1 → d×64/128 → 1).
- Parameter table per model and dataset: SV 129,290 / 175,658; GT 137,771 / 184,139; DB 191,169 / 391,329 (same in TF and PT).
- Code comparison table Keras ↔ PyTorch (data, layout, conv, GAP, init, BN momentum, `fit` vs loop, early stopping); 2 short code excerpts: Keras `build_tf` and PyTorch `CNN.__init__` + training-loop core (5 lines).

### 7. Results per dataset
Same layout for 7.1 SV, 7.2 GT, 7.3 DB:
1. Results table from the notebook's §6 (4 rows; DB 5 rows with `DB-TF-MLP`): accuracy, macro F1 (+ DB: F1 positive, ROC-AUC), params, epochs, time/epoch, inference ms/1k.
2. Comparison figures: `<code>_comparison_bars.png` (metrics + time per epoch), `<code>_comparison_curves.png` (validation loss/accuracy of the 4 runs).
3. Best model (usually CNN-5): `<run_id>_curves.png`, `<run_id>_confusion.png`.
4. What the network learned (images): `<run_id>_filters.png`, `<run_id>_feature_maps.png` for CNN-3 vs CNN-5 (TF in the text, PT in the appendix).
5. Errors (images): `SV-TF-CNN-5_misclassified.png` / `GT-TF-CNN-5_misclassified.png`.
6. DB only: `DB-TF_roc_pr.png`, `DB-TF-CNN-5_probabilities.png`.
7. 3–5 sentences: depth effect, framework gap, error patterns.

### 8. Cross-dataset comparison
- 12-row table + 2 charts from `make_summary.py`: (a) macro F1 per run grouped by dataset, (b) time per epoch per run.
- Depth: gain of CNN-5 over CNN-3 per dataset (expected: larger on GT with 43 classes than on SV; little on DB).
- Framework: TF vs PT quality gap and speed per dataset; code verbosity vs control (Keras `fit` vs PyTorch loop).
- DB: Conv1D vs MLP baseline and what it says about CNNs on tabular data.

### 9. Conclusion and limitations
- 4–5 takeaways.
- Limitations: one seed per run (no variance estimate), GPU non-determinism, no augmentation, DB is synthetic, Conv1D relies on an arbitrary column order, time measured on one machine.

### 10. Appendix
- Full glossary (from `../PLAN.md` §6.3) and notation table (§6.2).
- Extra figures: `DB_correlation.png`, PT curves/confusion matrices, PT filters/feature maps, CNN-3 figures not shown in §7.
- How to reproduce: setup commands, `A5_SMOKE=1`, data placement (`dataset/README.md`), `python report/extract_figures.py`.

## Figure inventory (67 files in `report/images/`, extracted from the executed notebooks)

| Group | SV (23) | GT (23) | DB (21) | Report section |
|---|---|---|---|---|
| EDA | `SV_class_distribution`, `SV_samples`, `SV_pixel_stats` | `GT_class_distribution`, `GT_samples`, `GT_pixel_stats` | `DB_target_balance`, `DB_feature_effect`, `DB_top_features`, `DB_correlation`, `DB_categorical_rates` | 5 |
| Training curves ×4 | `SV-{TF,PT}-{CNN-3,CNN-5}_curves` | `GT-{TF,PT}-{CNN-3,CNN-5}_curves` | `DB-{TF,PT}-{CNN-3,CNN-5}_curves`, `DB-TF-MLP_curves` | 7 / appendix |
| Confusion matrices ×4 | `SV-…_confusion` | `GT-…_confusion` | `DB-…_confusion`, `DB-TF-MLP_confusion` | 7 / appendix |
| Filters ×4 | `SV-{TF,PT}-{CNN-3,CNN-5}_filters` | `GT-…_filters` | — | 7 / appendix |
| Feature maps ×4 | `SV-…_feature_maps` | `GT-…_feature_maps` | — | 7 / appendix |
| Errors ×2 | `SV-{TF,PT}-CNN-5_misclassified` | `GT-{TF,PT}-CNN-5_misclassified` | — | 7 |
| ROC / PR ×2 | — | — | `DB-{TF,PT}_roc_pr`, `DB-{TF,PT}-CNN-5_probabilities` | 7.3 |
| Comparison | `SV_comparison_bars`, `SV_comparison_curves` | `GT_comparison_bars`, `GT_comparison_curves` | `DB_comparison_bars`, `DB_comparison_curves` | 7 |
| Cross-dataset (to make) | `summary_f1.png`, `summary_time.png` from `make_summary.py` | | | 2, 8 |

Not in the executed notebooks (added to the code after the run): `<code>_epoch_times.png`. It appears only after a re-run.

## Steps

| Step | Task | Output |
|---|---|---|
| 1 | ✅ `python report/extract_figures.py` (figures from the notebooks); metrics from the notebooks' section-6 tables | `report/images/*.png` |
| 2 | ✅ `report/make_summary.py` | `summary.csv`, `summary_table.tex`, `summary_f1.png`, `summary_time.png` |
| 3 | Copy the template preamble + cover from `Assignment_04.tex` | `Assignment_05.tex` skeleton |
| 4 | Sections 3–6 (method; no results needed) | draft |
| 5 | Sections 7–8 from the tables and figures; fill the notebooks' discussion/conclusion cells with the same text | draft |
| 6 | Sections 2, 9, 10; compile twice with XeLaTeX (for the TOC) | `Assignment_05.pdf` |
| 7 | Check: every number matches a JSON value, every figure has a caption with run ID, page count | final |
