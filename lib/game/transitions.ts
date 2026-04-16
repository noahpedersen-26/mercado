import { DEPOSIT_PRINCIPAL, LOAN_PRINCIPAL, RESOURCE_IDS } from "./constants";
import { maybeDiscoverNotesPrice } from "./pricing";
import {
  selectCurrentBankBuyer,
  selectDiscoveredOrAnchorPrice,
  selectLifeCostIndex,
  selectLoanInterestDue,
  selectMaturedDeposits,
  selectRoleSpecialty
} from "./selectors";
import { buildTurnOrder, rotateChair } from "./turn-order";
import type { Action, DepositToken, GameState, LifePaymentKind, PlayerId, RateOption, ResourceId, UpgradeCard } from "./types";

function createId(prefix: string, roundNumber: number, count: number) {
  return `${prefix}-${roundNumber}-${count}`;
}

function appendLog(state: GameState, actor: PlayerId | "bank" | "system", message: string): GameState {
  return {
    ...state,
    turnLog: [
      ...state.turnLog,
      {
        id: createId("log", state.round.roundNumber, state.turnLog.length + 1),
        roundNumber: state.round.roundNumber,
        phase: state.round.phase,
        actor,
        message
      }
    ]
  };
}

function resetTurnActivity(state: GameState, playerId: PlayerId): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        turnActivity: {
          normalProductionActionsUsed: 0,
          flexProductionUsed: false,
          loanTakenThisTurn: false,
          depositMadeThisTurn: false,
          upgradeBoughtThisTurn: false,
          firstUpgradeBoostUsed: {}
        }
      }
    }
  };
}

function refillUpgradeRow(state: GameState): GameState {
  if (state.upgradeMarketRow.length >= 3 || state.upgradeDeck.length === 0) {
    return state;
  }

  const needed = 3 - state.upgradeMarketRow.length;
  return {
    ...state,
    upgradeMarketRow: [...state.upgradeMarketRow, ...state.upgradeDeck.slice(0, needed)],
    upgradeDeck: state.upgradeDeck.slice(needed)
  };
}

function resetSettlement(state: GameState): GameState["round"]["settlement"] {
  return Object.fromEntries(
    state.playerOrder.map((playerId) => [
      playerId,
      {
        lifeUnitsPaid: 0,
        interestPaidLoanIds: []
      }
    ])
  ) as GameState["round"]["settlement"];
}

function autoMatureDeposits(state: GameState): GameState {
  let nextState = state;

  for (const playerId of state.playerOrder) {
    const matured = selectMaturedDeposits(nextState, playerId);

    if (matured.length === 0) {
      continue;
    }

    const returnedNotes = matured.reduce((sum, deposit) => sum + deposit.returnAmount, 0);
    nextState = {
      ...nextState,
      players: {
        ...nextState.players,
        [playerId]: {
          ...nextState.players[playerId],
          notes: nextState.players[playerId].notes + returnedNotes,
          deposits: nextState.players[playerId].deposits.filter((deposit) => deposit.maturesRound > nextState.round.roundNumber)
        }
      }
    };

    nextState = appendLog(
      nextState,
      "bank",
      `${nextState.players[playerId].name} received ${returnedNotes} Notes from matured deposits.`
    );
  }

  return nextState;
}

function resolvePolicyVotes(state: GameState): RateOption {
  const tallies = new Map<RateOption, number>([
    [0, 0],
    [10, 0],
    [20, 0]
  ]);

  for (const rate of Object.values(state.round.policyVotes)) {
    if (rate === undefined) {
      continue;
    }

    tallies.set(rate, (tallies.get(rate) ?? 0) + 1);
  }

  const maxVotes = Math.max(...Array.from(tallies.values()));
  const leaders = Array.from(tallies.entries())
    .filter(([, count]) => count === maxVotes)
    .map(([rate]) => rate);

  if (leaders.length === 1) {
    return leaders[0];
  }

  return state.round.policyVotes[state.round.policyChairPlayerId] ?? state.round.votedRate;
}

