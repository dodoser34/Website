import os
import secrets
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"
load_dotenv(ENV_FILE)


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str) -> list[str]:
    return [
        value.strip()
        for value in os.getenv(name, default).split(",")
        if value.strip()
    ]


MEDIA_DIR = BACKEND_DIR / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

APP_ENV = os.getenv("APP_ENV", "development").lower()
DEBUG = env_bool("DEBUG", False)
DATABASE_PATH = Path(
    os.getenv("WOODSTYLE_DATABASE_PATH", "data/woodstyle.sqlite3")
)
if not DATABASE_PATH.is_absolute():
    DATABASE_PATH = (BACKEND_DIR / DATABASE_PATH).resolve()
DATABASE_URL = os.getenv(
    "WOODSTYLE_DATABASE_URL",
    f"sqlite:///{DATABASE_PATH.as_posix()}",
)
SECRET_KEY_CONFIGURED = bool(os.getenv("WOODSTYLE_SECRET_KEY"))
SECRET_KEY = os.getenv("WOODSTYLE_SECRET_KEY") or secrets.token_urlsafe(48)
ACCESS_TOKEN_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        os.getenv("WOODSTYLE_ACCESS_TOKEN_MINUTES", "15"),
    )
)
REFRESH_TOKEN_DAYS = int(
    os.getenv(
        "REFRESH_TOKEN_EXPIRE_DAYS",
        os.getenv("WOODSTYLE_REFRESH_TOKEN_DAYS", "14"),
    )
)

DEFAULT_LOCALE = "en"
SUPPORTED_LOCALES = {"en", "ru", "de", "ja", "fr"}
DEFAULT_CURRENCY = "USD"
LEGACY_RUB_PER_USD = 71.9077

CORS_ORIGINS = env_list(
    "CORS_ORIGINS",
    os.getenv(
        "WOODSTYLE_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ),
)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")

COOKIE_SECURE = env_bool("COOKIE_SECURE", APP_ENV == "production")
COOKIE_SAMESITE = os.getenv(
    "COOKIE_SAMESITE",
    "strict" if APP_ENV == "production" else "lax",
).lower()
COOKIE_HTTPONLY = env_bool("COOKIE_HTTPONLY", True)
REFRESH_COOKIE_NAME = os.getenv("REFRESH_COOKIE_NAME", "woodstyle_refresh")
CSRF_COOKIE_NAME = os.getenv("CSRF_COOKIE_NAME", "woodstyle_csrf")
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_PROTECTION_ENABLED = env_bool("CSRF_PROTECTION_ENABLED", True)

RATE_LIMIT_ENABLED = env_bool("RATE_LIMIT_ENABLED", True)
RATE_LIMIT_LOGIN = os.getenv("RATE_LIMIT_LOGIN", "5/minute")
RATE_LIMIT_REGISTER = os.getenv("RATE_LIMIT_REGISTER", "5/minute")
RATE_LIMIT_REFRESH = os.getenv("RATE_LIMIT_REFRESH", "20/minute")
RATE_LIMIT_CONTACT = os.getenv("RATE_LIMIT_CONTACT", "3/minute")
RATE_LIMIT_CHECKOUT = os.getenv("RATE_LIMIT_CHECKOUT", "10/minute")
RATE_LIMIT_ADMIN = os.getenv("RATE_LIMIT_ADMIN", "30/minute")

MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
ALLOWED_IMAGE_TYPES = set(
    env_list("ALLOWED_IMAGE_TYPES", "image/jpeg,image/png,image/webp")
)
ALLOWED_IMAGE_EXTENSIONS = {
    value.lower()
    for value in env_list(
        "ALLOWED_IMAGE_EXTENSIONS",
        ".jpg,.jpeg,.png,.webp",
    )
}
MAX_IMAGE_PIXELS = int(os.getenv("MAX_IMAGE_PIXELS", "40000000"))

SECURITY_HEADERS_ENABLED = env_bool("SECURITY_HEADERS_ENABLED", True)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
