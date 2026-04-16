"use client";

import { useState } from "react";
import { POLICY_OPTIONS, RESOURCE_IDS } from "@/lib/game/constants";
import {
  selectCurrentBankBuyer,
  selectLifeCostIndex,
  selectNotesCreatedBreakdown,
  selectVisibleNotesPrices
} from "@/lib/game/selectors";
import { getLeftOfChair } from "@/lib/game/turn-order";
import type { Action, GameState, ResourceId } from "@/lib/game/types";
import { ActionPanel } from "./ActionPanel";
import { BankDemandCard } from "./BankDemandCard";
import { CurrencyToken } from "./CurrencyToken";
import { PriceTrack } from "./PriceTrack";
import { ResourceTokenGroup } from "./ResourceTokenGroup";
import { TurnTrack } from "./TurnTrack";
import { UpgradeRow } from "./UpgradeRow";

function SharedStatusStrip({ state }: { state: GameState }) {
  const lifeCostIndex = selectLifeCostIndex(state);
  const currentBankBuyer = selectCurrentBankBuyer(state);

  return (
    <div className="shared-status-strip">
      <CurrencyToken label="Round" value={state.round.roundNumber} tone="ivory" />
      <CurrencyToken label="Phase" value={state.round.phase} tone="ivory" />
      <CurrencyToken label="Life Cost" value={lifeCostIndex} tone="ivory" />
      <CurrencyToken label="Rate" value={`${state.round.votedRate}%`} tone="red" />
      <CurrencyToken label="Chair" value={state.players[state.round.policyChairPlayerId].name} tone="brass" />
      <CurrencyToken
        label="Bank Buyer"
        value={currentBankBuyer ? state.players[currentBankBuyer].name : "-"}
        tone="brass"
      />
    </div>
  );
}

