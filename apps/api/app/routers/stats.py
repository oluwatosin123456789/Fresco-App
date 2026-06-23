from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])

# Rough per-item averages used to turn "items saved" into the headline
# kg / money / CO2e stats (PRD §6.2 Waste Saved tracker). Not real market
# data -- a reasonable stand-in until pricing comes from the Trader module.
AVG_WEIGHT_KG = {
    "tomato": 0.12,
    "banana": 0.15,
    "strawberry": 0.25,  # punnet
    "spinach": 0.2,
    "bell_pepper": 0.18,
    "avocado": 0.2,
}
AVG_PRICE_PER_KG_NGN = {
    "tomato": 900,
    "banana": 700,
    "strawberry": 4500,
    "spinach": 1200,
    "bell_pepper": 1800,
    "avocado": 2500,
}
CO2E_PER_KG = 2.3
DEFAULT_WEIGHT_KG = 0.15
DEFAULT_PRICE_PER_KG = 1000

# Shown to a brand-new user with no resolved Pantry history yet, so the
# screen demonstrates the feature instead of looking broken/empty.
DEMO_BASELINE = schemas.WasteStatsOut(
    kg_saved=14.2,
    money_saved=38500,
    co2e_avoided_kg=31,
    streak_days=9,
    week=[
        schemas.WasteWeekDay(day="M", value=38, highlight=False),
        schemas.WasteWeekDay(day="T", value=58, highlight=False),
        schemas.WasteWeekDay(day="W", value=30, highlight=False),
        schemas.WasteWeekDay(day="T", value=72, highlight=False),
        schemas.WasteWeekDay(day="F", value=84, highlight=True),
        schemas.WasteWeekDay(day="S", value=20, highlight=False),
        schemas.WasteWeekDay(day="S", value=14, highlight=False),
    ],
    week_saved_label="+₦6,200 SAVED",
)


@router.get("/waste-saved", response_model=schemas.WasteStatsOut)
def get_waste_stats(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    used_items = (
        db.query(models.PantryItem)
        .filter(models.PantryItem.user_id == user.id, models.PantryItem.status == "used")
        .all()
    )
    if not used_items:
        return DEMO_BASELINE

    kg_saved = 0.0
    money_saved = 0.0
    by_day: dict[str, float] = defaultdict(float)

    for item in used_items:
        weight = AVG_WEIGHT_KG.get(item.produce_type, DEFAULT_WEIGHT_KG)
        price = AVG_PRICE_PER_KG_NGN.get(item.produce_type, DEFAULT_PRICE_PER_KG)
        item_money = weight * price
        kg_saved += weight
        money_saved += item_money

        resolved = item.resolved_at or item.created_at
        if resolved.tzinfo is None:
            resolved = resolved.replace(tzinfo=timezone.utc)
        by_day[resolved.date().isoformat()] += item_money

    co2e_avoided_kg = kg_saved * CO2E_PER_KG

    today = datetime.now(timezone.utc).date()
    week: list[schemas.WasteWeekDay] = []
    week_total = 0.0
    max_value = max(by_day.values(), default=0.0)
    for offset in range(6, -1, -1):
        d = today - timedelta(days=offset)
        value = by_day.get(d.isoformat(), 0.0)
        week_total += value
        week.append(
            schemas.WasteWeekDay(
                day=d.strftime("%a")[0],
                value=round(value, 2),
                highlight=value > 0 and value == max_value,
            )
        )

    # Streak: consecutive days ending today with >=1 saved item and 0 wasted that day.
    wasted_items = (
        db.query(models.PantryItem)
        .filter(models.PantryItem.user_id == user.id, models.PantryItem.status == "wasted")
        .all()
    )
    wasted_days = set()
    for item in wasted_items:
        resolved = item.resolved_at or item.created_at
        if resolved.tzinfo is None:
            resolved = resolved.replace(tzinfo=timezone.utc)
        wasted_days.add(resolved.date())

    saved_days = set()
    for item in used_items:
        resolved = item.resolved_at or item.created_at
        if resolved.tzinfo is None:
            resolved = resolved.replace(tzinfo=timezone.utc)
        saved_days.add(resolved.date())

    streak = 0
    cursor = today
    while cursor in saved_days and cursor not in wasted_days:
        streak += 1
        cursor -= timedelta(days=1)

    return schemas.WasteStatsOut(
        kg_saved=round(kg_saved, 1),
        money_saved=round(money_saved),
        co2e_avoided_kg=round(co2e_avoided_kg, 1),
        streak_days=streak,
        week=week,
        week_saved_label=f"+₦{round(week_total):,} SAVED",
    )
