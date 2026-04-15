import {
  DEFAULT_DEPOSIT_INTEREST_RATE,
  DEFAULT_LOAN_INTEREST_RATE,
  ROUND_PHASES,
  TURN_STEPS
} from "./constants";
import { recordTradePrice, syncAnchorPricesFromRoundActivity } from "./pricing";
import { buildTurnOrder, getLeftOfChair, rotateChair } from "./turn-order";
import type {
  Action,
  Deposit,
  GameState,
  Loan,
  PlayerId,
  ResourceId,
  RoundPhase,
  TradeRecord,
  TurnStep,
  UpgradeId
} from "./types";

function createId(prefix: string, roundNumber: number, count: number) {
  return `${prefix}-${roundNumber}-${count}`;
}

export function appendLog(
  state: GameState,
  action: Action,
  actor: PlayerId | "bank" | "system",
  message: string
): GameState {
  return {
    ...state,
    turnLog: [
      ...state.turnLog,
      {
        id: createId("log", state.round.roundNumber, state.turnLog.length + 1),
        roundNumber: state.round.roundNumber,
        phase: state.round.phase,
        actor,
        actionType: action.type,
        message
      }
    ]
  };
}

export function startRound(state: GameState): GameState {
  const firstTurnPlayerId = getLeftOfChair(state.round.policyChairPlayerId);
  const turnOrder = buildTurnOrder(state.round.policyChairPlayerId);

  return {
    ...state,
    round: {
      ...state.round,
      firstTurnPlayerId,
      turnOrder,
      activeTurnIndex: 0,
      activePlayerId: null,
      activeTurnWindow: null,
      hasRoundEnded: false
    },
    priceBook: {
      roundNumber: state.round.roundNumber,
      trades: [],
      lastTradeByResource: {},
      averageUnitPriceNotesByResource: {},
      averageUnitPriceCoinsByResource: {}
    }
  };
}

export function applyPolicyRate(state: GameState, rate: number): GameState {
  return {
    ...state,
    policy: {
      ...state.policy,
      policyRate: rate
    }
  };
}

export function applyDemandCardDraw(state: GameState): GameState {
  const nextCard = state.bankDemandDeck[(state.round.roundNumber - 1) % state.bankDemandDeck.length];
  return {
    ...state,
    activeDemandCardId: nextCard?.id ?? null
  };
}

export function beginPlayerTurns(state: GameState): GameState {
  return {
    ...state,
    round: {
      ...state.round,
      phase: "playerTurns",
      activeTurnIndex: 0,
      activePlayerId: state.round.turnOrder[0],
      activeTurnWindow: {
        playerId: state.round.turnOrder[0],
        step: "produce",
        actionsTaken: 0
      }
    }
  };
}

export function applyProduction(
  state: GameState,
  playerId: PlayerId,
  resourceId: ResourceId,
  quantity: number
): GameState {
  const player = state.players[playerId];
  const productionBonus = player.upgrades.reduce((bonus, ownedUpgrade) => {
    if (!ownedUpgrade.isUnlocked) {
      return bonus;
    }

    const definition = state.config.upgradeDefinitions[ownedUpgrade.upgradeId];
    const relevantBonus = definition.effects.find(
      (effect) => effect.type === "productionBonus" && effect.resourceId === resourceId
    );
    return bonus + (relevantBonus?.amount ?? 0);
  }, 0);

  const actualQuantity = quantity + productionBonus;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        inventory: {
          ...player.inventory,
          [resourceId]: player.inventory[resourceId] + actualQuantity
        }
      }
    },
    resources: {
      ...state.resources,
      [resourceId]: {
        ...state.resources[resourceId],
        availableSupply: state.resources[resourceId].availableSupply + actualQuantity,
        lastRoundProduced: state.resources[resourceId].lastRoundProduced + actualQuantity
      }
    },
    round: {
      ...state.round,
      activeTurnWindow: state.round.activeTurnWindow
        ? {
            ...state.round.activeTurnWindow,
            actionsTaken: state.round.activeTurnWindow.actionsTaken + 1
          }
        : null
    }
  };
}

export function applyLoanIssuance(
  state: GameState,
  playerId: PlayerId,
  amount: number,
  interestRate = DEFAULT_LOAN_INTEREST_RATE,
  minimumPayment = Math.ceil(amount / 4)
): GameState {
  const player = state.players[playerId];
  const loan: Loan = {
    id: createId("loan", state.round.roundNumber, player.loans.length + 1),
    playerId,
    principal: amount,
    interestRate,
    minimumPayment,
    remainingBalance: amount,
    termRounds: 4,
    status: "active"
  };

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        notes: player.notes + amount,
        loans: [...player.loans, loan]
      }
    }
  };
}

export function applyLoanRepayment(
  state: GameState,
  playerId: PlayerId,
  loanId: string,
  amount: number
): GameState {
  const player = state.players[playerId];

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        notes: Math.max(0, player.notes - amount),
        loans: player.loans.map((loan) =>
          loan.id !== loanId
            ? loan
            : {
                ...loan,
                remainingBalance: Math.max(0, loan.remainingBalance - amount),
                status: loan.remainingBalance - amount <= 0 ? "repaid" : loan.status
              }
        )
      }
    }
  };
}

