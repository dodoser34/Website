from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Category, Product
from app.services.catalog import normalize_locale, translated_category_name


router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
def categories(
    locale: str = "en",
    db: Session = Depends(get_db),
) -> list[dict[str, object]]:
    locale = normalize_locale(locale)
    rows = db.execute(
        select(Category, func.count(Product.id))
        .outerjoin(Product, (Product.category_id == Category.id) & Product.is_active)
        .where(Category.is_active.is_(True))
        .options(selectinload(Category.translations))
        .group_by(Category.id)
        .order_by(Category.id)
    ).all()
    return [
        {
            "id": category.id,
            "name": translated_category_name(category, locale),
            "slug": category.slug,
            "image": category.image,
            "parent_id": category.parent_id,
            "product_count": count,
        }
        for category, count in rows
    ]
