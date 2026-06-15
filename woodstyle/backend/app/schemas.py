from datetime import datetime
from decimal import Decimal
from typing import TypeVar

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

from app.core.config import SUPPORTED_LOCALES

TranslationValue = TypeVar("TranslationValue")


def validate_translation_locales(
    value: dict[str, TranslationValue],
) -> dict[str, TranslationValue]:
    locales = set(value)
    missing = SUPPORTED_LOCALES - locales
    unsupported = locales - SUPPORTED_LOCALES
    if missing or unsupported:
        raise ValueError("Translations must match the supported locales")
    return value


class MessageOut(BaseModel):
    message: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    locale: str = "en"
    currency_code: str = "USD"

    @model_validator(mode="after")
    def validate_password_policy(self):
        normalized_email = str(self.email).lower()
        local_part = normalized_email.split("@", 1)[0]
        common = {
            "password",
            "password123",
            "12345678",
            "qwerty123",
            "admin123",
        }
        if self.password.lower() in common:
            raise ValueError("Password is too common")
        if self.password.lower() in {normalized_email, local_part}:
            raise ValueError("Password must not match email")
        return self


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RefreshIn(BaseModel):
    refresh_token: str = ""


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str
    first_name: str
    last_name: str
    phone: str
    locale: str
    currency_code: str
    is_active: bool
    created_at: datetime


class ProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=40)
    locale: str | None = None
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)


class AddressIn(BaseModel):
    label: str = Field(default="Home", max_length=80)
    recipient_name: str = Field(min_length=2, max_length=160)
    phone: str = Field(min_length=7, max_length=40)
    country_code: str = Field(min_length=2, max_length=2)
    region: str = Field(default="", max_length=120)
    city: str = Field(min_length=2, max_length=120)
    postal_code: str = Field(min_length=2, max_length=30)
    address_line1: str = Field(min_length=3, max_length=255)
    address_line2: str = Field(default="", max_length=255)
    is_default: bool = False


class AddressOut(AddressIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class CurrencyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    symbol: str
    decimal_digits: int
    rate_from_usd: Decimal
    is_enabled: bool


class CurrencyUpdate(BaseModel):
    rate_from_usd: Decimal = Field(gt=0)
    is_enabled: bool
    name: str | None = Field(default=None, max_length=100)
    symbol: str | None = Field(default=None, max_length=12)


class ProductTranslationIn(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=5000)
    material: str = Field(default="", max_length=160)
    size: str = Field(default="", max_length=120)
    color: str = Field(default="", max_length=120)
    manufacturer: str = Field(default="WoodStyle", max_length=120)
    country: str = Field(default="", max_length=120)


class ProductAdminIn(BaseModel):
    category_id: int
    slug: str = Field(min_length=2, max_length=160)
    sku: str = Field(min_length=2, max_length=80)
    price_usd_cents: int = Field(ge=0)
    stock: int = Field(ge=0)
    image: str = Field(default="", max_length=255)
    popularity: int = Field(default=0, ge=0)
    is_active: bool = True
    translations: dict[str, ProductTranslationIn]

    @field_validator("translations")
    @classmethod
    def validate_translations(
        cls,
        value: dict[str, ProductTranslationIn],
    ) -> dict[str, ProductTranslationIn]:
        return validate_translation_locales(value)


class CategoryTranslationIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CategoryAdminIn(BaseModel):
    slug: str = Field(min_length=2, max_length=80)
    image: str = Field(default="", max_length=255)
    parent_id: int | None = None
    is_active: bool = True
    translations: dict[str, CategoryTranslationIn]

    @field_validator("translations")
    @classmethod
    def validate_translations(
        cls,
        value: dict[str, CategoryTranslationIn],
    ) -> dict[str, CategoryTranslationIn]:
        return validate_translation_locales(value)


class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartMergeIn(BaseModel):
    items: list[CartItemIn]


class CheckoutIn(BaseModel):
    shipping_zone_id: int
    currency_code: str = Field(min_length=3, max_length=3)
    address: AddressIn


class CardPaymentIn(BaseModel):
    order_id: int
    card_number: str
    cardholder: str = Field(min_length=2, max_length=160)
    idempotency_key: str | None = Field(default=None, max_length=100)

    @field_validator("card_number")
    @classmethod
    def normalize_card(cls, value: str) -> str:
        digits = "".join(character for character in value if character.isdigit())
        if len(digits) < 12 or len(digits) > 19:
            raise ValueError("Invalid card number")
        return digits


class OrderStatusUpdate(BaseModel):
    status: str
    note: str = Field(default="", max_length=255)


class ShippingZoneIn(BaseModel):
    name_en: str = Field(min_length=2, max_length=120)
    name_ru: str = Field(min_length=2, max_length=120)
    name_de: str = Field(min_length=2, max_length=120)
    name_ja: str = Field(min_length=1, max_length=120)
    name_fr: str = Field(min_length=2, max_length=120)
    country_codes: str = Field(default="*", max_length=500)
    price_usd_cents: int = Field(ge=0)
    free_from_usd_cents: int | None = Field(default=None, ge=0)
    eta_min_days: int = Field(default=3, ge=0, le=365)
    eta_max_days: int = Field(default=7, ge=0, le=365)
    is_active: bool = True


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    email: EmailStr
    message: str = Field(min_length=10, max_length=2000)
    website: str = Field(default="", max_length=200)


class LegacyInquiryIn(BaseModel):
    product_id: int
    customer_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    email: EmailStr | None = None
    quantity: int = Field(default=1, ge=1, le=20)
