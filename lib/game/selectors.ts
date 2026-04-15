import { RESOURCE_IDS } from "./constants";
import type { GameState, PlayerId, ResourceId, TurnStep } from "./types";

export function selectCurrentPlayer(state: GameState) {
  return state.round.activePlayerId ? state.players[state.round.activePlayerId] : null;
}

export function selectCurrentTurnStep(state: GameState): TurnStep | null {
  return state.round.activeTurnWindow?.step ?? null;
}

export function selectTurnOrder(state: GameState): PlayerId[] {
  return state.round.turnOrder;
}

export function selectRoundTradeHistory(state: GameState) {
  return state.priceBook.trades;
}

export function selectAveragePricesByResource(state: GameState) {
  return {
    notes: state.priceBook.averageUnitPriceNotesByResource,
    coins: state.priceBook.averageUnitPriceCoinsByResource
  };
}

export function selectOutstandingLoans(state: GameState) {
  return Object.values(state.players).flatMap((player) => player.loans.filter((loan) => loan.status === "active"));
}

export function selectOutstandingDeposits(state: GameState) {
  return Object.values(state.players).flatMap((player) =>
    player.deposits.filter((deposit) => deposit.status === "active")
  );
}

export function selectLifeCostIndex(state: GameState) {
  const weightedTotal = RESOURCE_IDS.reduce((sum, resourceId) => {
    const resourceDef = state.config.resourceDefinitions[resourceId];
    const resourceState = state.resources[resourceId];
    const compositePrice = resourceState.anchorPriceNotes + resourceState.anchorPriceCoins;
    return sum + compositePrice * resourceDef.lifeCostWeight;
  }, 0);

  return Number(weightedTotal.toFixed(2));
}

export function selectResourceLabel(state: GameState, resourceId: ResourceId) {
  return state.config.resourceDefinitions[resourceId].name;
}
