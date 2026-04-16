"use client";

import { useReducer } from "react";
import { gameReducer } from "@/lib/game/reducer";
import { initialGameState } from "@/lib/game/sample-data";
import { selectLifeCostIndex } from "@/lib/game/selectors";
import { GameLog } from "./GameLog";
import { MarketBankBoard } from "./MarketBankBoard";
import { OpponentSummary } from "./OpponentSummary";
import { PlayerBoard } from "./PlayerBoard";
import { TurnGuidePanel } from "./TurnGuidePanel";

export function GameTable() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const lifeCostIndex = selectLifeCostIndex(state);
  const localPlayerId = state.playerOrder[0];
  const opponents = state.playerOrder.filter((playerId) => playerId !== localPlayerId);

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
        <div className="focus-layout">
          <div className="focus-main-column">
            <PlayerBoard state={state} player={state.players[localPlayerId]} dispatch={dispatch} isLocalPlayer />
            <GameLog state={state} />
          </div>

          <div className="focus-side-column">
            <TurnGuidePanel state={state} localPlayerId={localPlayerId} />
            <MarketBankBoard state={state} dispatch={dispatch} compact />

            <section className="board opponents-board">
              <div className="board-header">
                <div>
                  <p className="eyebrow">Table View</p>
                  <h2>Other Players</h2>
                  <p className="board-subtitle">Compact role and upgrade summaries keep the focus on your own board.</p>
                </div>
              </div>

              <div className="opponents-list">
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
          </div>
        </div>
      </section>
    </main>
  );
}
