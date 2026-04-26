"""Pull closed multi-candidate election events from the Gamma API.

Writes data/events.json — list of dicts with the fields we need downstream:
  { id, title, endDate, markets: [ {id, question, yesTokenId, finalYesPrice} ] }
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

from common import gamma_get

# Title patterns that indicate a multi-candidate election / nomination /
# selection of a person. We deliberately exclude pure sports tournaments.
ELECTION_PAT = re.compile(
    r"\b("
    r"election|elections|electoral|"
    r"president|presidential|presidency|"
    r"prime\s*minister|chancellor|premier|"
    r"mayor|mayoral|"
    r"governor|gubernatorial|"
    r"senate|senator|"
    r"congress|congressional|house\s+seat|"
    r"primary|primaries|caucus|"
    r"nominee|nomination|"
    r"successor|"
    r"speaker\s+of\s+the\s+house|"
    r"fed\s+chair|fed\s+chairman|"
    r"pope|papal|conclave|"
    r"leader(ship)?\s+(election|race|contest)|"
    r"party\s+leader|"
    r"referendum"
    r")\b",
    re.IGNORECASE,
)

# Anti-patterns: drop sports/finance tournaments that share words.
EXCLUDE_PAT = re.compile(
    r"\b("
    r"super\s*bowl|nba|nfl|nhl|mlb|champions\s*league|premier\s*league|"
    r"la\s*liga|serie\s*a|stanley\s*cup|world\s*series|world\s*cup|"
    r"poker|chess|tennis|f1|grand\s*prix|formula|bundesliga|"
    r"price|bitcoin|ethereum|crypto|"
    r"weather|hurricane|earthquake"
    r")\b",
    re.IGNORECASE,
)


def looks_like_election(title: str) -> bool:
    if not title:
        return False
    if EXCLUDE_PAT.search(title):
        return False
    return bool(ELECTION_PAT.search(title))


def parse_market(m: dict) -> dict | None:
    """Extract the bits we need from a Gamma market record."""
    try:
        token_ids = json.loads(m.get("clobTokenIds") or "[]")
        outcomes = json.loads(m.get("outcomes") or "[]")
        prices = json.loads(m.get("outcomePrices") or "[]")
    except json.JSONDecodeError:
        return None
    if len(token_ids) != 2 or outcomes != ["Yes", "No"] or len(prices) != 2:
        return None
    try:
        final_yes = float(prices[0])
    except (TypeError, ValueError):
        return None
    # Skip markets that resolved 50/50 or weird (shouldn't happen for binaries).
    if final_yes not in (0.0, 1.0):
        return None
    return {
        "id": m["id"],
        "question": m.get("question", ""),
        "yesTokenId": token_ids[0],
        "noTokenId": token_ids[1],
        "finalYesPrice": final_yes,
        "closedTime": m.get("closedTime"),
    }


def fetch_all_closed_events() -> list[dict]:
    """Page through closed events sorted by volume desc."""
    out: list[dict] = []
    seen: set[str] = set()
    page = 0
    while True:
        page += 1
        batch = gamma_get(
            "/events",
            closed="true",
            limit=200,
            offset=(page - 1) * 200,
            order="volume",
            ascending="false",
        )
        if not isinstance(batch, list) or not batch:
            break
        new_in_batch = 0
        for e in batch:
            eid = str(e.get("id"))
            if eid in seen:
                continue
            seen.add(eid)
            new_in_batch += 1
            out.append(e)
        last_vol = batch[-1].get("volume", 0)
        print(
            f"  page {page}: {len(batch)} events, {new_in_batch} new, total {len(out)}, last vol={last_vol:,.0f}",
            file=sys.stderr,
        )
        # Stop early once volume drops below something tiny — those events are
        # too illiquid to matter and the long tail is huge.
        if last_vol < 100_000:
            print("  reached low-volume tail, stopping pagination", file=sys.stderr)
            break
        if len(batch) < 200:
            break
        if page >= 50:
            break
        time.sleep(0.5)  # be polite, avoid 503s on deep pages
    return out


def main() -> None:
    here = Path(__file__).resolve().parent.parent
    data_dir = here / "data"
    data_dir.mkdir(exist_ok=True)

    print("Fetching closed events from Gamma...", file=sys.stderr)
    events = fetch_all_closed_events()
    print(f"Total closed events fetched: {len(events)}", file=sys.stderr)

    candidates: list[dict] = []
    for e in events:
        title = e.get("title", "")
        if not looks_like_election(title):
            continue
        markets_raw = e.get("markets") or []
        if len(markets_raw) < 2:
            continue
        parsed = [pm for pm in (parse_market(m) for m in markets_raw) if pm]
        # Need at least 2 valid candidate markets and at least one actual winner
        if len(parsed) < 2:
            continue
        n_winners = sum(1 for pm in parsed if pm["finalYesPrice"] == 1.0)
        # Allow 0 winners (e.g., "other") or >1 (rare); but mostly want 1.
        candidates.append(
            {
                "id": str(e["id"]),
                "title": title,
                "endDate": e.get("endDate"),
                "volume": e.get("volume", 0),
                "nMarkets": len(parsed),
                "nWinners": n_winners,
                "markets": parsed,
            }
        )

    out_path = data_dir / "events.json"
    out_path.write_text(json.dumps(candidates, indent=2))
    print(f"Kept {len(candidates)} election-like multi-candidate events", file=sys.stderr)
    print(f"Wrote {out_path}", file=sys.stderr)
    print(f"Total candidate markets: {sum(len(e['markets']) for e in candidates)}", file=sys.stderr)


if __name__ == "__main__":
    main()
