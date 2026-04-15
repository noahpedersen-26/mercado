"use client";

import { useState } from "react";
import type { Action, GameState, PlayerState, ResourceId, UpgradeId } from "@/lib/game/types";
import { ActionPanel } from "./ActionPanel";
import { CurrencyToken } from "./CurrencyToken";
import { DepositToken } from "./DepositToken";
import { LoanToken } from "./LoanToken";
import { ResourceTokenGroup } from "./ResourceTokenGroup";

function getRoleSpecialization(state: GameState, player: PlayerState) {
  const unlocked = player.upgrades.find((upgrade) => upgrade.isUnlocked);

  if (unlocked) {
    return state.config.upgradeDefinitions[unlocked.upgradeId].name;
  }

  const topCapacity = Object.entries(player.productionCapacity).sort((a, b) => b[1] - a[1])[0];

  if (!topCapacity || topCapacity[1] === 0) {
    return "Speculator";
  }

  return `${state.config.resourceDefinitions[topCapacity[0] as ResourceId].name} House`;
}

function getUpkeepOutlook(player: PlayerState) {
  const totalGoods = Object.values(player.inventory).reduce((sum, value) => sum + value, 0);
  const debtPressure = player.loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + loan.minimumPayment, 0);

  if (player.notes < debtPressure) {
    return "Distress Risk";
  }

  if (totalGoods < 4) {
    return "Tight Supply";
  }

  return "Stable";
}

