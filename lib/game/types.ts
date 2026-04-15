export type PlayerId = "player-1" | "player-2";
export type ResourceId = "grain" | "wood" | "iron" | "energy";
export type UpgradeId = "mill" | "forge" | "warehouse" | "mint-press";
export type LoanId = string;
export type DepositId = string;
export type BankDemandCardId = string;
export type TradeRecordId = string;
export type TurnLogEntryId = string;

export type SeatPosition = 0 | 1;

export type RoundPhase =
  | "policy"
  | "playerTurns"
  | "settlement"
  | "upkeep"
  | "roundEnd";

export type TurnStep = "produce" | "finance" | "upgrades" | "trade" | "complete";

export type ActorId = PlayerId | "bank" | "system";

export interface ResourceDefinition {
  id: ResourceId;
  name: string;
  category: "food" | "materials" | "industry" | "utility";
  baseAnchorPriceNotes: number;
  baseAnchorPriceCoins: number;
  startingSupply: number;
  lifeCostWeight: number;
  canBeProduced: boolean;
}

export interface ResourceMarketState {
  resourceId: ResourceId;
  anchorPriceNotes: number;
  anchorPriceCoins: number;
  availableSupply: number;
  lastRoundDemand: number;
  lastRoundProduced: number;
}

export type Inventory = Record<ResourceId, number>;
export type ProductionCapacity = Record<ResourceId, number>;

export interface UpgradeEffect {
  type: "productionBonus" | "priceSupport" | "depositBonus";
  resourceId?: ResourceId;
  amount: number;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  costNotes: number;
  costCoins: number;
  description: string;
  effects: UpgradeEffect[];
}

export interface PlayerUpgradeState {
  upgradeId: UpgradeId;
  isUnlocked: boolean;
  isUsedThisRound: boolean;
}

export interface Loan {
  id: LoanId;
  playerId: PlayerId;
  principal: number;
  interestRate: number;
  minimumPayment: number;
  remainingBalance: number;
  termRounds?: number;
  status: "active" | "repaid";
}

export interface Deposit {
  id: DepositId;
  playerId: PlayerId;
  amount: number;
  interestRate: number;
  maturityRound?: number;
  status: "active" | "withdrawn";
}

export interface BankDemandCard {
  id: BankDemandCardId;
  title: string;
  description: string;
  resourceDemand: Partial<Record<ResourceId, number>>;
  payoutMultiplier: number;
  policyBias?: "tighten" | "ease" | "neutral";
}

export interface TradeQuote {
  resourceId: ResourceId;
  quantity: number;
  unitPriceNotes: number;
  unitPriceCoins: number;
}

export interface TradeRecord {
  id: TradeRecordId;
  roundNumber: number;
  phase: RoundPhase;
  buyerPlayerId: PlayerId;
  sellerPlayerId: PlayerId;
  resourceId: ResourceId;
  quantity: number;
  unitPriceNotes: number;
  unitPriceCoins: number;
  totalNotes: number;
  totalCoins: number;
}

export interface RoundPriceBook {
  roundNumber: number;
  trades: TradeRecord[];
  lastTradeByResource: Partial<Record<ResourceId, TradeRecord>>;
  averageUnitPriceNotesByResource: Partial<Record<ResourceId, number>>;
  averageUnitPriceCoinsByResource: Partial<Record<ResourceId, number>>;
}

export interface PolicyState {
  policyRate: number;
  lifeCostIndex: number;
  priceLevel: number;
  chairHistory: PlayerId[];
}

export interface TurnWindow {
  playerId: PlayerId;
  step: TurnStep;
  actionsTaken: number;
}

export interface RoundState {
  roundNumber: number;
  phase: RoundPhase;
  policyChairPlayerId: PlayerId;
  firstTurnPlayerId: PlayerId;
  turnOrder: PlayerId[];
  activeTurnIndex: number;
  activePlayerId: PlayerId | null;
  activeTurnWindow: TurnWindow | null;
  hasRoundEnded: boolean;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  seat: SeatPosition;
  notes: number;
  coins: number;
  inventory: Inventory;
  loans: Loan[];
  deposits: Deposit[];
  upgrades: PlayerUpgradeState[];
  productionCapacity: ProductionCapacity;
}

export interface GameConfig {
  resourceDefinitions: Record<ResourceId, ResourceDefinition>;
  upgradeDefinitions: Record<UpgradeId, UpgradeDefinition>;
  playerOrder: PlayerId[];
}

export interface TurnLogEntry {
  id: TurnLogEntryId;
  roundNumber: number;
  phase: RoundPhase;
  actor: ActorId;
  message: string;
  actionType: Action["type"];
}

export interface GameState {
  config: GameConfig;
  round: RoundState;
  policy: PolicyState;
  players: Record<PlayerId, PlayerState>;
  resources: Record<ResourceId, ResourceMarketState>;
  bankDemandDeck: BankDemandCard[];
  activeDemandCardId: BankDemandCardId | null;
  priceBook: RoundPriceBook;
  turnLog: TurnLogEntry[];
}

export interface ActionResult {
  ok: boolean;
  reason?: string;
}

export type Action =
  | { type: "startRound" }
  | { type: "rotateChair" }
  | { type: "setPolicyRate"; rate: number }
  | { type: "drawDemandCard" }
  | { type: "startPlayerTurns" }
  | { type: "produceResource"; playerId: PlayerId; resourceId: ResourceId; quantity: number }
  | { type: "takeLoan"; playerId: PlayerId; amount: number; interestRate?: number; minimumPayment?: number }
  | { type: "repayLoan"; playerId: PlayerId; loanId: LoanId; amount: number }
  | { type: "createDeposit"; playerId: PlayerId; amount: number; interestRate?: number }
  | { type: "withdrawDeposit"; playerId: PlayerId; depositId: DepositId }
  | { type: "buyUpgrade"; playerId: PlayerId; upgradeId: UpgradeId }
  | {
      type: "recordTrade";
      buyerPlayerId: PlayerId;
      sellerPlayerId: PlayerId;
      resourceId: ResourceId;
      quantity: number;
      unitPriceNotes: number;
      unitPriceCoins: number;
    }
  | { type: "advanceTurnStep" }
  | { type: "endPlayerTurn" }
  | { type: "advancePhase" }
  | { type: "endRound" };
