from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..deps import get_current_user
from ..grading import grade_image
from ..storage import save_upload

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("", response_model=schemas.ScanOut)
async def create_scan(
    image: UploadFile,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty image upload")

    result = grade_image(content)
    image_url = save_upload(content)

    scan = models.Scan(
        user_id=user.id,
        produce_name=result.produce_name,
        produce_type=result.produce_type,
        score=result.score,
        band=result.band,
        confidence=result.confidence,
        flagged=result.flagged,
        verdict=result.verdict,
        days_counter=result.days_counter,
        days_fridge=result.days_fridge,
        image_path=image_url,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return _to_scan_out(scan)


@router.get("/{scan_id}", response_model=schemas.ScanOut)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    scan = (
        db.query(models.Scan)
        .filter(models.Scan.id == scan_id, models.Scan.user_id == user.id)
        .first()
    )
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return _to_scan_out(scan)


def _to_scan_out(scan: models.Scan) -> schemas.ScanOut:
    return schemas.ScanOut(
        id=scan.id,
        produce_name=scan.produce_name,
        produce_type=scan.produce_type,
        score=scan.score,
        band=scan.band,
        confidence=scan.confidence,
        flagged=scan.flagged,
        verdict=scan.verdict,
        days_counter=scan.days_counter,
        days_fridge=scan.days_fridge,
        image_url=scan.image_path,
        created_at=scan.created_at,
    )
