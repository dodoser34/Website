from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.cart.router import router as cart_router
from app.categories.router import router as categories_router
from app.contact.router import router as contact_router
from app.core.config import CORS_ORIGINS, MEDIA_DIR
from app.core.i18n import request_locale, translate_error
from app.core.initialization import initialize_database
from app.currencies.router import router as currencies_router
from app.favorites.router import router as favorites_router
from app.legacy import router as legacy_router
from app.orders.router import router as orders_router
from app.payments.router import router as payments_router
from app.products.router import router as products_router
from app.shipping.router import router as shipping_router
from app.storage.router import router as storage_router
from app.users.router import router as users_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="WoodStyle International API",
    description="Multilingual commerce API for WoodStyle furniture and interior collections",
    version="2.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


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
        content={"detail": detail},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    message = translate_error("Invalid value", request_locale(request))
    return JSONResponse(
        status_code=422,
        content={
            "detail": [
                {
                    "field": ".".join(str(part) for part in error["loc"][1:]),
                    "message": message,
                }
                for error in exc.errors()
            ]
        },
    )
