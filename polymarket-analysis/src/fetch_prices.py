"""For each candidate market in data/events.json, fetch the Yes-token price
30 days before the event's resolution.

Writes data/snapshots.json with the same structure as events.json, plus a
`yesSnap` field on each market (or None if no history was available).
"""

from __future__ import annotations

import datetime as dt
import json
import sys
import time
from pathlib import Path

from common import clob_price_history

SNAPSHOT_OFFSET_DAYS = 30
WINDOW_HALF_HOURS = 12
FIDELITY_MIN = 60


def parse_iso(ts: str) -> dt.datetime:
    # Gamma timestamps are like '2024-11-05T12:00:00Z'
    return dt.datetime.fromisoformat(ts.replace("Z", "+00:00"))


def snapshot_target_ts(event_end_iso: str) -> int:
    end = parse_iso(event_end_iso)
    target = end - dt.timedelta(days=SNAPSHOT_OFFSET_DAYS)
    return int(target.timestamp())


def fetch_yes_snapshot(token_id: str, target_ts: int) -> tuple[float, int] | None:
    """Return (price, actual_timestamp) of the closest CLOB tick to target_ts.

    Returns None if the API has no history in the window.
    """
    half = WINDOW_HALF_HOURS * 3600
    try:
        hist = clob_price_history(
            token_id,
            start_ts=target_ts - half,
            end_ts=target_ts + half,
            fidelity=FIDELITY_MIN,
        )
    except Exception as e:  # noqa: BLE001 — fetch failure is data, not a crash
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

    # Resume support: if snapshots.json exists, reuse already-fetched yesSnap.
    cached: dict[str, dict] = {}
    if out_path.exists():
        for ev in json.loads(out_path.read_text()):
            for m in ev["markets"]:
                if "yesSnap" in m:
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
                m.setdefault("yesSnapTs", None)
            continue
        target_ts = snapshot_target_ts(ev["endDate"])
        for m in ev["markets"]:
            done += 1
            if m["id"] in cached and "yesSnap" in cached[m["id"]]:
                m["yesSnap"] = cached[m["id"]]["yesSnap"]
                m["yesSnapTs"] = cached[m["id"]].get("yesSnapTs")
                skipped_cached += 1
                continue
            snap = fetch_yes_snapshot(m["yesTokenId"], target_ts)
            if snap is None:
                m["yesSnap"] = None
                m["yesSnapTs"] = None
            else:
                m["yesSnap"] = snap[0]
                m["yesSnapTs"] = snap[1]
            fetched += 1
            # Throttle a tiny bit to be polite.
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
    print(
        f"Done. {done} markets total, {fetched} fetched this run, {skipped_cached} from cache",
        file=sys.stderr,
    )
    n_with_snap = sum(1 for ev in events for m in ev["markets"] if m.get("yesSnap") is not None)
    print(f"Markets with usable snapshot: {n_with_snap}/{done}", file=sys.stderr)


if __name__ == "__main__":
    main()
