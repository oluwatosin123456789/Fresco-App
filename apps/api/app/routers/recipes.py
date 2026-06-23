from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..deps import get_current_user
from ..seed_recipes import RECIPES
from .pantry import _to_pantry_out

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("", response_model=list[schemas.RecipeOut])
def list_recipes(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    active_items = (
        db.query(models.PantryItem)
        .filter(models.PantryItem.user_id == user.id, models.PantryItem.status == "active")
        .all()
    )
    pantry_out = sorted(
        (_to_pantry_out(item) for item in active_items), key=lambda p: p.days_remaining
    )
    expiring_types = {p.produce_type for p in pantry_out if p.days_remaining <= 3}

    results = []
    for recipe in RECIPES:
        tags = set(recipe["tags"])
        uses_expiring = len(tags & expiring_types)
        badge = f"SAVES {uses_expiring} EXPIRING" if uses_expiring >= 2 else None
        results.append(
            schemas.RecipeOut(
                id=recipe["id"],
                title=recipe["title"],
                subtitle=recipe["subtitle"],
                minutes=recipe["minutes"],
                tags=recipe["tags"],
                uses_expiring=uses_expiring,
                image_url=None,
                placeholder=recipe["placeholder"],
                badge=badge,
            )
        )

    results.sort(key=lambda r: (-r.uses_expiring, r.minutes))
    return results
