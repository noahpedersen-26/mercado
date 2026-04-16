import { DEPOSIT_PRINCIPAL, LOAN_PRINCIPAL } from "./constants";
import { selectCurrentBankBuyer, selectLifeCostIndex, selectLoanInterestDue, selectRoleSpecialty } from "./selectors";
import type { Action, GameState } from "./types";

export function validateAction(state: GameState, action: Action): string | null {
  switch (action.type) {
    case "setPolicyVote":
      return state.round.phase === "policyVote" ? null : "Votes only happen in Policy Vote.";
    case "resolvePolicyVote":
      return state.round.phase !== "policyVote"
        ? "Policy can only be resolved in Policy Vote."
        : Object.keys(state.round.policyVotes).length < state.playerOrder.length
          ? "All players must vote before resolving policy."
          : null;
    case "produceGood": {
      const player = state.players[action.playerId];
      if (state.round.phase !== "playerTurns" || state.round.activePlayerId !== action.playerId || state.round.activePlayerStage !== "production") {
        return "Production only happens on the active player's production step.";
      }

      if (action.useFlex) {
        if (!player.satisfiedUpkeepLastRound) {
          return "Flex production only exists if last upkeep was fully satisfied.";
        }

        if (player.turnActivity.flexProductionUsed) {
          return "Flex production has already been used.";
        }

        return null;
      }

      if (player.turnActivity.normalProductionActionsUsed >= 2) {
        return "Only two normal production actions are allowed.";
      }

      return null;
    }
    case "recordTrade": {
      if (state.round.phase !== "playerTurns" || state.round.activePlayerStage !== "market") {
        return "Trades only happen in the active player's Market / Finance / Build step.";
      }

      if (state.round.activePlayerId !== action.initiatorPlayerId) {
        return "Only the active player may initiate trades.";
      }

      if (action.quantity <= 0) {
        return "A trade must include at least one good coming from the counterparty.";
      }

      if (action.barterQuantity < 0 || action.totalNotes < 0 || action.totalBits < 0) {
        return "Trade values cannot be negative.";
      }

      if (state.players[action.otherPlayerId].goods[action.resourceId] < action.quantity) {
        return "Counterparty does not have enough of the incoming good.";
      }

      if (
        action.barterResourceId &&
        action.barterQuantity > 0 &&
        state.players[action.initiatorPlayerId].goods[action.barterResourceId] < action.barterQuantity
      ) {
        return "Initiator does not have enough of the offered good.";
      }

      if (state.players[action.initiatorPlayerId].notes < action.totalNotes || state.players[action.initiatorPlayerId].bits < action.totalBits) {
        return "Initiator does not have enough Notes or Bits.";
      }

      if (action.totalNotes === 0 && action.totalBits === 0 && (!action.barterResourceId || action.barterQuantity <= 0)) {
        return "Trade must include Notes, Bits, or a good offered back.";
      }

      return null;
    }
    case "takeLoan":
      return state.round.phase !== "playerTurns" ||
        state.round.activePlayerId !== action.playerId ||
        state.round.activePlayerStage !== "market"
        ? "Loans only happen on the active player's market step."
        : state.players[action.playerId].turnActivity.loanTakenThisTurn
          ? "Only one bank loan may be taken per turn."
          : null;
    case "createDeposit":
      return state.round.phase !== "playerTurns" ||
        state.round.activePlayerId !== action.playerId ||
        state.round.activePlayerStage !== "market"
        ? "Deposits only happen on the active player's market step."
        : state.players[action.playerId].turnActivity.depositMadeThisTurn
          ? "Only one bank deposit may be created per turn."
          : state.players[action.playerId].notes < DEPOSIT_PRINCIPAL
            ? "Player does not have 10 Notes to deposit."
            : null;
    case "repayLoan":
      return state.round.phase !== "playerTurns" ||
        state.round.activePlayerId !== action.playerId ||
        state.round.activePlayerStage !== "market"
        ? "Loan repayment only happens on the active player's market step."
        : state.players[action.playerId].notes < LOAN_PRINCIPAL
          ? "Player does not have 10 Notes to repay a loan."
          : null;
    case "buyUpgrade": {
      const card = state.upgradeMarketRow.find((entry) => entry.id === action.upgradeCardId);
      return state.round.phase !== "playerTurns" ||
        state.round.activePlayerId !== action.playerId ||
        state.round.activePlayerStage !== "market"
        ? "Upgrades only happen on the active player's market step."
        : state.players[action.playerId].turnActivity.upgradeBoughtThisTurn
          ? "At most one production upgrade may be bought per turn."
          : !card
            ? "That upgrade is not in the visible market row."
            : state.players[action.playerId].ownedUpgrades.some((owned) => owned.type === card.type)
              ? "Player already owns that production upgrade type."
              : state.players[action.playerId].notes < card.costNotes
                ? "Player does not have enough Notes."
                : null;
    }
    case "advancePlayerStage":
      return state.round.phase === "playerTurns" && state.round.activePlayerStage === "production"
        ? null
        : "Can only advance from Production to Market during player turns.";
    case "endPlayerTurn":
      return state.round.phase === "playerTurns" && state.round.activePlayerStage === "market"
        ? null
        : "Player turn can only end from the Market / Finance / Build step.";
    case "revealBankDemandCard":
      return state.round.phase === "centralBank" && !state.round.bankDemandCardId
        ? null
        : "Reveal exactly one demand card at the start of the Central Bank Turn.";
    case "bankBuy":
      return state.round.phase !== "centralBank"
        ? "Bank purchases only happen during the Central Bank Turn."
        : state.round.bankDemandCardId === null
          ? "Reveal the bank demand card first."
          : selectCurrentBankBuyer(state) !== action.playerId
            ? "Bank must buy in order starting left of the Policy Chair."
            : state.players[action.playerId].goods[action.resourceId] < action.quantity
              ? "That player does not have enough of the good."
              : null;
    case "advanceBankBuyer":
      return state.round.phase === "centralBank" ? null : "Bank order only advances during the Central Bank Turn.";
    case "payLife": {
      const player = state.players[action.playerId];
      const lifeCostIndex = selectLifeCostIndex(state);

      if (state.round.phase !== "settlement") {
        return "Life upkeep is only paid in Settlement.";
      }

      if (state.round.settlement[action.playerId].lifeUnitsPaid >= 2) {
        return "This player has already paid both Life Units.";
      }

      if (action.payment === "notes" && player.notes < lifeCostIndex) {
        return "Player does not have enough Notes for one Life Unit.";
      }

      if ((action.payment === "grain" || action.payment === "fuel") && player.goods[action.payment] < 1) {
        return "Player does not have that good available.";
      }

      return null;
    }
    case "payLoanInterest": {
      const due = selectLoanInterestDue(state.round.votedRate);
      return state.round.phase !== "settlement"
        ? "Loan interest is paid in Settlement."
        : due === 0
          ? "No interest is due at 0%."
          : state.round.settlement[action.playerId].interestPaidLoanIds.includes(action.loanId)
            ? "That loan's interest has already been settled."
            : state.players[action.playerId].notes < due
              ? "Not enough Notes to pay interest directly."
              : null;
    }
    case "resolveInterestShortfall":
      return state.round.phase !== "settlement"
        ? "Interest shortfalls are resolved in Settlement."
        : state.round.settlement[action.playerId].interestPaidLoanIds.includes(action.loanId)
          ? "That loan's interest has already been resolved."
          : null;
    case "setAnchorPrice":
      return state.round.phase === "repricing" ? null : "Anchor repricing only happens in Repricing / End Round.";
    case "endRound":
      return state.round.phase === "repricing" ? null : "The round can only end after repricing.";
    default:
      return null;
  }
}
