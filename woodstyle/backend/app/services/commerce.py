import json
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    CartItem,
    Category,
    Currency,
    Order,
    OrderItem,
    OrderStatusHistory,
    Payment,
    Product,
    ShippingZone,
    User,
)
from app.currencies.data import currency_digits_for
from app.schemas import CheckoutIn
from app.services.catalog import convert_usd_cents, serialize_product


ORDER_STATUSES = {
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "payment_failed",
}


def shipping_price(subtotal: int, zone: ShippingZone) -> int:
    if (
        zone.free_from_usd_cents is not None
        and subtotal >= zone.free_from_usd_cents
    ):
        return 0
    return zone.price_usd_cents


def serialize_cart(
    db: Session,
    user: User,
    currency: Currency,
    locale: str,
) -> dict[str, object]:
    items = db.scalars(
        select(CartItem)
        .where(CartItem.user_id == user.id)
        .options(
            selectinload(CartItem.product).selectinload(Product.translations),
            selectinload(CartItem.product).selectinload(Product.images),
            selectinload(CartItem.product)
            .selectinload(Product.category)
            .selectinload(Category.translations),
        )
        .order_by(CartItem.id)
    ).all()
    serialized = []
    subtotal_usd_cents = 0
    for item in items:
        product = serialize_product(item.product, currency, locale)
        line_usd_cents = item.product.price_usd_cents * item.quantity
        subtotal_usd_cents += line_usd_cents
        serialized.append(
            {
                "id": item.id,
                "quantity": item.quantity,
                "line_usd_cents": line_usd_cents,
                "line_minor": convert_usd_cents(line_usd_cents, currency),
                "product": product,
            }
        )
    return {
        "items": serialized,
        "subtotal_usd_cents": subtotal_usd_cents,
        "subtotal_minor": convert_usd_cents(subtotal_usd_cents, currency),
        "currency": currency.code,
        "currency_digits": currency.decimal_digits,
        "item_count": sum(item.quantity for item in items),
    }


def create_order(
    db: Session,
    user: User,
    payload: CheckoutIn,
    currency: Currency,
) -> Order:
    zone = db.get(ShippingZone, payload.shipping_zone_id)
    if zone is None or not zone.is_active:
        raise HTTPException(status_code=404, detail="Shipping option not found")

    cart_items = db.scalars(
        select(CartItem)
        .where(CartItem.user_id == user.id)
        .options(selectinload(CartItem.product).selectinload(Product.translations))
    ).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = 0
    for cart_item in cart_items:
        if not cart_item.product.is_active:
            raise HTTPException(
                status_code=409,
                detail=f"{cart_item.product.name} is unavailable",
            )
        if cart_item.quantity > cart_item.product.stock:
            raise HTTPException(
                status_code=409,
                detail=f"Insufficient stock for {cart_item.product.name}",
            )
        subtotal += cart_item.product.price_usd_cents * cart_item.quantity

    delivery = shipping_price(subtotal, zone)
    total = subtotal + delivery
    order = Order(
        user_id=user.id,
        status="pending_payment",
        currency_code=currency.code,
        exchange_rate=currency.rate_from_usd,
        subtotal_usd_cents=subtotal,
        shipping_usd_cents=delivery,
        total_usd_cents=total,
        total_minor=convert_usd_cents(total, currency),
        shipping_zone_id=zone.id,
        shipping_address_json=json.dumps(
            payload.address.model_dump(),
            ensure_ascii=False,
        ),
    )
    db.add(order)
    db.flush()
    for cart_item in cart_items:
        translation = next(
            (
                item
                for item in cart_item.product.translations
                if item.locale == user.locale
            ),
            None,
        )
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=cart_item.product_id,
                product_name=(
                    translation.name if translation else cart_item.product.name
                ),
                sku=cart_item.product.sku,
                quantity=cart_item.quantity,
                unit_price_usd_cents=cart_item.product.price_usd_cents,
            )
        )
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            status="pending_payment",
            note="Order created",
        )
    )
    db.commit()
    return get_order(db, order.id)


def get_order(db: Session, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.payment),
            selectinload(Order.history),
        )
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def serialize_order(order: Order) -> dict[str, object]:
    return {
        "id": order.id,
        "status": order.status,
        "currency": order.currency_code,
        "currency_digits": currency_digits_for(order.currency_code),
        "exchange_rate": str(order.exchange_rate),
        "subtotal_usd_cents": order.subtotal_usd_cents,
        "shipping_usd_cents": order.shipping_usd_cents,
        "total_usd_cents": order.total_usd_cents,
        "total_minor": order.total_minor,
        "shipping_address": json.loads(order.shipping_address_json),
        "created_at": order.created_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "sku": item.sku,
                "quantity": item.quantity,
                "unit_price_usd_cents": item.unit_price_usd_cents,
            }
            for item in order.items
        ],
        "payment": (
            {
                "provider": order.payment.provider,
                "status": order.payment.status,
                "reference": order.payment.reference,
                "last4": order.payment.last4,
                "paid_at": order.payment.paid_at,
            }
            if order.payment
            else None
        ),
        "history": [
            {
                "status": item.status,
                "note": item.note,
                "created_at": item.created_at,
            }
            for item in sorted(order.history, key=lambda value: value.id)
        ],
    }


def process_card_payment(
    db: Session,
    user: User,
    order_id: int,
    card_number: str,
) -> Order:
    order = get_order(db, order_id)
    if order.user_id != user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in {"pending_payment", "payment_failed"}:
        raise HTTPException(status_code=409, detail="Order cannot be paid")

    if card_number == "4000000000000002":
        order.status = "payment_failed"
        payment_status = "failed"
        note = "Card was declined"
    elif card_number == "4242424242424242":
        products = {
            item.product_id: db.get(Product, item.product_id)
            for item in order.items
            if item.product_id is not None
        }
        for item in order.items:
            product = products.get(item.product_id)
            if product is None or product.stock < item.quantity:
                raise HTTPException(
                    status_code=409,
                    detail=f"Insufficient stock for {item.product_name}",
                )
        for item in order.items:
            product = products.get(item.product_id)
            if product is not None:
                product.stock -= item.quantity
        order.status = "paid"
        payment_status = "paid"
        note = "Payment approved"
        db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    else:
        raise HTTPException(
            status_code=422,
            detail="Card authorization failed",
        )

    payment = order.payment
    if payment is None:
        payment = Payment(
            order_id=order.id,
            provider="local_card",
            reference=f"card_{uuid.uuid4().hex}",
        )
        db.add(payment)
    payment.status = payment_status
    payment.last4 = card_number[-4:]
    payment.paid_at = datetime.now(UTC) if payment_status == "paid" else None
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            status=order.status,
            note=note,
        )
    )
    db.commit()
    return get_order(db, order.id)


def update_order_status(
    db: Session,
    order: Order,
    status: str,
    note: str,
) -> Order:
    if status not in ORDER_STATUSES:
        raise HTTPException(status_code=422, detail="Unsupported order status")
    order.status = status
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            status=status,
            note=note or "Status changed by administrator",
        )
    )
    db.commit()
    return get_order(db, order.id)
