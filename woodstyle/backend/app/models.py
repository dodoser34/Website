from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="customer", index=True)
    first_name: Mapped[str] = mapped_column(String(100), default="")
    last_name: Mapped[str] = mapped_column(String(100), default="")
    phone: Mapped[str] = mapped_column(String(40), default="")
    locale: Mapped[str] = mapped_column(String(5), default="en")
    currency_code: Mapped[str] = mapped_column(String(3), default="USD")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    addresses: Mapped[list["Address"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    cart_items: Mapped[list["CartItem"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    favorites: Mapped[list["Favorite"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    orders: Mapped[list["Order"]] = relationship(back_populates="user")


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    label: Mapped[str] = mapped_column(String(80), default="Home")
    recipient_name: Mapped[str] = mapped_column(String(160))
    phone: Mapped[str] = mapped_column(String(40))
    country_code: Mapped[str] = mapped_column(String(2))
    region: Mapped[str] = mapped_column(String(120), default="")
    city: Mapped[str] = mapped_column(String(120))
    postal_code: Mapped[str] = mapped_column(String(30))
    address_line1: Mapped[str] = mapped_column(String(255))
    address_line2: Mapped[str] = mapped_column(String(255), default="")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates="addresses")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    image: Mapped[str] = mapped_column(String(255))
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    products: Mapped[list["Product"]] = relationship(back_populates="category")
    translations: Mapped[list["CategoryTranslation"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
    )


class CategoryTranslation(Base):
    __tablename__ = "category_translations"
    __table_args__ = (
        UniqueConstraint("category_id", "locale", name="uq_category_locale"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"),
        index=True,
    )
    locale: Mapped[str] = mapped_column(String(5), index=True)
    name: Mapped[str] = mapped_column(String(100))

    category: Mapped[Category] = relationship(back_populates="translations")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    price: Mapped[int] = mapped_column(Integer)
    image: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    material: Mapped[str] = mapped_column(String(120))
    size: Mapped[str] = mapped_column(String(120))
    color: Mapped[str] = mapped_column(String(120))
    manufacturer: Mapped[str] = mapped_column(String(120))
    country: Mapped[str] = mapped_column(String(120))
    popularity: Mapped[int] = mapped_column(Integer, default=0)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    sku: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    price_usd_cents: Mapped[int] = mapped_column(Integer, index=True)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow,
        onupdate=utcnow,
    )

    category: Mapped[Category] = relationship(back_populates="products")
    translations: Mapped[list["ProductTranslation"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
    )
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )


class ProductTranslation(Base):
    __tablename__ = "product_translations"
    __table_args__ = (
        UniqueConstraint("product_id", "locale", name="uq_product_locale"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
    )
    locale: Mapped[str] = mapped_column(String(5), index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    material: Mapped[str] = mapped_column(String(160), default="")
    size: Mapped[str] = mapped_column(String(120), default="")
    color: Mapped[str] = mapped_column(String(120), default="")
    manufacturer: Mapped[str] = mapped_column(String(120), default="WoodStyle")
    country: Mapped[str] = mapped_column(String(120), default="")

    product: Mapped[Product] = relationship(back_populates="translations")


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
    )
    path: Mapped[str] = mapped_column(String(255))
    alt_en: Mapped[str] = mapped_column(String(200), default="")
    alt_ru: Mapped[str] = mapped_column(String(200), default="")
    alt_de: Mapped[str] = mapped_column(String(200), default="")
    alt_ja: Mapped[str] = mapped_column(String(200), default="")
    alt_fr: Mapped[str] = mapped_column(String(200), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped[Product] = relationship(back_populates="images")


class Currency(Base):
    __tablename__ = "currencies"

    code: Mapped[str] = mapped_column(String(3), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    symbol: Mapped[str] = mapped_column(String(12))
    decimal_digits: Mapped[int] = mapped_column(Integer, default=2)
    rate_from_usd: Mapped[Decimal] = mapped_column(
        Numeric(18, 8),
        default=Decimal("1"),
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_cart_product"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped[User] = relationship(back_populates="cart_items")
    product: Mapped[Product] = relationship()


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_favorite_product"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped[User] = relationship(back_populates="favorites")
    product: Mapped[Product] = relationship()


class ShippingZone(Base):
    __tablename__ = "shipping_zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_en: Mapped[str] = mapped_column(String(120))
    name_ru: Mapped[str] = mapped_column(String(120))
    name_de: Mapped[str] = mapped_column(String(120), default="")
    name_ja: Mapped[str] = mapped_column(String(120), default="")
    name_fr: Mapped[str] = mapped_column(String(120), default="")
    country_codes: Mapped[str] = mapped_column(Text, default="*")
    price_usd_cents: Mapped[int] = mapped_column(Integer, default=0)
    free_from_usd_cents: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    eta_min_days: Mapped[int] = mapped_column(Integer, default=3)
    eta_max_days: Mapped[int] = mapped_column(Integer, default=7)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending_payment",
        index=True,
    )
    currency_code: Mapped[str] = mapped_column(String(3))
    exchange_rate: Mapped[Decimal] = mapped_column(Numeric(18, 8))
    subtotal_usd_cents: Mapped[int] = mapped_column(Integer)
    shipping_usd_cents: Mapped[int] = mapped_column(Integer)
    total_usd_cents: Mapped[int] = mapped_column(Integer)
    total_minor: Mapped[int] = mapped_column(Integer)
    shipping_zone_id: Mapped[int | None] = mapped_column(
        ForeignKey("shipping_zones.id"),
        nullable=True,
    )
    shipping_address_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow,
        onupdate=utcnow,
    )

    user: Mapped[User] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )
    payment: Mapped["Payment | None"] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        uselist=False,
    )
    history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
    )
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id"),
        nullable=True,
    )
    product_name: Mapped[str] = mapped_column(String(160))
    sku: Mapped[str] = mapped_column(String(80))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price_usd_cents: Mapped[int] = mapped_column(Integer)

    order: Mapped[Order] = relationship(back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        unique=True,
    )
    provider: Mapped[str] = mapped_column(String(30), default="local_card")
    status: Mapped[str] = mapped_column(String(30), default="pending")
    reference: Mapped[str] = mapped_column(String(100), unique=True)
    last4: Mapped[str] = mapped_column(String(4), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    order: Mapped[Order] = relationship(back_populates="payment")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
    )
    status: Mapped[str] = mapped_column(String(30))
    note: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    order: Mapped[Order] = relationship(back_populates="history")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(30))
    email: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class LegacyInquiry(Base):
    __tablename__ = "legacy_inquiries"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    customer_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
