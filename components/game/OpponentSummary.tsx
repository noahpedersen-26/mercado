import type { GameState, PlayerState } from "@/lib/game/types";
import { CurrencyToken } from "./CurrencyToken";

export function OpponentSummary({
  state,
  player,
  isActive
}: {
  state: GameState;
  player: PlayerState;
  isActive: boolean;
}) {
  return (
    <article className={`opponent-card ${isActive ? "opponent-card-active" : ""}`}>
      <div className="opponent-card-header">
        <div>
          <p className="game-card-kicker">Opponent</p>
          <h3>{player.name}</h3>
          <p className="tiny-note">
            {state.config.roles[player.role].name} · {state.config.resources[state.config.roles[player.role].specialty].name}
          </p>
        </div>
        {isActive ? <span className="status-chip status-chip-active">Active</span> : null}
      </div>

      <div className="opponent-meta-row">
        <CurrencyToken label="Notes" value={player.notes} tone="ivory" />
        <CurrencyToken label="Bits" value={player.bits} tone="brass" />
        <CurrencyToken label="Arrears" value={player.arrears} tone="red" />
      </div>

      <div className="opponent-stats-grid">
        <div className="mini-card">
          <p className="track-label">Goods</p>
          <p>
            G {player.goods.grain} · F {player.goods.fuel} · L {player.goods.lumber} · La {player.goods.labor}
          </p>
        </div>
        <div className="mini-card">
          <p className="track-label">Upgrades</p>
          <p>{player.ownedUpgrades.length > 0 ? player.ownedUpgrades.map((upgrade) => upgrade.name).join(", ") : "None"}</p>
        </div>
      </div>
    </article>
  );
}
