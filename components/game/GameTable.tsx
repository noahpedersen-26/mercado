"use client";

import { useReducer } from "react";
import { gameReducer } from "@/lib/game/reducer";
import { initialGameState } from "@/lib/game/sample-data";
import { selectLifeCostIndex } from "@/lib/game/selectors";
import { GameLog } from "./GameLog";
import { MarketBankBoard } from "./MarketBankBoard";
import { PlayerBoard } from "./PlayerBoard";

export function GameTable() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const lifeCostIndex = selectLifeCostIndex(state);

  return (
    <main className="table-shell">
      <header className="table-header">
        <div>
          <p className="eyebrow">Manual Tabletop Playtest Prototype</p>
          <h1 className="table-title">Debank</h1>
          <p className="table-subtitle">
            A market game about price discovery, debt Notes created through lending and bank buying, and Bits as fixed
            hard money. The shared board carries policy, pricing, bank demand, and repricing pressure while each player
            acts from a personal board.
          </p>
        </div>
        <div className="table-status-pill">
          <span>Round {state.round.roundNumber}</span>
          <span>{state.round.phase}</span>
          <span>Life Cost {lifeCostIndex}</span>
        </div>
      </header>

      <section className="game-table">
        <MarketBankBoard state={state} dispatch={dispatch} />

        <div className="player-board-row">
          {state.playerOrder.map((playerId) => (
            <PlayerBoard key={playerId} state={state} player={state.players[playerId]} dispatch={dispatch} />
          ))}
        </div>

        <GameLog state={state} />
      </section>
    </main>
  );
}
