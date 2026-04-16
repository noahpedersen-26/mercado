import type { GameState } from "@/lib/game/types";

export function PolicyTrack({ state }: { state: GameState }) {
  return (
    <section>
      <div className="zone-heading">
        <h3>Policy Track</h3>
        <p>Only 0%, 10%, or 20% are valid policy outcomes. The chair breaks ties.</p>
      </div>
      <div className="policy-track-grid">
        <div className="track-card">
          <span className="track-label">Policy Chair</span>
          <strong>{state.players[state.round.policyChairPlayerId].name}</strong>
        </div>
        <div className="track-card">
          <span className="track-label">Current Voted Rate</span>
          <strong>{state.round.votedRate}%</strong>
        </div>
        <div className="track-card">
          <span className="track-label">Tie Break</span>
          <strong>{state.players[state.round.policyChairPlayerId].name}</strong>
        </div>
      </div>
    </section>
  );
}
