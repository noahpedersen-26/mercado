"use client";

import type { Action, GameState } from "@/lib/game/types";

export function PhaseControls({
  state,
  dispatch
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <section className="panel">
      <h2>Round Controls</h2>
      <div className="button-grid">
        <button onClick={() => dispatch({ type: "startRound" })}>Start Round</button>
        <button onClick={() => dispatch({ type: "startPlayerTurns" })}>Start Player Turns</button>
        <button onClick={() => dispatch({ type: "advancePhase" })} disabled={state.round.phase === "policy"}>
          Advance Phase
        </button>
        <button onClick={() => dispatch({ type: "endRound" })}>End Round</button>
      </div>
      <p className="label">Use Start Round during policy setup, then Start Player Turns once the chair and demand card are ready.</p>
    </section>
  );
}
