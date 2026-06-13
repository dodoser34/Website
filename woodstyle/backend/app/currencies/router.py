from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Currency
from app.schemas import CurrencyOut


router = APIRouter(prefix="/currencies", tags=["currencies"])


@router.get("", response_model=list[CurrencyOut])
def currencies(
    all_codes: bool = False,
    db: Session = Depends(get_db),
):
    query = select(Currency)
    if not all_codes:
        query = query.where(Currency.is_enabled.is_(True))
    return list(db.scalars(query.order_by(Currency.code)).all())
