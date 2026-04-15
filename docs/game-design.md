# Debank Manual MVP

This prototype is intentionally manual-first. The pure TypeScript engine tracks a two-player round with policy setup, rotating chair priority, turn-by-turn production, lending or borrowing, upgrade purchases, trade settlement, and round-end bookkeeping.

Key balancing levers live in data:

- resource anchor prices in Notes and Coins
- resource life-cost weights
- upgrade costs and effects
- demand card payloads
- loan and deposit rates
- trade history and average price calculations

The UI is only a debugging and playtesting shell. React dispatches engine actions, while `lib/game` owns state transitions and validation.
