import io
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.core.audit import write_audit_log
from app.core.config import (
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_PIXELS,
    MAX_UPLOAD_SIZE_MB,
    MEDIA_DIR,
)
from app.core.database import get_db
from app.core.dependencies import get_admin_user
from app.models import User


router = APIRouter(prefix="/storage", tags=["storage"])
MAX_FILE_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024
FORMAT_EXTENSIONS = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}


def _validated_image(content: bytes) -> tuple[Image.Image, str]:
    Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
    try:
        with Image.open(io.BytesIO(content)) as candidate:
            candidate.verify()
        image = Image.open(io.BytesIO(content))
        image.load()
    except (
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
        UnidentifiedImageError,
        OSError,
    ) as error:
        raise HTTPException(status_code=422, detail="Invalid image file") from error
    extension = FORMAT_EXTENSIONS.get(image.format or "")
    if extension is None:
        image.close()
        raise HTTPException(status_code=422, detail="Invalid image file")
    return image, extension


@router.post("/images", status_code=201)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    source_extension = Path(file.filename or "").suffix.lower()
    if (
        (file.content_type or "") not in ALLOWED_IMAGE_TYPES
        or source_extension not in ALLOWED_IMAGE_EXTENSIONS
    ):
        raise HTTPException(status_code=422, detail="Invalid image file")
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Image exceeds {MAX_UPLOAD_SIZE_MB} MB",
        )
    image, extension = _validated_image(content)
    filename = f"{uuid.uuid4().hex}{extension}"
    path = MEDIA_DIR / filename
    output = io.BytesIO()
    try:
        if extension == ".jpg":
            image.convert("RGB").save(output, format="JPEG", quality=90, optimize=True)
        elif extension == ".png":
            image.save(output, format="PNG", optimize=True)
        else:
            image.save(output, format="WEBP", quality=90, method=6)
    finally:
        image.close()
    path.write_bytes(output.getvalue())
    write_audit_log(
        db,
        admin,
        request,
        "upload_image",
        "media",
        filename,
        {"content_type": file.content_type, "size": len(content)},
    )
    db.commit()
    return {"path": f"/media/{filename}", "filename": filename}
