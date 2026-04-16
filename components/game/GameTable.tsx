"use client";

import { useReducer } from "react";
import { gameReducer } from "@/lib/game/reducer";
import { initialGameState } from "@/lib/game/sample-data";
import { selectCurrentBankBuyer, selectLifeCostIndex, selectLoanInterestDue } from "@/lib/game/selectors";
import type { GameState, PlayerId } from "@/lib/game/types";
import { GameLog } from "./GameLog";
import { MarketBankBoard } from "./MarketBankBoard";
import { OpponentSummary } from "./OpponentSummary";
import { PlayerBoard } from "./PlayerBoard";

function formatPhaseLabel(phase: string) {
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

function getFocusPlayerId(state: GameState, fallbackPlayerId: PlayerId): PlayerId {
  if (state.round.phase === "playerTurns") {
    return state.round.activePlayerId ?? fallbackPlayerId;
  }

  if (state.round.phase === "centralBank") {
    return selectCurrentBankBuyer(state) ?? fallbackPlayerId;
  }

  if (state.round.phase === "settlement") {
    const interestDue = selectLoanInterestDue(state.round.votedRate);
    const unsettledPlayer = state.playerOrder.find((playerId) => {
      const settlement = state.round.settlement[playerId];
      const player = state.players[playerId];
      const lifeOpen = settlement.lifeUnitsPaid < 2;
      const interestOpen = interestDue > 0 && settlement.interestPaidLoanIds.length < player.loans.length;
      return lifeOpen || interestOpen;
    });

    return unsettledPlayer ?? fallbackPlayerId;
  }

  return fallbackPlayerId;
}

export function GameTable() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const lifeCostIndex = selectLifeCostIndex(state);
  const localPlayerId = state.playerOrder[0];
  const focusPlayerId = getFocusPlayerId(state, localPlayerId);
  const opponents = state.playerOrder.filter((playerId) => playerId !== focusPlayerId);

  return (
    <main className="table-shell board-first-shell">
      <header className="table-header board-first-header">
        <div>
          <p className="eyebrow">Manual Tabletop Prototype</p>
          <h1 className="table-title">Debank</h1>
          <p className="table-subtitle">
            A board-first market game about debt Notes, hard-money Bits, bank demand, and price discovery.
          </p>
        </div>

        <div className="hud-pill-row">
          <span>Round {state.round.roundNumber}</span>
          <span>{formatPhaseLabel(state.round.phase)}</span>
          <span>Life Cost {lifeCostIndex}</span>
          <span>Chair {state.players[state.round.policyChairPlayerId].name}</span>
          <span>Focus {state.players[focusPlayerId].name}</span>
        </div>
      </header>

      <section className="board-first-layout">
        <MarketBankBoard state={state} dispatch={dispatch} />

        <section className="board opponent-strip-board">
          <div className="board-strip-header">
            <div>
              <p className="eyebrow">Table Watch</p>
              <h2>Other Houses</h2>
            </div>
            <p className="board-subtitle">Reduced to quick-read badges so your mat stays central.</p>
          </div>

          <div className="opponent-badge-row">
            {opponents.map((playerId) => (
              <OpponentSummary
                key={playerId}
                state={state}
                player={state.players[playerId]}
                isActive={state.round.activePlayerId === playerId}
              />
            ))}
          </div>
        </section>

        <PlayerBoard
          state={state}
          player={state.players[focusPlayerId]}
          dispatch={dispatch}
          isLocalPlayer={focusPlayerId === localPlayerId}
        />

        <GameLog state={state} />
      </section>
    </main>
  );
}
