"""Model loading and the core prediction path.

The service loads ONE artifact — ``model/model_pipeline.joblib`` — a fitted sklearn
``Pipeline`` whose first step is the ``ColumnTransformer`` (imputer + scaler + one-hot /
frequency encoders) from notebook section 15 and whose last step is the selected
regressor from section 21. Deployment never re-fits any of it.

The notebook trains on ``log1p(Price)`` (section 12/17), so predictions are converted
back with ``expm1``.  TODO(notebook): if section 17 changes the target transform,
update ``_TARGET_IS_LOG1P`` below.
"""
from __future__ import annotations

import json
import threading
from typing import Optional

import joblib
import numpy as np
import pandas as pd

from . import config as C

_TARGET_IS_LOG1P = True   # notebook trains on log1p(Price); flip if that changes

_LOCK = threading.Lock()
_PIPELINE = None
_FEATURE_NAMES: Optional[list[str]] = None
_SCHEMA: Optional[dict] = None


# --------------------------------------------------------------------------- load
def get_pipeline():
    global _PIPELINE, _FEATURE_NAMES
    if _PIPELINE is None:
        with _LOCK:
            if _PIPELINE is None:
                _PIPELINE = joblib.load(C.MODEL_PIPELINE_PATH)
                if C.FEATURE_NAMES_PATH.exists():
                    _FEATURE_NAMES = list(joblib.load(C.FEATURE_NAMES_PATH))
                elif C.INPUT_SCHEMA_PATH.exists():
                    _FEATURE_NAMES = list(_load_schema().get("model_features_order", []))
    return _PIPELINE


def _load_schema() -> dict:
    global _SCHEMA
    if _SCHEMA is None and C.INPUT_SCHEMA_PATH.exists():
        _SCHEMA = json.loads(C.INPUT_SCHEMA_PATH.read_text())
    return _SCHEMA or {}


def feature_names() -> list[str]:
    get_pipeline()
    return _FEATURE_NAMES or []


def model_name() -> str:
    return _load_schema().get("chosen_model", type(_last_step()).__name__)


def is_ready() -> bool:
    try:
        get_pipeline()
        return _PIPELINE is not None
    except Exception:  # noqa: BLE001
        return False


def _last_step():
    pipe = get_pipeline()
    return pipe.steps[-1][1] if hasattr(pipe, "steps") else pipe


# ----------------------------------------------------------------------- predict
def _build_frame(payload: dict) -> pd.DataFrame:
    """Turn the validated request dict into a 1-row DataFrame with the exact
    columns the fitted pipeline expects. Missing columns are left as NaN / None so
    the pipeline's own imputers handle them (no imputation logic lives here)."""
    cols = feature_names()
    if not cols:
        # schema not wired yet — pass everything through and let the pipeline complain
        return pd.DataFrame([payload])
    row = {c: payload.get(c, np.nan) for c in cols}
    return pd.DataFrame([row])[cols]


def predict_price(payload: dict) -> float:
    """Raw request dict -> predicted price in million VND."""
    pipe = get_pipeline()
    X = _build_frame(payload)
    y = float(pipe.predict(X)[0])
    if _TARGET_IS_LOG1P:
        y = float(np.expm1(y))
    return y * C.PRICE_UNIT_MULTIPLIER
