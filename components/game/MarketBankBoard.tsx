"use client";

import { useState } from "react";
import { getLeftOfChair } from "@/lib/game/turn-order";
import type { Action, Deposit, GameState, Loan, ResourceId } from "@/lib/game/types";
import { ActionPanel } from "./ActionPanel";
import { BankDemandCard } from "./BankDemandCard";
import { CurrencyToken } from "./CurrencyToken";
import { DepositToken } from "./DepositToken";
import { LoanToken } from "./LoanToken";
import { PriceTrack } from "./PriceTrack";
import { ResourceTokenGroup } from "./ResourceTokenGroup";
import { TurnTrack } from "./TurnTrack";
import { PolicyTrack } from "./PolicyTrack";
import { UpgradeRow } from "./UpgradeRow";

export function MarketBankBoard({
  state,
  dispatch,
  lifeCostIndex,
  priceAverages,
  loans,
  deposits
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  lifeCostIndex: number;
  priceAverages: {
    notes: Partial<Record<ResourceId, number>>;
    coins: Partial<Record<ResourceId, number>>;
  };
  loans: Loan[];
  deposits: Deposit[];
}) {
  const [rateInput, setRateInput] = useState(state.policy.policyRate.toString());
  const chair = state.players[state.round.policyChairPlayerId];
  const leftOfChair = state.players[getLeftOfChair(state.round.policyChairPlayerId)];
  const activeCard = state.bankDemandDeck.find((card) => card.id === state.activeDemandCardId) ?? null;

  return (
    <section className="board shared-board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Shared Table</p>
          <h2>Market / Bank Board</h2>
        </div>
        <div className="board-header-stats">
          <CurrencyToken label="Life Cost" value={lifeCostIndex.toFixed(2)} tone="ivory" />
          <CurrencyToken label="Policy Rate" value={`${state.policy.policyRate.toFixed(2)}%`} tone="red" />
        </div>
      </div>

      <div className="shared-board-grid">
        <div className="board-zone board-zone-main">
          <TurnTrack state={state} />
          <PolicyTrack
            chairName={chair.name}
            leftOfChairName={leftOfChair.name}
            rateInput={rateInput}
            setRateInput={setRateInput}
            onApplyRate={() => dispatch({ type: "setPolicyRate", rate: Number(rateInput) })}
          />
          <BankDemandCard card={activeCard} />
          <PriceTrack state={state} priceAverages={priceAverages} />
        </div>

        <div className="board-zone board-zone-side">
          <ActionPanel
            title="Bank Actions"
            subtitle="Round and policy controls live on the central board."
            tone="bank"
          >
            <div className="action-grid">
              <button onClick={() => dispatch({ type: "startRound" })}>Open Round</button>
              <button onClick={() => dispatch({ type: "drawDemandCard" })}>Reveal Demand</button>
              <button onClick={() => dispatch({ type: "rotateChair" })}>Rotate Chair</button>
              <button onClick={() => dispatch({ type: "startPlayerTurns" })}>Begin Player Turns</button>
              <button onClick={() => dispatch({ type: "advancePhase" })}>Advance Phase</button>
              <button onClick={() => dispatch({ type: "endRound" })}>Close Round</button>
            </div>
          </ActionPanel>

          <ActionPanel title="Bank Reserves" subtitle="Outstanding paper, savings, and tracked supply." tone="bank">
            <div className="token-bank-row">
              <CurrencyToken
                label="Notes In Play"
                value={Object.values(state.players).reduce((sum, player) => sum + player.notes, 0)}
                tone="ivory"
              />
              <CurrencyToken
                label="Bits / Coins"
                value={Object.values(state.players).reduce((sum, player) => sum + player.coins, 0)}
                tone="brass"
              />
            </div>
            <ResourceTokenGroup
              title="Available Supply"
              resources={Object.fromEntries(
                Object.entries(state.resources).map(([resourceId, resource]) => [resourceId, resource.availableSupply])
              ) as Record<ResourceId, number>}
              definitions={state.config.resourceDefinitions}
              tone="supply"
            />
          </ActionPanel>
        </div>

        <div className="board-zone board-zone-full">
          <UpgradeRow state={state} />
        </div>

        <div className="board-zone board-zone-bank">
          <ActionPanel title="Loans" subtitle="Visible debt tokens in the bank reserve." tone="bank">
            <div className="token-strip">
              {loans.map((loan) => (
                <LoanToken key={loan.id} loan={loan} />
              ))}
            </div>
          </ActionPanel>

          <ActionPanel title="Deposits" subtitle="Savings claims waiting in the bank." tone="bank">
            <div className="token-strip">
              {deposits.map((deposit) => (
                <DepositToken key={deposit.id} deposit={deposit} />
              ))}
            </div>
          </ActionPanel>
        </div>
      </div>
    </section>
  );
}
