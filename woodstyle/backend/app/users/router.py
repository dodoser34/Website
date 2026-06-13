from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import SUPPORTED_LOCALES
from app.core.dependencies import get_current_user
from app.models import Address, Currency, User
from app.schemas import AddressIn, AddressOut, ProfileUpdate, UserOut


router = APIRouter(prefix="/me", tags=["profile"])


@router.get("", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    values = payload.model_dump(exclude_unset=True)
    if "locale" in values and values["locale"] not in SUPPORTED_LOCALES:
        raise HTTPException(status_code=422, detail="Unsupported locale")
    if "currency_code" in values:
        values["currency_code"] = values["currency_code"].upper()
        if db.get(Currency, values["currency_code"]) is None:
            raise HTTPException(status_code=422, detail="Unknown currency")
    for key, value in values.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/addresses", response_model=list[AddressOut])
def addresses(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Address]:
    return list(
        db.scalars(
            select(Address)
            .where(Address.user_id == user.id)
            .order_by(Address.is_default.desc(), Address.id)
        ).all()
    )


@router.post("/addresses", response_model=AddressOut, status_code=201)
def add_address(
    payload: AddressIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Address:
    if payload.is_default:
        db.query(Address).filter(Address.user_id == user.id).update(
            {"is_default": False}
        )
    address = Address(user_id=user.id, **payload.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/addresses/{address_id}", status_code=204)
def delete_address(
    address_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    address = db.scalar(
        select(Address).where(
            Address.id == address_id,
            Address.user_id == user.id,
        )
    )
    if address is None:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(address)
    db.commit()
