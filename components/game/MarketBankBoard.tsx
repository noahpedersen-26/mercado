"use client";

import { useMemo, useState } from "react";
import { POLICY_OPTIONS, RESOURCE_IDS } from "@/lib/game/constants";
import {
  selectCurrentBankBuyer,
  selectLifeCostIndex,
  selectNotesCreatedBreakdown,
  selectVisibleNotesPrices
} from "@/lib/game/selectors";
import { getLeftOfChair } from "@/lib/game/turn-order";
import type { Action, GameState, RateOption, ResourceId } from "@/lib/game/types";
import { BankDemandCard } from "./BankDemandCard";
import { CurrencyToken } from "./CurrencyToken";
import { PriceTrack } from "./PriceTrack";
import { TurnTrack } from "./TurnTrack";
import { UpgradeRow } from "./UpgradeRow";

function formatPhaseLabel(phase: GameState["round"]["phase"]) {
  switch (phase) {
    case "policyVote":
      return "Policy Vote";
    case "playerTurns":
      return "Player Turns";
    case "centralBank":
      return "Central Bank";
    case "settlement":
      return "Settlement";
    case "repricing":
      return "Repricing";
    default:
      return phase;
  }
}

function PhasePrompt({ state }: { state: GameState }) {
  const currentBuyer = selectCurrentBankBuyer(state);

  if (state.round.phase === "policyVote") {
    return <p>Vote 0%, 10%, or 20%. If split, {state.players[state.round.policyChairPlayerId].name} breaks the tie.</p>;
  }

  if (state.round.phase === "playerTurns") {
    return (
      <p>
        Follow turn order. The active player completes Production, then Market / Finance / Build from their personal mat.
      </p>
    );
  }

  if (state.round.phase === "centralBank") {
    return (
      <p>
        Reveal a demand card and buy starting left of the chair. Current seller:{" "}
        <strong>{currentBuyer ? state.players[currentBuyer].name : "None"}</strong>.
      </p>
    );
  }

  if (state.round.phase === "settlement") {
    return <p>Players now pay 2 Life Units, settle loan interest, and convert unpaid shortfalls into arrears.</p>;
  }

  return <p>Adjust Notes anchor prices from discovered trades and notes-created pressure, then rotate the chair.</p>;
}

