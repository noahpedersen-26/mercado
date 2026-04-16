import { ROUND_PHASES } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/types";

export function TurnTrack({ state }: { state: GameState }) {
  return (
    <section>
      <div className="zone-heading">
        <h3>Round Order</h3>
        <p>Policy Vote → Player Turns → Central Bank Turn → Settlement → Repricing / End Round / Rotate Chair</p>
      </div>
      <div className="track-row">
        {ROUND_PHASES.map((phase) => (
          <div key={phase} className={`track-space ${state.round.phase === phase ? "track-space-active" : ""}`}>
            <span>{phase}</span>
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
