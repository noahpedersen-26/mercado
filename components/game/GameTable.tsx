"use client";

import { useReducer } from "react";
import { initialGameState } from "@/lib/game/sample-data";
import { gameReducer } from "@/lib/game/reducer";
import {
  selectAveragePricesByResource,
  selectLifeCostIndex,
  selectOutstandingDeposits,
  selectOutstandingLoans
} from "@/lib/game/selectors";
import { GameLog } from "./GameLog";
import { MarketBankBoard } from "./MarketBankBoard";
import { PlayerBoard } from "./PlayerBoard";

export function GameTable() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const lifeCostIndex = selectLifeCostIndex(state);
  const priceAverages = selectAveragePricesByResource(state);
  const loans = selectOutstandingLoans(state);
  const deposits = selectOutstandingDeposits(state);

  return (
    <main className="table-shell">
      <header className="table-header">
        <div>
          <p className="eyebrow">Manual Digital Board-Game Prototype</p>
          <h1 className="table-title">Debank Market Table</h1>
          <p className="table-subtitle">
            The game now centers on a shared market and bank board, while each house plays from a dedicated tableau
            with cards, tracks, and resource tokens instead of admin panels.
          </p>
        </div>
        <div className="table-status-pill">
          <span>Round {state.round.roundNumber}</span>
          <span>{state.round.phase}</span>
          <span>{state.round.activeTurnWindow?.step ?? "table setup"}</span>
        </div>
      </header>

      <section className="game-table">
        <MarketBankBoard
          state={state}
          dispatch={dispatch}
          lifeCostIndex={lifeCostIndex}
          priceAverages={priceAverages}
          loans={loans}
          deposits={deposits}
        />

        <div className="player-board-row">
          {Object.values(state.players).map((player) => (
            <PlayerBoard key={player.id} state={state} player={player} dispatch={dispatch} />
          ))}
        </div>

        <GameLog entries={state.turnLog} trades={state.priceBook.trades} />
      </section>
    </main>
  );
}