export function MarketBankBoard({
  state,
  dispatch
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const [repricingResource, setRepricingResource] = useState<ResourceId>("grain");
  const [repricingValue, setRepricingValue] = useState(String(state.anchorNotesPrices.grain));
  const prices = selectVisibleNotesPrices(state);
  const lifeCostIndex = selectLifeCostIndex(state);
  const notesCreated = selectNotesCreatedBreakdown(state);
  const currentBuyer = selectCurrentBankBuyer(state);
  const leftOfChair = getLeftOfChair(state.playerOrder, state.round.policyChairPlayerId);
  const activeDemandCard = useMemo(
    () =>
      state.bankDemandDeck.find((card) => card.id === state.round.bankDemandCardId) ??
      state.discardedBankDemandCards.find((card) => card.id === state.round.bankDemandCardId) ??
      null,
    [state.bankDemandDeck, state.discardedBankDemandCards, state.round.bankDemandCardId]
  );

  return (
    <section className="board board-shared board-master">
      <div className="shared-board-frame">
        <div className="board-medallion">
          <span className="board-medallion-label">Round</span>
          <strong>{state.round.roundNumber}</strong>
        </div>

        <div className="shared-board-top">
          <div className={`board-compartment policy-compartment ${state.round.phase === "policyVote" ? "compartment-active" : ""}`}>
            <div className="compartment-heading-row">
              <div>
                <p className="eyebrow board-kicker">Shared Board</p>
                <h2>Bank &amp; Market Board</h2>
              </div>
              <div className="phase-chip">{formatPhaseLabel(state.round.phase)}</div>
            </div>

            <div className="policy-strip">
              <div className="marker-well">
                <span className="marker-label">Chair</span>
                <strong>{state.players[state.round.policyChairPlayerId].name}</strong>
              </div>
              <div className="marker-well">
                <span className="marker-label">Rate</span>
                <strong>{state.round.votedRate}%</strong>
              </div>
              <div className="policy-option-row">
                {POLICY_OPTIONS.map((option) => (
                  <div
                    key={option}
                    className={`policy-coin ${state.round.votedRate === option ? "policy-coin-active" : ""}`}
                  >
                    {option}%
                  </div>
                ))}
              </div>
            </div>

            {state.round.phase === "policyVote" ? (
              <div className="board-overlay action-overlay">
                <div className="overlay-heading">
                  <h3>Policy Vote</h3>
                  <p>Cast each vote on the board, then resolve the rate.</p>
                </div>
                <div className="vote-grid">
                  {state.playerOrder.map((playerId) => (
                    <div key={playerId} className="vote-card">
                      <span className="track-label">{state.players[playerId].name}</span>
                      <div className="scene-button-row">
                        {POLICY_OPTIONS.map((option) => (
                          <button
                            key={option}
                            onClick={() => dispatch({ type: "setPolicyVote", playerId, rate: option as RateOption })}
                          >
                            {option}%
                          </button>
                        ))}
                      </div>
                      <p className="tiny-note">Vote: {state.round.policyVotes[playerId] ?? "-"}</p>
                    </div>
                  ))}
                </div>
                <div className="scene-button-row">
                  <button onClick={() => dispatch({ type: "resolvePolicyVote" })}>Resolve Vote</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="board-compartment turn-order-compartment">
            <TurnTrack state={state} />
          </div>

          <div className="board-compartment bank-token-compartment">
            <div className="token-well-grid">
              <CurrencyToken label="Loan" value="10" tone="ivory" />
              <CurrencyToken label="Deposit" value="10" tone="ivory" />
              <CurrencyToken label="Notes Made" value={notesCreated.total} tone="brass" />
              <CurrencyToken label="Life Cost" value={lifeCostIndex} tone="red" />
            </div>
          </div>
        </div>

        <div className="shared-board-main">
          <div className="board-compartment price-grid-compartment">
            <div className="compartment-title-bar">
              <h3>Notes Price Board</h3>
              <p>Anchor prices and discovered market prices.</p>
            </div>
            <div className="price-grid-board">
              {RESOURCE_IDS.map((resourceId) => (
                <article key={resourceId} className="price-grid-tile">
                  <span className="price-grid-label">{state.config.resources[resourceId].name}</span>
                  <strong>{prices[resourceId].discovered ?? prices[resourceId].anchor}</strong>
                  <p>Anchor {prices[resourceId].anchor}</p>
                  <p>Found {prices[resourceId].discovered ?? "-"}</p>
                </article>
              ))}
            </div>
          </div>

          <div className={`board-compartment demand-compartment ${state.round.phase === "centralBank" ? "compartment-active" : ""}`}>
            <div className="compartment-title-bar">
              <h3>Central Bank Window</h3>
              <p>Demand card, buy order, and bank resolution.</p>
            </div>
            <BankDemandCard card={activeDemandCard} />
            <div className="bank-window-footer">
              <div className="mini-card">
                <p className="track-label">Left Of Chair</p>
                <p>{state.players[leftOfChair].name}</p>
              </div>
              <div className="mini-card">
                <p className="track-label">Current Seller</p>
                <p>{currentBuyer ? state.players[currentBuyer].name : "None"}</p>
              </div>
            </div>

            {state.round.phase === "centralBank" ? (
              <div className="board-overlay action-overlay">
                <div className="overlay-heading">
                  <h3>Central Bank Turn</h3>
                  <p>Reveal demand, then move seller by seller from left of chair.</p>
                </div>
                <div className="scene-button-row">
                  <button onClick={() => dispatch({ type: "revealBankDemandCard" })}>Reveal Demand</button>
                  <button onClick={() => dispatch({ type: "advanceBankBuyer" })}>Advance Seller</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="shared-board-bottom">
          <div className="board-compartment notes-track-compartment">
            <PriceTrack prices={prices} definitions={state.config.resources} />
          </div>

          <div className={`board-compartment upgrade-compartment ${state.round.phase === "playerTurns" ? "compartment-active" : ""}`}>
            <UpgradeRow cards={state.upgradeMarketRow} />
          </div>

          <div
            className={`board-compartment settlement-compartment ${
              state.round.phase === "settlement" || state.round.phase === "repricing" ? "compartment-active" : ""
            }`}
          >
            <div className="compartment-title-bar">
              <h3>Bank Ledger</h3>
              <p>Settlement, repricing pressure, and round reset.</p>
            </div>

            <div className="ledger-stack">
              <div className="ledger-row">
                <CurrencyToken label="Loans" value={notesCreated.loansIssued} tone="ivory" />
                <CurrencyToken label="Bank Buys" value={notesCreated.bankPurchases} tone="ivory" />
              </div>

              <div className="mini-card phase-prompt-card">
                <p className="track-label">Current Prompt</p>
                <PhasePrompt state={state} />
              </div>
            </div>

            {state.round.phase === "repricing" ? (
              <div className="board-overlay action-overlay">
                <div className="overlay-heading">
                  <h3>Repricing / End Round</h3>
                  <p>Set anchor prices manually, then rotate the chair into the next round.</p>
                </div>
                <div className="scene-form-grid">
                  <label className="control-stack">
                    <span>Good</span>
                    <select value={repricingResource} onChange={(event) => setRepricingResource(event.target.value as ResourceId)}>
                      {RESOURCE_IDS.map((resourceId) => (
                        <option key={resourceId} value={resourceId}>
                          {state.config.resources[resourceId].name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="control-stack">
                    <span>Anchor Notes</span>
                    <input
                      type="number"
                      min="1"
                      value={repricingValue}
                      onChange={(event) => setRepricingValue(event.target.value)}
                    />
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
                  <button onClick={() => dispatch({ type: "endRound" })}>End Round</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
