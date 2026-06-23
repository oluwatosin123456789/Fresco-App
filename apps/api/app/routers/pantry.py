import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/pantry", tags=["pantry"])


def _to_pantry_out(item: models.PantryItem) -> schemas.PantryItemOut:
    days_total = item.days_fridge if item.storage == "fridge" else item.days_counter
    created = item.created_at.replace(tzinfo=timezone.utc) if item.created_at.tzinfo is None else item.created_at
    use_by = created + timedelta(days=days_total)
    remaining_seconds = (use_by - datetime.now(timezone.utc)).total_seconds()
    days_remaining = max(0, math.ceil(remaining_seconds / 86400))

    return schemas.PantryItemOut(
        id=item.id,
        scan_id=item.scan_id,
        name=item.name,
        produce_type=item.produce_type,
        score=item.score,
        band=item.band,
        days_counter=item.days_counter,
        days_fridge=item.days_fridge,
        storage=item.storage,
        status=item.status,
        image_url=item.image_path,
        created_at=item.created_at,
        use_by=use_by,
        days_remaining=days_remaining,
    )


@router.get("", response_model=list[schemas.PantryItemOut])
def list_pantry(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    items = (
        db.query(models.PantryItem)
        .filter(models.PantryItem.user_id == user.id, models.PantryItem.status == "active")
        .all()
    )
    out = [_to_pantry_out(item) for item in items]
    out.sort(key=lambda p: p.days_remaining)
    return out


@router.post("", response_model=schemas.PantryItemOut)
def add_pantry_item(
    body: schemas.PantryItemCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    scan = (
        db.query(models.Scan)
        .filter(models.Scan.id == body.scan_id, models.Scan.user_id == user.id)
        .first()
    )
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    item = models.PantryItem(
        user_id=user.id,
        scan_id=scan.id,
        name=scan.produce_name,
        produce_type=scan.produce_type,
        score=scan.score,
        band=scan.band,
        days_counter=scan.days_counter,
        days_fridge=scan.days_fridge,
        storage=body.storage,
        image_path=scan.image_path,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_pantry_out(item)


@router.patch("/{item_id}", response_model=schemas.PantryItemOut)
def update_pantry_item(
    item_id: int,
    body: schemas.PantryItemUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.PantryItem)
        .filter(models.PantryItem.id == item_id, models.PantryItem.user_id == user.id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Pantry item not found")

    item.status = body.status
    item.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return _to_pantry_out(item)


@router.delete("/{item_id}", status_code=204)
def delete_pantry_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.PantryItem)
        .filter(models.PantryItem.id == item_id, models.PantryItem.user_id == user.id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    db.delete(item)
    db.commit()
    return None