function nextPlayerState(state: GameState): GameState {
  const nextIndex = state.round.activePlayerIndex + 1;
  const nextPlayerId = state.round.turnOrder[nextIndex] ?? null;

  if (!nextPlayerId) {
    return appendLog(
      {
        ...state,
        round: {
          ...state.round,
          phase: "centralBank",
          activePlayerIndex: nextIndex,
          activePlayerId: null,
          activePlayerStage: null,
          bankBuyOrderIndex: 0
        }
      },
      "system",
      "All player turns complete. Central Bank Turn begins."
    );
  }

  return appendLog(
    resetTurnActivity(
      {
        ...state,
        round: {
          ...state.round,
          activePlayerIndex: nextIndex,
          activePlayerId: nextPlayerId,
          activePlayerStage: "production"
        }
      },
      nextPlayerId
    ),
    "system",
    `${state.players[nextPlayerId].name} is now active.`
  );
}

function isSettlementComplete(state: GameState): boolean {
  const interestDue = selectLoanInterestDue(state.round.votedRate);

  return state.playerOrder.every((playerId) => {
    const settlement = state.round.settlement[playerId];
    const player = state.players[playerId];
    const lifeDone = settlement.lifeUnitsPaid >= 2;
    const interestDone = interestDue === 0 || settlement.interestPaidLoanIds.length >= player.loans.length;

    return lifeDone && interestDone;
  });
}

function maybeAdvanceToRepricing(state: GameState): GameState {
  if (!isSettlementComplete(state)) {
    return state;
  }

  return appendLog(
    {
      ...state,
      round: {
        ...state.round,
        phase: "repricing"
      }
    },
    "system",
    "Settlement complete. Move to Repricing / End Round."
  );
}

