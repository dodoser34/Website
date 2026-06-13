import os
from pathlib import Path


TEST_DATABASE = Path(__file__).with_name("test_woodstyle.db")
os.environ["WOODSTYLE_DATABASE_URL"] = f"sqlite:///{TEST_DATABASE}"
os.environ["WOODSTYLE_SECRET_KEY"] = "test-secret"

from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import engine  # noqa: E402
from app.main import app  # noqa: E402


LOCALES = ("en", "ru", "de", "ja", "fr")


def test_catalog_supports_all_locales_and_currency():
    with TestClient(app) as client:
        names = set()
        for locale in LOCALES:
            response = client.get(
                f"/api/v1/products?locale={locale}&currency=EUR&page_size=1"
            )
            assert response.status_code == 200
            payload = response.json()
            assert payload["total"] == 6
            assert len(payload["items"]) == 1
            assert payload["items"][0]["currency"] == "EUR"
            names.add(payload["items"][0]["name"])
        assert len(names) == len(LOCALES)


def test_shipping_supports_all_locales():
    with TestClient(app) as client:
        names = set()
        for locale in LOCALES:
            response = client.get(
                "/api/v1/checkout/shipping-options"
                f"?country=US&subtotal_usd_cents=1000&currency=USD&locale={locale}"
            )
            assert response.status_code == 200
            assert response.json()
            names.add(response.json()[0]["name"])
        assert len(names) == len(LOCALES)


def test_customer_checkout_and_card_payment():
    with TestClient(app) as client:
        registered = client.post(
            "/api/v1/auth/register",
            json={
                "email": "buyer@woodstyle.com",
                "password": "Customer123!",
                "first_name": "Morgan",
                "last_name": "Buyer",
                "locale": "en",
                "currency_code": "USD",
            },
        )
        assert registered.status_code == 201
        headers = {
            "Authorization": f"Bearer {registered.json()['access_token']}"
        }
        cart = client.post(
            "/api/v1/me/cart/items",
            headers=headers,
            json={"product_id": 1, "quantity": 2},
        )
        assert cart.status_code == 200
        assert cart.json()["item_count"] == 2

        shipping = client.get(
            "/api/v1/checkout/shipping-options"
            "?country=US&subtotal_usd_cents=1000&currency=USD"
        )
        assert shipping.status_code == 200

        order = client.post(
            "/api/v1/checkout/order",
            headers=headers,
            json={
                "shipping_zone_id": shipping.json()[0]["id"],
                "currency_code": "USD",
                "address": {
                    "label": "Home",
                    "recipient_name": "Morgan Buyer",
                    "phone": "+12025550100",
                    "country_code": "US",
                    "region": "CA",
                    "city": "San Francisco",
                    "postal_code": "94105",
                    "address_line1": "1 Market Street",
                    "address_line2": "",
                    "is_default": False,
                },
            },
        )
        assert order.status_code == 201

        payment = client.post(
            "/api/v1/checkout/pay",
            headers=headers,
            json={
                "order_id": order.json()["id"],
                "card_number": "4242424242424242",
                "cardholder": "Morgan Buyer",
            },
        )
        assert payment.status_code == 200
        assert payment.json()["status"] == "paid"


def test_admin_routes_require_admin_role():
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "customer@woodstyle.com",
                "password": "Customer123!",
            },
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        assert client.get("/api/v1/admin/dashboard", headers=headers).status_code == 403


