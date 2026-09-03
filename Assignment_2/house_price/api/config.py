"""Filesystem paths for the house-price API.

Everything the service loads at runtime is a file produced by
``notebook/house_price.ipynb`` section 22 (model persistence):

    model/model_pipeline.joblib   the full sklearn Pipeline (ColumnTransformer + regressor)
    model/feature_names.joblib    ordered list of raw feature columns the pipeline expects
    model/input_schema.json       the committed input contract (also read by clients)
"""
from __future__ import annotations

from pathlib import Path

# house_price/api/config.py -> house_price/
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"

MODEL_PIPELINE_PATH = MODEL_DIR / "model_pipeline.joblib"
FEATURE_NAMES_PATH = MODEL_DIR / "feature_names.joblib"
INPUT_SCHEMA_PATH = MODEL_DIR / "input_schema.json"

# The target (Price) is in million VND. Set to 1_000_000 to return raw VND instead.
PRICE_UNIT_MULTIPLIER = 1.0
