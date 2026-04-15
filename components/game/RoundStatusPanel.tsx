import type { GameState } from "@/lib/game/types";

export function RoundStatusPanel({
  state,
  lifeCostIndex
}: {
  state: GameState;
  lifeCostIndex: number;
}) {
  return (
    <section className="panel">
      <h2>Round Status</h2>
      <div className="data-list">
        <div className="stat-row">
          <span className="label">Round</span>
          <span className="value-strong">{state.round.roundNumber}</span>
        </div>
        <div className="stat-row">
          <span className="label">Phase</span>
          <span className="badge">{state.round.phase}</span>
        </div>
        <div className="stat-row">
          <span className="label">Active Player</span>
          <span>{state.round.activePlayerId ? state.players[state.round.activePlayerId].name : "None"}</span>
        </div>
        <div className="stat-row">
          <span className="label">Turn Step</span>
          <span>{state.round.activeTurnWindow?.step ?? "None"}</span>
        </div>
        <div className="stat-row">
          <span className="label">Life Cost Index</span>
          <span className="value-strong">{lifeCostIndex.toFixed(2)}</span>
        </div>
      </div>
    </section>
  );
}
