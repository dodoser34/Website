from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Category, Product
from app.services.catalog import (
    get_currency,
    normalize_locale,
    serialize_product,
    translated_product,
)


router = APIRouter(prefix="/products", tags=["products"])


def product_options():
    return (
        selectinload(Product.translations),
        selectinload(Product.images),
        selectinload(Product.category).selectinload(Category.translations),
    )


@router.get("")
def products(
    q: str = "",
    category: str = "",
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    sort: str = "popular",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    locale: str = "en",
    currency: str = "USD",
    db: Session = Depends(get_db),
) -> dict[str, object]:
    locale = normalize_locale(locale)
    selected_currency = get_currency(db, currency)
    items = list(
        db.scalars(
            select(Product)
            .where(Product.is_active.is_(True))
            .options(*product_options())
        ).all()
    )
    normalized_query = q.strip().lower()
    if category:
        items = [item for item in items if item.category.slug == category]
    if normalized_query:
        items = [
            item
            for item in items
            if normalized_query
            in (
                f"{translated_product(item, locale).name if translated_product(item, locale) else item.name} "
                f"{item.sku} {item.category.slug}"
            ).lower()
        ]
    if min_price is not None:
        items = [item for item in items if item.price_usd_cents >= min_price]
    if max_price is not None:
        items = [item for item in items if item.price_usd_cents <= max_price]
    if sort == "price-asc":
        items.sort(key=lambda item: item.price_usd_cents)
    elif sort == "price-desc":
        items.sort(key=lambda item: item.price_usd_cents, reverse=True)
    elif sort == "newest":
        items.sort(key=lambda item: item.id, reverse=True)
    else:
        items.sort(key=lambda item: item.popularity, reverse=True)
    total = len(items)
    start = (page - 1) * page_size
    page_items = items[start : start + page_size]
    return {
        "items": [
            serialize_product(item, selected_currency, locale)
            for item in page_items
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/{product_id}")
def product(
    product_id: int,
    locale: str = "en",
    currency: str = "USD",
    db: Session = Depends(get_db),
) -> dict[str, object]:
    item = db.scalar(
        select(Product)
        .where(Product.id == product_id, Product.is_active.is_(True))
        .options(*product_options())
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(
        item,
        get_currency(db, currency),
        normalize_locale(locale),
    )
