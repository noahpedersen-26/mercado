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
import { CurrencyToken } from "./CurrencyToken";
import { DepositToken } from "./DepositToken";
import { LoanToken } from "./LoanToken";

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
  const [barterResourceId, setBarterResourceId] = useState<ResourceId | "none">("none");
  const [barterQuantity, setBarterQuantity] = useState("0");
  const [tradeNotes, setTradeNotes] = useState("0");
  const [tradeBits, setTradeBits] = useState("0");
  const [bankSellResource, setBankSellResource] = useState<ResourceId>("lumber");
  const [bankSellQuantity, setBankSellQuantity] = useState("1");
  const [shortfallLoanId, setShortfallLoanId] = useState(player.loans[0]?.id ?? "");
  const [shortfallLabel, setShortfallLabel] = useState("grain");
  const [auctionProceeds, setAuctionProceeds] = useState("0");
  const specialty = selectRoleSpecialty(state, player.id);
  const upkeep = selectUpkeepPreview(state, player.id);
  const interestDue = selectLoanInterestDue(state.round.votedRate);
  const currentBankBuyer = selectCurrentBankBuyer(state);
  const isActive = state.round.activePlayerId === player.id;
  const isProductionTurn = state.round.phase === "playerTurns" && isActive && state.round.activePlayerStage === "production";
  const isMarketTurn = state.round.phase === "playerTurns" && isActive && state.round.activePlayerStage === "market";
  const lifeCostIndex = selectLifeCostIndex(state);

  const currentPrompt = (() => {
    if (state.round.phase === "policyVote") {
      return "Vote happens on the shared board. Your mat stays as a reference.";
    }

    if (isProductionTurn) {
      return "Take up to 2 production actions, plus a flex action if last upkeep was fully satisfied.";
    }

    if (isMarketTurn) {
      return "Choose from trade, finance, or upgrade actions, then end your turn.";
    }

    if (state.round.phase === "playerTurns") {
      return "Another player is taking their turn. Watch price discovery and prepare your next step.";
    }

    if (state.round.phase === "centralBank") {
      return currentBankBuyer === player.id
        ? "You are the current seller to the bank."
        : "Wait for the bank buy order to reach your house.";
    }

    if (state.round.phase === "settlement") {
      return "Pay life, settle interest, and record arrears if interest remains unpaid.";
    }

    return "Review your board while the shared board handles repricing and chair rotation.";
  })();

  return (
    <section
      className={`board player-mat ${isActive ? "is-active-player" : ""} ${isLocalPlayer ? "player-board-local" : ""}`}
    >
      <div className="player-mat-frame">
        <div className="player-mat-top">
          <article className="board-compartment role-plaque">
            <p className="eyebrow board-kicker">{isLocalPlayer ? "Your Mat" : "Action Mat"}</p>
            <h2>{player.name}</h2>
            <p className="role-name">{state.config.roles[player.role].name}</p>
            <p className="tiny-note">{state.config.roles[player.role].description}</p>
            <div className="status-chip-row">
              <span className="status-chip">Specialty {state.config.resources[specialty].name}</span>
              <span className="status-chip">{formatPhaseLabel(state.round.phase)}</span>
              {isActive ? <span className="status-chip status-chip-active">Active Turn</span> : null}
            </div>
          </article>

          <article className="board-compartment production-strip-compartment">
            <div className="compartment-title-bar">
              <h3>Production Strip</h3>
              <p>Two normal actions each turn, plus optional flex.</p>
            </div>

            <div className="production-slot-row">
              <div className="production-slot">
                <span className="track-label">Action 1</span>
                <strong>{player.turnActivity.normalProductionActionsUsed >= 1 ? "Used" : "Ready"}</strong>
              </div>
              <div className="production-slot">
                <span className="track-label">Action 2</span>
                <strong>{player.turnActivity.normalProductionActionsUsed >= 2 ? "Used" : "Ready"}</strong>
              </div>
              <div className={`production-slot ${player.satisfiedUpkeepLastRound ? "" : "production-slot-muted"}`}>
                <span className="track-label">Flex</span>
                <strong>
                  {player.satisfiedUpkeepLastRound
                    ? player.turnActivity.flexProductionUsed
                      ? "Used"
                      : "Ready"
                    : "Locked"}
                </strong>
              </div>
            </div>

            <div className="upgrade-badge-row">
              {player.ownedUpgrades.length > 0 ? (
                player.ownedUpgrades.map((upgrade) => (
                  <div key={upgrade.id} className="upgrade-badge">
                    <span>{upgrade.name}</span>
                  </div>
                ))
              ) : (
                <p className="tiny-note">No production upgrades owned.</p>
              )}
            </div>

            {isProductionTurn ? (
              <div className="board-overlay action-overlay">
                <div className="overlay-heading">
                  <h3>Produce</h3>
                  <p>Pick a good, resolve it, then continue or move to market.</p>
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
                    <span>Action Type</span>
                    <select value={String(useFlex)} onChange={(event) => setUseFlex(event.target.value === "true")}>
                      <option value="false">Normal</option>
                      <option value="true">Flex</option>
                    </select>
                  </label>
                </div>
                <div className="scene-button-row">
                  <button onClick={() => dispatch({ type: "produceGood", playerId: player.id, resourceId, useFlex })}>
                    Produce
                  </button>
                  <button onClick={() => dispatch({ type: "advancePlayerStage" })}>Go To Market Step</button>
                </div>
              </div>
            ) : null}
          </article>

          <article className="board-compartment finance-pocket-compartment">
            <div className="compartment-title-bar">
              <h3>Loans &amp; Deposits</h3>
              <p>Fixed 10 Note tokens with round-based obligations.</p>
            </div>

            <div className="finance-pocket-grid">
              <div className="finance-pocket">
                <span className="track-label">Loans</span>
                <div className="finance-token-stack">
                  {player.loans.length > 0 ? player.loans.map((loan) => <LoanToken key={loan.id} loan={loan} compact />) : <p className="tiny-note">None</p>}
                </div>
              </div>
              <div className="finance-pocket">
                <span className="track-label">Deposits</span>
                <div className="finance-token-stack">
                  {player.deposits.length > 0 ? (
                    player.deposits.map((deposit) => <DepositToken key={deposit.id} deposit={deposit} compact />)
                  ) : (
                    <p className="tiny-note">None</p>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="player-mat-middle">
          <article className="board-compartment action-tray-compartment">
            <div className="compartment-title-bar">
              <h3>Action Tray</h3>
              <p>{currentPrompt}</p>
            </div>

            {isMarketTurn ? (
              <div className="market-action-grid">
                <section className="mini-zone">
                  <div className="zone-heading">
                    <h3>Trade</h3>
                    <p>Active player initiates a trade and can barter goods, Notes, or Bits.</p>
                  </div>
                  <div className="scene-form-grid">
                    <label className="control-stack">
                      <span>Other Player</span>
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
                      <span>You Receive</span>
                      <select value={resourceId} onChange={(event) => setResourceId(event.target.value as ResourceId)}>
                        {RESOURCE_IDS.map((id) => (
                          <option key={id} value={id}>
                            {state.config.resources[id].name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="control-stack">
                      <span>Receive Qty</span>
                      <input value={tradeQuantity} onChange={(event) => setTradeQuantity(event.target.value)} type="number" min="1" />
                    </label>
                    <label className="control-stack">
                      <span>You Give</span>
                      <select value={barterResourceId} onChange={(event) => setBarterResourceId(event.target.value as ResourceId | "none")}>
                        <option value="none">No Good</option>
                        {RESOURCE_IDS.map((id) => (
                          <option key={id} value={id}>
                            {state.config.resources[id].name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="control-stack">
                      <span>Give Qty</span>
                      <input value={barterQuantity} onChange={(event) => setBarterQuantity(event.target.value)} type="number" min="0" />
                    </label>
                    <label className="control-stack">
                      <span>You Pay Notes</span>
                      <input value={tradeNotes} onChange={(event) => setTradeNotes(event.target.value)} type="number" min="0" />
                    </label>
                    <label className="control-stack">
                      <span>You Pay Bits</span>
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
                        barterResourceId: barterResourceId === "none" ? null : barterResourceId,
                        barterQuantity: Number(barterQuantity),
                        totalNotes: Number(tradeNotes),
                        totalBits: Number(tradeBits)
                      })
                    }
                  >
                    Record Trade
                  </button>
                </section>

                <section className="mini-zone">
                  <div className="zone-heading">
                    <h3>Finance</h3>
                    <p>Take 1 loan, make 1 deposit, or repay any number of loans.</p>
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
                </section>

                <section className="mini-zone">
                  <div className="zone-heading">
                    <h3>Upgrade</h3>
                    <p>Buy at most one upgrade this turn from the shared market row.</p>
                  </div>
                  <div className="scene-button-stack">
                    {state.upgradeMarketRow.map((card) => (
                      <button key={card.id} onClick={() => dispatch({ type: "buyUpgrade", playerId: player.id, upgradeCardId: card.id })}>
                        Buy {card.name}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="scene-button-row market-end-row">
                  <button onClick={() => dispatch({ type: "endPlayerTurn" })}>End Turn</button>
                </div>
              </div>
            ) : state.round.phase === "centralBank" && currentBankBuyer === player.id ? (
              <div className="market-action-grid single-mode-grid">
                <section className="mini-zone">
                  <div className="zone-heading">
                    <h3>Sell To Bank</h3>
                    <p>The bank pays the discovered Notes price this round or anchor if none was found.</p>
                  </div>
                  <div className="scene-form-grid">
                    <label className="control-stack">
                      <span>Good</span>
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
                      <input
                        value={bankSellQuantity}
                        onChange={(event) => setBankSellQuantity(event.target.value)}
                        type="number"
                        min="1"
                      />
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
                    <button onClick={() => dispatch({ type: "advanceBankBuyer" })}>Pass Seller Window</button>
                  </div>
                </section>
              </div>
            ) : state.round.phase === "settlement" ? (
              <div className="market-action-grid settlement-grid">
                <section className="mini-zone">
                  <div className="zone-heading">
                    <h3>Life Units</h3>
                    <p>Pay 2 units with Grain, Fuel, or Notes equal to the Life Cost Index.</p>
                  </div>
                  <div className="scene-button-row">
                    <button onClick={() => dispatch({ type: "payLife", playerId: player.id, payment: "grain" })}>Pay Grain</button>
                    <button onClick={() => dispatch({ type: "payLife", playerId: player.id, payment: "fuel" })}>Pay Fuel</button>
                    <button onClick={() => dispatch({ type: "payLife", playerId: player.id, payment: "notes" })}>
                      Pay {lifeCostIndex} Notes
                    </button>
                  </div>
                </section>

                <section className="mini-zone">
                  <div className="zone-heading">
                    <h3>Loan Interest</h3>
                    <p>Each loan owes {interestDue} Notes at the current voted rate.</p>
                  </div>
                  <div className="scene-button-stack">
                    {player.loans.map((loan) => (
                      <button key={loan.id} onClick={() => dispatch({ type: "payLoanInterest", playerId: player.id, loanId: loan.id })}>
                        Pay Interest {loan.id}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="mini-zone">
                  <div className="zone-heading">
                    <h3>Shortfall / Arrears</h3>
                    <p>Choose surrendered item and record auction proceeds if interest cannot be paid.</p>
                  </div>
                  <div className="scene-form-grid">
                    <label className="control-stack">
                      <span>Loan</span>
                      <select value={shortfallLoanId} onChange={(event) => setShortfallLoanId(event.target.value)}>
                        {player.loans.map((loan) => (
                          <option key={loan.id} value={loan.id}>
                            {loan.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="control-stack">
                      <span>Item</span>
                      <input value={shortfallLabel} onChange={(event) => setShortfallLabel(event.target.value)} />
                    </label>
                    <label className="control-stack">
                      <span>Proceeds</span>
                      <input
                        value={auctionProceeds}
                        onChange={(event) => setAuctionProceeds(event.target.value)}
                        type="number"
                        min="0"
                      />
                    </label>
                  </div>
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
                </section>
              </div>
            ) : (
              <div className="waiting-panel">
                <div className="mini-card">
                  <p className="track-label">Prompt</p>
                  <p>{currentPrompt}</p>
                </div>
                <div className="mini-card">
                  <p className="track-label">Upkeep Outlook</p>
                  <p>
                    {upkeep.status} · {upkeep.grainFuelUnits} goods toward life · {player.notes} Notes on hand
                  </p>
                </div>
              </div>
            )}
          </article>
        </div>

        <div className="player-mat-bottom">
          <article className="board-compartment resource-tray-compartment">
            <div className="compartment-title-bar">
              <h3>Resource Tray</h3>
              <p>Goods, cash, hard money, and arrears on your mat.</p>
            </div>

            <div className="resource-tray">
              {RESOURCE_IDS.map((id) => (
                <div key={id} className="tray-token">
                  <span className="tray-token-label">{state.config.resources[id].name}</span>
                  <strong>{player.goods[id]}</strong>
                </div>
              ))}
              <div className="tray-token tray-token-notes">
                <span className="tray-token-label">Notes</span>
                <strong>{player.notes}</strong>
              </div>
              <div className="tray-token tray-token-bits">
                <span className="tray-token-label">Bits</span>
                <strong>{player.bits}</strong>
              </div>
              <div className="tray-token tray-token-arrears">
                <span className="tray-token-label">Arrears</span>
                <strong>{player.arrears}</strong>
              </div>
            </div>
          </article>

          <article className="board-compartment upkeep-tray-compartment">
            <div className="compartment-title-bar">
              <h3>Upkeep Preview</h3>
              <p>Life units, current rate, and whether flex unlocks next round.</p>
            </div>
            <div className="token-well-grid">
              <CurrencyToken label="Life Due" value={upkeep.lifeUnitsRequired} tone="ivory" />
              <CurrencyToken label="Rate" value={`${state.round.votedRate}%`} tone="red" />
              <CurrencyToken label="Interest" value={interestDue} tone="ivory" />
              <CurrencyToken label="Flex Next" value={player.satisfiedUpkeepThisRound ? "Yes" : "No"} tone="brass" />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
