"use client";

import { useMemo, useState } from "react";
import type { Action, GameState, PlayerState, ResourceId, UpgradeId } from "@/lib/game/types";

export function PlayerTurnControls({
  state,
  player,
  dispatch
}: {
  state: GameState;
  player: PlayerState;
  dispatch: React.Dispatch<Action>;
}) {
  const otherPlayer = useMemo(
    () => Object.values(state.players).find((entry) => entry.id !== player.id) ?? player,
    [player, state.players]
  );
  const [resourceId, setResourceId] = useState<ResourceId>("grain");
  const [quantity, setQuantity] = useState("1");
  const [loanAmount, setLoanAmount] = useState("4");
  const [depositAmount, setDepositAmount] = useState("3");
  const [upgradeId, setUpgradeId] = useState<UpgradeId>("warehouse");
  const [tradeDirection, setTradeDirection] = useState<"buy" | "sell">("buy");
  const [tradeNotes, setTradeNotes] = useState("4");
  const [tradeCoins, setTradeCoins] = useState("1");

  const isActive = state.round.activePlayerId === player.id;
  const currentStep = state.round.activeTurnWindow?.step;
  const activeLoan = player.loans.find((loan) => loan.status === "active");
  const activeDeposit = player.deposits.find((deposit) => deposit.status === "active");

  return (
    <div className="section-divider stack">
      <h3>Turn Controls</h3>
      <p>
        Active: <span className="value-strong">{isActive ? "Yes" : "No"}</span>
      </p>
      <p>
        Current Step: <span className="badge">{currentStep ?? "n/a"}</span>
      </p>

      <div className="field-grid">
        <label>
          <span className="label">Resource</span>
          <select value={resourceId} onChange={(event) => setResourceId(event.target.value as ResourceId)}>
            {Object.keys(state.resources).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Quantity</span>
          <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="1" />
        </label>
      </div>

      <div className="button-grid">
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

      <div className="field-grid">
        <label>
          <span className="label">Loan Amount</span>
          <input value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} type="number" min="1" />
        </label>
        <label>
          <span className="label">Deposit Amount</span>
          <input value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} type="number" min="1" />
        </label>
      </div>

      <div className="button-grid">
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
          Repay Loan
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
          Withdraw Deposit
        </button>
      </div>

      <div className="field-grid">
        <label>
          <span className="label">Upgrade</span>
          <select value={upgradeId} onChange={(event) => setUpgradeId(event.target.value as UpgradeId)}>
            {Object.entries(state.config.upgradeDefinitions).map(([value, upgrade]) => (
              <option key={value} value={value}>
                {upgrade.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="button-grid">
        <button disabled={!isActive} onClick={() => dispatch({ type: "buyUpgrade", playerId: player.id, upgradeId })}>
          Buy Upgrade
        </button>
      </div>

      <div className="field-grid">
        <label>
          <span className="label">Trade Direction</span>
          <select value={tradeDirection} onChange={(event) => setTradeDirection(event.target.value as "buy" | "sell")}>
            <option value="buy">Buy from other player</option>
            <option value="sell">Sell to other player</option>
          </select>
        </label>
        <label>
          <span className="label">Notes / Unit</span>
          <input value={tradeNotes} onChange={(event) => setTradeNotes(event.target.value)} type="number" min="0" />
        </label>
        <label>
          <span className="label">Coins / Unit</span>
          <input value={tradeCoins} onChange={(event) => setTradeCoins(event.target.value)} type="number" min="0" />
        </label>
      </div>

      <div className="button-grid">
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
          Next Step
        </button>
        <button disabled={!isActive} onClick={() => dispatch({ type: "endPlayerTurn" })}>
          End Turn
        </button>
      </div>
    </div>
  );
}
