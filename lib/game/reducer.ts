import { selectLifeCostIndex } from "./selectors";
import {
  advanceRoundPhase,
  advanceToNextPlayer,
  advanceTurnStep,
  appendLog,
  applyDemandCardDraw,
  applyDepositChange,
  applyLoanIssuance,
  applyLoanRepayment,
  applyPolicyRate,
  applyProduction,
  applyTrade,
  applyUpgradePurchase,
  beginPlayerTurns,
  closeRound,
  startRound
} from "./transitions";
import { rotateChair } from "./turn-order";
import { canApplyAction } from "./validation";
import type { Action, GameState } from "./types";

function finalize(state: GameState): GameState {
  return {
    ...state,
    policy: {
      ...state.policy,
      lifeCostIndex: selectLifeCostIndex(state)
    }
  };
}

function rejectAction(state: GameState, action: Action, reason?: string) {
  return appendLog(state, action, "system", reason ?? "Action rejected.");
}

export function gameReducer(state: GameState, action: Action): GameState {
  const validity = canApplyAction(state, action);

  if (!validity.ok) {
    return rejectAction(state, action, validity.reason);
  }

  let nextState = state;

  switch (action.type) {
    case "startRound":
      nextState = appendLog(startRound(state), action, "system", "Round initialized and turn order prepared.");
      break;
    case "rotateChair": {
      const nextChair = rotateChair(state.round.policyChairPlayerId);
      nextState = appendLog(
        {
          ...state,
          round: {
            ...state.round,
            policyChairPlayerId: nextChair
          }
        },
        action,
        "system",
        `Policy chair rotated to ${state.players[nextChair].name}.`
      );
      break;
    }
    case "setPolicyRate":
      nextState = appendLog(
        applyPolicyRate(state, action.rate),
        action,
        "bank",
        `Policy rate set to ${action.rate.toFixed(2)}%.`
      );
      break;
    case "drawDemandCard": {
      const updated = applyDemandCardDraw(state);
      const card = updated.bankDemandDeck.find((entry) => entry.id === updated.activeDemandCardId);
      nextState = appendLog(updated, action, "bank", `Demand card revealed: ${card?.title ?? "none"}.`);
      break;
    }
    case "startPlayerTurns":
      nextState = appendLog(beginPlayerTurns(state), action, "system", "Player turn sequence started.");
      break;
    case "produceResource":
      nextState = appendLog(
        applyProduction(state, action.playerId, action.resourceId, action.quantity),
        action,
        action.playerId,
        `${state.players[action.playerId].name} produced ${action.quantity} ${action.resourceId}.`
      );
      break;
    case "takeLoan":
      nextState = appendLog(
        applyLoanIssuance(state, action.playerId, action.amount, action.interestRate, action.minimumPayment),
        action,
        action.playerId,
        `${state.players[action.playerId].name} borrowed ${action.amount} Notes.`
      );
      break;
    case "repayLoan":
      nextState = appendLog(
        applyLoanRepayment(state, action.playerId, action.loanId, action.amount),
        action,
        action.playerId,
        `${state.players[action.playerId].name} repaid ${action.amount} Notes on ${action.loanId}.`
      );
      break;
    case "createDeposit":
      nextState = appendLog(
        applyDepositChange(state, action.playerId, "create", action.amount, action.interestRate),
        action,
        action.playerId,
        `${state.players[action.playerId].name} deposited ${action.amount} Notes.`
      );
      break;
    case "withdrawDeposit":
      nextState = appendLog(
        applyDepositChange(state, action.playerId, "withdraw", action.depositId),
        action,
        action.playerId,
        `${state.players[action.playerId].name} withdrew deposit ${action.depositId}.`
      );
      break;
    case "buyUpgrade":
      nextState = appendLog(
        applyUpgradePurchase(state, action.playerId, action.upgradeId),
        action,
        action.playerId,
        `${state.players[action.playerId].name} bought ${state.config.upgradeDefinitions[action.upgradeId].name}.`
      );
      break;
    case "recordTrade":
      nextState = appendLog(
        applyTrade(
          state,
          action.buyerPlayerId,
          action.sellerPlayerId,
          action.resourceId,
          action.quantity,
          action.unitPriceNotes,
          action.unitPriceCoins
        ),
        action,
        state.round.activePlayerId ?? "system",
        `Trade recorded: ${action.quantity} ${action.resourceId} for ${action.unitPriceNotes} Notes and ${action.unitPriceCoins} Coins per unit.`
      );
      break;
    case "advanceTurnStep":
      nextState = appendLog(
        advanceTurnStep(state),
        action,
        "system",
        `Turn step advanced to ${state.round.activeTurnWindow?.step === "trade" ? "complete" : "next"} state.`
      );
      break;
    case "endPlayerTurn":
      nextState = appendLog(advanceToNextPlayer(state), action, "system", "Active player turn ended.");
      break;
    case "advancePhase":
      nextState = appendLog(advanceRoundPhase(state), action, "system", "Round phase advanced.");
      break;
    case "endRound":
      nextState = appendLog(closeRound(state), action, "system", "Round closed and chair rotated.");
      break;
    default:
      nextState = state;
  }

  return finalize(nextState);
}
