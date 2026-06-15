import json
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.rate_limit import client_ip
from app.models import AdminAuditLog, User


def write_audit_log(
    db: Session,
    admin: User,
    request: Request,
    action: str,
    entity_type: str,
    entity_id: str | int | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    db.add(
        AdminAuditLog(
            admin_user_id=admin.id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else "",
            ip_address=client_ip(request),
            user_agent=request.headers.get("user-agent", "")[:500],
            metadata_json=json.dumps(metadata or {}, ensure_ascii=False),
        )
    )
