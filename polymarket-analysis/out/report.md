# Polymarket underdog-No strategy — results

- Events analyzed: **284**
- Candidate markets: **3517**
- Markets with usable T-30d snapshot: **1275** (36.3%)

**TL;DR.** The hypothesis holds. In single-winner events with at least
4 candidate markets, buying No on every non-top-3 candidate trading at
Yes ≥ 5% one month before resolution returns about **+7% ROI** with a
loss-rate edge of about **+6 pp** over the no-arbitrage break-even.
The edge widens monotonically as the Yes-price floor rises (e.g. ≥10% →
+23% ROI, ≥15% → +60% ROI on small samples), consistent with the market
systematically over-pricing low-probability outcomes.

**Caveats.** No fees, no slippage, no liquidity check; underdog markets
are typically thin and the bid-ask on No can be 1-3¢, which would
compress most of the edge at the higher Yes floors. The keyword filter
also captures bracketed quantitative markets (% of vote, # of seats,
"what will Trump say in his speech" bingo) that aren't really
candidate races — those drive most of the losing bets in the table
further down.

## Headline: rank > 3, Yes ≥ 5%, all events
```
  bets=   99  wins=   80  loss_rate=80.81%  breakeven=80.55%  edge=+0.26pp
  invested=$     79.74  returned=$     80.00  P&L=$     +0.26  ROI= +0.32%
```

## Single-winner events only (typical winner-take-all elections)
```
  bets=   83  wins=   74  loss_rate=89.16%  breakeven=83.25%  edge=+5.91pp
  invested=$     69.09  returned=$     74.00  P&L=$     +4.91  ROI= +7.10%
```

## Sensitivity to Yes-price floor (rank > 3, single-winner)

| min Yes | bets | wins | loss rate | breakeven | edge (pp) | invested | P&L | ROI |
|--------:|-----:|-----:|----------:|----------:|----------:|---------:|----:|----:|
| 0.01 | 175 | 164 | 93.71% | 90.66% | +3.06 | $158.65 | $+5.35 | +3.37% |
| 0.02 | 140 | 129 | 92.14% | 88.69% | +3.46 | $124.16 | $+4.84 | +3.90% |
| 0.03 | 120 | 110 | 91.67% | 87.21% | +4.46 | $104.65 | $+5.35 | +5.11% |
| 0.05 | 83 | 74 | 89.16% | 83.25% | +5.91 | $69.09 | $+4.91 | +7.10% |
| 0.07 | 63 | 56 | 88.89% | 79.78% | +9.10 | $50.26 | $+5.74 | +11.41% |
| 0.10 | 40 | 36 | 90.00% | 72.99% | +17.01 | $29.20 | $+6.80 | +23.31% |
| 0.15 | 24 | 24 | 100.00% | 62.64% | +37.36 | $15.03 | $+8.97 | +59.65% |
| 0.20 | 20 | 20 | 100.00% | 58.50% | +41.50 | $11.70 | $+8.30 | +70.94% |

## Sensitivity to rank cutoff (Yes ≥ 5%, single-winner)

| exclude top | bets | wins | loss rate | breakeven | edge (pp) | invested | P&L | ROI |
|------------:|-----:|-----:|----------:|----------:|----------:|---------:|----:|----:|
| 0 | 405 | 251 | 61.98% | 59.19% | +2.78 | $239.74 | $+11.26 | +4.70% |
| 1 | 246 | 216 | 87.80% | 81.28% | +6.53 | $199.94 | $+16.06 | +8.03% |
| 2 | 135 | 121 | 89.63% | 83.98% | +5.65 | $113.37 | $+7.63 | +6.73% |
| 3 | 83 | 74 | 89.16% | 83.25% | +5.91 | $69.09 | $+4.91 | +7.10% |
| 4 | 58 | 51 | 87.93% | 82.13% | +5.80 | $47.64 | $+3.36 | +7.06% |
| 5 | 41 | 38 | 92.68% | 79.92% | +12.76 | $32.77 | $+5.23 | +15.97% |

## ROI heatmap: rank cutoff × Yes-price floor (one-winner events)

