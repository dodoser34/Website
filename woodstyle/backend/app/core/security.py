import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status

from app.core.config import (
    ACCESS_TOKEN_MINUTES,
    REFRESH_TOKEN_DAYS,
    SECRET_KEY,
)


PASSWORD_ITERATIONS = 600_000


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    return (
        f"pbkdf2_sha256${PASSWORD_ITERATIONS}$"
        f"{_b64encode(salt)}${_b64encode(digest)}"
    )


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            _b64decode(salt),
            int(iterations),
        )
        return hmac.compare_digest(_b64encode(digest), expected)
    except (TypeError, ValueError):
        return False


def create_token(
    subject: int,
    token_type: str,
    expires_delta: timedelta,
    extra: dict[str, Any] | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    header = {"alg": "HS256", "typ": "JWT"}
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    if extra:
        payload.update(extra)
    encoded_header = _b64encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8")
    )
    encoded_payload = _b64encode(
        json.dumps(payload, separators=(",", ":")).encode("utf-8")
    )
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        f"{encoded_header}.{encoded_payload}".encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64encode(signature)}"


def create_access_token(user_id: int, role: str) -> str:
    return create_token(
        user_id,
        "access",
        timedelta(minutes=ACCESS_TOKEN_MINUTES),
        {"role": role},
    )


def create_refresh_token(user_id: int) -> str:
    return create_token(
        user_id,
        "refresh",
        timedelta(days=REFRESH_TOKEN_DAYS),
    )


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
    )
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".", 2)
        expected_signature = hmac.new(
            SECRET_KEY.encode("utf-8"),
            f"{encoded_header}.{encoded_payload}".encode("ascii"),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(
            _b64encode(expected_signature),
            encoded_signature,
        ):
            raise credentials_error
        payload = json.loads(_b64decode(encoded_payload))
        if payload.get("type") != expected_type:
            raise credentials_error
        if int(payload.get("exp", 0)) <= int(
            datetime.now(timezone.utc).timestamp()
        ):
            raise credentials_error
        return payload
    except HTTPException:
        raise
    except (ValueError, TypeError, json.JSONDecodeError) as error:
        raise credentials_error from error