function PhaseScene({
  state,
  dispatch
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const [repricingResource, setRepricingResource] = useState<ResourceId>("grain");
  const [repricingValue, setRepricingValue] = useState(String(state.anchorNotesPrices.grain));
  const prices = selectVisibleNotesPrices(state);
  const notesCreated = selectNotesCreatedBreakdown(state);
  const currentBankBuyer = selectCurrentBankBuyer(state);
  const activeDemandCard =
    state.bankDemandDeck.find((card) => card.id === state.round.bankDemandCardId) ??
    state.discardedBankDemandCards.find((card) => card.id === state.round.bankDemandCardId) ??
    null;

  if (state.round.phase === "policyVote") {
    return (
      <section className="phase-scene">
        <ActionPanel title="Policy Vote" subtitle="This round starts with a single visible vote scene." tone="bank">
          <div className="scene-grid-wide">
            {state.playerOrder.map((playerId) => (
              <div key={playerId} className="track-card">
                <span className="track-label">{state.players[playerId].name}</span>
                <div className="scene-button-row">
                  {POLICY_OPTIONS.map((option) => (
                    <button key={option} onClick={() => dispatch({ type: "setPolicyVote", playerId, rate: option })}>
                      {option}%
                    </button>
                  ))}
                </div>
                <p className="tiny-note">Current vote: {state.round.policyVotes[playerId] ?? "-"}</p>
              </div>
            ))}
          </div>
          <div className="scene-button-row">
            <button onClick={() => dispatch({ type: "resolvePolicyVote" })}>Resolve Policy Vote</button>
          </div>
        </ActionPanel>
      </section>
    );
  }

  if (state.round.phase === "centralBank") {
    return (
      <section className="phase-scene">
        <ActionPanel
          title="Central Bank Turn"
          subtitle="Reveal the demand card, then buy from players in order starting left of the chair."
          tone="bank"
        >
          <div className="scene-split">
            <BankDemandCard card={activeDemandCard} />
            <div className="scene-stack">
              <div className="mini-card">
                <p>
                  Left of Chair: <strong>{state.players[getLeftOfChair(state.playerOrder, state.round.policyChairPlayerId)].name}</strong>
                </p>
                <p>
                  Current Bank Buyer: <strong>{currentBankBuyer ? state.players[currentBankBuyer].name : "None"}</strong>
                </p>
              </div>
              <ResourceTokenGroup
                title="Current Demand"
                resources={{
                  grain: activeDemandCard?.demand.grain ?? 0,
                  fuel: activeDemandCard?.demand.fuel ?? 0,
                  lumber: activeDemandCard?.demand.lumber ?? 0,
                  labor: activeDemandCard?.demand.labor ?? 0
                }}
                definitions={state.config.resources}
                tone="supply"
              />
              <div className="scene-button-row">
                <button onClick={() => dispatch({ type: "revealBankDemandCard" })}>Reveal Demand</button>
                <button onClick={() => dispatch({ type: "advanceBankBuyer" })}>Advance Buyer</button>
              </div>
            </div>
          </div>
        </ActionPanel>
      </section>
    );
  }

  if (state.round.phase === "settlement") {
    return (
      <section className="phase-scene">
        <ActionPanel
          title="Settlement"
          subtitle="The table is now in upkeep resolution. Pay life, resolve interest, and track arrears on player boards."
          tone="bank"
        >
          <div className="scene-grid-wide">
            {state.playerOrder.map((playerId) => (
              <div key={playerId} className="mini-card">
                <p className="track-label">{state.players[playerId].name}</p>
                <p>Life Paid: {state.round.settlement[playerId].lifeUnitsPaid}/2</p>
                <p>Interest Resolved: {state.round.settlement[playerId].interestPaidLoanIds.length}</p>
                <p>Arrears: {state.players[playerId].arrears}</p>
              </div>
            ))}
          </div>
        </ActionPanel>
      </section>
    );
  }

  if (state.round.phase === "repricing") {
    return (
      <section className="phase-scene">
        <ActionPanel
          title="Repricing / End Round"
          subtitle="Adjust anchors manually from the shared board using notes-created pressure and discovered prices."
          tone="bank"
        >
          <div className="scene-split">
            <div className="scene-stack">
              <div className="shared-status-strip">
                <CurrencyToken label="Loans Issued" value={notesCreated.loansIssued} tone="ivory" />
                <CurrencyToken label="Bank Buys" value={notesCreated.bankPurchases} tone="ivory" />
                <CurrencyToken label="Notes Created" value={notesCreated.total} tone="brass" />
              </div>
              <div className="scene-form-grid">
                <label className="control-stack">
                  <span>Anchor Good</span>
                  <select value={repricingResource} onChange={(event) => setRepricingResource(event.target.value as ResourceId)}>
                    {RESOURCE_IDS.map((resourceId) => (
                      <option key={resourceId} value={resourceId}>
                        {state.config.resources[resourceId].name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="control-stack">
                  <span>New Anchor Price</span>
                  <input value={repricingValue} onChange={(event) => setRepricingValue(event.target.value)} type="number" min="1" />
                </label>
              </div>
              <div className="scene-button-row">
                <button
                  onClick={() =>
                    dispatch({
                      type: "setAnchorPrice",
                      resourceId: repricingResource,
                      price: Number(repricingValue)
                    })
                  }
                >
                  Set Anchor
                </button>
                <button onClick={() => dispatch({ type: "endRound" })}>End Round / Rotate Chair</button>
              </div>
            </div>
            <PriceTrack prices={prices} definitions={state.config.resources} />
          </div>
        </ActionPanel>
      </section>
    );
  }

  return (
    <section className="phase-scene">
      <ActionPanel
        title="Shared Board Snapshot"
        subtitle="During player turns, the shared board stays compressed: turn order, prices, and the upgrade market stay visible without taking over the screen."
        tone="bank"
      >
        <div className="scene-split">
          <div className="scene-stack">
            <TurnTrack state={state} />
            <PriceTrack prices={prices} definitions={state.config.resources} />
          </div>
          <UpgradeRow cards={state.upgradeMarketRow} />
        </div>
      </ActionPanel>
    </section>
  );
}

export function MarketBankBoard({
  state,
  dispatch,
  compact = false
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  compact?: boolean;
}) {
  return (
    <section className={`board shared-board ${compact ? "shared-board-compact" : ""}`}>
      <div className="board-header">
        <div>
          <p className="eyebrow">Shared Board</p>
          <h2>Table State</h2>
          <p className="board-subtitle">One active shared scene at a time, with the rest collapsed into concise status.</p>
        </div>
      </div>

      <SharedStatusStrip state={state} />
      <PhaseScene state={state} dispatch={dispatch} />
    </section>
  );
}
