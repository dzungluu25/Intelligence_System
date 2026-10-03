# Datasets

Both datasets come from **Kaggle**, each 100–150 MB. Raw files are not committed (see the root `.gitignore`); put them in the folders below.
Each notebook writes `splits.npz` on its first run.

| Code | Dataset (Kaggle) | Size | Put these files in | Used |
|---|---|---|---|---|
| `EC` | Brazilian E-Commerce Public Dataset by Olist — [olistbr/brazilian-ecommerce](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) | 126 MB | `dataset/ec/`: `olist_orders_dataset.csv`, `olist_customers_dataset.csv`, `olist_order_items_dataset.csv`, `olist_sellers_dataset.csv`, `olist_geolocation_dataset.csv` | 96,470 delivered orders in 27 states, T = 10 orders, ~96k windows |
| `ST` | New York Stock Exchange — [dgawlik/nyse](https://www.kaggle.com/datasets/dgawlik/nyse) | 106 MB | `dataset/st/prices-split-adjusted.csv` | 250 tickers, T = 30 days, ~433k windows |

Checked after download: `olist_orders_dataset.csv` 99,441 orders (2016-09 → 2018-10); `olist_order_items_dataset.csv` 112,650 items; `prices-split-adjusted.csv` 851,264 rows, 501 tickers (467 with the full 1,762 days). The other files in the downloads are not used.

## Download

**Option 1 — Kaggle CLI** (needs `~/.kaggle/kaggle.json`). Run from `assignment_06/`:

```
kaggle datasets download -d olistbr/brazilian-ecommerce -p dataset/ec --unzip
kaggle datasets download -d dgawlik/nyse -p dataset/st --unzip
```

**Option 2 — `kagglehub`** (public datasets, no token needed), then copy the files into the folders above:

```python
import kagglehub
print(kagglehub.dataset_download("olistbr/brazilian-ecommerce"))
print(kagglehub.dataset_download("dgawlik/nyse"))
```

**Option 3 — browser:** open the links, click *Download*, unzip into `dataset/ec/` and `dataset/st/`.
