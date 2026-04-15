import type { GameState } from "@/lib/game/types";

export function TurnOrderPanel({ state }: { state: GameState }) {
  return (
    <section className="panel">
      <h2>Turn Order</h2>
      <div className="mini-list">
        <div className="mini-card">
          <p>
            <span className="label">First This Round:</span> {state.players[state.round.firstTurnPlayerId].name}
          </p>
          <p>
            <span className="label">Active Index:</span> {state.round.activeTurnIndex}
          </p>
        </div>
        {state.round.turnOrder.map((playerId, index) => (
          <div key={playerId} className="mini-card">
            <p className="value-strong">
              {index + 1}. {state.players[playerId].name}
            </p>
            <p>Seat {state.players[playerId].seat}</p>
            <p>{state.round.activePlayerId === playerId ? "Currently acting" : "Waiting"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
