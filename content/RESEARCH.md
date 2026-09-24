# Strategy card research

Verified on 2026-09-24. The five entries are original educational summaries;
no strategy code was implemented or backtested. Parameter choices describe the
cited examples, not recommended settings. Testing and risk paragraphs are
editorial analysis of each mechanism. No performance or profitability claims
are made.

## Sources and access

| Card | Evidence inspected | Access boundary |
|---|---|---|
| Trend Following | [QuantConnect Strategy Library](https://www.quantconnect.com/docs/v2/writing-algorithms/strategy-library), Asset Class Trend Following entry | The library's description was read. The dedicated article could not be fetched; no claim of reading its implementation is made. |
| Mean Reversion | [Mean Reversion Effect In Country Equity Indexes](https://www.quantconnect.com/research/15354/mean-reversion-effect-in-country-equity-indexes/) | Public method read: 19 country ETFs, 36-month return ranking, four long and four short, reweight every three years. This is not a daily RSI or moving-average strategy. |
| Pairs Trading | [Pairs Trading With Stocks](https://www.quantconnect.com/research/15300/pairs-trading-with-stocks/) | Public method read. Pair selection uses normalized-price distance; that procedure alone does not establish cointegration. |
| Index Arbitrage | [CME Group: Index Arbitrage and Futures Bases](https://www.cmegroup.com/education/trading-china-exposure) and [Calculating Fair Value](https://www.cmegroup.com/trading/equity-index/fairvalue.html) | Mechanism and fair-value factors read. The [Coursera lesson supplied by Nuth](https://www.coursera.org/learn/introduction-trading-machine-learning-gcp/lecture/YOlcM/index-arbitrage) could not be fetched; its video and transcript were not accessed or summarized. |
| Momentum Rotation | [Asset Class Momentum](https://www.quantconnect.com/research/15338/asset-class-momentum/) | Public method read: rank five ETFs by 12-month momentum, equally weight the strongest three, rebalance monthly. |

The QuantConnect pages are examples presented by the platform and its community;
their inclusion does not independently validate their economic assumptions or
backtests. Source links and relevant access notes travel with each card.

## Quantara lore authority

Local authority: `quantcorner-card-game/docs/Decisions.md`, decision D-WORLD-025,
and `quantcorner-card-game/data/world-cities.json`, dated 2026-09-24.

Nuth confirmed the Kingdom of Quantara and Deltaris as the city of Algorithmic
Trading Masters who build brass golems. The five item names, their origins and
their particular stories in these cards are new creative proposals. They are
not an established inventory, approved powers, game rules, or balance values.
The cards therefore explicitly call their lore items prototypes.

The other city names remain individually unconfirmed and are not used as
established lore here. No world registry or game-canon files were changed.
