from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import DEFAULT_CURRENCY, DEFAULT_LOCALE, SUPPORTED_LOCALES
from app.models import Category, Currency, Product


def normalize_locale(locale: str | None) -> str:
    return locale if locale in SUPPORTED_LOCALES else DEFAULT_LOCALE


def get_currency(
    db: Session,
    code: str | None,
    allow_disabled: bool = False,
) -> Currency:
    normalized = (code or DEFAULT_CURRENCY).upper()
    currency = db.get(Currency, normalized)
    if currency is None or (not currency.is_enabled and not allow_disabled):
        currency = db.get(Currency, DEFAULT_CURRENCY)
    if currency is None:
        raise HTTPException(status_code=500, detail="Currency catalogue is empty")
    return currency


def convert_usd_cents(usd_cents: int, currency: Currency) -> int:
    amount = (
        Decimal(usd_cents)
        / Decimal(100)
        * Decimal(currency.rate_from_usd)
        * (Decimal(10) ** currency.decimal_digits)
    )
    return int(amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def translated_category_name(category: Category, locale: str) -> str:
    selected = next(
        (
            translation
            for translation in category.translations
            if translation.locale == locale
        ),
        None,
    )
    fallback = next(
        (
            translation
            for translation in category.translations
            if translation.locale == DEFAULT_LOCALE
        ),
        None,
    )
    return (selected or fallback).name if selected or fallback else category.name


def translated_product(product: Product, locale: str):
    selected = next(
        (
            translation
            for translation in product.translations
            if translation.locale == locale
        ),
        None,
    )
    fallback = next(
        (
            translation
            for translation in product.translations
            if translation.locale == DEFAULT_LOCALE
        ),
        None,
    )
    return selected or fallback


def serialize_product(
    product: Product,
    currency: Currency,
    locale: str,
) -> dict[str, object]:
    translation = translated_product(product, locale)
    name = translation.name if translation else product.name
    images = [
        {
            "id": image.id,
            "path": image.path,
            "alt": getattr(image, f"alt_{locale}", "") or image.alt_en or name,
        }
        for image in product.images
    ]
    if not images:
        images = [{"id": 0, "path": product.image, "alt": name}]
    return {
        "id": product.id,
        "slug": product.slug,
        "sku": product.sku,
        "name": name,
        "description": translation.description if translation else product.description,
        "material": translation.material if translation else product.material,
        "size": translation.size if translation else product.size,
        "color": translation.color if translation else product.color,
        "manufacturer": (
            translation.manufacturer if translation else product.manufacturer
        ),
        "country": translation.country if translation else product.country,
        "category": translated_category_name(product.category, locale),
        "category_id": product.category_id,
        "category_slug": product.category.slug,
        "image": product.image,
        "images": images,
        "price_usd_cents": product.price_usd_cents,
        "price_minor": convert_usd_cents(product.price_usd_cents, currency),
        "currency": currency.code,
        "currency_digits": currency.decimal_digits,
        "stock": product.stock,
        "popularity": product.popularity,
        "is_active": product.is_active,
    }


def enabled_currencies(db: Session) -> list[Currency]:
    return list(
        db.scalars(
            select(Currency)
            .where(Currency.is_enabled.is_(True))
            .order_by(Currency.code)
        ).all()
    )
