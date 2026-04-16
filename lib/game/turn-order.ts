import type { PlayerId } from "./types";

export function getLeftOfChair(playerOrder: PlayerId[], chairPlayerId: PlayerId): PlayerId {
  const index = playerOrder.indexOf(chairPlayerId);
  return playerOrder[(index + 1) % playerOrder.length];
}

export function buildTurnOrder(playerOrder: PlayerId[], chairPlayerId: PlayerId): PlayerId[] {
  const firstPlayer = getLeftOfChair(playerOrder, chairPlayerId);
  const firstIndex = playerOrder.indexOf(firstPlayer);
  return playerOrder.slice(firstIndex).concat(playerOrder.slice(0, firstIndex));
}

export function rotateChair(playerOrder: PlayerId[], currentChair: PlayerId): PlayerId {
  return getLeftOfChair(playerOrder, currentChair);
}
