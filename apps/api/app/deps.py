from fastapi import Depends, Header
from sqlalchemy.orm import Session

from .db import get_db
from .models import User

# Lightweight stand-in for Supabase Auth: the client generates a UUID,
# persists it in localStorage, and sends it on every request. This keeps the
# PRD's "no sign-up wall to try it once" promise while still scoping data
# per device. Swap this for real Supabase Auth by replacing this dependency
# with one that resolves a `user_id` from a verified session/JWT instead.


def get_current_user(
    x_device_id: str = Header(..., alias="X-Device-Id"),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.device_id == x_device_id).first()
    if user is None:
        user = User(device_id=x_device_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
