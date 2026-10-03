"""Shared helpers for the assignment 05 notebooks.

Only framework-neutral plumbing lives here: paths, seeding, splits, metrics, result
files and plotting. Model code, training loops and anything the notebooks need to
explain stays in the notebooks themselves.

Environment switches:
    A5_SMOKE=1        quick run: small subsample, 2 epochs, outputs go to */smoke/
    A5_DATA_DIR=path  read raw data from another folder (default: ../dataset)
"""

import json
import os
import random
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

SEED = 42
SMOKE = os.environ.get("A5_SMOKE") == "1"

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("A5_DATA_DIR", ROOT / "dataset"))
_suffix = "smoke" if SMOKE else ""
RESULTS_DIR = ROOT / "notebook" / "results" / _suffix
MODELS_DIR = ROOT / "notebook" / "models" / _suffix
FIG_DIR = ROOT / "report" / "images" / _suffix
for _d in (RESULTS_DIR, MODELS_DIR, FIG_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# Shared training settings (identical for TF and PT, see PLAN.md §3 fairness rules).
BATCH_SIZE = 256
EPOCHS = 2 if SMOKE else 20
PATIENCE = 3
LEARNING_RATE = 1e-3
SMOKE_SIZE = {"train": 2000, "validation": 500, "test": 500}


def set_seed(seed=SEED):
    """Seed Python and NumPy. The notebooks seed TensorFlow and PyTorch themselves."""
    random.seed(seed)
    np.random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


def find_file(code, name):
    """Find `name` anywhere under dataset/<code, lowercase>/ (Kaggle zips often add a subfolder)."""
    base = DATA_DIR / code.lower()
    hits = sorted(base.rglob(name))
    if not hits:
        raise FileNotFoundError(
            f"{name} not found under {base}. Download the dataset first "
            f"(see dataset/README.md)."
        )
    return hits[0]


def make_or_load_splits(code, y, n_sample=None, seed=SEED):
    """Stratified 70/15/15 split, saved once to dataset/<code>/splits.npz.

    The file stores row indices into the raw data, so TensorFlow and PyTorch (and
    every later run) train and test on exactly the same samples. If `n_sample` is
    given, a stratified subsample of that size is drawn first.
    """
    path = DATA_DIR / code.lower() / "splits.npz"
    n_sample = min(n_sample or len(y), len(y))
    if path.exists():
        saved = np.load(path)
        splits = {k: saved[k] for k in ("train", "validation", "test")}
        if sum(len(v) for v in splits.values()) == n_sample:
            return _maybe_shrink(splits)
    idx = np.arange(len(y))
    if n_sample < len(y):
        idx, _ = train_test_split(idx, train_size=n_sample, stratify=y, random_state=seed)
    train, rest = train_test_split(idx, train_size=0.70, stratify=y[idx], random_state=seed)
    val, test = train_test_split(rest, test_size=0.50, stratify=y[rest], random_state=seed)
    splits = {"train": np.sort(train), "validation": np.sort(val), "test": np.sort(test)}
    np.savez(path, **splits)
    return _maybe_shrink(splits)


def _maybe_shrink(splits):
    if not SMOKE:
        return splits
    rng = np.random.default_rng(SEED)
    return {
        k: np.sort(rng.choice(v, size=min(SMOKE_SIZE[k], len(v)), replace=False))
        for k, v in splits.items()
    }


def classification_metrics(y_true, y_pred, y_score=None, binary=False):
    """Test-set metrics used in every notebook.

    Multi-class: accuracy + macro precision/recall/F1 (every class counts equally).
    Binary (DB): additionally positive-class F1, ROC-AUC and average precision,
    which need the predicted probability `y_score` of the positive class.
    """
    m = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_macro": precision_score(y_true, y_pred, average="macro", zero_division=0),
        "recall_macro": recall_score(y_true, y_pred, average="macro", zero_division=0),
        "f1_macro": f1_score(y_true, y_pred, average="macro", zero_division=0),
    }
    if binary:
        m["f1_positive"] = f1_score(y_true, y_pred, pos_label=1, zero_division=0)
        m["roc_auc"] = roc_auc_score(y_true, y_score)
        m["average_precision"] = average_precision_score(y_true, y_score)
    return {k: float(v) for k, v in m.items()}


