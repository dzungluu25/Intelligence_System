# Assignment 06 — Plan

**Author:** Lưu Anh Dũng (B23DCDK036)
**Course:** Intelligent System Development | **Lecturer:** Assoc. Prof. Dinh Que Tran, Ph.D.
Requirements and acceptance checklist: [REQUIREMENT.md](REQUIREMENT.md).

## 1. Scope

The plan delivers requirements R1–R7 of [REQUIREMENT.md](REQUIREMENT.md) in four parts:

- **Part 0 — Concepts** notebook: functions and operators of an RNN, each checked numerically.
- **Part 1 — RNN from scratch** (NumPy) on both datasets.
- **Part 2 — RNN in Keras** on both datasets.
- **Part 3 — RNN in PyTorch** on both datasets.

Datasets: **EC** (service process in e-commerce: order delivery time, Olist) and **ST** (stock: next-day trading range, NYSE).

Core runs: 2 datasets × 3 implementations (`SC` scratch, `TF` Keras, `PT` PyTorch) = **6**, all the same single-layer vanilla RNN.
Extras (Keras + PyTorch): LSTM and GRU on both datasets = **8 more**. Scratch LSTM/GRU is not built; the concepts notebook computes one GRU step by hand and checks it against PyTorch.

## 2. Datasets

Selection criteria: classic public Kaggle datasets of **100–150 MB**, time-related, CPU-sized, not used in another assignment, downloadable without login (`kagglehub`).

### 2.1 EC — Olist Brazilian e-commerce (order fulfilment)

[`olistbr/brazilian-ecommerce`](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce), 126 MB: 99,441 orders, 2016-09 → 2018-08, with the timestamps of the service process (purchase → approval → carrier → delivery, plus the promised date).

Task: per customer state, orders form a sequence in purchase order. Window = the last **T = 10 orders** to a state (9 previous + the new one); target = **delivery time in days** of the new order (`log1p`, z-scored). 96,470 delivered orders → **96,227 windows**.

| Feature (per order, known at purchase) | Meaning |
|---|---|
| `promise` | promised delivery date − purchase (days) |
| `price`, `freight`, `items` | order value, shipping fee, number of items (`log1p`) |
| `distance` | seller → customer haversine distance (`log1p` km), from the geolocation table |
| `same_state` | seller and customer in the same state |
| `recent` | mean delivery time of this state's orders delivered in the 7 days before the purchase |
| `gap` | hours since the previous order to this state (`log1p`) |
| `dow_sin/cos` | purchase weekday |

Earlier orders' delivery times are **not** inputs (they may still be in transit at purchase time); `recent` carries the past performance without look-ahead.
Baselines: train mean, recent state mean, promise regression (OLS on promised days), linear model on the flattened window.

### 2.2 ST — New York Stock Exchange (next-day volatility)

