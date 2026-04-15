"use client";

import { useReducer } from "react";
import { initialGameState } from "@/lib/game/sample-data";
import { gameReducer } from "@/lib/game/reducer";
import { selectAveragePricesByResource, selectLifeCostIndex, selectOutstandingDeposits, selectOutstandingLoans } from "@/lib/game/selectors";
import { FinancePanel } from "./FinancePanel";
import { MarketPanel } from "./MarketPanel";
import { PhaseControls } from "./PhaseControls";
import { PlayerPanel } from "./PlayerPanel";
import { PolicyPanel } from "./PolicyPanel";
import { RoundStatusPanel } from "./RoundStatusPanel";
import { TradeHistoryPanel } from "./TradeHistoryPanel";
import { TurnLogPanel } from "./TurnLogPanel";
import { TurnOrderPanel } from "./TurnOrderPanel";

export function GameDashboard() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const priceAverages = selectAveragePricesByResource(state);
  const lifeCostIndex = selectLifeCostIndex(state);
  const loans = selectOutstandingLoans(state);
  const deposits = selectOutstandingDeposits(state);

  return (
    <main className="page-shell">
      <h1 className="page-title">Debank Manual MVP</h1>
      <p className="page-subtitle">
        One round is playable manually: set policy, rotate chair priority, then walk each player through produce,
        finance, upgrades, and trade while the engine logs prices in Notes and Coins.
      </p>

      <div className="dashboard-grid">
        <RoundStatusPanel state={state} lifeCostIndex={lifeCostIndex} />
        <PolicyPanel state={state} dispatch={dispatch} />
        <TurnOrderPanel state={state} />
        <PhaseControls state={state} dispatch={dispatch} />

        {Object.values(state.players).map((player) => (
          <PlayerPanel key={player.id} state={state} player={player} dispatch={dispatch} />
        ))}

        <MarketPanel state={state} priceAverages={priceAverages} />
        <FinancePanel loans={loans} deposits={deposits} />
        <TradeHistoryPanel trades={state.priceBook.trades} />
        <TurnLogPanel entries={state.turnLog} />
      </div>
    </main>
  );
}
