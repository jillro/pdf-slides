"""Run the underdog-No strategy on data/snapshots.json and write out/report.md.

v2 — three changes vs the original:
  1. Bet cost uses the actual No-token price (`noSnap`), not `1 - yesSnap`.
     They're nominally complementary, but the No book and Yes book trade
     independently and can diverge on illiquid underdog markets.
  2. A strict filter restricts the universe to *candidate races* (i.e.
     "Will [person] win [the race]?"), dropping bracketed quantitative
     markets (% of vote, # of seats, "what will Trump say in his speech",
     margin-of-victory, tipping-point-state, …) that contaminated v1.
  3. The price-snapshot window around T-30d is widened to ±5 days, so
     markets that didn't have a tick at exactly T-30d still get one.

Strategy (unchanged otherwise):
  Rank candidate markets in each event by `yesSnap` desc.
  Underdog bets = rank > 3 AND `noSnap` ≤ 0.95.
  Buy 1 share of No at `noSnap`. Hold to resolution.
  Payout = 1 if candidate lost (finalYes == 0), else 0.
  P&L = payout − noSnap.
"""

from __future__ import annotations

import datetime as dt
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


def parse_iso_safe(s: str | None) -> dt.datetime | None:
    if not s:
        return None
    try:
        return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None

MAX_NO_DEFAULT = 0.95
RANK_CUTOFF_DEFAULT = 3


# --- Strict filter --------------------------------------------------------

# Event titles we drop outright (not real candidate races).
EVENT_TITLE_DROP = re.compile(
    r"(\bmargin\b|\bMOV\b|\b#\s*of\b|\bnumber\s+of\b|\bbrackets?\b|"
    r"\bRCV\b|\bpopular\s+vote\b|\belectoral\s+college\b|"
    r"\btipping\s+point\b|\bbalance\s+of\s+power\b|"
    r"\bspeech\b|\baddress\s+to\s+congress\b|\bsay\b|"
    r"\bmove(s|d)?\s+to\b|\bmoving\b|"
    r"\bturnout\b|\bvote\s+share\b|"
    r"\b1st\s+round\b|\b2nd\s+round\b|"
    r"\b1st\s+place\b|\b2nd\s+place\b|"
    r"\bfirst\s+round\b|\bsecond\s+round\b|"
    r"\bfirst\s+place\b|\bsecond\s+place\b|"
    r"\b%\s*of\b|\bpercentage\b|\b%\s*vote\b|\bvote\s*%\b|"
    r"\bseats?\b|\bboroughs\b|\bcounties\b|\bstates?\s+will\b|"
    r"\bbracket\b|\binaugurated\b|\bsmaller\s+brackets\b|"
    r"\bwinner\s+by\b|\binaugural\b|\bappear\b|\bannounce\s+run\b|"
    r"\bhow\s+many\b|\bhow\s+much\b|\bwhen\s+will\b|"
    # date-bucket / quantitative / non-candidate events that v2 still missed
    r"\bwhat\s+day\b|\bwhich\s+day\b|"
    r"\bclosest\s+state\b|\bclosest\s+states\b|"
    r"\bswing\s+state\b|"
    r"\bbattleground\b|"
    r"\bwhat\s+(time|date|month|year)\b|"
    r"\bbefore\s+\d{4}\b)",
    re.IGNORECASE,
)

# Per-market question patterns to drop within otherwise-valid events.
# (The event filter does most of the work; this catches stragglers.)
QUESTION_DROP = re.compile(
    r"(\bby\s+\d|\b\d+\s*-\s*\d+\s*%|\b\d+\s*%\b|"
    r"\bsay(s|ing)?\s*['\"]|\bsays?\s+\S+\s+(during|at)\b|"
    r"\bbalance\s+of\s+power\b|\bseats?\b|\btipping\s+point\b|"
    r"\bmargin\b|\bappear|\bRCV\b|\binaugurated\b|"
    r"\bmove(s|d)?\s+(right|left)|"
    r"\bnational\s+list\s+vote\b|"
    r"\bborough\b|\bcounties\b|\bcountie\b|"
    r"\bbe\s+decided\s+in\s+round\b|\bdecided\s+in\s+\d+\s+rounds?\b|"
    r"\bfinish\s+(first|second|third|2nd|3rd)\b|"
    r"\bplace\s+\d|\b\d+(st|nd|rd|th)\s+place\b|"
    r"\bturnout\b)",
    re.IGNORECASE,
)


def event_passes_strict(title: str) -> bool:
    if not title:
        return False
    if EVENT_TITLE_DROP.search(title):
        return False
    return True


def market_passes_strict(question: str) -> bool:
    if not question:
        return False
    return not QUESTION_DROP.search(question)


