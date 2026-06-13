import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[2]
MEDIA_DIR = BACKEND_DIR / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv(
    "WOODSTYLE_DATABASE_URL",
    f"sqlite:///{BACKEND_DIR / 'woodstyle.db'}",
)
SECRET_KEY = os.getenv(
    "WOODSTYLE_SECRET_KEY",
    "woodstyle-local-development-secret-change-before-production",
)
ACCESS_TOKEN_MINUTES = int(os.getenv("WOODSTYLE_ACCESS_TOKEN_MINUTES", "60"))
REFRESH_TOKEN_DAYS = int(os.getenv("WOODSTYLE_REFRESH_TOKEN_DAYS", "14"))

DEFAULT_LOCALE = "en"
SUPPORTED_LOCALES = {"en", "ru", "de", "ja", "fr"}
DEFAULT_CURRENCY = "USD"
LEGACY_RUB_PER_USD = 71.9077

CORS_ORIGINS = [
    value.strip()
    for value in os.getenv(
        "WOODSTYLE_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if value.strip()
]
