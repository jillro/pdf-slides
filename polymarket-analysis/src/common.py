"""Shared HTTP helpers — stdlib only."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

UA = "Mozilla/5.0 (compatible; underdog-research/0.1)"


def http_get_json(url: str, retries: int = 4, backoff: float = 1.5) -> Any:
    """GET a URL and parse JSON, with retry on 5xx and transient errors."""
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 400:
                # client error — don't retry, surface to caller
                raise
            last_err = e
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            last_err = e
        time.sleep(backoff ** attempt)
    raise RuntimeError(f"GET failed after {retries} retries: {url} ({last_err})")


def gamma_get(path: str, **params: Any) -> Any:
    qs = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    url = f"https://gamma-api.polymarket.com{path}"
    if qs:
        url = f"{url}?{qs}"
    return http_get_json(url)


def clob_price_history(token_id: str, start_ts: int, end_ts: int, fidelity: int = 60) -> list[dict]:
    """Fetch CLOB price history for a token id between two unix timestamps."""
    url = (
        "https://clob.polymarket.com/prices-history"
        f"?market={token_id}&startTs={start_ts}&endTs={end_ts}&fidelity={fidelity}"
    )
    return http_get_json(url).get("history", [])
