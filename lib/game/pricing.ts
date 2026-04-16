import type { GameState, ResourceId, TradeRecord } from "./types";

export function maybeDiscoverNotesPrice(state: GameState, trade: TradeRecord): Partial<Record<ResourceId, number>> {
  if (trade.totalBits !== 0 || trade.totalNotes <= 0 || trade.quantity <= 0) {
    return state.round.discoveredNotesPrices;
  }

  return {
    ...state.round.discoveredNotesPrices,
    [trade.resourceId]: Math.ceil(trade.totalNotes / trade.quantity)
  };
}

export function discoveredOrAnchorPrice(state: GameState, resourceId: ResourceId): number {
  return state.round.discoveredNotesPrices[resourceId] ?? state.anchorNotesPrices[resourceId];
}
