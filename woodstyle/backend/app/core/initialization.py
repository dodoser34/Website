from decimal import Decimal

from sqlalchemy import inspect, select, text

from app.catalog.seed_data import (
    CATEGORY_IMAGES,
    CATEGORY_NAMES,
    DEFAULT_PRODUCT_DATA,
    PRODUCT_TRANSLATIONS,
    SHIPPING_ZONE_NAMES,
)
from app.core.config import LEGACY_RUB_PER_USD
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.currencies.data import currency_seed_rows
from app.models import (
    Category,
    CategoryTranslation,
    Currency,
    Product,
    ProductImage,
    ProductTranslation,
    ShippingZone,
    User,
)


def _legacy_sqlite_upgrade() -> None:
    if not str(engine.url).startswith("sqlite"):
        return

    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())

        if "orders" in tables:
            order_columns = {
                column["name"]
                for column in inspector.get_columns("orders")
            }
            if "customer_name" in order_columns and "user_id" not in order_columns:
                connection.exec_driver_sql(
                    "ALTER TABLE orders RENAME TO legacy_inquiries"
                )
                inspector = inspect(connection)
                tables = set(inspector.get_table_names())

        if "categories" in tables:
            columns = {
                column["name"]
                for column in inspector.get_columns("categories")
            }
            if "parent_id" not in columns:
                connection.exec_driver_sql(
                    "ALTER TABLE categories ADD COLUMN parent_id INTEGER"
                )
            if "is_active" not in columns:
                connection.exec_driver_sql(
                    "ALTER TABLE categories "
                    "ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"
                )

        if "products" in tables:
            columns = {
                column["name"]
                for column in inspector.get_columns("products")
            }
            additions = {
                "slug": "VARCHAR(160)",
                "sku": "VARCHAR(80)",
                "price_usd_cents": "INTEGER",
                "stock": "INTEGER NOT NULL DEFAULT 20",
                "is_active": "BOOLEAN NOT NULL DEFAULT 1",
                "created_at": "DATETIME",
                "updated_at": "DATETIME",
            }
            for name, definition in additions.items():
                if name not in columns:
                    connection.exec_driver_sql(
                        f"ALTER TABLE products ADD COLUMN {name} {definition}"
                    )
            rows = connection.execute(
                text("SELECT id, name, price, slug, sku, price_usd_cents FROM products")
            ).mappings()
            for row in rows:
                price_usd_cents = row["price_usd_cents"] or round(
                    row["price"] / LEGACY_RUB_PER_USD * 100
                )
                connection.execute(
                    text(
                        "UPDATE products SET slug=:slug, sku=:sku, "
                        "price_usd_cents=:price_usd_cents, "
                        "created_at=COALESCE(created_at, CURRENT_TIMESTAMP), "
                        "updated_at=COALESCE(updated_at, CURRENT_TIMESTAMP) "
                        "WHERE id=:id"
                    ),
                    {
                        "id": row["id"],
                        "slug": row["slug"] or f"product-{row['id']}",
                        "sku": row["sku"] or f"WS-{row['id']:04d}",
                        "price_usd_cents": price_usd_cents,
                    },
                )
            connection.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_products_slug "
                "ON products (slug)"
            )
            connection.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_products_sku "
                "ON products (sku)"
            )

        if "contact_messages" in tables:
            columns = {
                column["name"]
                for column in inspector.get_columns("contact_messages")
            }
            if "is_processed" not in columns:
                connection.exec_driver_sql(
                    "ALTER TABLE contact_messages "
                    "ADD COLUMN is_processed BOOLEAN NOT NULL DEFAULT 0"
                )

        if "product_images" in tables:
            columns = {
                column["name"]
                for column in inspector.get_columns("product_images")
            }
            for locale in ("de", "ja", "fr"):
                column_name = f"alt_{locale}"
                if column_name not in columns:
                    connection.exec_driver_sql(
                        "ALTER TABLE product_images "
                        f"ADD COLUMN {column_name} VARCHAR(200) "
                        "NOT NULL DEFAULT ''"
                        )

        if "payments" in tables:
            columns = {
                column["name"]
                for column in inspector.get_columns("payments")
            }
            if "idempotency_key" not in columns:
                connection.exec_driver_sql(
                    "ALTER TABLE payments "
                    "ADD COLUMN idempotency_key VARCHAR(100)"
                )
                connection.exec_driver_sql(
                    "CREATE UNIQUE INDEX IF NOT EXISTS "
                    "ix_payments_idempotency_key "
                    "ON payments (idempotency_key)"
                )

        if "shipping_zones" in tables:
            columns = {
                column["name"]
                for column in inspector.get_columns("shipping_zones")
            }
            for locale in ("de", "ja", "fr"):
                column_name = f"name_{locale}"
                if column_name not in columns:
                    connection.exec_driver_sql(
                        "ALTER TABLE shipping_zones "
                        f"ADD COLUMN {column_name} VARCHAR(120) "
                        "NOT NULL DEFAULT ''"
                    )


