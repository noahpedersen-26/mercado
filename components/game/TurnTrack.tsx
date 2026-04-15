import type { GameState } from "@/lib/game/types";

export function TurnTrack({ state }: { state: GameState }) {
  const phases = ["policy", "playerTurns", "settlement", "upkeep", "roundEnd"];

  return (
    <section>
      <div className="zone-heading">
        <h3>Turn Track</h3>
        <p>Round flow and who currently has the table.</p>
      </div>
      <div className="track-row">
        {phases.map((phase) => (
          <div
            key={phase}
            className={`track-space ${state.round.phase === phase ? "track-space-active" : ""}`}
          >
            <span>{phase}</span>
          </div>
        ))}
      </div>
      <div className="turn-order-row">
        {state.round.turnOrder.map((playerId, index) => (
          <div
            key={playerId}
            className={`turn-marker ${state.round.activePlayerId === playerId ? "turn-marker-active" : ""}`}
          >
            <span>{index + 1}</span>
            <strong>{state.players[playerId].name}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
