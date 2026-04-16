import type { GameState, ResourceId, TradeRecord } from "./types";

export function maybeDiscoverNotesPrice(state: GameState, trade: TradeRecord): Partial<Record<ResourceId, number>> {
  if (trade.totalBits !== 0 || trade.quantity <= 0) {
    return state.round.discoveredNotesPrices;
  }

  if (trade.totalNotes > 0 && trade.barterQuantity <= 0) {
    return {
      ...state.round.discoveredNotesPrices,
      [trade.resourceId]: Math.ceil(trade.totalNotes / trade.quantity)
    };
  }

  if (trade.barterResourceId && trade.barterQuantity > 0) {
    const barterReferencePrice =
      state.round.discoveredNotesPrices[trade.barterResourceId] ?? state.anchorNotesPrices[trade.barterResourceId];
    const impliedNotesValue = trade.totalNotes + barterReferencePrice * trade.barterQuantity;

    if (impliedNotesValue > 0) {
      return {
        ...state.round.discoveredNotesPrices,
        [trade.resourceId]: Math.ceil(impliedNotesValue / trade.quantity)
      };
    }
  }

  if (trade.totalNotes <= 0) {
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
