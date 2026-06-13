from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import Category, Favorite, Product, User
from app.services.catalog import get_currency, normalize_locale, serialize_product


router = APIRouter(prefix="/me/favorites", tags=["favorites"])


def _favorite_products(
    db: Session,
    user: User,
    currency: str,
    locale: str,
):
    favorite_rows = db.scalars(
        select(Favorite)
        .where(Favorite.user_id == user.id)
        .options(
            selectinload(Favorite.product).selectinload(Product.translations),
            selectinload(Favorite.product).selectinload(Product.images),
            selectinload(Favorite.product)
            .selectinload(Product.category)
            .selectinload(Category.translations),
        )
        .order_by(Favorite.id.desc())
    ).all()
    selected_currency = get_currency(db, currency)
    selected_locale = normalize_locale(locale)
    return [
        serialize_product(row.product, selected_currency, selected_locale)
        for row in favorite_rows
        if row.product.is_active
    ]


@router.get("")
def favorites(
    currency: str = "USD",
    locale: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _favorite_products(db, user, currency, locale)


@router.post("/{product_id}", status_code=201)
def add_favorite(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.get(Product, product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = db.scalar(
        select(Favorite).where(
            Favorite.user_id == user.id,
            Favorite.product_id == product_id,
        )
    )
    if existing is None:
        db.add(Favorite(user_id=user.id, product_id=product_id))
        db.commit()
    return {"message": "Added to favorites"}


@router.delete("/{product_id}", status_code=204)
def remove_favorite(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    favorite = db.scalar(
        select(Favorite).where(
            Favorite.user_id == user.id,
            Favorite.product_id == product_id,
        )
    )
    if favorite:
        db.delete(favorite)
        db.commit()
