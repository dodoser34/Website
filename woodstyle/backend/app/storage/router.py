import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.config import MEDIA_DIR
from app.core.dependencies import get_admin_user
from app.models import User


router = APIRouter(prefix="/storage", tags=["storage"])
ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("/images", status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(get_admin_user),
):
    extension = ALLOWED_TYPES.get(file.content_type or "")
    if extension is None:
        raise HTTPException(
            status_code=422,
            detail="Only JPEG, PNG and WebP images are allowed",
        )
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image exceeds 5 MB")
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", Path(file.filename or "image").stem)
    filename = f"{stem[:40]}-{uuid.uuid4().hex[:10]}{extension}"
    path = MEDIA_DIR / filename
    path.write_bytes(content)
    return {"path": f"/media/{filename}", "filename": filename}
