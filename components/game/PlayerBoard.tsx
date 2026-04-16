"use client";

import { useState } from "react";
import { RESOURCE_IDS } from "@/lib/game/constants";
import { selectLifeCostIndex, selectLoanInterestDue, selectRoleSpecialty, selectUpkeepPreview } from "@/lib/game/selectors";
import type { Action, GameState, PlayerState, ResourceId } from "@/lib/game/types";
import { ActionPanel } from "./ActionPanel";
import { CurrencyToken } from "./CurrencyToken";
import { DepositToken } from "./DepositToken";
import { LoanToken } from "./LoanToken";
import { ResourceTokenGroup } from "./ResourceTokenGroup";

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

      <div className="player-board-grid">
        <ActionPanel title="Goods" subtitle="Only Grain, Fuel, Lumber, and Labor exist in this prototype." tone="player">
          <ResourceTokenGroup title="Goods" resources={player.goods} definitions={state.config.resources} tone="player" />
        </ActionPanel>

        <ActionPanel title="Role & Upkeep" subtitle="Production specialty and next life-cost pressure." tone="player">
          <div className="faction-card">
            <div className="faction-banner">{state.config.roles[player.role].name}</div>
            <p>{state.config.roles[player.role].description}</p>
            <div className="faction-meta">
              <span className="status-chip">Life Units: {upkeep.lifeUnitsRequired}</span>
              <span className="status-chip">Life Cost: {selectLifeCostIndex(state)} Notes</span>
              <span className={`status-chip ${upkeep.status === "coverable" ? "status-chip-good" : "status-chip-risk"}`}>
                {upkeep.status}
              </span>
            </div>
          </div>
        </ActionPanel>

        <ActionPanel title="Loans" subtitle={`Each loan is 10 Notes. Interest this round: ${interestDue} per loan.`} tone="player">
          <div className="token-strip">
            {player.loans.map((loan) => (
              <LoanToken key={loan.id} loan={loan} compact />
            ))}
          </div>
        </ActionPanel>

        <ActionPanel title="Deposits" subtitle="Each deposit is 10 Notes and returns next round at issue-time rate." tone="player">
          <div className="token-strip">
            {player.deposits.map((deposit) => (
              <DepositToken key={deposit.id} deposit={deposit} compact />
            ))}
          </div>
        </ActionPanel>

        <ActionPanel title="Owned Upgrades" subtitle="Production boosts only; first matching production action each turn gets +1." tone="player">
          <div className="card-row">
            {player.ownedUpgrades.length === 0 ? (
              <article className="game-card muted-card">
                <p>No upgrades owned.</p>
              </article>
            ) : (
              player.ownedUpgrades.map((upgrade) => (
                <article key={upgrade.id} className="game-card upgrade-card owned-card">
                  <p className="game-card-kicker">Owned Upgrade</p>
                  <h3>{upgrade.name}</h3>
                  <p>{upgrade.description}</p>
                </article>
              ))
            )}
          </div>
        </ActionPanel>

        <ActionPanel
          title="Production Step"
          subtitle="First do your production actions in sequence, then move to market."
          tone="player"
        >
          <div className="player-action-grid">
            <label className="control-stack">
              <span>Produce Good</span>
              <select value={resourceId} onChange={(event) => setResourceId(event.target.value as ResourceId)}>
                {RESOURCE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {state.config.resources[id].name}
                  </option>
                ))}
              </select>
            </label>
            <label className="control-stack">
              <span>Use Flex Action</span>
              <select value={String(useFlex)} onChange={(event) => setUseFlex(event.target.value === "true")}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
            <div className="mini-card">
              <p>Normal Actions Used: {player.turnActivity.normalProductionActionsUsed}/2</p>
              <p>Flex Used: {player.turnActivity.flexProductionUsed ? "Yes" : "No"}</p>
              <p>Last Upkeep Satisfied: {player.satisfiedUpkeepLastRound ? "Yes" : "No"}</p>
            </div>
            <div className="embedded-action-row embedded-action-row-wide">
              <button onClick={() => dispatch({ type: "produceGood", playerId: player.id, resourceId, useFlex })} disabled={!isActive}>
                Produce
              </button>
              <button onClick={() => dispatch({ type: "advancePlayerStage" })} disabled={!isActive || state.round.activePlayerStage !== "production"}>
                Move To Market Step
              </button>
            </div>
          </div>
        </ActionPanel>

        <ActionPanel
          title="Market / Finance / Build"
          subtitle="After production, choose trade, finance, upgrade, and then end turn."
          tone="player"
        >
          <div className="player-action-grid">
            <label className="control-stack">
              <span>Trade Target</span>
              <select value={tradeTargetId} onChange={(event) => setTradeTargetId(event.target.value)}>
                {state.playerOrder.filter((playerId) => playerId !== player.id).map((playerId) => (
                  <option key={playerId} value={playerId}>
                    {state.players[playerId].name}
                  </option>
                ))}
              </select>
            </label>
            <label className="control-stack">
              <span>Trade Good</span>
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
              <span>Total Notes</span>
              <input value={tradeNotes} onChange={(event) => setTradeNotes(event.target.value)} type="number" min="0" />
            </label>
            <label className="control-stack">
              <span>Total Bits</span>
              <input value={tradeBits} onChange={(event) => setTradeBits(event.target.value)} type="number" min="0" />
            </label>
            <div className="embedded-action-row embedded-action-row-wide">
              <button
                disabled={!isActive}
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
              <button disabled={!isActive} onClick={() => dispatch({ type: "takeLoan", playerId: player.id })}>
                Borrow 10 Notes
              </button>
              <button disabled={!isActive} onClick={() => dispatch({ type: "createDeposit", playerId: player.id })}>
                Deposit 10 Notes
              </button>
            </div>
            <div className="embedded-action-row embedded-action-row-wide">
              {player.loans.map((loan) => (
                <button key={loan.id} disabled={!isActive} onClick={() => dispatch({ type: "repayLoan", playerId: player.id, loanId: loan.id })}>
                  Repay {loan.id}
                </button>
              ))}
              {state.upgradeMarketRow.map((card) => (
                <button
                  key={card.id}
                  disabled={!isActive}
                  onClick={() => dispatch({ type: "buyUpgrade", playerId: player.id, upgradeCardId: card.id })}
                >
                  Buy {card.name}
                </button>
              ))}
              <button disabled={!isActive} onClick={() => dispatch({ type: "endPlayerTurn" })}>
                End Turn
              </button>
            </div>
          </div>
        </ActionPanel>

        <ActionPanel title="Settlement" subtitle="Pay 2 Life Units and settle each loan's interest at the voted rate." tone="player">
          <div className="player-action-grid">
            <div className="mini-card">
              <p>Life Units Paid: {state.round.settlement[player.id].lifeUnitsPaid}/2</p>
              <p>Interest Rate: {state.round.votedRate}%</p>
              <p>Interest / Loan: {interestDue} Notes</p>
            </div>
            <div className="embedded-action-row embedded-action-row-wide">
              <button onClick={() => dispatch({ type: "payLife", playerId: player.id, payment: "grain" })}>Pay Life With Grain</button>
              <button onClick={() => dispatch({ type: "payLife", playerId: player.id, payment: "fuel" })}>Pay Life With Fuel</button>
              <button onClick={() => dispatch({ type: "payLife", playerId: player.id, payment: "notes" })}>
                Pay Life With {selectLifeCostIndex(state)} Notes
              </button>
            </div>
            <div className="embedded-action-row embedded-action-row-wide">
              {player.loans.map((loan) => (
                <button key={loan.id} onClick={() => dispatch({ type: "payLoanInterest", playerId: player.id, loanId: loan.id })}>
                  Pay Interest {loan.id}
                </button>
              ))}
            </div>
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
            <div className="embedded-action-row embedded-action-row-wide">
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
                Resolve Interest Shortfall
              </button>
            </div>
          </div>
        </ActionPanel>

        <ActionPanel title="Bank Sale" subtitle="During Central Bank Turn, the current bank buyer sells to the bank from here." tone="player">
          <div className="player-action-grid">
            <label className="control-stack">
              <span>Bank Good</span>
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
            <div className="embedded-action-row embedded-action-row-wide">
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
            </div>
          </div>
        </ActionPanel>
      </div>
    </section>
  );
}
