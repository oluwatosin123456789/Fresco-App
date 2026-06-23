from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

Band = Literal["fresh", "eat_soon", "use_now"]


class ScanOut(BaseModel):
    id: int
    produce_name: str
    produce_type: str
    score: int
    band: Band
    confidence: int
    flagged: str | None
    verdict: str
    days_counter: int
    days_fridge: int
    image_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PantryItemCreate(BaseModel):
    scan_id: int
    storage: Literal["counter", "fridge"] = "fridge"


class PantryItemUpdate(BaseModel):
    status: Literal["used", "wasted"]


class PantryItemOut(BaseModel):
    id: int
    scan_id: int | None
    name: str
    produce_type: str
    score: int
    band: Band
    days_counter: int
    days_fridge: int
    storage: Literal["counter", "fridge"]
    status: Literal["active", "used", "wasted"]
    image_url: str | None
    created_at: datetime
    use_by: datetime
    days_remaining: int

    model_config = ConfigDict(from_attributes=True)


class RecipeOut(BaseModel):
    id: int
    title: str
    subtitle: str
    minutes: int
    tags: list[str]
    uses_expiring: int
    image_url: str | None
    placeholder: str
    badge: str | None


class WasteWeekDay(BaseModel):
    day: str
    value: float
    highlight: bool


class WasteStatsOut(BaseModel):
    kg_saved: float
    money_saved: float
    co2e_avoided_kg: float
    streak_days: int
    week: list[WasteWeekDay]
    week_saved_label: str


class TraderPricingTier(BaseModel):
    band: Band
    label: str
    adjustment_label: str


class TraderDistribution(BaseModel):
    fresh_pct: int
    soon_pct: int
    now_pct: int
    fresh_count: int
    soon_count: int
    now_count: int


class TraderItemOut(BaseModel):
    id: int
    produce_name: str
    produce_type: str
    score: int
    band: Band
    confidence: int

    model_config = ConfigDict(from_attributes=True)


class TraderBatchOut(BaseModel):
    id: int
    item_count: int
    created_at: datetime
    distribution: TraderDistribution
    items: list[TraderItemOut]
    pricing: list[TraderPricingTier]
