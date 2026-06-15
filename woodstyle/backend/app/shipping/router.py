from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import RATE_LIMIT_CHECKOUT
from app.core.dependencies import get_current_user
from app.core.rate_limit import enforce_rate_limit
from app.models import Currency, ShippingZone, User
from app.schemas import CheckoutIn
from app.services.catalog import convert_usd_cents, get_currency, normalize_locale
from app.services.commerce import create_order, serialize_order


router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.get("/shipping-options")
def shipping_options(
    country: str,
    subtotal_usd_cents: int = 0,
    currency: str = "USD",
    locale: str = "en",
    db: Session = Depends(get_db),
):
    country = country.upper()
    locale = normalize_locale(locale)
    selected_currency = get_currency(db, currency)
    zones = db.scalars(
        select(ShippingZone)
        .where(ShippingZone.is_active.is_(True))
        .order_by(ShippingZone.id)
    ).all()
    exact = [
        zone
        for zone in zones
        if country
        in {
            value.strip().upper()
            for value in zone.country_codes.split(",")
            if value.strip() != "*"
        }
    ]
    matching = exact or [zone for zone in zones if "*" in zone.country_codes]
    result = []
    for zone in matching:
        price = (
            0
            if zone.free_from_usd_cents is not None
            and subtotal_usd_cents >= zone.free_from_usd_cents
            else zone.price_usd_cents
        )
        result.append(
            {
                "id": zone.id,
                "name": (
                    getattr(zone, f"name_{locale}", "")
                    or zone.name_en
                ),
                "price_usd_cents": price,
                "price_minor": convert_usd_cents(price, selected_currency),
                "currency": selected_currency.code,
                "currency_digits": selected_currency.decimal_digits,
                "eta_min_days": zone.eta_min_days,
                "eta_max_days": zone.eta_max_days,
            }
        )
    return result


@router.post("/order", status_code=201)
def checkout(
    payload: CheckoutIn,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enforce_rate_limit(request, "checkout-order", RATE_LIMIT_CHECKOUT)
    currency: Currency = get_currency(db, payload.currency_code)
    return serialize_order(create_order(db, user, payload, currency))
