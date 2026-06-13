from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User
from app.schemas import CardPaymentIn
from app.services.commerce import process_card_payment, serialize_order


router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("/pay")
def pay(
    payload: CardPaymentIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = process_card_payment(
        db,
        user,
        payload.order_id,
        payload.card_number,
    )
    return serialize_order(order)
