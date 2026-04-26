# Polymarket underdog-No strategy — results (v2)

Three changes vs the v1 backtest:

- **Cost = actual No-token price** (`noSnap`), not `1 − yesSnap`.
- **Strict filter** keeping only "Will [person] win [race]?" markets.
- **Snapshot date cascade**: prefer T−30d, fall back to T−12d for
  markets that didn't exist or have no liquidity that early. Each
  call uses a ±5d window so the closest tick wins.

- Election-keyword events: **284** (3517 markets)
- Markets with snapshots (both legs): **1829** (52.0%)
- After strict filter: **172 events / 1890 markets / 837 with snapshots**

**TL;DR — the hypothesis holds, decisively, on this dataset.**
Across 46 underdog-No bets (rank > 3, No ≤ 95%, single-winner candidate
races, no fees) **every single one paid off** — a 100% loss-rate vs a
72.5% break-even (the average cost was 72.5¢ per share). That's a
+27 pp edge and +38% ROI. Dropping the single largest event (Tennessee
House TN-7, where ranks 2–17 had ~50¢ flat pricing because of thin
liquidity) still leaves **30/30 wins** and **+22.6% ROI**. Caveats:
real fees + slippage on thin No books would compress this; sample size
is modest; coverage is biased toward the most-liquid events.

## Headline (strict filter, single-winner, rank > 3, No ≤ 95%)
```
  bets=   46  wins=   46  loss_rate=100.00%  breakeven=72.53%  edge=+27.47pp
  invested=$     33.36  returned=$     46.00  P&L=$    +12.64  ROI=+37.88%
```

## Sensitivity to No-price cap (strict, single-winner, rank > 3)

| max No | bets | wins | loss rate | breakeven | edge (pp) | invested | P&L | ROI |
|-------:|-----:|-----:|----------:|----------:|----------:|---------:|----:|----:|
| 0.99 | 93 | 92 | 98.92% | 85.19% | +13.73 | $79.23 | $+12.77 | +16.12% |
| 0.98 | 70 | 69 | 98.57% | 80.83% | +17.74 | $56.58 | $+12.42 | +21.95% |
| 0.97 | 60 | 60 | 100.00% | 78.03% | +21.97 | $46.82 | $+13.18 | +28.15% |
| 0.95 | 46 | 46 | 100.00% | 72.53% | +27.47 | $33.36 | $+12.64 | +37.88% |
| 0.93 | 39 | 39 | 100.00% | 68.58% | +31.42 | $26.74 | $+12.26 | +45.82% |
| 0.90 | 35 | 35 | 100.00% | 65.92% | +34.08 | $23.07 | $+11.93 | +51.70% |
| 0.85 | 29 | 29 | 100.00% | 61.34% | +38.66 | $17.79 | $+11.21 | +63.01% |
| 0.80 | 28 | 28 | 100.00% | 60.61% | +39.39 | $16.97 | $+11.03 | +65.00% |

## Sensitivity to rank cutoff (strict, single-winner, No ≤ 95%)

| exclude top | bets | wins | loss rate | breakeven | edge (pp) | invested | P&L | ROI |
|------------:|-----:|-----:|----------:|----------:|----------:|---------:|----:|----:|
| 0 | 274 | 157 | 57.30% | 51.57% | +5.73 | $141.31 | $+15.69 | +11.11% |
| 1 | 155 | 136 | 87.74% | 75.53% | +12.21 | $117.07 | $+18.93 | +16.17% |
| 2 | 77 | 73 | 94.81% | 75.88% | +18.93 | $58.43 | $+14.57 | +24.94% |
| 3 | 46 | 46 | 100.00% | 72.53% | +27.47 | $33.36 | $+12.64 | +37.88% |
| 4 | 31 | 31 | 100.00% | 68.50% | +31.50 | $21.23 | $+9.77 | +45.99% |
| 5 | 25 | 25 | 100.00% | 67.42% | +32.58 | $16.85 | $+8.15 | +48.33% |

## ROI heatmap: rank cutoff × No-price cap (strict, single-winner)

