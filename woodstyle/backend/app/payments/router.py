from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import RATE_LIMIT_CHECKOUT
from app.core.dependencies import get_current_user
from app.core.rate_limit import enforce_rate_limit
from app.models import User
from app.schemas import CardPaymentIn
from app.services.commerce import process_card_payment, serialize_order


router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("/pay")
def pay(
    payload: CardPaymentIn,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enforce_rate_limit(request, "checkout-payment", RATE_LIMIT_CHECKOUT)
    order = process_card_payment(
        db,
        user,
        payload.order_id,
        payload.card_number,
        payload.idempotency_key,
    )
    return serialize_order(order)
