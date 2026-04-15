"use client";

import { useState } from "react";
import { getLeftOfChair } from "@/lib/game/turn-order";
import type { Action, GameState } from "@/lib/game/types";

export function PolicyPanel({
  state,
  dispatch
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const [rateInput, setRateInput] = useState(state.policy.policyRate.toString());
  const chair = state.players[state.round.policyChairPlayerId];
  const leftOfChair = state.players[getLeftOfChair(state.round.policyChairPlayerId)];
  const activeCard = state.bankDemandDeck.find((card) => card.id === state.activeDemandCardId) ?? null;

  return (
    <section className="panel">
      <h2>Policy</h2>
      <div className="data-list">
        <div className="stat-row">
          <span className="label">Policy Chair</span>
          <span>{chair.name}</span>
        </div>
        <div className="stat-row">
          <span className="label">Left of Chair</span>
          <span>{leftOfChair.name}</span>
        </div>
        <div className="stat-row">
          <span className="label">Policy Rate</span>
          <span>{state.policy.policyRate.toFixed(2)}%</span>
        </div>
      </div>

      <div className="section-divider stack">
        <label className="field-grid">
          <span className="label">Set Policy Rate</span>
          <input value={rateInput} onChange={(event) => setRateInput(event.target.value)} type="number" step="0.25" />
        </label>
        <div className="button-grid">
          <button onClick={() => dispatch({ type: "setPolicyRate", rate: Number(rateInput) })}>Apply Rate</button>
          <button onClick={() => dispatch({ type: "drawDemandCard" })}>Draw Demand Card</button>
          <button onClick={() => dispatch({ type: "rotateChair" })}>Rotate Chair</button>
        </div>
      </div>

      <div className="section-divider">
        <h3>Bank Demand Card</h3>
        {activeCard ? (
          <div className="mini-card">
            <p className="value-strong">{activeCard.title}</p>
            <p>{activeCard.description}</p>
            <p>
              Demand:{" "}
              {Object.entries(activeCard.resourceDemand)
                .map(([resourceId, amount]) => `${resourceId} ${amount}`)
                .join(", ")}
            </p>
            <p>Payout Multiplier: {activeCard.payoutMultiplier}x</p>
          </div>
        ) : (
          <p className="warn">No demand card revealed.</p>
        )}
      </div>
    </section>
  );
}
