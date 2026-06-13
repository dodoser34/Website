from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import DEFAULT_LOCALE, SUPPORTED_LOCALES
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import Currency, User
from app.schemas import LoginIn, RefreshIn, RegisterIn, TokenPair, UserOut


router = APIRouter(prefix="/auth", tags=["auth"])


def token_pair(user: User) -> TokenPair:
    return TokenPair(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/register", response_model=TokenPair, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> TokenPair:
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
    db.commit()
    db.refresh(user)
    return token_pair(user)


@router.post("/login", response_model=TokenPair)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenPair:
    user = db.scalar(
        select(User).where(func.lower(User.email) == payload.email.lower())
    )
    if (
        user is None
        or not user.is_active
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return token_pair(user)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshIn, db: Session = Depends(get_db)) -> TokenPair:
    token = decode_token(payload.refresh_token, "refresh")
    user = db.get(User, int(token["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is unavailable")
    return token_pair(user)


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"message": "Logged out"}
