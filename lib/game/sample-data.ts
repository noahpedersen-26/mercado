import { DEFAULT_POLICY_RATE, PLAYER_ORDER, RESOURCE_IDS } from "./constants";
import { buildTurnOrder, getLeftOfChair } from "./turn-order";
import type { GameState, Inventory, ProductionCapacity } from "./types";

const emptyInventory = (): Inventory => ({
  grain: 0,
  wood: 0,
  iron: 0,
  energy: 0
});

const inventory = (values: Partial<Inventory>): Inventory => ({
  ...emptyInventory(),
  ...values
});

const capacity = (values: Partial<ProductionCapacity>): ProductionCapacity => ({
  grain: 0,
  wood: 0,
  iron: 0,
  energy: 0,
  ...values
});

const initialChair = "player-1" as const;

export const initialGameState: GameState = {
  config: {
    playerOrder: PLAYER_ORDER,
    resourceDefinitions: {
      grain: {
        id: "grain",
        name: "Grain",
        category: "food",
        baseAnchorPriceNotes: 3,
        baseAnchorPriceCoins: 1,
        startingSupply: 12,
        lifeCostWeight: 0.5,
        canBeProduced: true
      },
      wood: {
        id: "wood",
        name: "Wood",
        category: "materials",
        baseAnchorPriceNotes: 4,
        baseAnchorPriceCoins: 1,
        startingSupply: 10,
        lifeCostWeight: 0.2,
        canBeProduced: true
      },
      iron: {
        id: "iron",
        name: "Iron",
        category: "industry",
        baseAnchorPriceNotes: 6,
        baseAnchorPriceCoins: 2,
        startingSupply: 8,
        lifeCostWeight: 0.15,
        canBeProduced: true
      },
      energy: {
        id: "energy",
        name: "Energy",
        category: "utility",
        baseAnchorPriceNotes: 5,
        baseAnchorPriceCoins: 2,
        startingSupply: 9,
        lifeCostWeight: 0.15,
        canBeProduced: true
      }
    },
    upgradeDefinitions: {
      mill: {
        id: "mill",
        name: "Mill",
        costNotes: 10,
        costCoins: 2,
        description: "Adds +1 Grain whenever this player produces Grain.",
        effects: [{ type: "productionBonus", resourceId: "grain", amount: 1 }]
      },
      forge: {
        id: "forge",
        name: "Forge",
        costNotes: 12,
        costCoins: 3,
        description: "Adds +1 Iron whenever this player produces Iron.",
        effects: [{ type: "productionBonus", resourceId: "iron", amount: 1 }]
      },
      warehouse: {
        id: "warehouse",
        name: "Warehouse",
        costNotes: 8,
        costCoins: 2,
        description: "Adds a small Wood production bump.",
        effects: [{ type: "productionBonus", resourceId: "wood", amount: 1 }]
      },
      "mint-press": {
        id: "mint-press",
        name: "Mint Press",
        costNotes: 14,
        costCoins: 4,
        description: "Represents better liquidity handling with higher deposit returns later.",
        effects: [{ type: "depositBonus", amount: 1 }]
      }
    }
  },
  round: {
    roundNumber: 1,
    phase: "policy",
    policyChairPlayerId: initialChair,
    firstTurnPlayerId: getLeftOfChair(initialChair),
    turnOrder: buildTurnOrder(initialChair),
    activeTurnIndex: 0,
    activePlayerId: null,
    activeTurnWindow: null,
    hasRoundEnded: false
  },
  policy: {
    policyRate: DEFAULT_POLICY_RATE,
    lifeCostIndex: 8.1,
    priceLevel: 1,
    chairHistory: [initialChair]
  },
  players: {
    "player-1": {
      id: "player-1",
      name: "River Syndicate",
      seat: 0,
      notes: 28,
      coins: 9,
      inventory: inventory({ grain: 3, wood: 2, iron: 1, energy: 1 }),
      loans: [
        {
          id: "loan-setup-1",
          playerId: "player-1",
          principal: 10,
          interestRate: 8,
          minimumPayment: 3,
          remainingBalance: 7,
          termRounds: 3,
          status: "active"
        }
      ],
      deposits: [
        {
          id: "deposit-setup-1",
          playerId: "player-1",
          amount: 6,
          interestRate: 3,
          maturityRound: 2,
          status: "active"
        }
      ],
      upgrades: [
        { upgradeId: "mill", isUnlocked: true, isUsedThisRound: false },
        { upgradeId: "warehouse", isUnlocked: false, isUsedThisRound: false }
      ],
      productionCapacity: capacity({ grain: 2, wood: 1, iron: 0, energy: 1 })
    },
    "player-2": {
      id: "player-2",
      name: "Foundry House",
      seat: 1,
      notes: 24,
      coins: 11,
      inventory: inventory({ grain: 1, wood: 3, iron: 3, energy: 2 }),
      loans: [
        {
          id: "loan-setup-2",
          playerId: "player-2",
          principal: 12,
          interestRate: 7,
          minimumPayment: 3,
          remainingBalance: 9,
          termRounds: 4,
          status: "active"
        }
      ],
      deposits: [
        {
          id: "deposit-setup-2",
          playerId: "player-2",
          amount: 4,
          interestRate: 4,
          maturityRound: 3,
          status: "active"
        }
      ],
      upgrades: [
        { upgradeId: "forge", isUnlocked: true, isUsedThisRound: false },
        { upgradeId: "mint-press", isUnlocked: false, isUsedThisRound: false }
      ],
      productionCapacity: capacity({ grain: 1, wood: 1, iron: 2, energy: 1 })
    }
  },
  resources: Object.fromEntries(
    RESOURCE_IDS.map((resourceId) => {
      const definition = {
        grain: { notes: 3, coins: 1, supply: 12 },
        wood: { notes: 4, coins: 1, supply: 10 },
        iron: { notes: 6, coins: 2, supply: 8 },
        energy: { notes: 5, coins: 2, supply: 9 }
      }[resourceId];

      return [
        resourceId,
        {
          resourceId,
          anchorPriceNotes: definition.notes,
          anchorPriceCoins: definition.coins,
          availableSupply: definition.supply,
          lastRoundDemand: 0,
          lastRoundProduced: 0
        }
      ];
    })
  ) as GameState["resources"],
  bankDemandDeck: [
    {
      id: "demand-card-1",
      title: "Winter Reserves",
      description: "The bank wants Grain and Energy to stabilize households.",
      resourceDemand: { grain: 3, energy: 2 },
      payoutMultiplier: 1.2,
      policyBias: "ease"
    },
    {
      id: "demand-card-2",
      title: "Rail Expansion",
      description: "The bank prioritizes Wood and Iron deliveries for public works.",
      resourceDemand: { wood: 3, iron: 2 },
      payoutMultiplier: 1.4,
      policyBias: "tighten"
    }
  ],
  activeDemandCardId: "demand-card-1",
  priceBook: {
    roundNumber: 1,
    trades: [],
    lastTradeByResource: {},
    averageUnitPriceNotesByResource: {},
    averageUnitPriceCoinsByResource: {}
  },
  turnLog: [
    {
      id: "log-setup-1",
      roundNumber: 1,
      phase: "policy",
      actor: "system",
      actionType: "startRound",
      message: "Prototype seed loaded with two firms, active credit, and dual-currency prices."
    }
  ]
};
