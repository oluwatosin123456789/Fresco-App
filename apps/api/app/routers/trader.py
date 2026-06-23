from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..deps import get_current_user
from ..grading import grade_image

router = APIRouter(prefix="/trader", tags=["trader"])

# Fixed quality-based pricing tiers per PRD §6.3 (Pro/Trader mode).
PRICING_TIERS = [
    schemas.TraderPricingTier(band="fresh", label="Fresh", adjustment_label="Full price"),
    schemas.TraderPricingTier(band="eat_soon", label="Eat-soon", adjustment_label="−15%"),
    schemas.TraderPricingTier(band="use_now", label="Use-now · sell today", adjustment_label="−40%"),
]


@router.post("/batch", response_model=schemas.TraderBatchOut)
async def create_batch(
    images: list[UploadFile],
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not images:
        raise HTTPException(status_code=400, detail="No images uploaded")

    batch = models.TraderBatch(user_id=user.id, item_count=len(images))
    db.add(batch)
    db.flush()

    counts = {"fresh": 0, "eat_soon": 0, "use_now": 0}
    for image in images:
        content = await image.read()
        if not content:
            continue
        result = grade_image(content)
        counts[result.band] += 1
        db.add(
            models.TraderBatchItem(
                batch_id=batch.id,
                produce_name=result.produce_name,
                produce_type=result.produce_type,
                score=result.score,
                band=result.band,
                confidence=result.confidence,
            )
        )

    db.commit()
    db.refresh(batch)

    total = max(batch.item_count, 1)
    distribution = schemas.TraderDistribution(
        fresh_pct=round(counts["fresh"] / total * 100),
        soon_pct=round(counts["eat_soon"] / total * 100),
        now_pct=round(counts["use_now"] / total * 100),
        fresh_count=counts["fresh"],
        soon_count=counts["eat_soon"],
        now_count=counts["use_now"],
    )

    return schemas.TraderBatchOut(
        id=batch.id,
        item_count=batch.item_count,
        created_at=batch.created_at,
        distribution=distribution,
        items=[schemas.TraderItemOut.model_validate(item) for item in batch.items],
        pricing=PRICING_TIERS,
    )


@router.get("/batches/{batch_id}", response_model=schemas.TraderBatchOut)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    batch = (
        db.query(models.TraderBatch)
        .filter(models.TraderBatch.id == batch_id, models.TraderBatch.user_id == user.id)
        .first()
    )
    if batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")

    total = max(batch.item_count, 1)
    counts = {"fresh": 0, "eat_soon": 0, "use_now": 0}
    for item in batch.items:
        counts[item.band] += 1

    distribution = schemas.TraderDistribution(
        fresh_pct=round(counts["fresh"] / total * 100),
        soon_pct=round(counts["eat_soon"] / total * 100),
        now_pct=round(counts["use_now"] / total * 100),
        fresh_count=counts["fresh"],
        soon_count=counts["eat_soon"],
        now_count=counts["use_now"],
    )

    return schemas.TraderBatchOut(
        id=batch.id,
        item_count=batch.item_count,
        created_at=batch.created_at,
        distribution=distribution,
        items=[schemas.TraderItemOut.model_validate(item) for item in batch.items],
        pricing=PRICING_TIERS,
    )
