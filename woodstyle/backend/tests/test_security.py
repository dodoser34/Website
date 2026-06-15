import os
from pathlib import Path


TEST_DATABASE = Path(__file__).with_name("test_woodstyle.db")
os.environ["WOODSTYLE_DATABASE_URL"] = f"sqlite:///{TEST_DATABASE}"
os.environ["WOODSTYLE_SECRET_KEY"] = "security-test-secret"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app.core.database import SessionLocal, engine  # noqa: E402
from app.core.rate_limit import reset_rate_limits  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Payment, Product  # noqa: E402


def register(client: TestClient, email: str):
    return client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "SecurePass123!",
            "first_name": "Security",
            "last_name": "Test",
            "locale": "en",
            "currency_code": "USD",
        },
    )


def test_refresh_rotation_and_logout_revoke_session():
    reset_rate_limits()
    with TestClient(app) as client:
        registered = register(client, "refresh-security@woodstyle.com")
        assert registered.status_code == 201
        original = registered.json()["refresh_token"]

        rotated = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": original},
        )
        assert rotated.status_code == 200
        replacement = rotated.json()["refresh_token"]
        assert replacement != original

        logged_out = client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": replacement},
        )
        assert logged_out.status_code == 200
        assert client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": replacement},
        ).status_code == 401


def test_login_rate_limit_is_applied_per_ip_and_email():
    reset_rate_limits()
    with TestClient(app) as client:
        statuses = [
            client.post(
                "/api/v1/auth/login",
                json={
                    "email": "rate-limit@woodstyle.com",
                    "password": "WrongPassword123!",
                },
            ).status_code
            for _ in range(6)
        ]
        assert statuses[:5] == [401] * 5
        assert statuses[5] == 429
    reset_rate_limits()


def test_security_headers_and_restricted_cors():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.headers["x-content-type-options"] == "nosniff"
        assert response.headers["x-frame-options"] == "DENY"
        assert "frame-ancestors" in response.headers["content-security-policy"]

        preflight = client.options(
            "/api/v1/products",
            headers={
                "Origin": "https://attacker.example",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert "access-control-allow-origin" not in preflight.headers


def test_contact_honeypot_and_catalog_sort_validation():
    reset_rate_limits()
    with TestClient(app) as client:
        honeypot = client.post(
            "/api/v1/contact",
            json={
                "name": "Security Test",
                "phone": "+12025550100",
                "email": "contact-security@woodstyle.com",
                "message": "This message should be rejected by the honeypot.",
                "website": "https://spam.example",
            },
        )
        assert honeypot.status_code == 400
        assert client.get(
            "/api/v1/products?sort=drop-table",
        ).status_code == 400


def test_upload_rejects_invalid_extension_and_oversized_file():
    reset_rate_limits()
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@woodstyle.com",
                "password": "Admin123!",
            },
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        invalid = client.post(
            "/api/v1/storage/images",
            headers=headers,
            files={"file": ("payload.svg", b"<svg/>", "image/svg+xml")},
        )
        assert invalid.status_code == 422
        oversized = client.post(
            "/api/v1/storage/images",
            headers=headers,
            files={
                "file": (
                    "large.jpg",
                    b"x" * (5 * 1024 * 1024 + 1),
                    "image/jpeg",
                )
            },
        )
        assert oversized.status_code == 413


def test_payment_idempotency_does_not_reduce_stock_twice():
    reset_rate_limits()
    with TestClient(app) as client:
        registered = register(client, "payment-security@woodstyle.com")
        headers = {
            "Authorization": f"Bearer {registered.json()['access_token']}"
        }
        client.post(
            "/api/v1/me/cart/items",
            headers=headers,
            json={"product_id": 1, "quantity": 1},
        )
        shipping = client.get(
            "/api/v1/checkout/shipping-options"
            "?country=US&subtotal_usd_cents=1000&currency=USD"
        ).json()[0]
        order = client.post(
            "/api/v1/checkout/order",
            headers=headers,
            json={
                "shipping_zone_id": shipping["id"],
                "currency_code": "USD",
                "address": {
                    "label": "Home",
                    "recipient_name": "Security Test",
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
        ).json()
        with SessionLocal() as db:
            stock_before = db.get(Product, 1).stock

        payload = {
            "order_id": order["id"],
            "card_number": "4242424242424242",
            "cardholder": "Security Test",
            "idempotency_key": "payment-security-key",
        }
        first = client.post("/api/v1/checkout/pay", headers=headers, json=payload)
        second = client.post("/api/v1/checkout/pay", headers=headers, json=payload)
        assert first.status_code == 200
        assert second.status_code == 200

        with SessionLocal() as db:
            assert db.get(Product, 1).stock == stock_before - 1
            payment = db.scalar(
                select(Payment).where(
                    Payment.idempotency_key == "payment-security-key"
                )
            )
            assert payment is not None
            assert payment.last4 == "4242"
            assert "4242424242424242" not in payment.reference


def teardown_module():
    engine.dispose()
    TEST_DATABASE.unlink(missing_ok=True)