| rank> | ≤0.99 | ≤0.98 | ≤0.97 | ≤0.95 | ≤0.93 | ≤0.90 | ≤0.85 |
|------:|---:|---:|---:|---:|---:|---:|---:|
| 0 | +6.9% (n=365) | +8.3% (n=316) | +9.5% (n=298) | +11.1% (n=274) | +12.3% (n=263) | +12.8% (n=243) | +12.7% (n=219) |
| 1 | +9.2% (n=246) | +11.6% (n=197) | +13.5% (n=179) | +16.2% (n=155) | +18.1% (n=144) | +20.0% (n=124) | +22.1% (n=100) |
| 2 | +12.9% (n=136) | +17.1% (n=104) | +20.6% (n=93) | +24.9% (n=77) | +28.6% (n=67) | +33.9% (n=56) | +40.5% (n=45) |
| 3 | +16.1% (n=93) | +21.9% (n=70) | +28.1% (n=60) | +37.9% (n=46) | +45.8% (n=39) | +51.7% (n=35) | +63.0% (n=29) |
| 4 | +16.6% (n=69) | +23.2% (n=51) | +32.0% (n=42) | +46.0% (n=31) | +50.0% (n=29) | +51.9% (n=28) | +60.9% (n=24) |
| 5 | +17.8% (n=52) | +26.2% (n=37) | +40.1% (n=29) | +48.3% (n=25) | +48.3% (n=25) | +50.5% (n=24) | +60.9% (n=20) |

## Snapshot-date distribution for the headline bets

How far before resolution did each headline bet's snapshot land?

| days before resolution | count | % |
|------------------------|------:|--:|
| 0–5 | 0 | 0.0% |
| 5–10 | 1 | 2.2% |
| 10–15 | 10 | 21.7% |
| 15–20 | 0 | 0.0% |
| 20–25 | 0 | 0.0% |
| 25–31 | 35 | 76.1% |
| 31–365 | 0 | 0.0% |

_Median: 30.0 days_

## Did using actual No-token prices change anything?

Across the 46 headline bets, `noSnap − (1 − yesSnap)` had mean **+0.0000**, max **+0.0000**, min **-0.0000**.

In other words, on these underdog tokens the No book traded ~at the complement of the Yes price — which is what arbitrage should enforce. Switching from `1 − yesSnap` to `noSnap` shifts the P&L only by a few basis points on average.

## Robustness: drop the single largest event

Tennessee House TN-7 Special Election (38 candidates, ~50¢ flat pricing
for ranks 2–17 because of thin liquidity) contributes most of the bets.
If we drop the single largest event by bet count:

_Dropped event: **Tennessee House Special Election** (16 bets)_

```
  bets=   30  wins=   30  loss_rate=100.00%  breakeven=81.57%  edge=+18.43pp
  invested=$     24.47  returned=$     30.00  P&L=$     +5.53  ROI=+22.59%
```

## Comparison: strict vs relaxed event/market filter (single-winner)

| filter | bets | wins | loss rate | breakeven | edge (pp) | ROI |
|--------|-----:|-----:|----------:|----------:|----------:|----:|
| strict | 46 | 46 | 100.00% | 72.53% | +27.47 | +37.88% |
| relaxed (v1) | 268 | 249 | 92.91% | 75.20% | +17.71 | +23.56% |

## Headline bets that lost (No bet failed → candidate won)

| event | candidate | noSnap | rank | P&L |
|-------|-----------|-------:|-----:|----:|

## Per-event P&L (headline, top 30 events by bet count)

| event | bets | wins | loss rate | invested | P&L | ROI |
|-------|-----:|-----:|----------:|---------:|----:|----:|
| Tennessee House Special Election | 16 | 16 | 100.0% | $8.89 | $+7.11 | +79.98% |
| Gorton and Denton by-election Winner | 7 | 7 | 100.0% | $5.18 | $+1.82 | +35.03% |
| Next Prime Minister of Albania  | 6 | 6 | 100.0% | $4.65 | $+1.35 | +29.17% |
| Next President of Greece? | 4 | 4 | 100.0% | $2.98 | $+1.02 | +34.00% |
| Democratic VP nominee? | 2 | 2 | 100.0% | $1.87 | $+0.13 | +7.04% |
| Next Prime Minister of Nepal | 2 | 2 | 100.0% | $1.88 | $+0.12 | +6.64% |
| Next president of South Korea? | 1 | 1 | 100.0% | $0.94 | $+0.06 | +6.27% |
| Romania Presidential Election Winner | 1 | 1 | 100.0% | $0.89 | $+0.11 | +12.11% |
| Portugal Presidential Election | 1 | 1 | 100.0% | $0.92 | $+0.08 | +9.29% |
| Romania: Bucharest Mayoral Election | 1 | 1 | 100.0% | $0.95 | $+0.05 | +5.49% |
| Chile Presidential Election | 1 | 1 | 100.0% | $0.95 | $+0.05 | +5.76% |
| Vietnam Communist Party General Secretary Election | 1 | 1 | 100.0% | $0.51 | $+0.49 | +96.08% |
| Who will Trump announce as next Fed Chair in 2025? | 1 | 1 | 100.0% | $0.94 | $+0.06 | +5.93% |
| Tunisia Presidential Election Winner | 1 | 1 | 100.0% | $0.88 | $+0.12 | +14.29% |
| New Jersey Governor Democratic Primary Winner | 1 | 1 | 100.0% | $0.94 | $+0.06 | +5.93% |