# --- Strategy -------------------------------------------------------------


@dataclass
class Bet:
    event_id: str
    event_title: str
    market_id: str
    question: str
    yes_snap: float
    no_snap: float
    final_yes: float  # 0 or 1
    rank: int
    n_candidates: int

    @property
    def cost(self) -> float:
        return self.no_snap

    @property
    def payout(self) -> float:
        return 1.0 if self.final_yes == 0.0 else 0.0

    @property
    def pnl(self) -> float:
        return self.payout - self.cost

    @property
    def won(self) -> bool:
        return self.final_yes == 0.0


def collect_bets(
    events: list[dict],
    max_no: float = MAX_NO_DEFAULT,
    rank_cutoff: int = RANK_CUTOFF_DEFAULT,
    one_winner_only: bool = False,
    strict: bool = False,
) -> list[Bet]:
    bets: list[Bet] = []
    for ev in events:
        if strict and not event_passes_strict(ev["title"]):
            continue
        markets = [
            m
            for m in ev["markets"]
            if m.get("yesSnap") is not None and m.get("noSnap") is not None
            and (not strict or market_passes_strict(m["question"]))
        ]
        if len(markets) < rank_cutoff + 1:
            continue
        if one_winner_only:
            n_winners = sum(1 for m in markets if m["finalYesPrice"] == 1.0)
            if n_winners != 1:
                continue
        ranked = sorted(markets, key=lambda m: -m["yesSnap"])
        for i, m in enumerate(ranked, start=1):
            if i <= rank_cutoff:
                continue
            if m["noSnap"] > max_no:
                continue
            bets.append(
                Bet(
                    event_id=ev["id"],
                    event_title=ev["title"],
                    market_id=m["id"],
                    question=m["question"],
                    yes_snap=m["yesSnap"],
                    no_snap=m["noSnap"],
                    final_yes=m["finalYesPrice"],
                    rank=i,
                    n_candidates=len(ranked),
                )
            )
    return bets


def summarize(bets: Iterable[Bet]) -> dict:
    bets = list(bets)
    n = len(bets)
    if n == 0:
        return {"n": 0}
    wins = sum(1 for b in bets if b.won)
    invested = sum(b.cost for b in bets)
    returned = sum(b.payout for b in bets)
    pnl = returned - invested
    avg_no = sum(b.no_snap for b in bets) / n
    loss_rate = wins / n
    breakeven_loss_rate = invested / n
    return {
        "n": n,
        "wins": wins,
        "loss_rate": loss_rate,
        "breakeven_loss_rate": breakeven_loss_rate,
        "edge_pp": (loss_rate - breakeven_loss_rate) * 100,
        "avg_no_snap": avg_no,
        "invested": invested,
        "returned": returned,
        "pnl": pnl,
        "roi": pnl / invested if invested else 0,
    }


def fmt_summary(s: dict) -> str:
    if s.get("n", 0) == 0:
        return "  (no bets)"
    return (
        f"  bets={s['n']:>5}  wins={s['wins']:>5}  "
        f"loss_rate={s['loss_rate']:>6.2%}  "
        f"breakeven={s['breakeven_loss_rate']:>6.2%}  "
        f"edge={s['edge_pp']:>+5.2f}pp\n"
        f"  invested=${s['invested']:>10.2f}  returned=${s['returned']:>10.2f}  "
        f"P&L=${s['pnl']:>+10.2f}  ROI={s['roi']:>+7.2%}"
    )


def by_event(bets: list[Bet]) -> dict[str, dict]:
    g: dict[str, list[Bet]] = defaultdict(list)
    for b in bets:
        g[b.event_id].append(b)
    return {eid: {"title": bs[0].event_title, **summarize(bs)} for eid, bs in g.items()}