| rank> | ≥0.01 | ≥0.02 | ≥0.03 | ≥0.05 | ≥0.07 | ≥0.10 | ≥0.15 |
|------:|---:|---:|---:|---:|---:|---:|---:|
| 0 | +3.1% (n=550) | +3.5% (n=485) | +3.9% (n=455) | +4.7% (n=405) | +6.4% (n=374) | +7.5% (n=328) | +10.2% (n=280) |
| 1 | +4.9% (n=391) | +5.7% (n=326) | +6.5% (n=296) | +8.0% (n=246) | +10.7% (n=215) | +13.5% (n=169) | +20.5% (n=121) |
| 2 | +3.8% (n=244) | +4.5% (n=197) | +5.4% (n=175) | +6.7% (n=135) | +9.2% (n=108) | +14.5% (n=74) | +30.5% (n=47) |
| 3 | +3.4% (n=175) | +3.9% (n=140) | +5.1% (n=120) | +7.1% (n=83) | +11.4% (n=63) | +23.3% (n=40) | +59.7% (n=24) |
| 4 | +3.6% (n=130) | +4.3% (n=102) | +6.0% (n=86) | +7.1% (n=58) | +10.5% (n=42) | +29.4% (n=25) | +72.0% (n=17) |
| 5 | +6.5% (n=97) | +8.1% (n=76) | +11.3% (n=63) | +16.0% (n=41) | +27.5% (n=27) | +53.0% (n=17) | +72.9% (n=15) |

## Headline bets that lost (No bet failed, candidate won)

| event | candidate | yesSnap | rank | P&L |
|-------|-----------|--------:|-----:|----:|
| NYC Mayoral Dem Primary: # of RCV rounds | Will the NYC Mayoral Democratic Primary be decided in round  | 0.065 | 6/12 | $-0.935 |
| 2nd Place in Bucharest Mayoral Election | Will Anca Alexandrescu finish second in the 2025 Bucharest m | 0.065 | 4/23 | $-0.935 |
| Virginia Governor Election Abigail Spanberger  mar | Will Abigail Spanberger win by 15-18%? | 0.070 | 5/6 | $-0.930 |
| # of Republican Senate seats after Election? | Will Republicans have 53 seats in Senate after election? | 0.075 | 5/8 | $-0.925 |
| # of seats Liberals win in Canadian Election? | Will the Liberals win between 160-169 seats in the next Cana | 0.089 | 6/10 | $-0.910 |
| Who will qualify for the second round of the Portu | Will António José Seguro qualify for the second round of the | 0.090 | 5/20 | $-0.910 |
|  New Jersey Governor Election Mikie Sherrill margi | Will Mikie Sherrill win by 12-15%? | 0.105 | 5/6 | $-0.895 |
| # seats Conservatives win in Canadian Election? | Will the Conservatives win between 140-149 seats in the next | 0.108 | 4/10 | $-0.892 |
| Indian Election: How many seats will the NDA win? | Will the NDA win less than 300 seats? | 0.114 | 6/6 | $-0.886 |
| # of Republican House seats after Election? (brack | Will Republicans have between 220 and 224 seats in House aft | 0.125 | 5/8 | $-0.875 |
| Which states will move to the right in Presidentia | Will Alaska move right in the 2024 U.S. Presidential Electio | 0.300 | 5/5 | $-0.700 |
| What will Trump say during address to Congress? | Will Trump say 'trans' during the 2025 State of the Union? | 0.305 | 10/13 | $-0.695 |
| What will Trump say during address to Congress? | Will Trump say 'China' 5+ times during the 2025 State of the | 0.315 | 9/13 | $-0.685 |
| What will Trump say during address to Congress? | Will Trump say 'Mexico' 5+ times during the 2025 State of th | 0.385 | 7/13 | $-0.615 |
| What will Trump say during address to Congress? | Will Trump say 'Elon' or 'Musk' during the 2025 State of the | 0.425 | 6/13 | $-0.575 |
| Which states will move to the right in Presidentia | Will Texas move right in the 2024 U.S. Presidential Election | 0.580 | 4/5 | $-0.420 |
| What will Trump say during address to Congress? | Will Trump say 'DOGE' or 'Department of Government Efficienc | 0.615 | 5/13 | $-0.385 |
| What will Trump say during address to Congress? | Will Trump say 'DEI' or 'diversity, equity, and inclusion' d | 0.665 | 4/13 | $-0.335 |
| Which boroughs will Mamdani win in NYC Mayoral Ele | Will Zohran Mamdani win The Bronx in the 2025 New York City  | 0.720 | 4/5 | $-0.280 |

