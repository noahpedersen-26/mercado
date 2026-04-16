import { applyAction } from "./transitions";
import { validateAction } from "./validation";
import type { Action, GameState } from "./types";

export function gameReducer(state: GameState, action: Action): GameState {
  const error = validateAction(state, action);

  if (error) {
    return {
      ...state,
      turnLog: [
        ...state.turnLog,
        {
          id: `log-${state.round.roundNumber}-${state.turnLog.length + 1}`,
          roundNumber: state.round.roundNumber,
          phase: state.round.phase,
          actor: "system",
          message: error
        }
      ]
    };
  }

  return applyAction(state, action);
}