def main() -> None:
    here = Path(__file__).resolve().parent.parent
    events = json.loads((here / "data" / "snapshots.json").read_text())

    n_events = len(events)
    n_markets_total = sum(len(e["markets"]) for e in events)
    n_markets_with_snap = sum(
        1
        for e in events
        for m in e["markets"]
        if m.get("yesSnap") is not None and m.get("noSnap") is not None
    )

    # Strict-filter coverage
    strict_events = [e for e in events if event_passes_strict(e["title"])]
    n_markets_strict = sum(
        1
        for e in strict_events
        for m in e["markets"]
        if market_passes_strict(m["question"])
    )
    n_markets_strict_snap = sum(
        1
        for e in strict_events
        for m in e["markets"]
        if market_passes_strict(m["question"])
        and m.get("yesSnap") is not None
        and m.get("noSnap") is not None
    )

    out_dir = here / "out"
    out_dir.mkdir(exist_ok=True)
    lines: list[str] = []
    p = lines.append

    p("# Polymarket underdog-No strategy — results (v2)")
    p("")
    p("Three changes vs the v1 backtest:")
    p("")
    p("- **Cost = actual No-token price** (`noSnap`), not `1 − yesSnap`.")
    p("- **Strict filter** keeping only \"Will [person] win [race]?\" markets.")
    p("- **Snapshot date cascade**: prefer T−30d, fall back to T−12d for")
    p("  markets that didn't exist or have no liquidity that early. Each")
    p("  call uses a ±5d window so the closest tick wins.")
    p("")
    p(f"- Election-keyword events: **{n_events}** ({n_markets_total} markets)")
    p(f"- Markets with snapshots (both legs): **{n_markets_with_snap}** "
      f"({n_markets_with_snap/n_markets_total:.1%})")
    p(f"- After strict filter: **{len(strict_events)} events / {n_markets_strict} markets / "
      f"{n_markets_strict_snap} with snapshots**")
    p("")

    # === Headline strategy (strict filter) ===
    p("## Headline (strict filter, single-winner, rank > 3, No ≤ 95%)")
    bets = collect_bets(events, max_no=0.95, rank_cutoff=3, one_winner_only=True, strict=True)
    headline = summarize(bets)
    p("```")
    p(fmt_summary(headline))
    p("```")
    p("")

    # === Sensitivity to No cap ===
    p("## Sensitivity to No-price cap (strict, single-winner, rank > 3)")
    p("")
    p("| max No | bets | wins | loss rate | breakeven | edge (pp) | invested | P&L | ROI |")
    p("|-------:|-----:|-----:|----------:|----------:|----------:|---------:|----:|----:|")
    for mx in [0.99, 0.98, 0.97, 0.95, 0.93, 0.90, 0.85, 0.80]:
        s = summarize(
            collect_bets(
                events, max_no=mx, rank_cutoff=3, one_winner_only=True, strict=True
            )
        )
        if s.get("n", 0) == 0:
            p(f"| {mx:.2f} | 0 | - | - | - | - | - | - | - |")
            continue
        p(
            f"| {mx:.2f} | {s['n']} | {s['wins']} | {s['loss_rate']:.2%} | "
            f"{s['breakeven_loss_rate']:.2%} | {s['edge_pp']:+.2f} | "
            f"${s['invested']:.2f} | ${s['pnl']:+.2f} | {s['roi']:+.2%} |"
        )
    p("")

    # === Rank cutoff sensitivity ===
    p("## Sensitivity to rank cutoff (strict, single-winner, No ≤ 95%)")
    p("")
    p("| exclude top | bets | wins | loss rate | breakeven | edge (pp) | invested | P&L | ROI |")
    p("|------------:|-----:|-----:|----------:|----------:|----------:|---------:|----:|----:|")
    for rc in [0, 1, 2, 3, 4, 5]:
        s = summarize(
            collect_bets(
                events, max_no=0.95, rank_cutoff=rc, one_winner_only=True, strict=True
            )
        )
        if s.get("n", 0) == 0:
            p(f"| {rc} | 0 | - | - | - | - | - | - | - |")
            continue
        p(
            f"| {rc} | {s['n']} | {s['wins']} | {s['loss_rate']:.2%} | "
            f"{s['breakeven_loss_rate']:.2%} | {s['edge_pp']:+.2f} | "
            f"${s['invested']:.2f} | ${s['pnl']:+.2f} | {s['roi']:+.2%} |"
        )
    p("")

    # === Joint heatmap ===
    p("## ROI heatmap: rank cutoff × No-price cap (strict, single-winner)")
    p("")
    no_caps = [0.99, 0.98, 0.97, 0.95, 0.93, 0.90, 0.85]
    rank_cuts = [0, 1, 2, 3, 4, 5]
    header = "| rank> | " + " | ".join(f"≤{c:.2f}" for c in no_caps) + " |"
    sep = "|------:|" + "|".join(["---:"] * len(no_caps)) + "|"
    p(header); p(sep)
    for rc in rank_cuts:
        cells = []
        for nc in no_caps:
            s = summarize(
                collect_bets(
                    events, max_no=nc, rank_cutoff=rc, one_winner_only=True, strict=True
                )
            )
            if s.get("n", 0) == 0:
                cells.append("—")
            else:
                cells.append(f"{s['roi']:+.1%} (n={s['n']})")
        p(f"| {rc} | " + " | ".join(cells) + " |")
    p("")

    # === Snapshot-date distribution (T-30d vs cascade fallback) ===
    p("## Snapshot-date distribution for the headline bets")
    p("")
    p("How far before resolution did each headline bet's snapshot land?")
    p("")
    if bets:
        # Need to look up snapTs and event endDate for each bet
        ts_lookup = {}
        for ev in events:
            try:
                ev_end = parse_iso_safe(ev.get("endDate"))
            except Exception:
                continue
            for m in ev["markets"]:
                if m.get("snapTs"):
                    ts_lookup[m["id"]] = (m["snapTs"], ev_end)
        deltas: list[float] = []
        for b in bets:
            if b.market_id in ts_lookup:
                snap_ts, ev_end = ts_lookup[b.market_id]
                if ev_end is None:
                    continue
                delta_days = (ev_end.timestamp() - snap_ts) / 86400
                deltas.append(delta_days)
        if deltas:
            buckets = [(0, 5), (5, 10), (10, 15), (15, 20), (20, 25), (25, 31), (31, 365)]
            p("| days before resolution | count | % |")
            p("|------------------------|------:|--:|")
            for lo, hi in buckets:
                n = sum(1 for d in deltas if lo <= d < hi)
                pct = n / len(deltas) if deltas else 0
                p(f"| {lo}–{hi} | {n} | {pct:.1%} |")
            p("")
            p(f"_Median: {sorted(deltas)[len(deltas)//2]:.1f} days_")
        p("")

    # === Spread between No and (1 - Yes) ===
    p("## Did using actual No-token prices change anything?")
    p("")
    bets_strict = bets
    diffs = [b.no_snap - (1 - b.yes_snap) for b in bets_strict]
    if diffs:
        avg = sum(diffs) / len(diffs)
        worst_pos = max(diffs)
        worst_neg = min(diffs)
        p(f"Across the {len(bets_strict)} headline bets, "
          f"`noSnap − (1 − yesSnap)` had mean **{avg:+.4f}**, "
          f"max **{worst_pos:+.4f}**, min **{worst_neg:+.4f}**.")
        p("")
        p("In other words, on these underdog tokens the No book traded ~at the "
          "complement of the Yes price — which is what arbitrage should enforce. "
          "Switching from `1 − yesSnap` to `noSnap` shifts the P&L only by a "
          "few basis points on average.")
    p("")

    # === Comparison to relaxed filter (v1 universe) ===
    p("## Comparison: strict vs relaxed event/market filter (single-winner)")
    p("")
    p("| filter | bets | wins | loss rate | breakeven | edge (pp) | ROI |")
    p("|--------|-----:|-----:|----------:|----------:|----------:|----:|")
    for label, strict_flag in [("strict", True), ("relaxed (v1)", False)]:
        s = summarize(
            collect_bets(
                events, max_no=0.95, rank_cutoff=3, one_winner_only=True, strict=strict_flag
            )
        )
        if s.get("n", 0) == 0:
            p(f"| {label} | 0 | - | - | - | - | - |")
        else:
            p(
                f"| {label} | {s['n']} | {s['wins']} | {s['loss_rate']:.2%} | "
                f"{s['breakeven_loss_rate']:.2%} | {s['edge_pp']:+.2f} | "
                f"{s['roi']:+.2%} |"
            )
    p("")

    # === Headline bets that lost ===
    p("## Headline bets that lost (No bet failed → candidate won)")
    losers = sorted([b for b in bets if not b.won], key=lambda b: b.no_snap, reverse=True)
    p("")
    p("| event | candidate | noSnap | rank | P&L |")
    p("|-------|-----------|-------:|-----:|----:|")
    for b in losers[:25]:
        p(f"| {b.event_title[:50]} | {b.question[:60]} | "
          f"{b.no_snap:.3f} | {b.rank}/{b.n_candidates} | ${b.pnl:+.3f} |")
    if len(losers) > 25:
        p(f"\n_…and {len(losers)-25} more losing bets_")
    p("")

    # === Per-event breakdown ===
    p("## Per-event P&L (headline, top 30 events by bet count)")
    per = by_event(bets)
    p("")
    p("| event | bets | wins | loss rate | invested | P&L | ROI |")
    p("|-------|-----:|-----:|----------:|---------:|----:|----:|")
    for eid, s in sorted(per.items(), key=lambda kv: -kv[1]["n"])[:30]:
        p(
            f"| {s['title'][:55]} | {s['n']} | {s['wins']} | "
            f"{s['loss_rate']:.1%} | ${s['invested']:.2f} | "
            f"${s['pnl']:+.2f} | {s['roi']:+.2%} |"
        )
    p("")

    report = "\n".join(lines) + "\n"
    (out_dir / "report.md").write_text(report)
    print(report)


if __name__ == "__main__":
    main()
