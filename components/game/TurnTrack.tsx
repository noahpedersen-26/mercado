import { ROUND_PHASES } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/types";

function formatPhaseLabel(phase: GameState["round"]["phase"]) {
  switch (phase) {
    case "policyVote":
      return "Policy";
    case "playerTurns":
      return "Player Turns";
    case "centralBank":
      return "Bank";
    case "settlement":
      return "Settlement";
    case "repricing":
      return "Repricing";
    default:
      return phase;
  }
}

export function TurnTrack({ state }: { state: GameState }) {
  return (
    <section className="turn-track-board">
      <div className="zone-heading">
        <h3>Round Order</h3>
        <p>Policy → Players → Bank → Settlement → Repricing</p>
      </div>
      <div className="track-row">
        {ROUND_PHASES.map((phase) => (
          <div key={phase} className={`track-space ${state.round.phase === phase ? "track-space-active" : ""}`}>
            <span>{formatPhaseLabel(phase)}</span>
          </div>
        ))}
      </div>
      <div className="turn-order-row">
        {state.round.turnOrder.map((playerId, index) => (
          <div key={playerId} className={`turn-marker ${state.round.activePlayerId === playerId ? "turn-marker-active" : ""}`}>
            <span>{index + 1}</span>
            <strong>{state.players[playerId].name}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
