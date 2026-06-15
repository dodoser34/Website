import hmac
import logging
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import write_audit_log
from app.core.config import (
    APP_ENV,
    COOKIE_HTTPONLY,
    COOKIE_SAMESITE,
    COOKIE_SECURE,
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    CSRF_PROTECTION_ENABLED,
    DEFAULT_LOCALE,
    RATE_LIMIT_LOGIN,
    RATE_LIMIT_REFRESH,
    RATE_LIMIT_REGISTER,
    REFRESH_COOKIE_NAME,
    REFRESH_TOKEN_DAYS,
    SUPPORTED_LOCALES,
)
from app.core.database import get_db
from app.core.rate_limit import client_ip, enforce_rate_limit
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    password_needs_rehash,
    verify_password,
)
from app.models import Currency, RefreshSession, User
from app.schemas import LoginIn, RefreshIn, RegisterIn, TokenPair


router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("woodstyle.auth")


def _set_auth_cookies(response: Response, refresh_token: str) -> None:
    max_age = REFRESH_TOKEN_DAYS * 24 * 60 * 60
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=max_age,
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/api/v1/auth",
    )
    response.set_cookie(
        CSRF_COOKIE_NAME,
        csrf_token,
        max_age=max_age,
        httponly=False,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/v1/auth")
    response.delete_cookie(CSRF_COOKIE_NAME, path="/")


def _create_refresh_session(
    db: Session,
    user: User,
    request: Request,
    family_id: str | None = None,
) -> tuple[RefreshSession, str]:
    token_id = uuid.uuid4().hex
    family = family_id or uuid.uuid4().hex
    token = create_refresh_token(user.id, token_id, family)
    session = RefreshSession(
        user_id=user.id,
        token_id=token_id,
        family_id=family,
        token_hash=hash_token(token),
        user_agent=request.headers.get("user-agent", "")[:500],
        ip_address=client_ip(request),
        expires_at=datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_DAYS),
    )
    db.add(session)
    return session, token


def _token_pair(
    db: Session,
    user: User,
    request: Request,
    response: Response,
    family_id: str | None = None,
) -> TokenPair:
    _, refresh_token = _create_refresh_session(
        db,
        user,
        request,
        family_id=family_id,
    )
    db.commit()
    _set_auth_cookies(response, refresh_token)
    return TokenPair(
        access_token=create_access_token(user.id, user.role),
        refresh_token=refresh_token if APP_ENV != "production" else "",
    )


def _request_refresh_token(
    request: Request,
    payload: RefreshIn | None,
) -> str:
    body_token = payload.refresh_token if payload else ""
    if body_token:
        return body_token
    cookie_token = request.cookies.get(REFRESH_COOKIE_NAME, "")
    if not cookie_token:
        raise HTTPException(status_code=401, detail="Refresh session is unavailable")
    if CSRF_PROTECTION_ENABLED:
        csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME, "")
        csrf_header = request.headers.get(CSRF_HEADER_NAME, "")
        if not csrf_cookie or not hmac.compare_digest(csrf_cookie, csrf_header):
            raise HTTPException(status_code=403, detail="CSRF validation failed")
    return cookie_token


def _session_for_token(db: Session, refresh_token: str) -> RefreshSession:
    token = decode_token(refresh_token, "refresh")
    token_id = str(token.get("jti", ""))
    session = db.scalar(
        select(RefreshSession).where(RefreshSession.token_id == token_id)
    )
    if session is None or not hmac.compare_digest(
        session.token_hash,
        hash_token(refresh_token),
    ):
        raise HTTPException(status_code=401, detail="Refresh session is unavailable")
    if session.revoked_at is not None:
        db.query(RefreshSession).filter(
            RefreshSession.family_id == session.family_id,
            RefreshSession.revoked_at.is_(None),
        ).update({"revoked_at": datetime.now(UTC)})
        db.commit()
        raise HTTPException(status_code=401, detail="Refresh token reuse detected")
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= datetime.now(UTC):
        raise HTTPException(status_code=401, detail="Refresh session expired")
    return session


@router.post("/register", response_model=TokenPair, status_code=201)
def register(
    payload: RegisterIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenPair:
    enforce_rate_limit(request, "register", RATE_LIMIT_REGISTER)
    email = payload.email.lower()
    if db.scalar(select(User.id).where(func.lower(User.email) == email)):
        raise HTTPException(status_code=409, detail="Email is already registered")
    if db.get(Currency, payload.currency_code.upper()) is None:
        raise HTTPException(status_code=422, detail="Unknown currency")
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        locale=(
            payload.locale
            if payload.locale in SUPPORTED_LOCALES
            else DEFAULT_LOCALE
        ),
        currency_code=payload.currency_code.upper(),
    )
    db.add(user)
    db.flush()
    logger.info("registration_success user_id=%s ip=%s", user.id, client_ip(request))
    return _token_pair(db, user, request, response)


@router.post("/login", response_model=TokenPair)
def login(
    payload: LoginIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenPair:
    enforce_rate_limit(
        request,
        "login",
        RATE_LIMIT_LOGIN,
        identifier=payload.email,
    )
    user = db.scalar(
        select(User).where(func.lower(User.email) == payload.email.lower())
    )
    if (
        user is None
        or not user.is_active
        or not verify_password(payload.password, user.password_hash)
    ):
        logger.warning("login_failure ip=%s", client_ip(request))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)
    if user.role == "admin":
        write_audit_log(db, user, request, "admin_login", "auth", user.id)
    logger.info("login_success user_id=%s ip=%s", user.id, client_ip(request))
    return _token_pair(db, user, request, response)


@router.post("/refresh", response_model=TokenPair)
def refresh(
    request: Request,
    response: Response,
    payload: RefreshIn | None = Body(default=None),
    db: Session = Depends(get_db),
) -> TokenPair:
    enforce_rate_limit(request, "refresh", RATE_LIMIT_REFRESH)
    refresh_token = _request_refresh_token(request, payload)
    session = _session_for_token(db, refresh_token)
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is unavailable")
    session.revoked_at = datetime.now(UTC)
    replacement, new_token = _create_refresh_session(
        db,
        user,
        request,
        family_id=session.family_id,
    )
    session.replaced_by_token_id = replacement.token_id
    db.commit()
    _set_auth_cookies(response, new_token)
    return TokenPair(
        access_token=create_access_token(user.id, user.role),
        refresh_token=new_token if APP_ENV != "production" else "",
    )


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    payload: RefreshIn | None = Body(default=None),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    refresh_token = payload.refresh_token if payload else ""
    refresh_token = refresh_token or request.cookies.get(REFRESH_COOKIE_NAME, "")
    if refresh_token:
        try:
            session = _session_for_token(db, refresh_token)
            session.revoked_at = datetime.now(UTC)
            db.commit()
        except HTTPException:
            pass
    _clear_auth_cookies(response)
    return {"message": "Logged out"}
