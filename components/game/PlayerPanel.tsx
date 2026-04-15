import type { Action, GameState, PlayerState } from "@/lib/game/types";
import { PlayerTurnControls } from "./PlayerTurnControls";

export function PlayerPanel({
  state,
  player,
  dispatch
}: {
  state: GameState;
  player: PlayerState;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <section className="panel">
      <h2>{player.name}</h2>
      <div className="data-list">
        <div className="stat-row">
          <span className="label">Notes</span>
          <span className="value-strong">{player.notes}</span>
        </div>
        <div className="stat-row">
          <span className="label">Coins</span>
          <span className="value-strong">{player.coins}</span>
        </div>
      </div>

      <div className="section-divider">
        <h3>Inventory</h3>
        <div className="table-list">
          {Object.entries(player.inventory).map(([resourceId, amount]) => (
            <div key={resourceId} className="table-row">
              <span>{resourceId}</span>
              <span>{amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider">
        <h3>Upgrades</h3>
        <div className="mini-list">
          {player.upgrades.map((upgrade) => (
            <div key={upgrade.upgradeId} className="mini-card">
              <p className="value-strong">{state.config.upgradeDefinitions[upgrade.upgradeId].name}</p>
              <p>{upgrade.isUnlocked ? "Owned" : "Available to buy"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider">
        <h3>Loans</h3>
        <div className="mini-list">
          {player.loans.map((loan) => (
            <div key={loan.id} className="mini-card">
              <p>{loan.id}</p>
              <p>
                Balance {loan.remainingBalance} at {loan.interestRate}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider">
        <h3>Deposits</h3>
        <div className="mini-list">
          {player.deposits.map((deposit) => (
            <div key={deposit.id} className="mini-card">
              <p>{deposit.id}</p>
              <p>
                {deposit.amount} Notes at {deposit.interestRate}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <PlayerTurnControls state={state} player={player} dispatch={dispatch} />
    </section>
  );
}