def _seed_catalog(db) -> None:
    if db.scalar(select(Category.id).limit(1)) is None:
        db.add_all(
            Category(
                name=CATEGORY_NAMES["en"][slug],
                slug=slug,
                image=CATEGORY_IMAGES[slug],
                is_active=True,
            )
            for slug in CATEGORY_NAMES["en"]
        )
        db.flush()

    if db.scalar(select(Product.id).limit(1)) is None:
        categories_by_slug = {
            category.slug: category
            for category in db.scalars(select(Category)).all()
        }
        for product_id, (category_slug, rub_price, popularity) in DEFAULT_PRODUCT_DATA.items():
            english = PRODUCT_TRANSLATIONS[product_id]["en"]
            db.add(
                Product(
                    id=product_id,
                    name=english["name"],
                    category_id=categories_by_slug[category_slug].id,
                    price=rub_price,
                    image=CATEGORY_IMAGES[category_slug],
                    description=english["description"],
                    material=english["material"],
                    size=english["size"],
                    color=english["color"],
                    manufacturer="WoodStyle",
                    country=english["country"],
                    popularity=popularity,
                    slug=f"product-{product_id}",
                    sku=f"WS-{product_id:04d}",
                    price_usd_cents=round(
                        rub_price / LEGACY_RUB_PER_USD * 100
                    ),
                    stock=20,
                    is_active=True,
                )
            )
        db.flush()

    categories = db.scalars(select(Category)).all()
    for category in categories:
        existing = {
            translation.locale
            for translation in category.translations
        }
        for locale, names in CATEGORY_NAMES.items():
            if locale not in existing:
                db.add(
                    CategoryTranslation(
                        category_id=category.id,
                        locale=locale,
                        name=names.get(category.slug, category.name),
                    )
                )

    products = db.scalars(select(Product)).all()
    for product in products:
        existing = {
            translation.locale
            for translation in product.translations
        }
        seeded_translations = PRODUCT_TRANSLATIONS.get(product.id, {})
        for locale in CATEGORY_NAMES:
            if locale in existing:
                continue
            translation = seeded_translations.get(
                locale,
                seeded_translations.get("en", {}),
            )
            db.add(
                ProductTranslation(
                    product_id=product.id,
                    locale=locale,
                    name=translation.get("name", product.name),
                    description=translation.get(
                        "description",
                        product.description,
                    ),
                    material=translation.get("material", product.material),
                    size=translation.get("size", product.size),
                    color=translation.get("color", product.color),
                    manufacturer="WoodStyle",
                    country=translation.get("country", product.country),
                )
            )
        if not product.images:
            translations = PRODUCT_TRANSLATIONS.get(product.id, {})
            db.add(
                ProductImage(
                    product_id=product.id,
                    path=product.image,
                    alt_en=translations.get("en", {}).get("name", product.name),
                    alt_ru=translations.get("ru", {}).get("name", product.name),
                    alt_de=translations.get("de", {}).get("name", product.name),
                    alt_ja=translations.get("ja", {}).get("name", product.name),
                    alt_fr=translations.get("fr", {}).get("name", product.name),
                    sort_order=0,
                )
            )
        else:
            translations = PRODUCT_TRANSLATIONS.get(product.id, {})
            for image in product.images:
                for locale in ("de", "ja", "fr"):
                    field = f"alt_{locale}"
                    if not getattr(image, field):
                        setattr(
                            image,
                            field,
                            translations.get(locale, {}).get(
                                "name",
                                product.name,
                            ),
                        )


