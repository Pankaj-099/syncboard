
import json
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

_redis_client = None


def get_redis():
    global _redis_client
    from app.core.config import settings

    if not settings.REDIS_ENABLED:
        return None

    if _redis_client is None:
        try:
            import redis
            _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            _redis_client.ping()
            logger.info("Redis connected")
        except Exception as e:
            logger.warning(f"Redis unavailable, caching disabled: {e}")
            _redis_client = None

    return _redis_client


def cache_get(key: str) -> Optional[Any]:
    r = get_redis()
    if not r:
        return None
    try:
        val = r.get(key)
        return json.loads(val) if val else None
    except Exception as e:
        logger.warning(f"Cache get error: {e}")
        return None


def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    r = get_redis()
    if not r:
        return
    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning(f"Cache set error: {e}")


def cache_delete(key: str) -> None:
    r = get_redis()
    if not r:
        return
    try:
        r.delete(key)
    except Exception as e:
        logger.warning(f"Cache delete error: {e}")


def cache_delete_pattern(pattern: str) -> None:

    r = get_redis()
    if not r:
        return
    try:
        keys = r.keys(pattern)
        if keys:
            r.delete(*keys)
    except Exception as e:
        logger.warning(f"Cache pattern delete error: {e}")
