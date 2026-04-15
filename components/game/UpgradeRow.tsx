import type { GameState } from "@/lib/game/types";

export function UpgradeRow({ state }: { state: GameState }) {
  return (
    <section>
      <div className="zone-heading">
        <h3>Upgrade Market Row</h3>
        <p>Visible market cards available for purchase from player boards.</p>
      </div>
      <div className="card-row">
        {Object.values(state.config.upgradeDefinitions).map((upgrade) => (
          <article key={upgrade.id} className="game-card upgrade-card">
            <p className="game-card-kicker">Upgrade Market</p>
            <h3>{upgrade.name}</h3>
            <p>{upgrade.description}</p>
            <div className="cost-row">
              <span>{upgrade.costNotes} Notes</span>
              <span>{upgrade.costCoins} Bits</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
