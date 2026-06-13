from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import LEGACY_RUB_PER_USD
from app.core.database import get_db
from app.core.dependencies import get_admin_user
from app.models import (
    CartItem,
    Category,
    CategoryTranslation,
    ContactMessage,
    Currency,
    Order,
    Product,
    ProductImage,
    ProductTranslation,
    ShippingZone,
    User,
)
from app.schemas import (
    CategoryAdminIn,
    CurrencyOut,
    CurrencyUpdate,
    OrderStatusUpdate,
    ProductAdminIn,
    ShippingZoneIn,
    UserOut,
)
from app.services.catalog import get_currency, serialize_product
from app.services.commerce import (
    get_order,
    serialize_order,
    update_order_status,
)


router = APIRouter(prefix="/admin", tags=["admin"])


def _translations_map(items) -> dict[str, dict[str, str]]:
    return {
        item.locale: {
            "name": item.name,
            **(
                {
                    "description": item.description,
                    "material": item.material,
                    "size": item.size,
                    "color": item.color,
                    "manufacturer": item.manufacturer,
                    "country": item.country,
                }
                if isinstance(item, ProductTranslation)
                else {}
            ),
        }
        for item in items
    }


def _admin_product(product: Product) -> dict[str, object]:
    return {
        "id": product.id,
        "category_id": product.category_id,
        "slug": product.slug,
        "sku": product.sku,
        "price_usd_cents": product.price_usd_cents,
        "stock": product.stock,
        "image": product.image,
        "popularity": product.popularity,
        "is_active": product.is_active,
        "translations": _translations_map(product.translations),
        "images": [
            {
                "id": image.id,
                "path": image.path,
                "alt_en": image.alt_en,
                "alt_ru": image.alt_ru,
                "alt_de": image.alt_de,
                "alt_ja": image.alt_ja,
                "alt_fr": image.alt_fr,
                "sort_order": image.sort_order,
            }
            for image in product.images
        ],
    }


@router.get("/dashboard")
def dashboard(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    paid_statuses = {"paid", "processing", "shipped", "delivered"}
    order_rows = db.scalars(select(Order)).all()
    revenue = sum(
        order.total_usd_cents
        for order in order_rows
        if order.status in paid_statuses
    )
    status_counts: dict[str, int] = {}
    for order in order_rows:
        status_counts[order.status] = status_counts.get(order.status, 0) + 1
    product_rows = db.execute(
        select(Product.name, func.coalesce(func.sum(CartItem.quantity), 0))
        .outerjoin(CartItem, CartItem.product_id == Product.id)
        .group_by(Product.id)
        .order_by(func.coalesce(func.sum(CartItem.quantity), 0).desc())
        .limit(5)
    ).all()
    return {
        "revenue_usd_cents": revenue,
        "orders": len(order_rows),
        "average_order_usd_cents": (
            round(revenue / len(order_rows)) if order_rows else 0
        ),
        "users": db.scalar(select(func.count(User.id))) or 0,
        "products": db.scalar(select(func.count(Product.id))) or 0,
        "status_counts": status_counts,
        "popular_products": [
            {"name": name, "cart_quantity": quantity}
            for name, quantity in product_rows
        ],
    }


@router.get("/products")
def products(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(Product)
        .options(
            selectinload(Product.translations),
            selectinload(Product.images),
        )
        .order_by(Product.id)
    ).all()
    return [_admin_product(row) for row in rows]


def _apply_product(product: Product, payload: ProductAdminIn) -> None:
    fallback = payload.translations.get("en") or next(
        iter(payload.translations.values())
    )
    product.category_id = payload.category_id
    product.slug = payload.slug
    product.sku = payload.sku
    product.price_usd_cents = payload.price_usd_cents
    product.price = round(
        payload.price_usd_cents / 100 * LEGACY_RUB_PER_USD
    )
    product.stock = payload.stock
    product.image = payload.image or "hero.jpg"
    product.popularity = payload.popularity
    product.is_active = payload.is_active
    product.name = fallback.name
    product.description = fallback.description
    product.material = fallback.material
    product.size = fallback.size
    product.color = fallback.color
    product.manufacturer = fallback.manufacturer
    product.country = fallback.country


@router.post("/products", status_code=201)
def create_product(
    payload: ProductAdminIn,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if db.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=404, detail="Category not found")
    if db.scalar(select(Product.id).where(Product.slug == payload.slug)):
        raise HTTPException(status_code=409, detail="Product slug already exists")
    if db.scalar(select(Product.id).where(Product.sku == payload.sku)):
        raise HTTPException(status_code=409, detail="Product SKU already exists")
    fallback = payload.translations.get("en") or next(
        iter(payload.translations.values())
    )
    product = Product(
        category_id=payload.category_id,
        slug=payload.slug,
        sku=payload.sku,
        price_usd_cents=payload.price_usd_cents,
        price=0,
        stock=payload.stock,
        image=payload.image or "hero.jpg",
        popularity=payload.popularity,
        is_active=payload.is_active,
        name="",
        description="",
        material="",
        size="",
        color="",
        manufacturer="WoodStyle",
        country="",
    )
    _apply_product(product, payload)
    db.add(product)
    db.flush()
    for locale, translation in payload.translations.items():
        db.add(
            ProductTranslation(
                product_id=product.id,
                locale=locale,
                **translation.model_dump(),
            )
        )
    if payload.image:
        db.add(
            ProductImage(
                product_id=product.id,
                path=payload.image,
                alt_en=payload.translations.get("en", fallback).name,
                alt_ru=payload.translations.get("ru", fallback).name,
                alt_de=payload.translations.get("de", fallback).name,
                alt_ja=payload.translations.get("ja", fallback).name,
                alt_fr=payload.translations.get("fr", fallback).name,
            )
        )
    db.commit()
    return _admin_product(
        db.scalar(
            select(Product)
            .where(Product.id == product.id)
            .options(
                selectinload(Product.translations),
                selectinload(Product.images),
            )
        )
    )


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    payload: ProductAdminIn,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    product = db.scalar(
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.translations),
            selectinload(Product.images),
        )
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    _apply_product(product, payload)
    translations = {item.locale: item for item in product.translations}
    for locale, values in payload.translations.items():
        item = translations.get(locale)
        if item is None:
            item = ProductTranslation(product_id=product.id, locale=locale)
            db.add(item)
        for key, value in values.model_dump().items():
            setattr(item, key, value)
    db.commit()
    return _admin_product(product)


