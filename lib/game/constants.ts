import type { PlayerId, ResourceId, RoundPhase, TurnStep } from "./types";

export const ROUND_PHASES: RoundPhase[] = [
  "policy",
  "playerTurns",
  "settlement",
  "upkeep",
  "roundEnd"
];

export const TURN_STEPS: TurnStep[] = ["produce", "finance", "upgrades", "trade", "complete"];

export const PLAYER_ORDER: PlayerId[] = ["player-1", "player-2"];

export const RESOURCE_IDS: ResourceId[] = ["grain", "wood", "iron", "energy"];

export const DEFAULT_POLICY_RATE = 5;
export const DEFAULT_LOAN_INTEREST_RATE = 8;
export const DEFAULT_DEPOSIT_INTEREST_RATE = 3;