def _seed_currencies(db) -> None:
    existing = set(db.scalars(select(Currency.code)).all())
    for row in currency_seed_rows():
        if row["code"] not in existing:
            db.add(Currency(**row))


def _seed_users_and_shipping(db) -> None:
    legacy_admin = db.scalar(
        select(User).where(User.email == "admin@woodstyle.local")
    )
    if legacy_admin:
        legacy_admin.email = "admin@woodstyle.com"
    legacy_customer = db.scalar(
        select(User).where(User.email == "customer@woodstyle.local")
    )
    if legacy_customer:
        legacy_customer.email = "customer@woodstyle.com"
    customer = db.scalar(
        select(User).where(User.email == "customer@woodstyle.com")
    )
    if customer and customer.first_name == "Demo":
        customer.first_name = "Alex"
        customer.last_name = "Morgan"

    if db.scalar(select(User.id).limit(1)) is None:
        db.add_all(
            [
                User(
                    email="admin@woodstyle.com",
                    password_hash=hash_password("Admin123!"),
                    role="admin",
                    first_name="WoodStyle",
                    last_name="Admin",
                    locale="en",
                    currency_code="USD",
                ),
                User(
                    email="customer@woodstyle.com",
                    password_hash=hash_password("Customer123!"),
                    role="customer",
                    first_name="Alex",
                    last_name="Morgan",
                    locale="en",
                    currency_code="USD",
                ),
            ]
        )

    local_country_codes = "US,CA,GB,DE,FR,ES,IT,KZ"

    if db.scalar(select(ShippingZone.id).limit(1)) is None:
        regional = SHIPPING_ZONE_NAMES["local"]
        international = SHIPPING_ZONE_NAMES["international"]
        db.add_all(
            [
                ShippingZone(
                    **{f"name_{locale}": name for locale, name in regional.items()},
                    country_codes=local_country_codes,
                    price_usd_cents=2500,
                    free_from_usd_cents=100000,
                    eta_min_days=3,
                    eta_max_days=7,
                ),
                ShippingZone(
                    **{
                        f"name_{locale}": name
                        for locale, name in international.items()
                    },
                    country_codes="*",
                    price_usd_cents=6500,
                    free_from_usd_cents=200000,
                    eta_min_days=7,
                    eta_max_days=21,
                ),
            ]
        )
    else:
        zones = db.scalars(select(ShippingZone).order_by(ShippingZone.id)).all()
        keys = ("local", "international")
        for index, zone in enumerate(zones[:2]):
            names = SHIPPING_ZONE_NAMES[keys[index]]
            for locale, name in names.items():
                field = f"name_{locale}"
                if not getattr(zone, field):
                    setattr(zone, field, name)
            if index == 0:
                codes = [
                    code.strip().upper()
                    for code in zone.country_codes.split(",")
                    if code.strip()
                ]
                if "*" not in codes and "KZ" not in codes:
                    zone.country_codes = ",".join([*codes, "KZ"])


def initialize_database() -> None:
    _legacy_sqlite_upgrade()
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        _seed_catalog(db)
        _seed_currencies(db)
        _seed_users_and_shipping(db)
        db.commit()
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS alembic_version "
            "(version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
        )
        current = connection.execute(
            text("SELECT version_num FROM alembic_version LIMIT 1")
        ).scalar_one_or_none()
        if current is None:
            connection.execute(
                text(
                    "INSERT INTO alembic_version (version_num) "
                    "VALUES ('20260615_01')"
                )
            )
        elif current != "20260615_01":
            connection.execute(
                text(
                    "UPDATE alembic_version "
                    "SET version_num='20260615_01'"
                )
            )
