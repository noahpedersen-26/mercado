"use client";

import { useState } from "react";
import { POLICY_OPTIONS, RESOURCE_IDS } from "@/lib/game/constants";
import { selectCurrentBankBuyer, selectLifeCostIndex, selectNotesCreatedBreakdown, selectVisibleNotesPrices } from "@/lib/game/selectors";
import { getLeftOfChair } from "@/lib/game/turn-order";
import type { Action, GameState, PlayerId, RateOption, ResourceId } from "@/lib/game/types";
import { ActionPanel } from "./ActionPanel";
import { BankDemandCard } from "./BankDemandCard";
import { CurrencyToken } from "./CurrencyToken";
import { PolicyTrack } from "./PolicyTrack";
import { PriceTrack } from "./PriceTrack";
import { ResourceTokenGroup } from "./ResourceTokenGroup";
import { TurnTrack } from "./TurnTrack";
import { UpgradeRow } from "./UpgradeRow";

export function MarketBankBoard({
  state,
  dispatch
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const [repricingResource, setRepricingResource] = useState<ResourceId>("grain");
  const [repricingValue, setRepricingValue] = useState(String(state.anchorNotesPrices.grain));
  const lifeCostIndex = selectLifeCostIndex(state);
  const prices = selectVisibleNotesPrices(state);
  const currentBankBuyer = selectCurrentBankBuyer(state);
  const notesCreated = selectNotesCreatedBreakdown(state);
  const activeDemandCard =
    state.bankDemandDeck.find((card) => card.id === state.round.bankDemandCardId) ??
    state.discardedBankDemandCards.find((card) => card.id === state.round.bankDemandCardId) ??
    null;

  return (
    <section className="board shared-board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Shared Board</p>
          <h2>Market / Bank Board</h2>
          <p className="board-subtitle">Policy vote, Notes prices, bank demand, upgrade row, and repricing pressure.</p>
        </div>
        <div className="board-header-stats">
          <CurrencyToken label="Life Cost Index" value={lifeCostIndex} tone="ivory" />
          <CurrencyToken label="Voted Rate" value={`${state.round.votedRate}%`} tone="red" />
          <CurrencyToken label="Notes Created" value={state.round.notesCreatedThisRound} tone="brass" />
        </div>
      </div>

      <div className="shared-board-grid">
        <div className="board-zone board-zone-main">
          <TurnTrack state={state} />
          <PolicyTrack state={state} />
          <BankDemandCard card={activeDemandCard} />
          <PriceTrack prices={prices} definitions={state.config.resources} />
        </div>

        <div className="board-zone board-zone-side">
          <ActionPanel title="Policy Vote" subtitle="Each player votes 0%, 10%, or 20%. The chair breaks ties." tone="bank">
            <div className="vote-row">
              {state.playerOrder.map((playerId) => (
                <div key={playerId} className="track-card">
                  <span className="track-label">{state.players[playerId].name}</span>
                  <div className="embedded-action-row">
                    {POLICY_OPTIONS.map((option) => (
                      <button key={option} onClick={() => dispatch({ type: "setPolicyVote", playerId, rate: option })}>
                        {option}%
                      </button>
                    ))}
                  </div>
                  <p className="tiny-note">Vote: {state.round.policyVotes[playerId] ?? "-"}</p>
                </div>
              ))}
              <button onClick={() => dispatch({ type: "resolvePolicyVote" })}>Resolve Vote</button>
            </div>
          </ActionPanel>

          <ActionPanel title="Central Bank Area" subtitle="Reveal demand, buy in order from left of chair, then advance." tone="bank">
            <div className="mini-card">
              <p>
                Policy Chair: <strong>{state.players[state.round.policyChairPlayerId].name}</strong>
              </p>
              <p>
                Left of Chair: <strong>{state.players[getLeftOfChair(state.playerOrder, state.round.policyChairPlayerId)].name}</strong>
              </p>
              <p>
                Current Bank Buyer: <strong>{currentBankBuyer ? state.players[currentBankBuyer].name : "None"}</strong>
              </p>
            </div>
            <div className="action-grid">
              <button onClick={() => dispatch({ type: "revealBankDemandCard" })}>Reveal Bank Demand</button>
              <button onClick={() => dispatch({ type: "advanceBankBuyer" })}>Advance Bank Buyer</button>
            </div>
          </ActionPanel>

          <ActionPanel title="Repricing Track" subtitle="Track Notes expansion and manually update anchors in repricing." tone="bank">
            <div className="token-bank-row">
              <CurrencyToken label="Loans Issued" value={notesCreated.loansIssued} tone="ivory" />
              <CurrencyToken label="Bank Buys" value={notesCreated.bankPurchases} tone="ivory" />
              <CurrencyToken label="Notes Created" value={notesCreated.total} tone="brass" />
            </div>
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
              <span>New Anchor Notes Price</span>
              <input value={repricingValue} onChange={(event) => setRepricingValue(event.target.value)} type="number" min="1" />
            </label>
            <div className="embedded-action-row">
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
          </ActionPanel>
        </div>

        <div className="board-zone board-zone-full">
          <UpgradeRow cards={state.upgradeMarketRow} />
        </div>

        <div className="board-zone board-zone-bank">
          <ActionPanel title="Bank Buying Targets" subtitle="Demand skews toward Lumber and Labor, with some Fuel and rare Grain." tone="bank">
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
          </ActionPanel>

          <ActionPanel title="Discovered Notes Prices" subtitle="Bank pays latest discovered Notes price this round or anchor if none." tone="bank">
            <div className="price-summary-list">
              {RESOURCE_IDS.map((resourceId) => (
                <div key={resourceId} className="table-row">
                  <span>{state.config.resources[resourceId].name}</span>
                  <strong>{prices[resourceId].discovered ?? prices[resourceId].anchor} Notes</strong>
                </div>
              ))}
            </div>
          </ActionPanel>
        </div>
      </div>
    </section>
  );
}
