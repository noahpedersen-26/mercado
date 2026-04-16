import type { UpgradeCard } from "@/lib/game/types";

export function UpgradeRow({ cards }: { cards: UpgradeCard[] }) {
  return (
    <section>
      <div className="zone-heading">
        <h3>Upgrade Market Row</h3>
        <p>Three face-up production upgrades. Refill when purchased.</p>
      </div>
      <div className="card-row">
        {cards.map((card) => (
          <article key={card.id} className="game-card upgrade-card">
            <p className="game-card-kicker">Upgrade Card</p>
            <h3>{card.name}</h3>
            <p>{card.description}</p>
            <div className="cost-row">
              <span>{card.costNotes} Notes</span>
              <span>First matching action only</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
