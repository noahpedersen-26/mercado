import { PLAYER_ORDER } from "./constants";
import type { PlayerId } from "./types";

export function getLeftOfChair(chairPlayerId: PlayerId): PlayerId {
  const index = PLAYER_ORDER.indexOf(chairPlayerId);
  return PLAYER_ORDER[(index + 1) % PLAYER_ORDER.length];
}

export function buildTurnOrder(chairPlayerId: PlayerId): PlayerId[] {
  const firstPlayerId = getLeftOfChair(chairPlayerId);
  const firstIndex = PLAYER_ORDER.indexOf(firstPlayerId);

  return PLAYER_ORDER.slice(firstIndex).concat(PLAYER_ORDER.slice(0, firstIndex));
}

export function rotateChair(currentChair: PlayerId): PlayerId {
  return getLeftOfChair(currentChair);
}