@router.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()


@router.get("/categories")
def categories(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(Category)
        .options(selectinload(Category.translations))
        .order_by(Category.id)
    ).all()
    return [
        {
            "id": row.id,
            "slug": row.slug,
            "image": row.image,
            "parent_id": row.parent_id,
            "is_active": row.is_active,
            "translations": _translations_map(row.translations),
        }
        for row in rows
    ]


@router.post("/categories", status_code=201)
def create_category(
    payload: CategoryAdminIn,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if db.scalar(select(Category.id).where(Category.slug == payload.slug)):
        raise HTTPException(status_code=409, detail="Category slug already exists")
    fallback = payload.translations.get("en") or next(
        iter(payload.translations.values())
    )
    category = Category(
        name=fallback.name,
        slug=payload.slug,
        image=payload.image,
        parent_id=payload.parent_id,
        is_active=payload.is_active,
    )
    db.add(category)
    db.flush()
    for locale, translation in payload.translations.items():
        db.add(
            CategoryTranslation(
                category_id=category.id,
                locale=locale,
                name=translation.name,
            )
        )
    db.commit()
    return {"id": category.id, "slug": category.slug}


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> None:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    has_active_products = db.scalar(
        select(Product.id).where(
            Product.category_id == category_id,
            Product.is_active.is_(True),
        )
    )
    if has_active_products:
        raise HTTPException(
            status_code=409,
            detail="Move or hide active products before hiding the category",
        )
    category.is_active = False
    db.commit()


@router.get("/orders")
def orders(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    ids = db.scalars(select(Order.id).order_by(Order.id.desc())).all()
    return [serialize_order(get_order(db, item)) for item in ids]


@router.patch("/orders/{order_id}")
def set_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return serialize_order(
        update_order_status(
            db,
            get_order(db, order_id),
            payload.status,
            payload.note,
        )
    )


@router.get("/users", response_model=list[UserOut])
def users(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return list(db.scalars(select(User).order_by(User.id)).all())


@router.get("/carts")
def carts(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(User, CartItem, Product)
        .join(CartItem, CartItem.user_id == User.id)
        .join(Product, Product.id == CartItem.product_id)
        .order_by(User.id, CartItem.id)
    ).all()
    return [
        {
            "user_id": user.id,
            "email": user.email,
            "product_id": product.id,
            "product_name": product.name,
            "quantity": cart_item.quantity,
        }
        for user, cart_item, product in rows
    ]


@router.get("/currencies", response_model=list[CurrencyOut])
def currencies(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return list(db.scalars(select(Currency).order_by(Currency.code)).all())


@router.patch("/currencies/{code}", response_model=CurrencyOut)
def update_currency(
    code: str,
    payload: CurrencyUpdate,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    currency = get_currency(db, code, allow_disabled=True)
    currency.rate_from_usd = payload.rate_from_usd
    currency.is_enabled = payload.is_enabled
    if payload.name is not None:
        currency.name = payload.name
    if payload.symbol is not None:
        currency.symbol = payload.symbol
    db.commit()
    db.refresh(currency)
    return currency


@router.get("/shipping")
def shipping(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return list(db.scalars(select(ShippingZone).order_by(ShippingZone.id)).all())


@router.post("/shipping", status_code=201)
def create_shipping(
    payload: ShippingZoneIn,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    zone = ShippingZone(**payload.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.put("/shipping/{zone_id}")
def update_shipping(
    zone_id: int,
    payload: ShippingZoneIn,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    zone = db.get(ShippingZone, zone_id)
    if zone is None:
        raise HTTPException(status_code=404, detail="Shipping zone not found")
    for key, value in payload.model_dump().items():
        setattr(zone, key, value)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/messages")
def messages(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(ContactMessage).order_by(ContactMessage.id.desc())
        ).all()
    )


@router.patch("/messages/{message_id}")
def process_message(
    message_id: int,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    message = db.get(ContactMessage, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    message.is_processed = True
    db.commit()
    return {"message": "Marked as processed"}