[`dgawlik/nyse`](https://www.kaggle.com/datasets/dgawlik/nyse), 106 MB; file `prices-split-adjusted.csv`, 851k rows, 501 tickers, 2010-01-04 → 2016-12-30.
250 most-traded tickers among the 467 with the full 1,762-day history → 250 × 1,731 = **432,750 windows**.

| Feature (per day, per ticker) | |
|---|---|
| `log_range` | ln(ln(high/low)), floored at 0.1 % (**target at t+1**) |
| `ret`, `abs_ret` | log close-to-close return and its absolute value |
| `oc_ret` | ln(close/open) |
| `vol_rel` | ln(1+volume) minus the ticker's train-period mean |
| `dow_sin/cos` | trading weekday |

Window **T = 30 days**, F = 7. The target is risk, not return: returns are close to unpredictable, the range is autocorrelated (volatility clustering).
Baselines: persistence, 5-day mean, 22-day mean, train mean, **HAR** (least squares on day / week / month means).

### 2.3 Data rules

- Chronological split 70 / 15 / 15 by the time of the predicted event (EC: purchase time; ST: calendar date, same cut dates for all tickers).
- Scalers fitted on the train period only; a window may look back into an earlier period, its target never does.
- Seed 42; windows built once; the identical `(N, T, F)` arrays go to scratch, Keras and PyTorch.
- Raw files are gitignored; `dataset/README.md` has links and download commands; notebooks write `splits.npz`.

## 3. Models

| | EC | ST |
|---|---|---|
| T / F | 10 orders / 10 | 30 days / 7 |
| Core model | RNN(32, tanh) → h_T → Dense(1) | same |
| Parameters `F·H + H·H + H + H + 1` | 1,409 | 1,313 |
| Loss | MSE on z-scored target | same |

- **Scratch (NumPy):** forward pass storing every `h_t`, BPTT written out, global-norm clipping (1.0), hand-written Adam. Verified by a finite-difference gradient check and by forward equality with Keras/PyTorch on identical weights.
- **Keras:** `SimpleRNN(32)` + `Dense(1)`, `fit` + `EarlyStopping`; weights copied from scratch with `set_weights`.
- **PyTorch:** `nn.RNN(F, 32, batch_first=True)` + `nn.Linear`; hand-written loop; weights copied transposed, `b_hh` zeroed and frozen so parameter counts match.
- **Fairness:** same arrays and initial weights, Adam (lr 1e-3, eps 1e-7), batch 128, ≤ 30 epochs, patience 5, clip-norm 1.0, seed 42, **CPU for all three** (`tensorflow-metal` is disabled in the notebooks). Time per epoch = median of epochs 2+.

## 4. Evaluation & visualization

- EC: RMSE / MAE in days, share within ±3 days, R²; ST: RMSE / MAE of the range in percentage points, R², directional accuracy (calmer / wilder than today).
- Per run: loss curves, forecast vs actual for one series (EC: orders to RJ; ST: AAPL, 120 days), residual histogram, parameters, time per epoch, inference time.
- Scratch only: gradient-check table, gradient norm per step.
- EDA: EC — delivery vs promise, weekly median over time, states, autocorrelation, distance; ST — market range over time, autocorrelation of range vs return, weekday, volume vs range.
- Comparison: table vs baselines, validation curves of the three core implementations, prediction differences between implementations. Report tables: `report/make_tables.py`.

## 5. File structure

```
assignment_06/
├── REQUIREMENT.md, PLAN.md, README.md, requirements.txt
├── dataset/
│   ├── README.md
│   ├── ec/            # Olist CSVs (gitignored) + splits.npz
│   └── st/            # prices-split-adjusted.csv (gitignored) + splits.npz
├── notebook/
│   ├── 00_rnn_concepts.ipynb
│   ├── ec_olist.ipynb
│   ├── st_nyse.ipynb
│   └── results/       # <run_id>.json, <CODE>_comparison.csv
└── report/
    ├── Assignment_06.tex, A6_02_dungla_036.pdf
    ├── make_tables.py, table_*.tex
    └── images/
```

Notebook sections (both datasets): 1 Setup · 2 Data · 3 EDA · 4 Scratch · 5 Keras · 6 PyTorch · 7 Comparison · 8 Conclusion.
Concepts notebook: 1 Sequences as data · 2 Operators · 3 One step, unrolling, weight sharing · 4 BPTT · 5 Vanishing/exploding gradients, clipping · 6 LSTM and GRU · 7 One layer, three names.

## 6. Naming

| Item | Convention | Example |
|---|---|---|
| Dataset / implementation / model | `EC`, `ST` / `SC`, `TF`, `PT` / `RNN`, `LSTM`, `GRU` | |
| Run ID | `<dataset>-<impl>-<model>` | `ST-TF-GRU` |
| Files | `results/<run_id>.json`, `images/<run_id>_<plot>.png` | `images/EC-SC-RNN_forecast.png` |

## 7. Risks and decisions

- EC has ~96k windows (below 300k) because the dataset must stay within 100–150 MB; Olist was chosen as the classic e-commerce service-process dataset. More variance between runs is expected.
- EC inputs must not leak future deliveries: only purchase-time information plus the `recent` feature built from deliveries completed before the purchase.
- ST: HAR is a strong linear baseline; an RNN that only ties HAR is a valid, reported result.