export function applyAction(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "setPolicyVote":
      return appendLog(
        {
          ...state,
          round: {
            ...state.round,
            policyVotes: {
              ...state.round.policyVotes,
              [action.playerId]: action.rate
            }
          }
        },
        action.playerId,
        `${state.players[action.playerId].name} voted for ${action.rate}%.`
      );
    case "resolvePolicyVote": {
      const votedRate = resolvePolicyVotes(state);
      const firstPlayerId = state.round.turnOrder[0];
      return appendLog(
        resetTurnActivity(
          {
            ...state,
            round: {
              ...state.round,
              phase: "playerTurns",
              votedRate,
              activePlayerIndex: 0,
              activePlayerId: firstPlayerId,
              activePlayerStage: "production"
            }
          },
          firstPlayerId
        ),
        "system",
        `Policy vote resolved at ${votedRate}%. ${state.players[firstPlayerId].name} starts player turns.`
      );
    }
    case "produceGood": {
      const player = state.players[action.playerId];
      const specialty = selectRoleSpecialty(state, action.playerId);
      const isFlex = Boolean(action.useFlex);
      const hasMatchingUpgrade = player.ownedUpgrades.some((upgrade) => upgrade.resourceId === action.resourceId);
      const upgradeAlreadyUsed = player.turnActivity.firstUpgradeBoostUsed[action.resourceId] ?? false;
      const upgradeBonus = !isFlex && hasMatchingUpgrade && !upgradeAlreadyUsed ? 1 : 0;
      const roleBonus = !isFlex && specialty === action.resourceId ? 1 : 0;
      const output = Math.min(3, 1 + roleBonus + upgradeBonus);

      let nextState: GameState = {
        ...state,
        players: {
          ...state.players,
          [action.playerId]: {
            ...player,
            goods: {
              ...player.goods,
              [action.resourceId]: player.goods[action.resourceId] + output
            },
            turnActivity: {
              ...player.turnActivity,
              normalProductionActionsUsed: isFlex
                ? player.turnActivity.normalProductionActionsUsed
                : player.turnActivity.normalProductionActionsUsed + 1,
              flexProductionUsed: isFlex ? true : player.turnActivity.flexProductionUsed,
              firstUpgradeBoostUsed:
                upgradeBonus > 0
                  ? {
                      ...player.turnActivity.firstUpgradeBoostUsed,
                      [action.resourceId]: true
                    }
                  : player.turnActivity.firstUpgradeBoostUsed
            }
          }
        }
      };

      nextState = appendLog(
        nextState,
        action.playerId,
        `${player.name} produced ${output} ${state.config.resources[action.resourceId].name}${
          isFlex ? " with the flex action" : ""
        }.`
      );

      return nextState;
    }
    case "recordTrade": {
      const trade = {
        id: createId("trade", state.round.roundNumber, state.tradeLog.length + 1),
        roundNumber: state.round.roundNumber,
        initiatorPlayerId: action.initiatorPlayerId,
        otherPlayerId: action.otherPlayerId,
        resourceId: action.resourceId,
        quantity: action.quantity,
        barterResourceId: action.barterResourceId,
        barterQuantity: action.barterQuantity,
        totalNotes: action.totalNotes,
        totalBits: action.totalBits,
        discoveredNotesPrice: null
      };

      const buyer = state.players[action.initiatorPlayerId];
      const seller = state.players[action.otherPlayerId];
      const discoveredNotesPrices = maybeDiscoverNotesPrice(state, trade);
      const discoveredNotesPrice = discoveredNotesPrices[action.resourceId] ?? null;
      const buyerGoods = {
        ...buyer.goods,
        [action.resourceId]: buyer.goods[action.resourceId] + action.quantity
      };
      const sellerGoods = {
        ...seller.goods,
        [action.resourceId]: seller.goods[action.resourceId] - action.quantity
      };

      if (action.barterResourceId && action.barterQuantity > 0) {
        buyerGoods[action.barterResourceId] = buyer.goods[action.barterResourceId] - action.barterQuantity;
        sellerGoods[action.barterResourceId] = seller.goods[action.barterResourceId] + action.barterQuantity;
      }

      return appendLog(
        {
          ...state,
          players: {
            ...state.players,
            [action.initiatorPlayerId]: {
              ...buyer,
              notes: buyer.notes - action.totalNotes,
              bits: buyer.bits - action.totalBits,
              goods: buyerGoods
            },
            [action.otherPlayerId]: {
              ...seller,
              notes: seller.notes + action.totalNotes,
              bits: seller.bits + action.totalBits,
              goods: sellerGoods
            }
          },
          tradeLog: [...state.tradeLog, { ...trade, discoveredNotesPrice }],
          round: {
            ...state.round,
            discoveredNotesPrices
          }
        },
        action.initiatorPlayerId,
        `${buyer.name} received ${action.quantity} ${state.config.resources[action.resourceId].name}${
          action.barterResourceId && action.barterQuantity > 0
            ? ` by sending ${action.barterQuantity} ${state.config.resources[action.barterResourceId].name}`
            : ""
        }${action.totalNotes > 0 ? ` and ${action.totalNotes} Notes` : ""}${action.totalBits > 0 ? ` and ${action.totalBits} Bits` : ""}.`
      );
    }
    case "takeLoan": {
      const player = state.players[action.playerId];

      return appendLog(
        {
          ...state,
          players: {
            ...state.players,
            [action.playerId]: {
              ...player,
              notes: player.notes + LOAN_PRINCIPAL,
              loans: [
                ...player.loans,
                {
                  id: createId("loan", state.round.roundNumber, player.loans.length + 1),
                  issuedRound: state.round.roundNumber,
                  principal: 10
                }
              ],
              turnActivity: {
                ...player.turnActivity,
                loanTakenThisTurn: true
              }
            }
          },
          round: {
            ...state.round,
            notesCreatedThisRound: state.round.notesCreatedThisRound + LOAN_PRINCIPAL
          }
        },
        action.playerId,
        `${player.name} borrowed 10 Notes and created 1 Loan token.`
      );
    }
    case "createDeposit": {
      const player = state.players[action.playerId];
      const returnAmount = state.round.votedRate === 20 ? 12 : state.round.votedRate === 10 ? 11 : 10;
      const deposit: DepositToken = {
        id: createId("deposit", state.round.roundNumber, player.deposits.length + 1),
        issuedRound: state.round.roundNumber,
        maturesRound: state.round.roundNumber + 1,
        returnAmount
      };

      return appendLog(
        {
          ...state,
          players: {
            ...state.players,
            [action.playerId]: {
              ...player,
              notes: player.notes - DEPOSIT_PRINCIPAL,
              deposits: [...player.deposits, deposit],
              turnActivity: {
                ...player.turnActivity,
                depositMadeThisTurn: true
              }
            }
          }
        },
        action.playerId,
        `${player.name} deposited 10 Notes for a locked ${returnAmount} Note return next round.`
      );
    }
    case "repayLoan": {
      const player = state.players[action.playerId];

      return appendLog(
        {
          ...state,
          players: {
            ...state.players,
            [action.playerId]: {
              ...player,
              notes: player.notes - LOAN_PRINCIPAL,
              loans: player.loans.filter((loan) => loan.id !== action.loanId)
            }
          }
        },
        action.playerId,
        `${player.name} repaid one 10 Note loan principal.`
      );
    }
    case "buyUpgrade": {
      const player = state.players[action.playerId];
      const card = state.upgradeMarketRow.find((upgrade) => upgrade.id === action.upgradeCardId) as UpgradeCard;
      const nextState = refillUpgradeRow({
        ...state,
        players: {
          ...state.players,
          [action.playerId]: {
            ...player,
            notes: player.notes - card.costNotes,
            ownedUpgrades: [...player.ownedUpgrades, card],
            turnActivity: {
              ...player.turnActivity,
              upgradeBoughtThisTurn: true
            }
          }
        },
        upgradeMarketRow: state.upgradeMarketRow.filter((upgrade) => upgrade.id !== action.upgradeCardId)
      });

      return appendLog(nextState, action.playerId, `${player.name} bought ${card.name}.`);
    }
    case "advancePlayerStage":
      return appendLog(
        {
          ...state,
          round: {
            ...state.round,
            activePlayerStage: "market"
          }
        },
        "system",
        "Player turn advanced to Market / Finance / Build."
      );
    case "endPlayerTurn":
      return nextPlayerState(state);
    case "revealBankDemandCard": {
      const [nextCard, ...remainingDeck] = state.bankDemandDeck;
      return appendLog(
        {
          ...state,
          bankDemandDeck: remainingDeck,
          discardedBankDemandCards: nextCard ? [...state.discardedBankDemandCards, nextCard] : state.discardedBankDemandCards,
          round: {
            ...state.round,
            bankDemandCardId: nextCard?.id ?? null
          }
        },
        "bank",
        `Bank revealed demand card: ${nextCard?.title ?? "No card"}.`
      );
    }
    case "bankBuy": {
      const player = state.players[action.playerId];
      const price = selectDiscoveredOrAnchorPrice(state, action.resourceId);
      const payment = price * action.quantity;

      return appendLog(
        {
          ...state,
          players: {
            ...state.players,
            [action.playerId]: {
              ...player,
              notes: player.notes + payment,
              goods: {
                ...player.goods,
                [action.resourceId]: player.goods[action.resourceId] - action.quantity
              }
            }
          },
          round: {
            ...state.round,
            notesCreatedThisRound: state.round.notesCreatedThisRound + payment,
            discoveredNotesPrices: {
              ...state.round.discoveredNotesPrices,
              [action.resourceId]: price
            }
          }
        },
        "bank",
        `Bank bought ${action.quantity} ${state.config.resources[action.resourceId].name} from ${player.name} for ${payment} Notes.`
      );
    }
    case "advanceBankBuyer": {
      const nextIndex = state.round.bankBuyOrderIndex + 1;
      const nextBuyer = state.round.turnOrder[nextIndex] ?? null;

      return appendLog(
        {
          ...state,
          round: {
            ...state.round,
            phase: nextBuyer ? "centralBank" : "settlement",
            bankBuyOrderIndex: nextIndex
          }
        },
        "system",
        nextBuyer
          ? `Bank buying order advanced to ${state.players[nextBuyer].name}.`
          : "Central Bank Turn complete. Move to Settlement."
      );
    }
    case "payLife": {
      const player = state.players[action.playerId];
      const settlement = state.round.settlement[action.playerId];
      const lifeCostIndex = selectLifeCostIndex(state);

      const costUpdates =
        action.payment === "notes"
          ? { notes: player.notes - lifeCostIndex }
          : {
              goods: {
                ...player.goods,
                [action.payment]: player.goods[action.payment] - 1
              }
            };

      return maybeAdvanceToRepricing(
        appendLog(
        {
          ...state,
          players: {
            ...state.players,
            [action.playerId]: {
              ...player,
              ...costUpdates,
              satisfiedUpkeepThisRound: settlement.lifeUnitsPaid + 1 >= 2
            }
          },
          round: {
            ...state.round,
            settlement: {
              ...state.round.settlement,
              [action.playerId]: {
                ...settlement,
                lifeUnitsPaid: settlement.lifeUnitsPaid + 1
              }
            }
          }
        },
        action.playerId,
        `${player.name} paid 1 Life Unit with ${action.payment === "notes" ? `${lifeCostIndex} Notes` : state.config.resources[action.payment].name}.`
      ));
    }
    case "payLoanInterest": {
      const player = state.players[action.playerId];
      const due = selectLoanInterestDue(state.round.votedRate);
      const settlement = state.round.settlement[action.playerId];

      return maybeAdvanceToRepricing(
        appendLog(
        {
          ...state,
          players: {
            ...state.players,
            [action.playerId]: {
              ...player,
              notes: player.notes - due
            }
          },
          round: {
            ...state.round,
            settlement: {
              ...state.round.settlement,
              [action.playerId]: {
                ...settlement,
                interestPaidLoanIds: [...settlement.interestPaidLoanIds, action.loanId]
              }
            }
          }
        },
        action.playerId,
        `${player.name} paid ${due} Note interest on ${action.loanId}.`
      ));
    }
    case "resolveInterestShortfall": {
      const player = state.players[action.playerId];
      const due = selectLoanInterestDue(state.round.votedRate);
      const remaining = Math.max(0, due - action.auctionProceeds);
      const resourceId = RESOURCE_IDS.find((resource) => resource === action.surrenderedLabel) as ResourceId | undefined;

      return maybeAdvanceToRepricing(
        appendLog(
        {
          ...state,
          players: {
            ...state.players,
            [action.playerId]: {
              ...player,
              goods: resourceId
                ? {
                    ...player.goods,
                    [resourceId]: Math.max(0, player.goods[resourceId] - 1)
                  }
                : player.goods,
              arrears: player.arrears + remaining
            }
          },
          round: {
            ...state.round,
            settlement: {
              ...state.round.settlement,
              [action.playerId]: {
                ...state.round.settlement[action.playerId],
                interestPaidLoanIds: [...state.round.settlement[action.playerId].interestPaidLoanIds, action.loanId]
              }
            }
          }
        },
        "bank",
        `${player.name} surrendered ${action.surrenderedLabel}; auction raised ${action.auctionProceeds} Notes and ${remaining} became Arrears.`
      ));
    }
    case "setAnchorPrice":
      return appendLog(
        {
          ...state,
          anchorNotesPrices: {
            ...state.anchorNotesPrices,
            [action.resourceId]: action.price
          }
        },
        "system",
        `${state.config.resources[action.resourceId].name} anchor price set to ${action.price} Notes.`
      );
    case "endRound": {
      const nextChair = rotateChair(state.playerOrder, state.round.policyChairPlayerId);
      const nextRound = state.round.roundNumber + 1;
      const nextTurnOrder = buildTurnOrder(state.playerOrder, nextChair);
      const withMaturedDeposits = autoMatureDeposits({
        ...state,
        players: Object.fromEntries(
          Object.entries(state.players).map(([playerId, player]) => [
            playerId,
            {
              ...player,
              satisfiedUpkeepLastRound: player.satisfiedUpkeepThisRound,
              satisfiedUpkeepThisRound: false,
              turnActivity: {
                normalProductionActionsUsed: 0,
                flexProductionUsed: false,
                loanTakenThisTurn: false,
                depositMadeThisTurn: false,
                upgradeBoughtThisTurn: false,
                firstUpgradeBoostUsed: {}
              }
            }
          ])
        ) as GameState["players"],
        round: {
          roundNumber: nextRound,
          phase: "policyVote",
          policyChairPlayerId: nextChair,
          turnOrder: nextTurnOrder,
          activePlayerIndex: 0,
          activePlayerId: null,
          activePlayerStage: null,
          policyVotes: {},
          votedRate: state.round.votedRate,
          discoveredNotesPrices: {},
          bankDemandCardId: null,
          bankBuyOrderIndex: 0,
          notesCreatedThisRound: 0,
          settlement: resetSettlement(state)
        }
      });

      return appendLog(withMaturedDeposits, "system", `Round ended. Policy Chair rotated to ${state.players[nextChair].name}.`);
    }
    default:
      return state;
  }
}
