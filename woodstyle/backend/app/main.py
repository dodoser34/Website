import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.cart.router import router as cart_router
from app.categories.router import router as categories_router
from app.contact.router import router as contact_router
from app.core.audit import write_audit_log
from app.core.config import (
    ALLOWED_HOSTS,
    APP_ENV,
    CORS_ORIGINS,
    DATABASE_URL,
    DEBUG,
    LOG_LEVEL,
    MEDIA_DIR,
    RATE_LIMIT_ADMIN,
    RATE_LIMIT_ENABLED,
    SECRET_KEY_CONFIGURED,
    SECURITY_HEADERS_ENABLED,
)
from app.core.database import SessionLocal, engine
from app.core.i18n import request_locale, translate_error
from app.core.initialization import initialize_database
from app.core.rate_limit import enforce_rate_limit
from app.core.security import decode_token
from app.currencies.router import router as currencies_router
from app.favorites.router import router as favorites_router
from app.legacy import router as legacy_router
from app.models import User
from app.orders.router import router as orders_router
from app.payments.router import router as payments_router
from app.products.router import router as products_router
from app.shipping.router import router as shipping_router
from app.storage.router import router as storage_router
from app.users.router import router as users_router


logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("woodstyle")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if APP_ENV == "production" and not SECRET_KEY_CONFIGURED:
        raise RuntimeError("WOODSTYLE_SECRET_KEY is required in production")
    initialize_database()
    logger.info(
        "startup env=%s debug=%s database=%s cors=%s media=%s "
        "security_headers=%s rate_limit=%s",
        APP_ENV,
        DEBUG,
        engine.url.get_backend_name(),
        ",".join(CORS_ORIGINS),
        MEDIA_DIR,
        SECURITY_HEADERS_ENABLED,
        RATE_LIMIT_ENABLED,
    )
    yield


app = FastAPI(
    title="WoodStyle International API",
    description="Multilingual commerce API for WoodStyle furniture and interior collections",
    version="2.1.0",
    debug=DEBUG,
    lifespan=lifespan,
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "X-CSRF-Token",
    ],
)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

for router in (
    auth_router,
    users_router,
    products_router,
    categories_router,
    currencies_router,
    cart_router,
    favorites_router,
    orders_router,
    payments_router,
    shipping_router,
    contact_router,
    storage_router,
    admin_router,
):
    app.include_router(router, prefix="/api/v1")

app.include_router(legacy_router)


def _admin_action(request: Request) -> tuple[str, str, str]:
    relative = request.url.path.removeprefix("/api/v1/admin/").strip("/")
    parts = relative.split("/") if relative else ["admin"]
    entity_type = parts[0]
    entity_id = parts[1] if len(parts) > 1 else ""
    action = f"{request.method.lower()}_{entity_type}"
    aliases = {
        ("POST", "products"): "create_product",
        ("PUT", "products"): "update_product",
        ("DELETE", "products"): "hide_product",
        ("PATCH", "orders"): "update_order_status",
        ("PATCH", "currencies"): "update_currency",
        ("POST", "shipping"): "create_shipping_zone",
        ("PUT", "shipping"): "update_shipping_zone",
        ("GET", "messages"): "view_messages",
        ("PATCH", "messages"): "process_message",
    }
    return aliases.get((request.method, entity_type), action), entity_type, entity_id


@app.middleware("http")
async def security_and_audit_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
    is_admin_mutation = (
        request.url.path.startswith("/api/v1/admin/")
        and request.method in {"POST", "PUT", "PATCH", "DELETE"}
    )
    if is_admin_mutation:
        try:
            enforce_rate_limit(request, "admin-mutation", RATE_LIMIT_ADMIN)
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "detail": translate_error(
                        str(exc.detail),
                        request_locale(request),
                    ),
                    "code": "RATE_LIMITED",
                    "fields": {},
                },
                headers=exc.headers,
            )

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    if SECURITY_HEADERS_ENABLED:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = (
            "cross-origin"
            if request.url.path.startswith("/media/")
            else "same-origin"
        )
        if request.url.path.startswith(("/docs", "/openapi.json")):
            csp = (
                "default-src 'self' https://cdn.jsdelivr.net; "
                "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; "
                "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; "
                "img-src 'self' data:; frame-ancestors 'none';"
            )
        else:
            connect_sources = " ".join(CORS_ORIGINS)
            csp = (
                "default-src 'self'; script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: blob:; font-src 'self' data:; "
                f"connect-src 'self' {connect_sources}; "
                "frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
            )
        response.headers["Content-Security-Policy"] = csp
        if APP_ENV == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

    should_audit = (
        response.status_code < 400
        and request.url.path.startswith("/api/v1/admin/")
        and (
            request.method in {"POST", "PUT", "PATCH", "DELETE"}
            or request.url.path.endswith("/messages")
        )
    )
    if should_audit:
        authorization = request.headers.get("authorization", "")
        if authorization.lower().startswith("bearer "):
            try:
                payload = decode_token(authorization.split(" ", 1)[1], "access")
                with SessionLocal() as db:
                    admin = db.get(User, int(payload["sub"]))
                    if admin and admin.role == "admin":
                        action, entity_type, entity_id = _admin_action(request)
                        write_audit_log(
                            db,
                            admin,
                            request,
                            action,
                            entity_type,
                            entity_id,
                            {"status_code": response.status_code},
                        )
                        db.commit()
            except Exception:
                logger.exception("admin_audit_write_failed request_id=%s", request_id)
    return response


def health_payload() -> dict[str, str]:
    database_status = "ok"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        database_status = "error"
    return {
        "service": "backend",
        "status": "ok" if database_status == "ok" else "degraded",
        "database": database_status,
        "version": "2.1.0",
    }


@app.get("/health")
def root_health():
    return health_payload()


@app.get("/api/v1/health")
def health():
    return health_payload()


@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException,
):
    detail = exc.detail
    if isinstance(detail, str):
        detail = translate_error(detail, request_locale(request))
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail, "code": f"HTTP_{exc.status_code}", "fields": {}},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    message = translate_error("Invalid value", request_locale(request))
    fields = {
        ".".join(str(part) for part in error["loc"][1:]): message
        for error in exc.errors()
    }
    return JSONResponse(
        status_code=422,
        content={
            "detail": message,
            "code": "VALIDATION_ERROR",
            "fields": fields,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "unhandled_error method=%s path=%s",
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "code": "INTERNAL_ERROR",
            "fields": {},
        },
    )
