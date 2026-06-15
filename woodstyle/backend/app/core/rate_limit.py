import logging
import re
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from app.core.config import RATE_LIMIT_ENABLED


logger = logging.getLogger("woodstyle.security")
_LOCK = threading.Lock()
_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
_LIMIT_PATTERN = re.compile(r"^(?P<count>\d+)/(?:minute|min|m)$")


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"


def parse_limit(value: str) -> tuple[int, int]:
    match = _LIMIT_PATTERN.match(value.strip().lower())
    if not match:
        raise ValueError(f"Unsupported rate limit: {value}")
    return int(match.group("count")), 60


def enforce_rate_limit(
    request: Request,
    scope: str,
    limit: str,
    identifier: str = "",
) -> None:
    if not RATE_LIMIT_ENABLED:
        return
    count, window = parse_limit(limit)
    now = time.monotonic()
    key = f"{scope}:{client_ip(request)}:{identifier.strip().lower()}"
    with _LOCK:
        bucket = _BUCKETS[key]
        while bucket and bucket[0] <= now - window:
            bucket.popleft()
        if len(bucket) >= count:
            logger.warning(
                "rate_limit_exceeded scope=%s ip=%s",
                scope,
                client_ip(request),
            )
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Try again later.",
                headers={"Retry-After": str(window)},
            )
        bucket.append(now)


def reset_rate_limits() -> None:
    with _LOCK:
        _BUCKETS.clear()