def test_profile_currency_and_address_lifecycle():
    with TestClient(app) as client:
        registered = client.post(
            "/api/v1/auth/register",
            json={
                "email": "profile@woodstyle.com",
                "password": "Profile123!",
                "first_name": "Profile",
                "last_name": "Member",
                "locale": "en",
                "currency_code": "USD",
            },
        )
        headers = {
            "Authorization": f"Bearer {registered.json()['access_token']}"
        }
        for locale in LOCALES:
            updated = client.patch(
                "/api/v1/me",
                headers=headers,
                json={
                    "first_name": "Profile",
                    "last_name": "Member",
                    "phone": "+492215550174",
                    "locale": locale,
                    "currency_code": "EUR",
                },
            )
            assert updated.status_code == 200
            assert updated.json()["locale"] == locale
            assert updated.json()["currency_code"] == "EUR"

        address = client.post(
            "/api/v1/me/addresses",
            headers=headers,
            json={
                "label": "Köln",
                "recipient_name": "Profile Member",
                "phone": "+492215550174",
                "country_code": "DE",
                "region": "Nordrhein-Westfalen",
                "city": "Köln",
                "postal_code": "50667",
                "address_line1": "Kleine Budengasse 1-3",
                "address_line2": "",
                "is_default": True,
            },
        )
        assert address.status_code == 201
        address_id = address.json()["id"]
        assert client.delete(
            f"/api/v1/me/addresses/{address_id}",
            headers=headers,
        ).status_code == 204
        assert client.get(
            "/api/v1/me/addresses",
            headers=headers,
        ).json() == []


def test_api_errors_follow_accept_language():
    expected = {
        "ru": "Неверный email или пароль",
        "de": "E-Mail-Adresse oder Passwort ist ungültig",
        "ja": "メールアドレスまたはパスワードが正しくありません",
        "fr": "Adresse e-mail ou mot de passe incorrect",
    }
    with TestClient(app) as client:
        for locale, message in expected.items():
            response = client.post(
                "/api/v1/auth/login",
                headers={"Accept-Language": locale},
                json={"email": "missing@woodstyle.com", "password": "Unknown123!"},
            )
            assert response.status_code == 401
            assert response.json()["detail"] == message


def test_admin_can_create_product_in_all_locales():
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@woodstyle.com",
                "password": "Admin123!",
            },
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        created = client.post(
            "/api/v1/admin/products",
            headers=headers,
            json={
                "category_id": 1,
                "slug": "atelier-lounge-chair",
                "sku": "WS-CHR-101",
                "price_usd_cents": 34900,
                "stock": 5,
                "image": "chair.jpg",
                "popularity": 1,
                "is_active": True,
                "translations": {
                    "en": {
                        "name": "Atelier Lounge Chair",
                        "description": "An oak lounge chair with a woven seat.",
                        "material": "Oak",
                        "size": "80 x 80 cm",
                        "color": "Natural",
                        "manufacturer": "WoodStyle",
                        "country": "International",
                    },
                    "ru": {
                        "name": "Кресло Atelier",
                        "description": "Дубовое кресло с плетёным сиденьем.",
                        "material": "Дуб",
                        "size": "80 x 80 см",
                        "color": "Натуральный",
                        "manufacturer": "WoodStyle",
                        "country": "Германия",
                    },
                    "de": {
                        "name": "Atelier Loungesessel",
                        "description": "Ein Loungesessel aus Eiche mit geflochtener Sitzfläche.",
                        "material": "Eiche",
                        "size": "80 x 80 cm",
                        "color": "Natur",
                        "manufacturer": "WoodStyle",
                        "country": "Deutschland",
                    },
                    "ja": {
                        "name": "アトリエ ラウンジチェア",
                        "description": "オーク材と編み座面のラウンジチェア。",
                        "material": "オーク",
                        "size": "80 x 80 cm",
                        "color": "ナチュラル",
                        "manufacturer": "WoodStyle",
                        "country": "ドイツ",
                    },
                    "fr": {
                        "name": "Fauteuil Atelier",
                        "description": "Un fauteuil en chêne avec une assise tressée.",
                        "material": "Chêne",
                        "size": "80 x 80 cm",
                        "color": "Naturel",
                        "manufacturer": "WoodStyle",
                        "country": "Allemagne",
                    },
                },
            },
        )
        assert created.status_code == 201
        translations = created.json()["translations"]
        assert set(LOCALES).issubset(translations)
        assert len({translations[locale]["name"] for locale in LOCALES}) == 5


def teardown_module():
    engine.dispose()
    TEST_DATABASE.unlink(missing_ok=True)
