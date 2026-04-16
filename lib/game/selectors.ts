import { RESOURCE_IDS } from "./constants";
import type { GameState, PlayerId, RateOption, ResourceId } from "./types";

export function selectRoleSpecialty(state: GameState, playerId: PlayerId): ResourceId {
  return state.config.roles[state.players[playerId].role].specialty;
}

export function selectLifeCostIndex(state: GameState): number {
  return Math.ceil((state.anchorNotesPrices.grain + state.anchorNotesPrices.fuel) / 2);
}

export function selectLoanInterestDue(rate: RateOption): number {
  if (rate === 10) {
    return 1;
  }

  if (rate === 20) {
    return 2;
  }

  return 0;
}

export function selectDiscoveredOrAnchorPrice(state: GameState, resourceId: ResourceId): number {
  return state.round.discoveredNotesPrices[resourceId] ?? state.anchorNotesPrices[resourceId];
}

export function selectCurrentBankBuyer(state: GameState): PlayerId | null {
  return state.round.turnOrder[state.round.bankBuyOrderIndex] ?? null;
}

export function selectMaturedDeposits(state: GameState, playerId: PlayerId) {
  return state.players[playerId].deposits.filter((deposit) => deposit.maturesRound <= state.round.roundNumber);
}

export function selectNotesCreatedBreakdown(state: GameState) {
  const loanNotes = state.tradeLog.length;
  return {
    total: state.round.notesCreatedThisRound,
    loansIssued: state.turnLog.filter((entry) => entry.message.includes("borrowed 10 Notes")).length,
    bankPurchases: state.turnLog.filter((entry) => entry.message.includes("Bank bought")).length,
    debugTradeCount: loanNotes
  };
}

export function selectUpkeepPreview(state: GameState, playerId: PlayerId) {
  const player = state.players[playerId];
  const lifeCostIndex = selectLifeCostIndex(state);
  const grainFuelUnits = player.goods.grain + player.goods.fuel;

  return {
    lifeUnitsRequired: 2,
    grainFuelUnits,
    notesEquivalent: lifeCostIndex,
    status: grainFuelUnits >= 2 || player.notes >= lifeCostIndex * 2 ? "coverable" : "tight"
  };
}

export function selectVisibleNotesPrices(state: GameState) {
  return Object.fromEntries(
    RESOURCE_IDS.map((resourceId) => [
      resourceId,
      {
        anchor: state.anchorNotesPrices[resourceId],
        discovered: state.round.discoveredNotesPrices[resourceId] ?? null
      }
    ])
  ) as Record<ResourceId, { anchor: number; discovered: number | null }>;
}
