import type { Action, ActionResult, GameState, PlayerId } from "./types";

function validateActivePlayer(state: GameState, playerId: PlayerId): ActionResult {
  if (state.round.phase !== "playerTurns") {
    return { ok: false, reason: "Player actions only happen during player turns." };
  }

  if (state.round.activePlayerId !== playerId) {
    return { ok: false, reason: "Only the active player can act right now." };
  }

  return { ok: true };
}

export function canApplyAction(state: GameState, action: Action): ActionResult {
  switch (action.type) {
    case "startRound":
      return { ok: state.round.phase === "policy" };
    case "rotateChair":
      return { ok: state.round.phase === "roundEnd" || state.round.phase === "policy" };
    case "setPolicyRate":
    case "drawDemandCard":
    case "startPlayerTurns":
      return {
        ok: state.round.phase === "policy",
        reason: "Policy actions only happen during the policy phase."
      };
    case "produceResource":
      if (action.quantity <= 0) {
        return { ok: false, reason: "Production quantity must be positive." };
      }
      if (state.round.activeTurnWindow?.step !== "produce") {
        return { ok: false, reason: "Production is only legal during the produce step." };
      }
      if (action.quantity > state.players[action.playerId].productionCapacity[action.resourceId]) {
        return { ok: false, reason: "Production cannot exceed the player's current capacity." };
      }
      return validateActivePlayer(state, action.playerId);
    case "takeLoan":
      if (action.amount <= 0) {
        return { ok: false, reason: "Loan amount must be positive." };
      }
      if (state.round.activeTurnWindow?.step !== "finance") {
        return { ok: false, reason: "Finance actions are only legal during the finance step." };
      }
      return validateActivePlayer(state, action.playerId);
    case "repayLoan":
      if (action.amount <= 0) {
        return { ok: false, reason: "Repayment amount must be positive." };
      }
      if (state.players[action.playerId].notes < action.amount) {
        return { ok: false, reason: "Player does not have enough Notes to repay that amount." };
      }
      if (!state.players[action.playerId].loans.some((loan) => loan.id === action.loanId && loan.status === "active")) {
        return { ok: false, reason: "That loan is not active." };
      }
      if (state.round.activeTurnWindow?.step !== "finance") {
        return { ok: false, reason: "Finance actions are only legal during the finance step." };
      }
      return validateActivePlayer(state, action.playerId);
    case "createDeposit":
      if (action.amount <= 0) {
        return { ok: false, reason: "Deposit amount must be positive." };
      }
      if (state.players[action.playerId].notes < action.amount) {
        return { ok: false, reason: "Player does not have enough Notes to make that deposit." };
      }
      if (state.round.activeTurnWindow?.step !== "finance") {
        return { ok: false, reason: "Finance actions are only legal during the finance step." };
      }
      return validateActivePlayer(state, action.playerId);
    case "withdrawDeposit":
      if (
        !state.players[action.playerId].deposits.some(
          (deposit) => deposit.id === action.depositId && deposit.status === "active"
        )
      ) {
        return { ok: false, reason: "That deposit is not active." };
      }
      if (state.round.activeTurnWindow?.step !== "finance") {
        return { ok: false, reason: "Finance actions are only legal during the finance step." };
      }
      return validateActivePlayer(state, action.playerId);
    case "buyUpgrade":
      if (state.players[action.playerId].upgrades.some((upgrade) => upgrade.upgradeId === action.upgradeId && upgrade.isUnlocked)) {
        return { ok: false, reason: "That upgrade is already owned." };
      }
      if (state.players[action.playerId].notes < state.config.upgradeDefinitions[action.upgradeId].costNotes) {
        return { ok: false, reason: "Player does not have enough Notes for that upgrade." };
      }
      if (state.players[action.playerId].coins < state.config.upgradeDefinitions[action.upgradeId].costCoins) {
        return { ok: false, reason: "Player does not have enough Coins for that upgrade." };
      }
      if (state.round.activeTurnWindow?.step !== "upgrades") {
        return { ok: false, reason: "Upgrades are only legal during the upgrades step." };
      }
      return validateActivePlayer(state, action.playerId);
    case "recordTrade":
      if (action.quantity <= 0) {
        return { ok: false, reason: "Trade quantity must be positive." };
      }
      if (action.unitPriceNotes < 0 || action.unitPriceCoins < 0) {
        return { ok: false, reason: "Trade prices cannot be negative." };
      }
      if (state.round.activeTurnWindow?.step !== "trade") {
        return { ok: false, reason: "Trades are only legal during the trade step." };
      }
      if (state.round.activePlayerId !== action.buyerPlayerId && state.round.activePlayerId !== action.sellerPlayerId) {
        return { ok: false, reason: "The active player must participate in the trade." };
      }
      if (action.buyerPlayerId === action.sellerPlayerId) {
        return { ok: false, reason: "A player cannot trade with themselves." };
      }
      if (state.players[action.sellerPlayerId].inventory[action.resourceId] < action.quantity) {
        return { ok: false, reason: "Seller does not have enough inventory." };
      }
      if (state.players[action.buyerPlayerId].notes < action.quantity * action.unitPriceNotes) {
        return { ok: false, reason: "Buyer does not have enough Notes." };
      }
      if (state.players[action.buyerPlayerId].coins < action.quantity * action.unitPriceCoins) {
        return { ok: false, reason: "Buyer does not have enough Coins." };
      }
      return { ok: true };
    case "advanceTurnStep":
    case "endPlayerTurn":
      return {
        ok: state.round.phase === "playerTurns",
        reason: "Turn controls only work during player turns."
      };
    case "advancePhase":
      return {
        ok: state.round.phase === "settlement" || state.round.phase === "upkeep",
        reason: "Only settlement and upkeep can be advanced manually."
      };
    case "endRound":
      return {
        ok: state.round.phase === "roundEnd",
        reason: "The round must be in roundEnd before it can reset."
      };
    default:
      return { ok: true };
  }
}