export function applyDepositChange(
  state: GameState,
  playerId: PlayerId,
  kind: "create" | "withdraw",
  amountOrDepositId: number | string,
  interestRate = DEFAULT_DEPOSIT_INTEREST_RATE
): GameState {
  const player = state.players[playerId];

  if (kind === "create") {
    const amount = amountOrDepositId as number;
    const deposit: Deposit = {
      id: createId("deposit", state.round.roundNumber, player.deposits.length + 1),
      playerId,
      amount,
      interestRate,
      maturityRound: state.round.roundNumber + 2,
      status: "active"
    };

    return {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          notes: Math.max(0, player.notes - amount),
          deposits: [...player.deposits, deposit]
        }
      }
    };
  }

  const depositId = amountOrDepositId as string;
  const targetDeposit = player.deposits.find((deposit) => deposit.id === depositId);
  const payout = targetDeposit ? targetDeposit.amount : 0;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        notes: player.notes + payout,
        deposits: player.deposits.map((deposit) =>
          deposit.id === depositId ? { ...deposit, status: "withdrawn" } : deposit
        )
      }
    }
  };
}

export function applyUpgradePurchase(state: GameState, playerId: PlayerId, upgradeId: UpgradeId): GameState {
  const player = state.players[playerId];
  const upgrade = state.config.upgradeDefinitions[upgradeId];

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        notes: player.notes - upgrade.costNotes,
        coins: player.coins - upgrade.costCoins,
        upgrades: player.upgrades.map((owned) =>
          owned.upgradeId === upgradeId ? { ...owned, isUnlocked: true } : owned
        )
      }
    }
  };
}

export function applyTrade(
  state: GameState,
  buyerPlayerId: PlayerId,
  sellerPlayerId: PlayerId,
  resourceId: ResourceId,
  quantity: number,
  unitPriceNotes: number,
  unitPriceCoins: number
): GameState {
  const totalNotes = quantity * unitPriceNotes;
  const totalCoins = quantity * unitPriceCoins;
  const buyer = state.players[buyerPlayerId];
  const seller = state.players[sellerPlayerId];

  const tradeRecord: TradeRecord = {
    id: createId("trade", state.round.roundNumber, state.priceBook.trades.length + 1),
    roundNumber: state.round.roundNumber,
    phase: state.round.phase,
    buyerPlayerId,
    sellerPlayerId,
    resourceId,
    quantity,
    unitPriceNotes,
    unitPriceCoins,
    totalNotes,
    totalCoins
  };

  const priceBook = recordTradePrice(state.priceBook, tradeRecord);

  return {
    ...state,
    players: {
      ...state.players,
      [buyerPlayerId]: {
        ...buyer,
        notes: buyer.notes - totalNotes,
        coins: buyer.coins - totalCoins,
        inventory: {
          ...buyer.inventory,
          [resourceId]: buyer.inventory[resourceId] + quantity
        }
      },
      [sellerPlayerId]: {
        ...seller,
        notes: seller.notes + totalNotes,
        coins: seller.coins + totalCoins,
        inventory: {
          ...seller.inventory,
          [resourceId]: seller.inventory[resourceId] - quantity
        }
      }
    },
    resources: {
      ...state.resources,
      [resourceId]: {
        ...syncAnchorPricesFromRoundActivity(state.resources[resourceId], priceBook, resourceId),
        lastRoundDemand: state.resources[resourceId].lastRoundDemand + quantity
      }
    },
    priceBook
  };
}

export function advanceTurnStep(state: GameState): GameState {
  if (!state.round.activeTurnWindow) {
    return state;
  }

  const currentIndex = TURN_STEPS.indexOf(state.round.activeTurnWindow.step);
  const nextStep = TURN_STEPS[Math.min(currentIndex + 1, TURN_STEPS.length - 1)];

  return {
    ...state,
    round: {
      ...state.round,
      activeTurnWindow: {
        ...state.round.activeTurnWindow,
        step: nextStep,
        actionsTaken: 0
      }
    }
  };
}

export function advanceToNextPlayer(state: GameState): GameState {
  const nextIndex = state.round.activeTurnIndex + 1;
  const nextPlayerId = state.round.turnOrder[nextIndex];

  if (!nextPlayerId) {
    return {
      ...state,
      round: {
        ...state.round,
        phase: "settlement",
        activeTurnIndex: nextIndex,
        activePlayerId: null,
        activeTurnWindow: null
      }
    };
  }

  return {
    ...state,
    round: {
      ...state.round,
      activeTurnIndex: nextIndex,
      activePlayerId: nextPlayerId,
      activeTurnWindow: {
        playerId: nextPlayerId,
        step: "produce",
        actionsTaken: 0
      }
    }
  };
}

export function advanceRoundPhase(state: GameState): GameState {
  const currentIndex = ROUND_PHASES.indexOf(state.round.phase);
  const nextPhase = ROUND_PHASES[Math.min(currentIndex + 1, ROUND_PHASES.length - 1)] as RoundPhase;

  return {
    ...state,
    round: {
      ...state.round,
      phase: nextPhase
    }
  };
}

export function closeRound(state: GameState): GameState {
  const nextChair = rotateChair(state.round.policyChairPlayerId);

  return {
    ...state,
    round: {
      roundNumber: state.round.roundNumber + 1,
      phase: "policy",
      policyChairPlayerId: nextChair,
      firstTurnPlayerId: getLeftOfChair(nextChair),
      turnOrder: buildTurnOrder(nextChair),
      activeTurnIndex: 0,
      activePlayerId: null,
      activeTurnWindow: null,
      hasRoundEnded: true
    },
    policy: {
      ...state.policy,
      chairHistory: [...state.policy.chairHistory, nextChair]
    },
    players: Object.fromEntries(
      Object.entries(state.players).map(([playerId, player]) => [
        playerId,
        {
          ...player,
          upgrades: player.upgrades.map((upgrade) => ({ ...upgrade, isUsedThisRound: false }))
        }
      ])
    ) as GameState["players"],
    resources: Object.fromEntries(
      Object.entries(state.resources).map(([resourceId, resource]) => [
        resourceId,
        {
          ...resource,
          lastRoundDemand: 0,
          lastRoundProduced: 0
        }
      ])
    ) as GameState["resources"]
  };
}
