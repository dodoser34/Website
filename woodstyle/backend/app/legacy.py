from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.categories.router import categories
from app.contact.router import contact, inquiry
from app.core.database import get_db
from app.products.router import product, products
from app.schemas import ContactIn, LegacyInquiryIn


router = APIRouter(prefix="/api", tags=["legacy"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/products")
def legacy_products(db: Session = Depends(get_db)):
    return products(page_size=100, db=db)["items"]


@router.get("/products/{product_id}")
def legacy_product(product_id: int, db: Session = Depends(get_db)):
    return product(product_id=product_id, db=db)


@router.get("/categories")
def legacy_categories(db: Session = Depends(get_db)):
    return categories(db=db)


@router.post("/orders", status_code=201)
def legacy_order(payload: LegacyInquiryIn, db: Session = Depends(get_db)):
    return inquiry(payload=payload, db=db)


@router.post("/contact", status_code=201)
def legacy_contact(payload: ContactIn, db: Session = Depends(get_db)):
    return contact(payload=payload, db=db)
