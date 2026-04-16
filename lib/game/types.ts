export type PlayerId = string;
export type ResourceId = "grain" | "fuel" | "lumber" | "labor";
export type RoleId = "farmer" | "refiner" | "builder" | "organizer";
export type RateOption = 0 | 10 | 20;
export type RoundPhase = "policyVote" | "playerTurns" | "centralBank" | "settlement" | "repricing";
export type PlayerTurnStage = "production" | "market";
export type UpgradeType = "grain-mill" | "fuel-rig" | "sawmill" | "hiring-office";
export type LifePaymentKind = "grain" | "fuel" | "notes";

export interface ResourceDefinition {
  id: ResourceId;
  name: string;
  shortLabel: string;
}

export interface RoleDefinition {
  id: RoleId;
  name: string;
  specialty: ResourceId;
  description: string;
}

export interface UpgradeCard {
  id: string;
  type: UpgradeType;
  name: string;
  resourceId: ResourceId;
  description: string;
  costNotes: number;
}

export interface LoanToken {
  id: string;
  issuedRound: number;
  principal: 10;
}

export interface DepositToken {
  id: string;
  issuedRound: number;
  maturesRound: number;
  returnAmount: 10 | 11 | 12;
}

export interface BankDemandCard {
  id: string;
  title: string;
  description: string;
  demand: Partial<Record<ResourceId, number>>;
}

export interface TradeRecord {
  id: string;
  roundNumber: number;
  initiatorPlayerId: PlayerId;
  otherPlayerId: PlayerId;
  resourceId: ResourceId;
  quantity: number;
  totalNotes: number;
  totalBits: number;
  discoveredNotesPrice: number | null;
}

export interface TurnActivity {
  normalProductionActionsUsed: number;
  flexProductionUsed: boolean;
  loanTakenThisTurn: boolean;
  depositMadeThisTurn: boolean;
  upgradeBoughtThisTurn: boolean;
  firstUpgradeBoostUsed: Partial<Record<ResourceId, boolean>>;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  role: RoleId;
  notes: number;
  bits: number;
  goods: Record<ResourceId, number>;
  loans: LoanToken[];
  deposits: DepositToken[];
  arrears: number;
  ownedUpgrades: UpgradeCard[];
  satisfiedUpkeepLastRound: boolean;
  satisfiedUpkeepThisRound: boolean;
  turnActivity: TurnActivity;
}

export interface SettlementState {
  lifeUnitsPaid: number;
  interestPaidLoanIds: string[];
}

export interface RoundState {
  roundNumber: number;
  phase: RoundPhase;
  policyChairPlayerId: PlayerId;
  turnOrder: PlayerId[];
  activePlayerIndex: number;
  activePlayerId: PlayerId | null;
  activePlayerStage: PlayerTurnStage | null;
  policyVotes: Partial<Record<PlayerId, RateOption>>;
  votedRate: RateOption;
  discoveredNotesPrices: Partial<Record<ResourceId, number>>;
  bankDemandCardId: string | null;
  bankBuyOrderIndex: number;
  notesCreatedThisRound: number;
  settlement: Record<PlayerId, SettlementState>;
}

export interface TurnLogEntry {
  id: string;
  roundNumber: number;
  phase: RoundPhase;
  actor: PlayerId | "bank" | "system";
  message: string;
}

export interface GameConfig {
  resources: Record<ResourceId, ResourceDefinition>;
  roles: Record<RoleId, RoleDefinition>;
}

export interface GameState {
  config: GameConfig;
  players: Record<PlayerId, PlayerState>;
  playerOrder: PlayerId[];
  round: RoundState;
  anchorNotesPrices: Record<ResourceId, number>;
  bankDemandDeck: BankDemandCard[];
  discardedBankDemandCards: BankDemandCard[];
  upgradeDeck: UpgradeCard[];
  upgradeMarketRow: UpgradeCard[];
  tradeLog: TradeRecord[];
  turnLog: TurnLogEntry[];
}

export type Action =
  | { type: "setPolicyVote"; playerId: PlayerId; rate: RateOption }
  | { type: "resolvePolicyVote" }
  | { type: "produceGood"; playerId: PlayerId; resourceId: ResourceId; useFlex?: boolean }
  | {
      type: "recordTrade";
      initiatorPlayerId: PlayerId;
      otherPlayerId: PlayerId;
      resourceId: ResourceId;
      quantity: number;
      totalNotes: number;
      totalBits: number;
    }
  | { type: "takeLoan"; playerId: PlayerId }
  | { type: "createDeposit"; playerId: PlayerId }
  | { type: "repayLoan"; playerId: PlayerId; loanId: string }
  | { type: "buyUpgrade"; playerId: PlayerId; upgradeCardId: string }
  | { type: "advancePlayerStage" }
  | { type: "endPlayerTurn" }
  | { type: "revealBankDemandCard" }
  | { type: "bankBuy"; playerId: PlayerId; resourceId: ResourceId; quantity: number }
  | { type: "advanceBankBuyer" }
  | { type: "payLife"; playerId: PlayerId; payment: LifePaymentKind }
  | { type: "payLoanInterest"; playerId: PlayerId; loanId: string }
  | {
      type: "resolveInterestShortfall";
      playerId: PlayerId;
      loanId: string;
      surrenderedLabel: string;
      auctionProceeds: number;
    }
  | { type: "setAnchorPrice"; resourceId: ResourceId; price: number }
  | { type: "endRound" };
