from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import CartItem, Product, User
from app.schemas import CartItemIn, CartItemUpdate, CartMergeIn
from app.services.catalog import get_currency, normalize_locale
from app.services.commerce import serialize_cart


router = APIRouter(prefix="/me/cart", tags=["cart"])


def _cart_response(db: Session, user: User, currency: str, locale: str):
    return serialize_cart(
        db,
        user,
        get_currency(db, currency),
        normalize_locale(locale),
    )


@router.get("")
def get_cart(
    currency: str = "USD",
    locale: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _cart_response(db, user, currency, locale)


@router.post("/items")
def add_item(
    payload: CartItemIn,
    currency: str = "USD",
    locale: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.get(Product, payload.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    if payload.quantity > product.stock:
        raise HTTPException(status_code=409, detail="Insufficient stock")
    item = db.scalar(
        select(CartItem).where(
            CartItem.user_id == user.id,
            CartItem.product_id == payload.product_id,
        )
    )
    if item:
        item.quantity = min(product.stock, item.quantity + payload.quantity)
    else:
        db.add(CartItem(user_id=user.id, **payload.model_dump()))
    db.commit()
    return _cart_response(db, user, currency, locale)


@router.patch("/items/{item_id}")
def update_item(
    item_id: int,
    payload: CartItemUpdate,
    currency: str = "USD",
    locale: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.scalar(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == user.id,
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Cart item not found")
    product = db.get(Product, item.product_id)
    if product is None or payload.quantity > product.stock:
        raise HTTPException(status_code=409, detail="Insufficient stock")
    item.quantity = payload.quantity
    db.commit()
    return _cart_response(db, user, currency, locale)


@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    currency: str = "USD",
    locale: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.scalar(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == user.id,
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return _cart_response(db, user, currency, locale)


@router.post("/merge")
def merge_cart(
    payload: CartMergeIn,
    currency: str = "USD",
    locale: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for incoming in payload.items:
        product = db.get(Product, incoming.product_id)
        if product is None or not product.is_active or product.stock <= 0:
            continue
        item = db.scalar(
            select(CartItem).where(
                CartItem.user_id == user.id,
                CartItem.product_id == incoming.product_id,
            )
        )
        quantity = min(product.stock, incoming.quantity)
        if item:
            item.quantity = min(product.stock, item.quantity + quantity)
        else:
            db.add(
                CartItem(
                    user_id=user.id,
                    product_id=incoming.product_id,
                    quantity=quantity,
                )
            )
    db.commit()
    return _cart_response(db, user, currency, locale)
