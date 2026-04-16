import { RESOURCE_IDS } from "./constants";
import { buildTurnOrder } from "./turn-order";
import type {
  BankDemandCard,
  DepositToken,
  GameState,
  LoanToken,
  PlayerState,
  ResourceId,
  RoleId,
  UpgradeCard
} from "./types";

function goods(values: Partial<Record<ResourceId, number>>) {
  return {
    grain: 0,
    fuel: 0,
    lumber: 0,
    labor: 0,
    ...values
  };
}

function loanToken(id: string, issuedRound: number): LoanToken {
  return {
    id,
    issuedRound,
    principal: 10
  };
}

function depositToken(id: string, issuedRound: number, returnAmount: 10 | 11 | 12): DepositToken {
  return {
    id,
    issuedRound,
    maturesRound: issuedRound + 1,
    returnAmount
  };
}

function upgradeCard(id: string, type: UpgradeCard["type"], name: string, resourceId: ResourceId): UpgradeCard {
  return {
    id,
    type,
    name,
    resourceId,
    description: `+1 on the first ${resourceId} production action each turn, up to max 3 output.`,
    costNotes: 8
  };
}

function player(id: string, name: string, role: RoleId, overrides: Partial<PlayerState>): PlayerState {
  return {
    id,
    name,
    role,
    notes: 12,
    bits: 6,
    goods: goods({}),
    loans: [],
    deposits: [],
    arrears: 0,
    ownedUpgrades: [],
    satisfiedUpkeepLastRound: false,
    satisfiedUpkeepThisRound: false,
    turnActivity: {
      normalProductionActionsUsed: 0,
      flexProductionUsed: false,
      loanTakenThisTurn: false,
      depositMadeThisTurn: false,
      upgradeBoughtThisTurn: false,
      firstUpgradeBoostUsed: {}
    },
    ...overrides
  };
}

const demandDeck: BankDemandCard[] = [
  {
    id: "housing-push",
    title: "Housing Push",
    description: "The bank buys Lumber and Labor for housing programs.",
    demand: { lumber: 2, labor: 2 }
  },
  {
    id: "infrastructure-program",
    title: "Infrastructure Program",
    description: "The bank buys Lumber, Labor, and some Fuel.",
    demand: { lumber: 2, labor: 2, fuel: 1 }
  },
  {
    id: "energy-relief",
    title: "Energy Relief",
    description: "The bank buys Fuel for relief support.",
    demand: { fuel: 2 }
  },
  {
    id: "food-support",
    title: "Food Support",
    description: "The bank buys Grain for emergency support.",
    demand: { grain: 2 }
  },
  {
    id: "tightening",
    title: "Tightening",
    description: "The bank buys little or nothing this round.",
    demand: {}
  }
];

const upgradeDeck: UpgradeCard[] = [
  upgradeCard("grain-mill-a", "grain-mill", "Grain Mill", "grain"),
  upgradeCard("fuel-rig-a", "fuel-rig", "Fuel Rig", "fuel"),
  upgradeCard("sawmill-a", "sawmill", "Sawmill", "lumber"),
  upgradeCard("hiring-office-a", "hiring-office", "Hiring Office", "labor"),
  upgradeCard("grain-mill-b", "grain-mill", "Grain Mill", "grain"),
  upgradeCard("fuel-rig-b", "fuel-rig", "Fuel Rig", "fuel"),
  upgradeCard("sawmill-b", "sawmill", "Sawmill", "lumber"),
  upgradeCard("hiring-office-b", "hiring-office", "Hiring Office", "labor")
];

const playerOrder = ["player-1", "player-2"];
const chair = "player-1";

export const initialGameState: GameState = {
  config: {
    resources: {
      grain: { id: "grain", name: "Grain", shortLabel: "GR" },
      fuel: { id: "fuel", name: "Fuel", shortLabel: "FU" },
      lumber: { id: "lumber", name: "Lumber", shortLabel: "LU" },
      labor: { id: "labor", name: "Labor", shortLabel: "LA" }
    },
    roles: {
      farmer: {
        id: "farmer",
        name: "Farmer",
        specialty: "grain",
        description: "+1 output on Grain production actions."
      },
      refiner: {
        id: "refiner",
        name: "Refiner",
        specialty: "fuel",
        description: "+1 output on Fuel production actions."
      },
      builder: {
        id: "builder",
        name: "Builder",
        specialty: "lumber",
        description: "+1 output on Lumber production actions."
      },
      organizer: {
        id: "organizer",
        name: "Organizer",
        specialty: "labor",
        description: "+1 output on Labor production actions."
      }
    }
  },
  players: {
    "player-1": player("player-1", "River Farm Co.", "farmer", {
      notes: 14,
      bits: 4,
      goods: goods({ grain: 2, fuel: 1, lumber: 1, labor: 0 }),
      loans: [loanToken("loan-p1-1", 0)],
      deposits: [depositToken("deposit-p1-1", 0, 11)],
      ownedUpgrades: [upgradeCard("owned-grain-mill-1", "grain-mill", "Grain Mill", "grain")],
      satisfiedUpkeepLastRound: true
    }),
    "player-2": player("player-2", "Forge & Crew", "builder", {
      notes: 10,
      bits: 7,
      goods: goods({ grain: 1, fuel: 1, lumber: 2, labor: 1 }),
      loans: [loanToken("loan-p2-1", 0)],
      deposits: [],
      ownedUpgrades: [upgradeCard("owned-sawmill-1", "sawmill", "Sawmill", "lumber")],
      satisfiedUpkeepLastRound: false
    })
  },
  playerOrder,
  round: {
    roundNumber: 1,
    phase: "policyVote",
    policyChairPlayerId: chair,
    turnOrder: buildTurnOrder(playerOrder, chair),
    activePlayerIndex: 0,
    activePlayerId: null,
    activePlayerStage: null,
    policyVotes: {},
    votedRate: 10,
    discoveredNotesPrices: {},
    bankDemandCardId: null,
    bankBuyOrderIndex: 0,
    notesCreatedThisRound: 0,
    settlement: Object.fromEntries(
      playerOrder.map((playerId) => [
        playerId,
        {
          lifeUnitsPaid: 0,
          interestPaidLoanIds: []
        }
      ])
    ) as GameState["round"]["settlement"]
  },
  anchorNotesPrices: {
    grain: 3,
    fuel: 4,
    lumber: 5,
    labor: 5
  },
  bankDemandDeck: demandDeck,
  discardedBankDemandCards: [],
  upgradeDeck: upgradeDeck.slice(3),
  upgradeMarketRow: upgradeDeck.slice(0, 3),
  tradeLog: [],
  turnLog: [
    {
      id: "log-1",
      roundNumber: 1,
      phase: "policyVote",
      actor: "system",
      message: "Game ready: vote on 0%, 10%, or 20% before player turns begin."
    }
  ]
};
