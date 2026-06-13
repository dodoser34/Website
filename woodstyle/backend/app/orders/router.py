from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import Order, User
from app.services.commerce import get_order, serialize_order


router = APIRouter(prefix="/me/orders", tags=["orders"])


@router.get("")
def orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ids = db.scalars(
        select(Order.id)
        .where(Order.user_id == user.id)
        .order_by(Order.id.desc())
    ).all()
    return [serialize_order(get_order(db, order_id)) for order_id in ids]


@router.get("/{order_id}")
def order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = get_order(db, order_id)
    if item.user_id != user.id:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_order(item)
