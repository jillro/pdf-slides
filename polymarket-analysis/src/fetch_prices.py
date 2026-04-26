"""For each candidate market in data/events.json, fetch the Yes-token *and*
No-token prices around 30 days before the event's resolution.

Writes data/snapshots.json with the same structure as events.json, plus
`yesSnap`, `noSnap` and `snapTs` on each market (None if no history).

We use a wider ±5-day window (vs the original ±12h) so that markets created
shortly after T-30d, or with sparse early ticks, still get a snapshot. The
closest tick to the target T-30d timestamp is used, and we record how far
off it actually was.
"""

from __future__ import annotations

import datetime as dt
import json
import sys
import time
from pathlib import Path

from common import clob_price_history

SNAPSHOT_OFFSET_DAYS = 30
WINDOW_HALF_DAYS = 5  # CLOB caps total window at ~14d; 10d is well within
FIDELITY_MIN = 60


def parse_iso(ts: str) -> dt.datetime:
    return dt.datetime.fromisoformat(ts.replace("Z", "+00:00"))


def snapshot_target_ts(event_end_iso: str) -> int:
    end = parse_iso(event_end_iso)
    target = end - dt.timedelta(days=SNAPSHOT_OFFSET_DAYS)
    return int(target.timestamp())


def closest_price(token_id: str, target_ts: int) -> tuple[float, int] | None:
    half = WINDOW_HALF_DAYS * 86400
    try:
        hist = clob_price_history(
            token_id,
            start_ts=target_ts - half,
            end_ts=target_ts + half,
            fidelity=FIDELITY_MIN,
        )
    except Exception as e:  # noqa: BLE001
        print(f"    fetch error: {e}", file=sys.stderr)
        return None
    if not hist:
        return None
    closest = min(hist, key=lambda p: abs(p["t"] - target_ts))
    return float(closest["p"]), int(closest["t"])


def main() -> None:
    here = Path(__file__).resolve().parent.parent
    events = json.loads((here / "data" / "events.json").read_text())
    out_path = here / "data" / "snapshots.json"

    # Resume support: reuse already-fetched snaps. We require BOTH yesSnap and
    # noSnap to consider a market cached, so an old yes-only run is re-fetched.
    cached: dict[str, dict] = {}
    if out_path.exists():
        for ev in json.loads(out_path.read_text()):
            for m in ev["markets"]:
                if "yesSnap" in m and "noSnap" in m:
                    cached[m["id"]] = m

    total_markets = sum(len(e["markets"]) for e in events)
    done = 0
    fetched = 0
    skipped_cached = 0
    last_save = time.time()

    for ev in events:
        if not ev.get("endDate"):
            for m in ev["markets"]:
                done += 1
                m.setdefault("yesSnap", None)
                m.setdefault("noSnap", None)
                m.setdefault("snapTs", None)
            continue
        target_ts = snapshot_target_ts(ev["endDate"])
        for m in ev["markets"]:
            done += 1
            if m["id"] in cached:
                c = cached[m["id"]]
                m["yesSnap"] = c["yesSnap"]
                m["noSnap"] = c["noSnap"]
                m["snapTs"] = c.get("snapTs")
                m.setdefault("noTokenId", c.get("noTokenId"))
                skipped_cached += 1
                continue

            yes = closest_price(m["yesTokenId"], target_ts)
            no = closest_price(m["noTokenId"], target_ts) if m.get("noTokenId") else None

            if yes is None and no is None:
                m["yesSnap"] = None
                m["noSnap"] = None
                m["snapTs"] = None
            else:
                m["yesSnap"] = yes[0] if yes else None
                m["noSnap"] = no[0] if no else None
                # Pick the timestamp of whichever leg we got (prefer yes).
                m["snapTs"] = (yes or no)[1]

            fetched += 1
            time.sleep(0.05)
            if done % 50 == 0:
                print(
                    f"  {done}/{total_markets} markets ({fetched} fetched, {skipped_cached} cached)",
                    file=sys.stderr,
                )
            if time.time() - last_save > 30:
                out_path.write_text(json.dumps(events, indent=2))
                last_save = time.time()

    out_path.write_text(json.dumps(events, indent=2))
    n_yes = sum(1 for ev in events for m in ev["markets"] if m.get("yesSnap") is not None)
    n_no = sum(1 for ev in events for m in ev["markets"] if m.get("noSnap") is not None)
    n_both = sum(
        1
        for ev in events
        for m in ev["markets"]
        if m.get("yesSnap") is not None and m.get("noSnap") is not None
    )
    print(
        f"Done. {done} markets, {fetched} fetched this run, {skipped_cached} from cache",
        file=sys.stderr,
    )
    print(f"Coverage: yes={n_yes}, no={n_no}, both={n_both}", file=sys.stderr)


if __name__ == "__main__":
    main()
