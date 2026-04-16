import type { GameState, PlayerState } from "@/lib/game/types";

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
    <article className={`opponent-badge ${isActive ? "opponent-badge-active" : ""}`}>
      <div className="opponent-badge-head">
        <div>
          <p className="game-card-kicker">House</p>
          <h3>{player.name}</h3>
          <p className="tiny-note">
            {state.config.roles[player.role].name} · {state.config.resources[state.config.roles[player.role].specialty].name}
          </p>
        </div>
        {isActive ? <span className="status-chip status-chip-active">Active</span> : null}
      </div>

      <div className="opponent-badge-stats">
        <span>N {player.notes}</span>
        <span>B {player.bits}</span>
        <span>L {player.loans.length}</span>
        <span>D {player.deposits.length}</span>
        <span>U {player.ownedUpgrades.length}</span>
      </div>

      <div className="opponent-badge-foot">
        <span>G {player.goods.grain}</span>
        <span>F {player.goods.fuel}</span>
        <span>Lm {player.goods.lumber}</span>
        <span>Lb {player.goods.labor}</span>
      </div>
    </article>
  );
}