class Stopwatch:
    """Context manager: `with Stopwatch() as t: ...; t.seconds`."""

    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def __exit__(self, *exc):
        self.seconds = time.perf_counter() - self._start


def save_result(record):
    """Write one run's record to results/<run_id>.json."""
    path = RESULTS_DIR / f"{record['run_id']}.json"
    path.write_text(json.dumps(record, indent=2), encoding="utf-8")
    return path


def load_results(run_ids):
    """Read results/<run_id>.json for each run ID (missing runs are skipped)."""
    out = []
    for rid in run_ids:
        path = RESULTS_DIR / f"{rid}.json"
        if path.exists():
            out.append(json.loads(path.read_text(encoding="utf-8")))
    return out


def savefig(fig, name):
    """Save a figure as report/images/<name>.png (name = run ID or dataset code + plot)."""
    fig.savefig(FIG_DIR / f"{name}.png", dpi=150, bbox_inches="tight")


def plot_history(history, run_id):
    """Training vs validation loss and accuracy per epoch."""
    fig, axes = plt.subplots(1, 2, figsize=(11, 3.8))
    epochs = np.arange(1, len(history["loss"]) + 1)
    for ax, key, title in [(axes[0], "loss", "Loss"), (axes[1], "accuracy", "Accuracy")]:
        ax.plot(epochs, history[key], marker="o", label="train")
        ax.plot(epochs, history[f"val_{key}"], marker="o", label="validation")
        ax.set_title(f"{run_id} — {title}")
        ax.set_xlabel("epoch")
        ax.grid(alpha=0.3)
        ax.legend()
    fig.tight_layout()
    savefig(fig, f"{run_id}_curves")
    plt.show()


def plot_confusion(y_true, y_pred, labels, run_id, normalize=True):
    """Confusion matrix; rows = true class, columns = predicted class."""
    cm = confusion_matrix(y_true, y_pred, labels=np.arange(len(labels)))
    shown = cm / cm.sum(axis=1, keepdims=True).clip(min=1) if normalize else cm
    size = max(4.5, 0.28 * len(labels))
    fig, ax = plt.subplots(figsize=(size + 1, size))
    im = ax.imshow(shown, cmap="Blues", vmin=0, vmax=1 if normalize else None)
    ax.set_xticks(range(len(labels)))
    ax.set_yticks(range(len(labels)))
    ax.set_xticklabels(labels, rotation=90 if len(labels) > 12 else 0, fontsize=7 if len(labels) > 12 else 9)
    ax.set_yticklabels(labels, fontsize=7 if len(labels) > 12 else 9)
    if len(labels) <= 12:
        for i in range(len(labels)):
            for j in range(len(labels)):
                ax.text(j, i, f"{shown[i, j]:.2f}" if normalize else cm[i, j],
                        ha="center", va="center", fontsize=8,
                        color="white" if shown[i, j] > 0.5 * shown.max() else "black")
    ax.set_xlabel("predicted class")
    ax.set_ylabel("true class")
    ax.set_title(f"{run_id} — confusion matrix" + (" (row-normalized)" if normalize else ""))
    fig.colorbar(im, ax=ax, fraction=0.046)
    fig.tight_layout()
    savefig(fig, f"{run_id}_confusion")
    plt.show()
    return cm


def results_table(records):
    """One row per run ID with the comparison columns used in section 6."""
    import pandas as pd

    rows = []
    for r in records:
        row = {
            "run_id": r["run_id"],
            "framework": r["framework"],
            "model": r["model"],
            "params": r["params"],
            "epochs": r["epochs_run"],
            "time_per_epoch_s": r["time_per_epoch_s"],
            "train_time_s": r["train_time_s"],
            "inference_ms_per_1k": r["inference_ms_per_1k"],
        }
        row.update(r["test_metrics"])
        rows.append(row)
    return pd.DataFrame(rows).set_index("run_id")
