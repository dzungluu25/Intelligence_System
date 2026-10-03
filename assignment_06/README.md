# Assignment 06: RNN from scratch, Keras and PyTorch

**Author:** Lưu Anh Dũng (B23DCDK036)

Concepts of recurrent neural networks, then a vanilla RNN on two time-related datasets in three implementations (NumPy scratch, Keras, PyTorch), plus LSTM/GRU in Keras and PyTorch.

- Requirements: [REQUIREMENT.md](REQUIREMENT.md) · Plan: [PLAN.md](PLAN.md) · Data: [dataset/README.md](dataset/README.md)
- Report: [report/A6_02_dungla_036.pdf](report/A6_02_dungla_036.pdf) (source `report/Assignment_06.tex`)

| Notebook | Content |
|---|---|
| `notebook/00_rnn_concepts.ipynb` | sequences, operators, one RNN step, BPTT, vanishing gradients, clipping, GRU/LSTM, three implementations — every formula checked in code |
| `notebook/ec_olist.ipynb` | EC: delivery time of an Olist order from the last 10 orders to the same state (96k windows) |
| `notebook/st_nyse.ipynb` | ST: next-day trading range of 250 NYSE stocks from the last 30 days (433k windows) |

## Results (test period)

| Dataset | Best baseline | RNN / LSTM / GRU | Finding |
|---|---|---|---|
| EC (Olist, RMSE in days) | 5.22 (recent state mean) | 4.82–5.01, R² 0.54–0.58 | all RNNs beat all baselines; GRU/LSTM best; scratch / Keras / PyTorch within 2 % |
| ST (NYSE, RMSE of range in pp) | 1.145 (HAR) | 1.145–1.19, R² 0.52–0.54, direction 70.5–71.1 % | risk is predictable, but no model beats the classic HAR model; best LSTM ties it |

With identical starting weights the three implementations give the same outputs (difference < 5e-7) and parameter counts; the scratch gradients match finite differences to ~1e-10.

## Setup

```bash
uv venv -p 3.12 .venv            # TensorFlow needs Python ≤ 3.12
source .venv/bin/activate
uv pip install -r requirements.txt
python -m ipykernel install --user --name a6-venv --display-name "Python 3.12 (assignment_06 .venv)"
```

Download the data as described in [dataset/README.md](dataset/README.md) (`kagglehub`, no token needed).

## Run

Run the notebooks top to bottom from `notebook/` with the `a6-venv` kernel, one at a time (on an Apple-silicon CPU: concepts < 1 min, EC ≈ 2 min, ST ≈ 12 min). Quick test: `A6_SMOKE=1` (small data, 2 epochs, outputs in `smoke/` folders).
Keras is forced onto the CPU in the notebooks so that the three implementations are timed on the same hardware.
Then `python report/make_tables.py` and build the report with XeLaTeX (twice).
