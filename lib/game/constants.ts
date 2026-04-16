import type { RateOption, ResourceId, RoleId, RoundPhase, UpgradeType } from "./types";

export const RESOURCE_IDS: ResourceId[] = ["grain", "fuel", "lumber", "labor"];
export const ROLE_IDS: RoleId[] = ["farmer", "refiner", "builder", "organizer"];
export const ROUND_PHASES: RoundPhase[] = ["policyVote", "playerTurns", "centralBank", "settlement", "repricing"];
export const POLICY_OPTIONS: RateOption[] = [0, 10, 20];
export const UPGRADE_TYPES: UpgradeType[] = ["grain-mill", "fuel-rig", "sawmill", "hiring-office"];
export const LOAN_PRINCIPAL = 10;
export const DEPOSIT_PRINCIPAL = 10;