## Per-event P&L (headline strategy, top 30 events by bet count)

| event | bets | wins | loss rate | invested | P&L | ROI |
|-------|-----:|-----:|----------:|---------:|----:|----:|
| Tennessee House Special Election | 16 | 16 | 100.0% | $8.89 | $+7.11 | +79.98% |
| What will Trump say during address to Congress? | 10 | 4 | 40.0% | $6.52 | $-2.52 | -38.65% |
| Electoral College Margin of Victory? | 6 | 6 | 100.0% | $5.60 | $+0.40 | +7.09% |
| # of seats Liberals win in Canadian Election? | 6 | 5 | 83.3% | $5.43 | $-0.43 | -7.94% |
| Bolivia Presidential Election Margin of Victory | 5 | 5 | 100.0% | $4.55 | $+0.45 | +9.96% |
| NYC Mayoral Dem Primary: # of RCV rounds | 5 | 4 | 80.0% | $4.59 | $-0.59 | -12.85% |
| # of Republican House seats after Election? (brackets) | 5 | 4 | 80.0% | $4.48 | $-0.48 | -10.71% |
| Hungary Election: Popular Vote Margin of Victory | 4 | 4 | 100.0% | $3.71 | $+0.29 | +7.83% |
| Next President of Greece? | 4 | 4 | 100.0% | $2.99 | $+1.01 | +34.00% |
| # seats Conservatives win in Canadian Election? | 4 | 3 | 75.0% | $3.66 | $-0.66 | -17.99% |
| Tipping Point State in 2024 Election? | 3 | 3 | 100.0% | $2.74 | $+0.26 | +9.35% |
| # of Republican Senate seats after Election? | 3 | 2 | 66.7% | $2.76 | $-0.76 | -27.59% |
|  New Jersey Governor Election Mikie Sherrill margin of  | 3 | 2 | 66.7% | $2.64 | $-0.64 | -24.24% |
| Indian Election: How many seats will the NDA win? | 3 | 2 | 66.7% | $2.63 | $-0.63 | -23.98% |
| Democratic VP nominee? | 2 | 2 | 100.0% | $1.87 | $+0.13 | +7.04% |
| Who will qualify for the second round of the Portugal P | 2 | 1 | 50.0% | $1.81 | $-0.81 | -44.90% |
| Virginia Governor Election Abigail Spanberger  margin o | 2 | 1 | 50.0% | $1.76 | $-0.76 | -43.17% |
| Democratic candidates announce run for president before | 2 | 2 | 100.0% | $1.60 | $+0.40 | +24.61% |
| Portugal Presidential Election: 1st Round 2nd Place | 2 | 2 | 100.0% | $1.87 | $+0.13 | +6.87% |
| Which boroughs will Mamdani win in NYC Mayoral Election | 2 | 1 | 50.0% | $1.20 | $-0.20 | -16.32% |
| Which states will move to the right in Presidential Ele | 2 | 0 | 0.0% | $1.12 | $-1.12 | -100.00% |
| Romania Presidential Election Winner | 1 | 1 | 100.0% | $0.89 | $+0.11 | +12.11% |
| Portugal Presidential Election | 1 | 1 | 100.0% | $0.92 | $+0.08 | +9.29% |
| Romania: Bucharest Mayoral Election | 1 | 1 | 100.0% | $0.95 | $+0.05 | +5.49% |
| Balance of Power: 2024 Election | 1 | 1 | 100.0% | $0.82 | $+0.18 | +21.21% |
| Who will Trump announce as next Fed Chair in 2025? | 1 | 1 | 100.0% | $0.94 | $+0.06 | +5.93% |
| NYC Mayoral Dem Primary Mamdani MOV | 1 | 1 | 100.0% | $0.92 | $+0.08 | +9.11% |
| 2nd Place in Bucharest Mayoral Election | 1 | 0 | 0.0% | $0.94 | $-0.94 | -100.00% |
| New Jersey Governor Democratic Primary Winner | 1 | 1 | 100.0% | $0.94 | $+0.06 | +5.93% |

