"""Pydantic request / response models for the house-price API.

The request mirrors the cleaned feature set from the notebook (section 13). Only
``Area`` is required; every other field is optional and is median-/"Unknown"-imputed
by the **saved** preprocessing pipeline exactly as during training — the API never
fits a new imputer or encoder (Appendix: "Important: Data Leakage").

TODO(notebook): once house_price.ipynb section 13 finalises the feature list and the
categorical vocabularies, sync the field names, the ``Literal[...]`` option sets and
the ``model_features_order`` in model/input_schema.json with this file.
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ListingInput(BaseModel):
    # --- required ---
    Area: float = Field(..., gt=0, le=10_000, description="usable area in m^2")

    # --- optional numeric (imputed by the saved pipeline if omitted / null) ---
    Width: Optional[float] = Field(None, gt=0, le=500, description="frontage width, m")
    Length: Optional[float] = Field(None, gt=0, le=1_000, description="lot depth, m")
    Bedrooms: Optional[float] = Field(None, ge=0, le=50)
    Bathrooms: Optional[float] = Field(None, ge=0, le=50)
    Floors: Optional[float] = Field(None, ge=0, le=100)
    AlleyWidth: Optional[float] = Field(None, ge=0, le=100, alias="Alley Width")
    Latitude: Optional[float] = Field(None, ge=8.0, le=24.0)
    Longitude: Optional[float] = Field(None, ge=102.0, le=110.0)

    # --- categorical (free-form; unknown values fall back to the pipeline's "Unknown") ---
    PropertyType: Optional[str] = Field(None, alias="Property Type",
                                        description="e.g. 'Nhà riêng', 'Căn hộ chung cư', 'Đất'")
    Position: Optional[str] = Field(None, description="e.g. 'Đường chính', 'Trong hẻm'")
    Direction: Optional[str] = Field(None, description="compass direction, e.g. 'Nam'")
    RoadType: Optional[str] = Field(None, alias="Road Type", description="e.g. 'Đường nhựa'")
    Province: Optional[str] = Field(None, description="province slug, e.g. 'tp-ho-chi-minh'")
    AgentRole: Optional[str] = Field(None, alias="Agent Role",
                                     description="'Môi giới' or 'Chính chủ'")

    # --- engineered upstream from the free-text Location column (notebook section 13) ---
    ward: Optional[str] = Field(None, description="parsed ward, e.g. 'Phường An Hòa'")
    district: Optional[str] = Field(None, description="parsed district, e.g. 'Quận 9'")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "Area": 78.7,
                "Width": 4.0,
                "Bedrooms": 3,
                "Bathrooms": 2,
                "Floors": 2,
                "Property Type": "Nhà riêng",
                "Position": "Đường chính",
                "Direction": "Nam",
                "Road Type": "Đường nhựa",
                "Province": "an-giang",
                "Agent Role": "Chính chủ",
                "ward": "Phường An Hòa",
                "district": "Rạch Giá",
            }
        },
    }


class PredictionOut(BaseModel):
    predicted_price: float = Field(..., description="estimated listing price in million VND")
    price_per_m2: Optional[float] = Field(None, description="predicted_price * 1000 / Area, in million VND / m^2 * 1000")
    currency: str = "million VND"
    model_name: str = Field(..., description="the deployed regressor, e.g. 'XGBoost'")


class HealthOut(BaseModel):
    status: str
    model_loaded: bool
    model_name: Optional[str] = None