export function PlayerBoard({
  state,
  player,
  dispatch
}: {
  state: GameState;
  player: PlayerState;
  dispatch: React.Dispatch<Action>;
}) {
  const [resourceId, setResourceId] = useState<ResourceId>("grain");
  const [quantity, setQuantity] = useState("1");
  const [loanAmount, setLoanAmount] = useState("4");
  const [depositAmount, setDepositAmount] = useState("3");
  const [upgradeId, setUpgradeId] = useState<UpgradeId>("warehouse");
  const [tradeDirection, setTradeDirection] = useState<"buy" | "sell">("buy");
  const [tradeNotes, setTradeNotes] = useState("4");
  const [tradeCoins, setTradeCoins] = useState("1");

  const otherPlayer = Object.values(state.players).find((entry) => entry.id !== player.id) ?? player;
  const isActive = state.round.activePlayerId === player.id;
  const currentStep = state.round.activeTurnWindow?.step;
  const activeLoan = player.loans.find((loan) => loan.status === "active");
  const activeDeposit = player.deposits.find((deposit) => deposit.status === "active");
  const roleSpecialization = getRoleSpecialization(state, player);
  const upkeepOutlook = getUpkeepOutlook(player);

  return (
    <section className={`board player-board ${isActive ? "is-active-player" : ""}`}>
      <div className="board-header">
        <div>
          <p className="eyebrow">Player Tableau</p>
          <h2>{player.name}</h2>
          <p className="board-subtitle">
            Seat {player.seat} · Role: {roleSpecialization}
          </p>
        </div>
        <div className="board-header-stats">
          <CurrencyToken label="Notes" value={player.notes} tone="ivory" />
          <CurrencyToken label="Bits" value={player.coins} tone="brass" />
        </div>
      </div>

      <div className="player-board-grid">
        <ActionPanel title="Faction Card" subtitle="Specialization and standing in the round." tone="player">
          <div className="faction-card">
            <div className="faction-banner">{roleSpecialization}</div>
            <div className="faction-meta">
              <span className={`status-chip ${isActive ? "status-chip-active" : ""}`}>
                {isActive ? "Active Turn" : "Waiting"}
              </span>
              <span className="status-chip">{currentStep ?? "No turn yet"}</span>
              <span className={`status-chip ${upkeepOutlook === "Stable" ? "status-chip-good" : "status-chip-risk"}`}>
                {upkeepOutlook}
              </span>
            </div>
          </div>
        </ActionPanel>

        <ActionPanel title="Resources" subtitle="Personal stockpile represented as tabletop tokens." tone="player">
          <ResourceTokenGroup
            title="Inventory"
            resources={player.inventory}
            definitions={state.config.resourceDefinitions}
            tone="player"
          />
        </ActionPanel>

        <ActionPanel title="Production Row" subtitle="What this house can make during its produce step." tone="player">
          <ResourceTokenGroup
            title="Production Capacity"
            resources={player.productionCapacity}
            definitions={state.config.resourceDefinitions}
            tone="capacity"
          />
        </ActionPanel>

        <ActionPanel title="Owned Upgrades" subtitle="Purchased cards on this player mat." tone="player">
          <div className="card-row">
            {player.upgrades.map((upgrade) => {
              const definition = state.config.upgradeDefinitions[upgrade.upgradeId];

              return (
                <article key={upgrade.upgradeId} className={`game-card upgrade-card ${upgrade.isUnlocked ? "owned-card" : ""}`}>
                  <p className="game-card-kicker">Upgrade</p>
                  <h3>{definition.name}</h3>
                  <p>{definition.description}</p>
                  <div className="cost-row">
                    <span>{definition.costNotes} Notes</span>
                    <span>{definition.costCoins} Bits</span>
                  </div>
                  <span className="status-chip">{upgrade.isUnlocked ? "Owned" : "Market"}</span>
                </article>
              );
            })}
          </div>
        </ActionPanel>

        <ActionPanel title="Debt & Savings" subtitle="Visible loan and deposit tokens on the player board." tone="player">
          <div className="token-strip">
            {player.loans.map((loan) => (
              <LoanToken key={loan.id} loan={loan} compact />
            ))}
            {player.deposits.map((deposit) => (
              <DepositToken key={deposit.id} deposit={deposit} compact />
            ))}
          </div>
        </ActionPanel>

        <ActionPanel title="Player Actions" subtitle="Controls live on the active player's board, not in a side admin rail." tone="player">
          <div className="player-action-grid">
            <label className="control-stack">
              <span>Resource</span>
              <select value={resourceId} onChange={(event) => setResourceId(event.target.value as ResourceId)}>
                {Object.keys(state.resources).map((value) => (
                  <option key={value} value={value}>
                    {state.config.resourceDefinitions[value as ResourceId].name}
                  </option>
                ))}
              </select>
            </label>

            <label className="control-stack">
              <span>Quantity</span>
              <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="1" />
            </label>

            <div className="embedded-action-row">
              <button
                disabled={!isActive}
                onClick={() =>
                  dispatch({
                    type: "produceResource",
                    playerId: player.id,
                    resourceId,
                    quantity: Number(quantity)
                  })
                }
              >
                Produce
              </button>
            </div>

            <label className="control-stack">
              <span>Loan Amount</span>
              <input value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} type="number" min="1" />
            </label>

            <label className="control-stack">
              <span>Deposit Amount</span>
              <input
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                type="number"
                min="1"
              />
            </label>

            <div className="embedded-action-row">
              <button disabled={!isActive} onClick={() => dispatch({ type: "takeLoan", playerId: player.id, amount: Number(loanAmount) })}>
                Borrow
              </button>
              <button
                disabled={!isActive || !activeLoan}
                onClick={() =>
                  activeLoan &&
                  dispatch({
                    type: "repayLoan",
                    playerId: player.id,
                    loanId: activeLoan.id,
                    amount: Number(loanAmount)
                  })
                }
              >
                Repay
              </button>
              <button
                disabled={!isActive}
                onClick={() => dispatch({ type: "createDeposit", playerId: player.id, amount: Number(depositAmount) })}
              >
                Deposit
              </button>
              <button
                disabled={!isActive || !activeDeposit}
                onClick={() =>
                  activeDeposit && dispatch({ type: "withdrawDeposit", playerId: player.id, depositId: activeDeposit.id })
                }
              >
                Withdraw
              </button>
            </div>

            <label className="control-stack">
              <span>Upgrade Market Card</span>
              <select value={upgradeId} onChange={(event) => setUpgradeId(event.target.value as UpgradeId)}>
                {Object.entries(state.config.upgradeDefinitions).map(([value, upgrade]) => (
                  <option key={value} value={value}>
                    {upgrade.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="embedded-action-row">
              <button disabled={!isActive} onClick={() => dispatch({ type: "buyUpgrade", playerId: player.id, upgradeId })}>
                Buy Upgrade
              </button>
            </div>

            <label className="control-stack">
              <span>Trade Direction</span>
              <select value={tradeDirection} onChange={(event) => setTradeDirection(event.target.value as "buy" | "sell")}>
                <option value="buy">Buy from rival</option>
                <option value="sell">Sell to rival</option>
              </select>
            </label>

            <label className="control-stack">
              <span>Notes / Unit</span>
              <input value={tradeNotes} onChange={(event) => setTradeNotes(event.target.value)} type="number" min="0" />
            </label>

            <label className="control-stack">
              <span>Bits / Unit</span>
              <input value={tradeCoins} onChange={(event) => setTradeCoins(event.target.value)} type="number" min="0" />
            </label>

            <div className="embedded-action-row embedded-action-row-wide">
              <button
                disabled={!isActive}
                onClick={() =>
                  dispatch({
                    type: "recordTrade",
                    buyerPlayerId: tradeDirection === "buy" ? player.id : otherPlayer.id,
                    sellerPlayerId: tradeDirection === "buy" ? otherPlayer.id : player.id,
                    resourceId,
                    quantity: Number(quantity),
                    unitPriceNotes: Number(tradeNotes),
                    unitPriceCoins: Number(tradeCoins)
                  })
                }
              >
                Record Trade
              </button>
              <button disabled={!isActive} onClick={() => dispatch({ type: "advanceTurnStep" })}>
                Advance Step
              </button>
              <button disabled={!isActive} onClick={() => dispatch({ type: "endPlayerTurn" })}>
                End Turn
              </button>
            </div>
          </div>
        </ActionPanel>
      </div>
    </section>
  );
}
