from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import ContactMessage, LegacyInquiry, Product
from app.schemas import ContactIn, LegacyInquiryIn


router = APIRouter(tags=["contact"])


@router.post("/contact", status_code=201)
def contact(payload: ContactIn, db: Session = Depends(get_db)):
    item = ContactMessage(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "message": "Message received. The WoodStyle team will contact you.",
        "created_at": item.created_at,
    }


@router.post("/inquiries", status_code=201)
def inquiry(payload: LegacyInquiryIn, db: Session = Depends(get_db)):
    if db.get(Product, payload.product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    item = LegacyInquiry(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "message": "Inquiry received",
        "created_at": item.created_at,
    }
