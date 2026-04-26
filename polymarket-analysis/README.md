# Polymarket underdog-No strategy

Hypothesis: in multi-candidate winner-take-all markets, candidates that are
**not in the top 3** but still trade with Yes ≥ 5% (i.e. No ≤ 95%) one month
before resolution lose at a rate noticeably above 95%, so systematically
buying No on them is profitable (ignoring fees and slippage).

## Method

1. Pull every closed multi-candidate event from the Polymarket Gamma API
   whose title looks like an election / nomination (`election`, `nominee`,
   `president`, `mayor`, `governor`, `prime minister`, `chancellor`,
   `primary`, `referendum`, `successor`, …).
2. For each candidate market in the event, query the CLOB
   `prices-history` endpoint for a ±12 h window centred on
   `closeTime − 30 days` and take the closest tick as the snapshot price.
3. Rank candidates inside each event by snapshot Yes price; keep the ones
   ranked **4 or worse** with Yes ≥ 0.05.
4. Simulate buying 1 share of No at price `1 − yesSnap` and holding to
   resolution. Resolution payout is read from `outcomePrices`: 1 if No
   won (candidate lost), 0 if No lost (candidate won).

P&L per bet = `resolution − (1 − yesSnap)`, bankroll is just the sum.

## Layout

```
polymarket-analysis/
  src/
    fetch_events.py     # paginate Gamma → data/events.json
    fetch_prices.py     # data/events.json → data/snapshots.json
    analyze.py          # data/snapshots.json → out/report.md
  data/                 # cached API output (gitignored)
  out/                  # generated report
```

## Run

```bash
cd polymarket-analysis
python3 src/fetch_events.py
python3 src/fetch_prices.py
python3 src/analyze.py
```

No external dependencies — stdlib only.
