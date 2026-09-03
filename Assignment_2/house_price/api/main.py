"""FastAPI service for the house-price prediction application (Assignment 02, App 2).

    JSON input  ->  validation (schema.py)  ->  the SAME preprocessing saved from
    training (model/model_pipeline.joblib)  ->  regressor  ->  JSON output

Run (from Assignment_2/):
    uvicorn api.main:app --reload --port 8001
Docs / Swagger UI:
    http://localhost:8001/docs
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import inference as I
from .schema import HealthOut, ListingInput, PredictionOut

app = FastAPI(
    title="House-Price Prediction API",
    version="1.0.0",
    description="Assignment 02 · Application 2 — property attributes → estimated price "
                "(million VND). Loads a persisted sklearn pipeline; no training here.",
)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
def _warm() -> None:
    try:
        I.get_pipeline()          # load once at startup so the first request is fast
    except Exception as e:        # noqa: BLE001
        # don't crash the server if the notebook hasn't produced the model yet;
        # /healthz will report model_loaded == False.
        print(f"[startup] model not loaded: {e}")


@app.get("/healthz", response_model=HealthOut)
def healthz() -> HealthOut:
    ready = I.is_ready()
    return HealthOut(
        status="ok" if ready else "model-not-loaded",
        model_loaded=ready,
        model_name=I.model_name() if ready else None,
    )


@app.post("/predict", response_model=PredictionOut)
def predict(inp: ListingInput) -> PredictionOut:
    if not I.is_ready():
        raise HTTPException(
            status_code=503,
            detail="model/model_pipeline.joblib is missing — run notebook/house_price.ipynb "
                   "section 22 to produce it.",
        )
    payload = inp.model_dump(by_alias=True, exclude_none=True)
    try:
        price = I.predict_price(payload)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"prediction failed: {e}") from e

    area = payload.get("Area")
    ppm2 = round(price * 1000 / area, 2) if area else None
    return PredictionOut(
        predicted_price=round(price, 3),
        price_per_m2=ppm2,
        model_name=I.model_name(),
    )
