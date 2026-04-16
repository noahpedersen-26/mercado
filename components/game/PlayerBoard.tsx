"use client";

import { useState } from "react";
import { RESOURCE_IDS } from "@/lib/game/constants";
import {
  selectCurrentBankBuyer,
  selectLifeCostIndex,
  selectLoanInterestDue,
  selectRoleSpecialty,
  selectUpkeepPreview
} from "@/lib/game/selectors";
import type { Action, GameState, PlayerState, ResourceId } from "@/lib/game/types";
import { ActionPanel } from "./ActionPanel";
import { CurrencyToken } from "./CurrencyToken";
import { DepositToken } from "./DepositToken";
import { LoanToken } from "./LoanToken";
import { ResourceTokenGroup } from "./ResourceTokenGroup";

function SceneShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="action-panel action-panel-player player-scene">
      <div className="zone-heading">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export function PlayerBoard({
  state,
  player,
  dispatch,
  isLocalPlayer = false
}: {
  state: GameState;
  player: PlayerState;
  dispatch: React.Dispatch<Action>;
  isLocalPlayer?: boolean;
}) {
  const [resourceId, setResourceId] = useState<ResourceId>("grain");
  const [useFlex, setUseFlex] = useState(false);
  const [tradeTargetId, setTradeTargetId] = useState(
    state.playerOrder.find((playerId) => playerId !== player.id) ?? state.playerOrder[0]
  );
  const [tradeQuantity, setTradeQuantity] = useState("1");
  const [tradeNotes, setTradeNotes] = useState("0");
  const [tradeBits, setTradeBits] = useState("0");
  const [bankSellResource, setBankSellResource] = useState<ResourceId>("lumber");
  const [bankSellQuantity, setBankSellQuantity] = useState("1");
  const [shortfallLoanId, setShortfallLoanId] = useState(player.loans[0]?.id ?? "");
  const [shortfallLabel, setShortfallLabel] = useState("grain");
  const [auctionProceeds, setAuctionProceeds] = useState("0");
  const upkeep = selectUpkeepPreview(state, player.id);
  const specialty = selectRoleSpecialty(state, player.id);
  const interestDue = selectLoanInterestDue(state.round.votedRate);
  const isActive = state.round.activePlayerId === player.id;
  const currentBankBuyer = selectCurrentBankBuyer(state);

  const overviewCards = (
    <div className="player-overview-grid">
      <ActionPanel title="Goods" subtitle="Your supply on the table." tone="player">
        <ResourceTokenGroup title="Goods" resources={player.goods} definitions={state.config.resources} tone="player" />
      </ActionPanel>

      <ActionPanel title="Role & Pressure" subtitle="Specialty, upkeep pressure, and owned engine." tone="player">
        <div className="faction-card">
          <div className="faction-banner">{state.config.roles[player.role].name}</div>
          <p>{state.config.roles[player.role].description}</p>
          <div className="faction-meta">
            <span className="status-chip">Life Cost {selectLifeCostIndex(state)} Notes</span>
            <span className="status-chip">Life Units {upkeep.lifeUnitsRequired}</span>
            <span className={`status-chip ${upkeep.status === "coverable" ? "status-chip-good" : "status-chip-risk"}`}>
              {upkeep.status}
            </span>
          </div>
          <p className="tiny-note">
            Upgrades: {player.ownedUpgrades.length > 0 ? player.ownedUpgrades.map((upgrade) => upgrade.name).join(", ") : "None"}
          </p>
        </div>
      </ActionPanel>

      <ActionPanel title="Debt & Savings" subtitle="Loan and deposit tokens on your mat." tone="player">
        <div className="token-strip">
          {player.loans.map((loan) => (
            <LoanToken key={loan.id} loan={loan} compact />
          ))}
          {player.deposits.map((deposit) => (
            <DepositToken key={deposit.id} deposit={deposit} compact />
          ))}
        </div>
      </ActionPanel>
    </div>
  );

  let scene: React.ReactNode;

  if (state.round.phase === "policyVote") {
    scene = (
      <SceneShell
        title="Waiting For Policy Vote"
        subtitle="Policy is handled on the shared board. Once all votes are in, resolve the vote and the active player begins production."
      >
        <div className="scene-stat-row">
          <div className="mini-card">
            <p className="track-label">Your Role</p>
            <p>{state.config.roles[player.role].name}</p>
          </div>
          <div className="mini-card">
            <p className="track-label">Your Vote</p>
            <p>{state.round.policyVotes[player.id] ?? "Not cast"}</p>
          </div>
          <div className="mini-card">
            <p className="track-label">Chair</p>
            <p>{state.players[state.round.policyChairPlayerId].name}</p>
          </div>
        </div>
      </SceneShell>
    );
  } else if (state.round.phase === "playerTurns" && isActive && state.round.activePlayerStage === "production") {
    scene = (
      <SceneShell
        title="Production Step"
        subtitle="Use your production actions sequentially, then advance to the market step."
      >
        <div className="scene-stat-row">
          <div className="mini-card">
            <p className="track-label">Specialty</p>
            <p>{state.config.resources[specialty].name}</p>
          </div>
          <div className="mini-card">
            <p className="track-label">Normal Actions Used</p>
            <p>{player.turnActivity.normalProductionActionsUsed} / 2</p>
          </div>
          <div className="mini-card">
            <p className="track-label">Flex Action</p>
            <p>{player.satisfiedUpkeepLastRound ? (player.turnActivity.flexProductionUsed ? "Used" : "Available") : "Locked"}</p>
          </div>
        </div>

        <div className="scene-form-grid">
          <label className="control-stack">
            <span>Good</span>
            <select value={resourceId} onChange={(event) => setResourceId(event.target.value as ResourceId)}>
              {RESOURCE_IDS.map((id) => (
                <option key={id} value={id}>
                  {state.config.resources[id].name}
                </option>
              ))}
            </select>
          </label>
          <label className="control-stack">
            <span>Use Flex</span>
            <select value={String(useFlex)} onChange={(event) => setUseFlex(event.target.value === "true")}>
              <option value="false">Normal Action</option>
              <option value="true">Flex Action</option>
            </select>
          </label>
        </div>

        <div className="scene-button-row">
          <button onClick={() => dispatch({ type: "produceGood", playerId: player.id, resourceId, useFlex })}>Produce</button>
          <button onClick={() => dispatch({ type: "advancePlayerStage" })}>Go To Market Step</button>
        </div>
      </SceneShell>
    );
  } else if (state.round.phase === "playerTurns" && isActive && state.round.activePlayerStage === "market") {
    scene = (
      <SceneShell
        title="Market / Finance / Build"
        subtitle="Choose one of the available action families, resolve it, then end your turn."
      >
        <div className="scene-tabs-grid">
          <div className="action-panel action-panel-player">
            <div className="zone-heading">
              <h3>Trade</h3>
              <p>Record a trade you initiate with another player.</p>
            </div>
            <div className="scene-form-grid">
              <label className="control-stack">
                <span>Target</span>
                <select value={tradeTargetId} onChange={(event) => setTradeTargetId(event.target.value)}>
                  {state.playerOrder
                    .filter((playerId) => playerId !== player.id)
                    .map((playerId) => (
                      <option key={playerId} value={playerId}>
                        {state.players[playerId].name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="control-stack">
                <span>Good</span>
                <select value={resourceId} onChange={(event) => setResourceId(event.target.value as ResourceId)}>
                  {RESOURCE_IDS.map((id) => (
                    <option key={id} value={id}>
                      {state.config.resources[id].name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="control-stack">
                <span>Qty</span>
                <input value={tradeQuantity} onChange={(event) => setTradeQuantity(event.target.value)} type="number" min="1" />
              </label>
              <label className="control-stack">
                <span>Notes</span>
                <input value={tradeNotes} onChange={(event) => setTradeNotes(event.target.value)} type="number" min="0" />
              </label>
              <label className="control-stack">
                <span>Bits</span>
                <input value={tradeBits} onChange={(event) => setTradeBits(event.target.value)} type="number" min="0" />
              </label>
            </div>
            <button
              onClick={() =>
                dispatch({
                  type: "recordTrade",
                  initiatorPlayerId: player.id,
                  otherPlayerId: tradeTargetId,
                  resourceId,
                  quantity: Number(tradeQuantity),
                  totalNotes: Number(tradeNotes),
                  totalBits: Number(tradeBits)
                })
              }
            >
              Record Trade
            </button>
          </div>

          <div className="action-panel action-panel-player">
            <div className="zone-heading">
              <h3>Finance</h3>
              <p>Borrow once, deposit once, or repay any loan token.</p>
            </div>
            <div className="scene-button-stack">
              <button onClick={() => dispatch({ type: "takeLoan", playerId: player.id })}>Borrow 10 Notes</button>
              <button onClick={() => dispatch({ type: "createDeposit", playerId: player.id })}>Deposit 10 Notes</button>
              {player.loans.map((loan) => (
                <button key={loan.id} onClick={() => dispatch({ type: "repayLoan", playerId: player.id, loanId: loan.id })}>
                  Repay {loan.id}
                </button>
              ))}
            </div>
          </div>

          <div className="action-panel action-panel-player">
            <div className="zone-heading">
              <h3>Upgrade</h3>
              <p>Buy at most one production upgrade this turn.</p>
            </div>
            <div className="scene-button-stack">
              {state.upgradeMarketRow.map((card) => (
                <button key={card.id} onClick={() => dispatch({ type: "buyUpgrade", playerId: player.id, upgradeCardId: card.id })}>
                  Buy {card.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="scene-button-row">
          <button onClick={() => dispatch({ type: "endPlayerTurn" })}>End Turn</button>
        </div>
      </SceneShell>
    );
  } else if (state.round.phase === "playerTurns") {
    scene = (
      <SceneShell
        title="Waiting On Another Player"
        subtitle="Keep your board visible, but only concise rival info is needed until the turn comes back around."
      >
        <div className="scene-stat-row">
          <div className="mini-card">
            <p className="track-label">Active Player</p>
            <p>{state.round.activePlayerId ? state.players[state.round.activePlayerId].name : "None"}</p>
          </div>
          <div className="mini-card">
            <p className="track-label">Stage</p>
            <p>{state.round.activePlayerStage ?? "None"}</p>
          </div>
          <div className="mini-card">
            <p className="track-label">Your Next Concern</p>
            <p>Watch prices, bank demand, and your upkeep outlook.</p>
          </div>
        </div>
      </SceneShell>
    );
  } else if (state.round.phase === "centralBank") {
    scene = (
      <SceneShell
        title={currentBankBuyer === player.id ? "Your Bank Sale Window" : "Central Bank Buying"}
        subtitle="Bank buys in order starting left of the chair, paying discovered Notes prices or anchors."
      >
        <div className="scene-stat-row">
          <div className="mini-card">
            <p className="track-label">Current Buyer</p>
            <p>{currentBankBuyer ? state.players[currentBankBuyer].name : "None"}</p>
          </div>
          <div className="mini-card">
            <p className="track-label">You Are Up</p>
            <p>{currentBankBuyer === player.id ? "Yes" : "No"}</p>
          </div>
        </div>

        {currentBankBuyer === player.id ? (
          <>
            <div className="scene-form-grid">
              <label className="control-stack">
                <span>Sell Good</span>
                <select value={bankSellResource} onChange={(event) => setBankSellResource(event.target.value as ResourceId)}>
                  {RESOURCE_IDS.map((id) => (
                    <option key={id} value={id}>
                      {state.config.resources[id].name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="control-stack">
                <span>Qty</span>
                <input value={bankSellQuantity} onChange={(event) => setBankSellQuantity(event.target.value)} type="number" min="1" />
              </label>
            </div>
            <div className="scene-button-row">
              <button
                onClick={() =>
                  dispatch({
                    type: "bankBuy",
                    playerId: player.id,
                    resourceId: bankSellResource,
                    quantity: Number(bankSellQuantity)
                  })
                }
              >
                Sell To Bank
              </button>
              <button onClick={() => dispatch({ type: "advanceBankBuyer" })}>Pass To Next Seller</button>
            </div>
          </>
        ) : (
          <div className="scene-button-row">
            <button onClick={() => dispatch({ type: "advanceBankBuyer" })}>Advance Bank Buyer</button>
          </div>
        )}
      </SceneShell>
    );
  } else if (state.round.phase === "settlement") {
    scene = (
      <SceneShell
        title="Settlement"
        subtitle="Pay two Life Units, then settle interest or convert unpaid amounts into arrears."
      >
        <div className="scene-stat-row">
          <div className="mini-card">
            <p className="track-label">Life Units Paid</p>
            <p>{state.round.settlement[player.id].lifeUnitsPaid} / 2</p>
          </div>
          <div className="mini-card">
            <p className="track-label">Interest / Loan</p>
            <p>{interestDue} Notes</p>
          </div>
          <div className="mini-card">
            <p className="track-label">Arrears</p>
            <p>{player.arrears}</p>
          </div>
        </div>

        <div className="scene-button-row">
          <button onClick={() => dispatch({ type: "payLife", playerId: player.id, payment: "grain" })}>Pay Grain</button>
          <button onClick={() => dispatch({ type: "payLife", playerId: player.id, payment: "fuel" })}>Pay Fuel</button>
          <button onClick={() => dispatch({ type: "payLife", playerId: player.id, payment: "notes" })}>
            Pay {selectLifeCostIndex(state)} Notes
          </button>
        </div>

        <div className="scene-button-stack">
          {player.loans.map((loan) => (
            <button key={loan.id} onClick={() => dispatch({ type: "payLoanInterest", playerId: player.id, loanId: loan.id })}>
              Pay Interest {loan.id}
            </button>
          ))}
        </div>

        <div className="scene-form-grid">
          <label className="control-stack">
            <span>Shortfall Loan</span>
            <select value={shortfallLoanId} onChange={(event) => setShortfallLoanId(event.target.value)}>
              {player.loans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.id}
                </option>
              ))}
            </select>
          </label>
          <label className="control-stack">
            <span>Surrendered Item</span>
            <input value={shortfallLabel} onChange={(event) => setShortfallLabel(event.target.value)} />
          </label>
          <label className="control-stack">
            <span>Auction Proceeds</span>
            <input value={auctionProceeds} onChange={(event) => setAuctionProceeds(event.target.value)} type="number" min="0" />
          </label>
        </div>

        <div className="scene-button-row">
          <button
            onClick={() =>
              dispatch({
                type: "resolveInterestShortfall",
                playerId: player.id,
                loanId: shortfallLoanId,
                surrenderedLabel: shortfallLabel,
                auctionProceeds: Number(auctionProceeds)
              })
            }
          >
            Resolve Shortfall
          </button>
        </div>
      </SceneShell>
    );
  } else {
    scene = (
      <SceneShell
        title="Repricing / End Round"
        subtitle="The shared board handles anchor adjustments and round reset. Your board becomes a concise end-of-round reference."
      >
        <div className="scene-stat-row">
          <div className="mini-card">
            <p className="track-label">Upkeep Outcome</p>
            <p>{player.satisfiedUpkeepThisRound ? "Satisfied" : "Not Yet Satisfied"}</p>
          </div>
          <div className="mini-card">
            <p className="track-label">Next Flex Action</p>
            <p>{player.satisfiedUpkeepThisRound ? "Unlocked next round" : "Locked next round"}</p>
          </div>
        </div>
      </SceneShell>
    );
  }

  return (
    <section className={`board player-board ${isActive ? "is-active-player" : ""} ${isLocalPlayer ? "player-board-local" : ""}`}>
      <div className="board-header">
        <div>
          <p className="eyebrow">{isLocalPlayer ? "Your Board" : "Player Board"}</p>
          <h2>{player.name}</h2>
          <p className="board-subtitle">
            Role: <strong>{state.config.roles[player.role].name}</strong> · Specialty {state.config.resources[specialty].name}
          </p>
        </div>
        <div className="board-header-stats">
          <CurrencyToken label="Notes" value={player.notes} tone="ivory" />
          <CurrencyToken label="Bits" value={player.bits} tone="brass" />
          <CurrencyToken label="Arrears" value={player.arrears} tone="red" />
        </div>
      </div>

      <div className="player-focus-layout">
        {scene}
        {overviewCards}
      </div>
    </section>
  );
}
