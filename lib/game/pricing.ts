import type { ResourceId, RoundPriceBook, TradeRecord } from "./types";

export function recordTradePrice(priceBook: RoundPriceBook, trade: TradeRecord): RoundPriceBook {
  const trades = [...priceBook.trades, trade];
  const lastTradeByResource = {
    ...priceBook.lastTradeByResource,
    [trade.resourceId]: trade
  };

  const averageUnitPriceNotesByResource = calculateAverageTradePrices(trades, "notes");
  const averageUnitPriceCoinsByResource = calculateAverageTradePrices(trades, "coins");

  return {
    roundNumber: priceBook.roundNumber,
    trades,
    lastTradeByResource,
    averageUnitPriceNotesByResource,
    averageUnitPriceCoinsByResource
  };
}

export function calculateAverageTradePrices(
  trades: TradeRecord[],
  currency: "notes" | "coins"
): Partial<Record<ResourceId, number>> {
  const grouped: Partial<Record<ResourceId, { total: number; quantity: number }>> = {};

  for (const trade of trades) {
    const current = grouped[trade.resourceId] ?? { total: 0, quantity: 0 };
    const price = currency === "notes" ? trade.totalNotes : trade.totalCoins;
    grouped[trade.resourceId] = {
      total: current.total + price,
      quantity: current.quantity + trade.quantity
    };
  }

  const averages: Partial<Record<ResourceId, number>> = {};

  for (const [resourceId, entry] of Object.entries(grouped) as Array<
    [ResourceId, { total: number; quantity: number }]
  >) {
    averages[resourceId] = entry.quantity === 0 ? 0 : Number((entry.total / entry.quantity).toFixed(2));
  }

  return averages;
}

export function syncAnchorPricesFromRoundActivity<
  T extends {
    anchorPriceNotes: number;
    anchorPriceCoins: number;
  }
>(
  resourceState: T,
  priceBook: RoundPriceBook,
  resourceId: ResourceId
): T {
  const notePrice = priceBook.averageUnitPriceNotesByResource[resourceId];
  const coinPrice = priceBook.averageUnitPriceCoinsByResource[resourceId];

  return {
    ...resourceState,
    anchorPriceNotes: notePrice ?? resourceState.anchorPriceNotes,
    anchorPriceCoins: coinPrice ?? resourceState.anchorPriceCoins
  };
}
